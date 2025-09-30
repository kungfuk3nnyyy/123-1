
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { addClient, removeClient, clients } from '@/lib/real-time-messaging'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const userId = session.user.id
    console.log(`📡 SSE connection for user ${userId.substring(0, 8)}`)

    // Create Server-Sent Events stream
    const stream = new ReadableStream({
      start(controller) {
        console.log(`📡 Starting SSE stream for user ${userId.substring(0, 8)}`)
        
        // Store the controller for this user
        console.log(`🔍 [${new Date().toISOString()}] New SSE connection from user ${userId.substring(0, 8)}`)
        
        const previousController = clients.get(userId)
        if (previousController) {
          console.log(`🔄 Replacing previous connection for user ${userId.substring(0, 8)}`)
          try {
            previousController.close()
            console.log(`✅ Successfully closed previous connection for user ${userId.substring(0, 8)}`)
          } catch (error) {
            console.error(`❌ Error closing previous connection for user ${userId.substring(0, 8)}:`, error)
          }
        } else {
          console.log(`👤 New connection for user ${userId.substring(0, 8)} (no previous connection found)`)
        }
        
        addClient(userId, controller)
        console.log(`✅ Added new connection for user ${userId.substring(0, 8)}. Total active connections: ${clients.size}`)
        
        // Send initial connection confirmation
        const sendConnectionMessage = () => {
          try {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'connected',
              message: 'Real-time messaging connected',
              timestamp: new Date().toISOString()
            })}\n\n`)
            return true
          } catch (error) {
            console.error('Failed to send connection message:', error)
            return false
          }
        }
        
        // Initial connection message
        if (!sendConnectionMessage()) {
          console.error('Failed to send initial connection message')
          controller.close()
          return
        }

        // Send periodic heartbeat to keep connection alive
        let heartbeat: NodeJS.Timeout | null = null
        let isConnectionOpen = true
        
        const startHeartbeat = () => {
          const sendHeartbeat = () => {
            if (!isConnectionOpen) {
              if (heartbeat) clearInterval(heartbeat)
              return
            }
            
            try {
              // Check if the connection is still writable
              if (controller.desiredSize !== null) {
                controller.enqueue(`data: ${JSON.stringify({
                  type: 'heartbeat',
                  timestamp: new Date().toISOString()
                })}\n\n`)
              } else {
                // Connection is no longer writable, clean up
                console.log('Connection no longer writable, cleaning up...')
                cleanup()
              }
            } catch (error) {
              console.error('Heartbeat failed:', error)
              cleanup()
            }
          }
          
          // Send first heartbeat immediately
          sendHeartbeat()
          
          // Then set up the interval
          heartbeat = setInterval(sendHeartbeat, 30000) // Every 30 seconds
        }
        
        startHeartbeat()

        // Cleanup function
        const cleanup = () => {
          if (!isConnectionOpen) return // Prevent multiple cleanups
          isConnectionOpen = false
          
          console.log(`🧹 Cleaning up SSE connection for user ${userId.substring(0, 8)}`)
          
          // Clear the heartbeat interval
          if (heartbeat) {
            clearInterval(heartbeat)
            heartbeat = null
          }
          
          // Only remove if this is still the current controller
          const currentController = clients.get(userId)
          if (currentController === controller) {
            removeClient(userId)
          }
          
          try {
            // Check if the controller is still open before trying to close it
            if (controller.desiredSize !== null) {
              controller.close()
            }
          } catch (error) {
            console.error('Error during controller cleanup:', error)
          }
        }

        // Handle connection close
        const handleAbort = () => {
          console.log(`📡 SSE connection closed for user ${userId.substring(0, 8)}`)
          cleanup()
        }
        
        // Set up abort handler
        request.signal.addEventListener('abort', handleAbort, { once: true })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
