
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

interface RealTimeMessage {
  type: 'connected' | 'new_message' | 'message_sent' | 'message_read' | 'heartbeat'
  data?: any
  message?: string
  timestamp?: string
}

interface UseRealTimeMessagingReturn {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  lastMessage: RealTimeMessage | null
  sendMessage: (message: any) => void
  connect: () => void
  disconnect: () => void
}

export function useRealTimeMessaging(): UseRealTimeMessagingReturn {
  const { data: session } = useSession()
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastMessage, setLastMessage] = useState<RealTimeMessage | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (!session?.user?.id) {
      console.log('⚠️ Cannot connect: No user session or user ID')
      setConnectionStatus('error')
      return
    }

    // Clean up any existing connection
    if (eventSourceRef.current) {
      console.log('🔄 Cleaning up existing connection...')
      try {
        eventSourceRef.current.close()
      } catch (error) {
        console.error('Error closing previous connection:', error)
      } finally {
        eventSourceRef.current = null
      }
    }

    console.log(`🔌 [${new Date().toISOString()}] Connecting to real-time messaging...`)
    setConnectionStatus('connecting')
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = undefined
    }

    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime()
      const eventSource = new EventSource(`/api/websocket?t=${timestamp}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`✅ [${new Date().toISOString()}] Real-time messaging connected`)
        setIsConnected(true)
        setConnectionStatus('connected')
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = undefined
        }
      }

      eventSource.onmessage = (event) => {
        try {
          const message: RealTimeMessage = JSON.parse(event.data)
          console.log('📨 Real-time message received:', message)
          
          setLastMessage(message)
          
          // Handle different message types
          switch (message.type) {
            case 'connected':
              console.log('🎉 Real-time messaging ready')
              break
            case 'new_message':
              console.log('💬 New message received from SSE')
              // Trigger custom event for components to listen to
              window.dispatchEvent(new CustomEvent('realtime-new-message', {
                detail: message.data
              }))
              break
            case 'message_sent':
              console.log('✅ Message delivery confirmed')
              window.dispatchEvent(new CustomEvent('realtime-message-sent', {
                detail: message.data
              }))
              break
            case 'message_read':
              console.log('👀 Message read receipt')
              window.dispatchEvent(new CustomEvent('realtime-message-read', {
                detail: message.data
              }))
              break
            case 'heartbeat':
              // Silent heartbeat to keep connection alive
              break
          }
        } catch (error) {
          console.error('Error parsing real-time message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error(`❌ [${new Date().toISOString()}] Real-time messaging error:`, error)
        
        // Only update state if we were previously connected
        const wasConnected = isConnected
        
        // Clean up the current connection
        if (eventSourceRef.current) {
          try {
            eventSourceRef.current.close()
          } catch (e) {
            console.error('Error closing connection during error handling:', e)
          }
          eventSourceRef.current = null
        }
        
        // Update state after cleanup
        setIsConnected(false)
        setConnectionStatus('error')
        
        // Only attempt to reconnect if we were previously connected
        if (wasConnected) {
          const reconnectDelay = 3000 // Start with 3 seconds
          console.log(`🔄 [${new Date().toISOString()}] Attempting to reconnect in ${reconnectDelay/1000} seconds...`)
          
          // Clear any existing timeout to prevent multiple reconnection attempts
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔌 [${new Date().toISOString()}] Reconnecting...`)
            connect()
          }, reconnectDelay)
        }
      }

    } catch (error) {
      console.error('Failed to establish SSE connection:', error)
      setConnectionStatus('error')
    }
  }, [session])

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('🔌 Disconnecting from real-time messaging...')
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const sendMessage = useCallback((message: any) => {
    // Note: SSE is one-way (server to client)
    // For sending messages, we still use regular API calls
    // This function is here for consistency with WebSocket interfaces
    console.log('📤 Send message called (will use regular API):', message)
  }, [])

  // Auto-connect when session is available
  useEffect(() => {
    if (session?.user) {
      console.log('👤 User session detected, connecting to real-time service...')
      connect()
    } else {
      console.log('👤 No user session, disconnecting...')
      disconnect()
    }
    
    // Cleanup on unmount or session change
    return () => {
      console.log('🧹 Cleaning up real-time connection...')
      disconnect()
    }
  }, [session?.user?.id]) // Only reconnect if user ID changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  }
}
