
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  Search
} from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { EMPTY_STATES } from '@/constants/empty-states'
import Link from 'next/link'
import { useRealTimeMessaging } from '@/hooks/use-real-time-messaging'

interface Message {
  id: string
  content: string
  isRead: boolean
  createdAt: Date
  sender: {
    id: string
    name: string
    role: string
  }
  receiver: {
    id: string
    name: string
    role: string
  }
  Booking: {
    id: string
    event: {
      title: string
    }
    organizer?: {
      id: string
      name: string
    }
  }
}

interface Conversation {
  bookingId: string
  eventTitle: string
  organizerName: string
  lastMessage: Message
  unreadCount: number
  messages: Message[]
}

export default function TalentMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time messaging connection
  const { isConnected, connectionStatus, connect, disconnect } = useRealTimeMessaging()

  useEffect(() => {
    fetchAllConversations()
  }, [])

  useEffect(() => {
    if (selectedBookingId) {
      fetchConversationMessages(selectedBookingId)
    }
  }, [selectedBookingId])

  // Listen for real-time new messages
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const messageData = event?.detail
      console.log('📨 New message received (Talent):', messageData)
      
      // Add message to selected conversation if it matches
      if (selectedBookingId && messageData?.booking?.id === selectedBookingId) {
        setSelectedMessages(prev => [...(prev ?? []), {
          id: messageData?.id ?? '',
          content: messageData?.content ?? '',
          isRead: messageData?.isRead ?? false,
          createdAt: new Date(messageData?.createdAt ?? new Date()),
          sender: messageData?.sender ?? { id: '', name: '', role: '' },
          receiver: {
            id: messageData?.receiver?.id ?? '',
            name: messageData?.receiver?.name ?? '',
            role: messageData?.receiver?.role ?? ''
          },
          Booking: messageData?.booking ?? { id: '', event: { title: '' } }
        }])
      }
      
      // Refresh all conversations
      fetchAllConversations()
    }

    const handleMessageSent = (event: CustomEvent) => {
      const messageData = event?.detail
      console.log('✅ Message sent confirmation (Talent):', messageData)
    }

    // Add event listeners
    window?.addEventListener('realtime-new-message', handleNewMessage as EventListener)
    window?.addEventListener('realtime-message-sent', handleMessageSent as EventListener)

    return () => {
      window?.removeEventListener('realtime-new-message', handleNewMessage as EventListener)
      window?.removeEventListener('realtime-message-sent', handleMessageSent as EventListener)
    }
  }, [selectedBookingId])

  const fetchAllConversations = async () => {
    try {
      setLoading(true)
      setError(null)
      // Use the direct-messages endpoint
      const response = await fetch('/api/direct-messages')
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`)
      }
      const result = await response.json()
      if (result?.success) {
        const conversations = result.data?.conversations || []
        console.log('Fetched conversations:', conversations) // Debug log
        
        // Transform the direct messages data to match the expected format
        const formattedConversations = conversations.map((conv: any) => ({
          bookingId: `direct-${conv.user.id}`, // Use a prefix to indicate direct message
          eventTitle: conv.user.companyName || 'Direct Message',
          organizerName: conv.user.name,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount || 0,
          user: conv.user // Keep the full user object for reference
        }))
        
        console.log('Formatted conversations:', formattedConversations) // Debug log
        setConversations(formattedConversations)
      } else {
        throw new Error(result?.error ?? 'Failed to fetch conversations')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching conversations'
      console.error('Fetch conversations error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      // Extract the user ID from the conversation ID (removing the 'direct-' prefix)
      const userId = conversationId.replace('direct-', '')
      
      const response = await fetch(`/api/direct-messages?otherUserId=${userId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`)
      }
      const data = await response.json()
      if (data?.success) {
        const messages = data?.data?.messages || []
        setSelectedMessages(messages)
        // Mark messages as read
        markMessagesAsRead(messages)
      } else {
        throw new Error(data?.error ?? 'Failed to fetch conversation messages')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching conversation'
      console.error('Error fetching conversation:', errorMessage)
    }
  }

  const markMessagesAsRead = async (messages: Message[]) => {
    if (!messages?.length) return
    
    const currentUserId = getCurrentUserId()
    if (!currentUserId) return
    
    const unreadMessages = messages.filter(m => 
      m && !m.isRead && m.receiver?.id === currentUserId
    )
    
    for (const message of unreadMessages) {
      if (!message?.id) continue
      try {
        await fetch(`/api/messages/${message.id}/read`, {
          method: 'PATCH'
        })
      } catch (err) {
        console.error('Error marking message as read:', err)
      }
    }
  }

  const getCurrentUserId = () => {
    // Get current user ID from conversations or selected messages
    const firstConversation = conversations?.[0]
    const firstMessage = selectedMessages?.[0]
    
    // Try to get user ID from conversation messages
    if (firstConversation?.messages?.length > 0) {
      const talentMessage = firstConversation.messages.find(m => 
        m?.sender?.role === 'TALENT'
      )
      if (talentMessage?.sender?.id) return talentMessage.sender.id
      
      const talentReceiver = firstConversation.messages.find(m => 
        m?.receiver?.role === 'TALENT'
      )
      if (talentReceiver?.receiver?.id) return talentReceiver.receiver.id
    }
    
    // Try to get from selected messages
    if (firstMessage) {
      if (firstMessage.sender?.role === 'TALENT') return firstMessage.sender.id
      if (firstMessage.receiver?.role === 'TALENT') return firstMessage.receiver.id
    }
    
    return ''
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedBookingId) return
    
    try {
      setSending(true)
      // Extract the user ID from the conversation ID (removing the 'direct-' prefix)
      const otherUserId = selectedBookingId.replace('direct-', '')
      
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`)
      }
      
      const data = await response.json()
      if (data?.success) {
        setNewMessage('')
        // The real-time event will handle updating the UI
        fetchAllConversations() // Refresh the conversation list
      } else {
        throw new Error(data?.error ?? 'Failed to send message')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message'
      console.error('Send message error:', errorMessage)
      setError(errorMessage)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return '--:--'
    try {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '--:--'
    }
  }

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown'
    
    try {
      const now = new Date()
      const messageDate = new Date(date)
      
      if (messageDate.toDateString() === now.toDateString()) {
        return 'Today'
      }
      
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Yesterday'
      }
      
      return messageDate.toLocaleDateString()
    } catch {
      return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/talent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading messages: {error}</span>
            </div>
            <Button onClick={fetchAllConversations} className="mt-4" variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/talent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Communicate with event organizers
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                disabled
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {!conversations?.length ? (
                <EmptyState
                  icon={EMPTY_STATES.TALENT_MESSAGES.icon}
                  title={EMPTY_STATES.TALENT_MESSAGES.title}
                  description={EMPTY_STATES.TALENT_MESSAGES.description}
                  size="md"
                  action={{
                    label: 'Complete Your Profile',
                    onClick: () => window.location.href = '/talent/profile'
                  }}
                />
              ) : (
                <div className="space-y-1">
                  {conversations.map((conversation) => {
                    if (!conversation?.bookingId) return null
                    
                    return (
                      <div
                        key={conversation.bookingId}
                        className={`p-4 cursor-pointer hover:bg-muted transition-colors border-b ${
                          selectedBookingId === conversation.bookingId ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedBookingId(conversation.bookingId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm truncate">
                                {conversation.organizerName ?? 'Unknown Organizer'}
                              </h4>
                              {(conversation.unreadCount ?? 0) > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.eventTitle ?? 'Unknown Event'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {conversation.lastMessage?.content ?? 'No message content'}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessage?.createdAt)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2">
          {selectedBookingId ? (
            <>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">
                  {conversations?.find(c => c?.bookingId === selectedBookingId)?.eventTitle ?? 'Unknown Event'}
                </CardTitle>
                <CardDescription>
                  with {conversations?.find(c => c?.bookingId === selectedBookingId)?.organizerName ?? 'Unknown Organizer'}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px] p-4">
                  <div className="space-y-4">
                    {selectedMessages?.map?.((message, index) => {
                      if (!message?.id) return null
                      
                      const isFromTalent = message.sender?.role === 'TALENT'
                      const showDate = index === 0 || 
                        formatDate(message.createdAt) !== formatDate(selectedMessages[index - 1]?.createdAt)

                      return (
                        <div key={message.id}>
                          {showDate && (
                            <div className="text-center text-xs text-muted-foreground my-4">
                              {formatDate(message.createdAt)}
                            </div>
                          )}
                          <div className={`flex ${isFromTalent ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                isFromTalent
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <p className="text-sm">{message.content ?? 'No content'}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 opacity-50" />
                                <span className="text-xs opacity-75">
                                  {formatTime(message.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    }) ?? []}
                    {(!selectedMessages?.length) && (
                      <div className="p-4">
                        <EmptyState
                          icon={MessageSquare}
                          title="No messages yet"
                          description="Start the conversation by sending a message below."
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage ?? ''}
                      onChange={(e) => setNewMessage(e.target.value ?? '')}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      disabled={sending}
                    />
                    <Button onClick={sendMessage} disabled={sending || !newMessage?.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
