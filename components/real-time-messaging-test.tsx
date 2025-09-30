
'use client'

import { useState, useEffect } from 'react'
import { useRealTimeMessaging } from '@/hooks/use-real-time-messaging'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Wifi, 
  WifiOff, 
  Send, 
  MessageSquare, 
  CheckCircle,
  Eye,
  AlertCircle
} from 'lucide-react'

interface TestMessage {
  id: string
  content: string
  timestamp: string
  type: 'sent' | 'received'
  status?: 'sending' | 'delivered' | 'read'
}

export default function RealTimeMessagingTest() {
  const { data: session } = useSession()
  const { isConnected, connectionStatus, lastMessage, connect, disconnect } = useRealTimeMessaging()
  const [messages, setMessages] = useState<TestMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [testReceiverId, setTestReceiverId] = useState('')
  const [testBookingId, setTestBookingId] = useState('')
  const [sending, setSending] = useState(false)

  // Listen for real-time events
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const messageData = event.detail
      setMessages(prev => [...prev, {
        id: messageData.id,
        content: messageData.content,
        timestamp: messageData.createdAt,
        type: 'received',
        status: 'delivered'
      }])
    }

    const handleMessageSent = (event: CustomEvent) => {
      const data = event.detail
      setMessages(prev => prev.map(msg => 
        msg.id === data.id 
          ? { ...msg, status: 'delivered' }
          : msg
      ))
    }

    const handleMessageRead = (event: CustomEvent) => {
      const data = event.detail
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, status: 'read' }
          : msg
      ))
    }

    window.addEventListener('realtime-new-message', handleNewMessage as EventListener)
    window.addEventListener('realtime-message-sent', handleMessageSent as EventListener)
    window.addEventListener('realtime-message-read', handleMessageRead as EventListener)

    return () => {
      window.removeEventListener('realtime-new-message', handleNewMessage as EventListener)
      window.removeEventListener('realtime-message-sent', handleMessageSent as EventListener)
      window.removeEventListener('realtime-message-read', handleMessageRead as EventListener)
    }
  }, [])

  const sendTestMessage = async () => {
    if (!newMessage.trim() || !testReceiverId || !testBookingId) return

    setSending(true)
    const tempId = `temp-${Date.now()}`
    
    // Add message to UI immediately
    const newMsg: TestMessage = {
      id: tempId,
      content: newMessage,
      timestamp: new Date().toISOString(),
      type: 'sent',
      status: 'sending'
    }
    
    setMessages(prev => [...prev, newMsg])

    try {
      // Send via API
      const response = await fetch('/api/test-messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: session?.user?.id,
          receiverId: testReceiverId,
          bookingId: testBookingId,
          content: newMessage
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Update message with real ID
        setMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, id: result.data.id, status: 'delivered' }
            : msg
        ))
      } else {
        // Remove failed message
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        alert('Failed to send message')
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      alert('Error sending message')
    } finally {
      setSending(false)
      setNewMessage('')
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending': return <AlertCircle className="h-3 w-3 text-yellow-500" />
      case 'delivered': return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'read': return <Eye className="h-3 w-3 text-blue-500" />
      default: return null
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500'
      case 'connecting': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Real-time Messaging Test
            <Badge variant={isConnected ? 'default' : 'destructive'} className="ml-2">
              {isConnected ? (
                <><Wifi className="h-3 w-3 mr-1" />Connected</>
              ) : (
                <><WifiOff className="h-3 w-3 mr-1" />Disconnected</>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor()}`}></div>
            <span className="text-sm">Status: {connectionStatus}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>

          {/* Test Setup */}
          <div className="grid gap-2">
            <Input
              placeholder="Receiver User ID for testing"
              value={testReceiverId}
              onChange={(e) => setTestReceiverId(e.target.value)}
            />
            <Input
              placeholder="Booking ID for testing"
              value={testBookingId}
              onChange={(e) => setTestBookingId(e.target.value)}
            />
          </div>

          {/* Messages */}
          <ScrollArea className="h-64 border rounded p-2">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet</p>
            ) : (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 ${
                        message.type === 'sent'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-75">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                        {message.type === 'sent' && getStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Send Message */}
          <div className="flex gap-2">
            <Input
              placeholder="Type a test message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
              disabled={sending}
            />
            <Button 
              onClick={sendTestMessage}
              disabled={sending || !newMessage.trim() || !testReceiverId || !testBookingId}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Last Real-time Message Debug */}
          {lastMessage && (
            <div className="bg-muted p-2 rounded text-xs">
              <strong>Last SSE Message:</strong>
              <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
