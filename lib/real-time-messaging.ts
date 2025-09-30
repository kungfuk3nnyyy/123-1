
// Store Server-Sent Events connections
export const clients = new Map<string, ReadableStreamDefaultController>()

// Helper function to send real-time message to specific user
export function sendRealTimeMessage(userId: string, data: any) {
  console.log(`🔍 [${new Date().toISOString()}] Attempting to send message to user ${userId}`)
  console.log(`🔍 Active connections (${clients.size}):`, Array.from(clients.keys()).map(id => id.substring(0, 8)))
  
  const controller = clients.get(userId)
  if (controller) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      console.log(`📤 Sending message to user ${userId.substring(0, 8)}:`, data.type)
      controller.enqueue(message)
      return true
    } catch (error) {
      console.error(`❌ Error sending real-time message to user ${userId}:`, error)
      console.log(`🧹 Removing user ${userId} from active connections due to error`)
      clients.delete(userId)
      return false
    }
  } else {
    console.log(`⚠️ No active connection found for user ${userId}. Active users:`, 
      Array.from(clients.keys()).map(id => id.substring(0, 8)))
    return false
  }
}

// Helper function to broadcast to multiple users
export function broadcastRealTimeMessage(userIds: string[], data: any) {
  const results = userIds.map(userId => sendRealTimeMessage(userId, data))
  return results.filter(Boolean).length
}

// Get active connections count
export function getActiveConnections() {
  return clients.size
}

// Add client connection
export function addClient(userId: string, controller: ReadableStreamDefaultController) {
  console.log(`➕ Adding client connection for user ${userId.substring(0, 8)}`)
  console.log(`   Current active connections: ${clients.size}`)
  clients.set(userId, controller)
  console.log(`   New active connections: ${clients.size}`)
}

// Remove client connection
export function removeClient(userId: string) {
  console.log(`➖ Removing client connection for user ${userId.substring(0, 8)}`)
  console.log(`   Current active connections before removal: ${clients.size}`)
  const deleted = clients.delete(userId)
  console.log(`   ${deleted ? 'Successfully removed' : 'Failed to remove'} connection for user ${userId.substring(0, 8)}`)
  console.log(`   Remaining active connections: ${clients.size}`)
}
