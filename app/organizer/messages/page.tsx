
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Send, 
  Search, 
  User, 
  Clock,
  CheckCircle,
  Circle,
  Plus,
  X
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRealTimeMessaging } from '@/hooks/use-real-time-messaging'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface User {
  id: string
  name: string
  email?: string
  role: string
  organizerProfile?: {
    companyName: string
  }
  talentProfile?: {
    category: string
  }
  profileImage?: string
}

interface Talent {
  id: string
  name: string
  email: string
  role: string
  category?: string
  companyName?: string
  profileImage?: string
  bio?: string
  rating?: number
  location?: string
  reviewCount?: number
  givenReviewCount?: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  isRead: boolean
  sender: User
  receiver: User
}

interface Conversation {
  user: User | null
  latestMessage: {
    content: string
    createdAt: string
  } | null
  unreadCount: number
  messageCount: number
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewChatModal, setShowNewChatModal] = useState(false)
  const [searchResults, setSearchResults] = useState<Talent[]>([])
  const [talentSearchTerm, setTalentSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  
  // Real-time messaging connection
  const { isConnected, connectionStatus, connect, disconnect } = useRealTimeMessaging()
  
  // Debug logging for connection status changes
  useEffect(() => {
    console.log('🔌 Connection status changed:', { isConnected, connectionStatus })
    
    // Try to connect if not already connected
    if (!isConnected && connectionStatus === 'disconnected') {
      console.log('🔄 Attempting to connect to SSE...')
      connect()
    }
    
    // Cleanup on unmount
    return () => {
      if (isConnected) {
        console.log('🧹 Cleaning up SSE connection...')
        disconnect()
      }
    }
  }, [isConnected, connectionStatus, connect, disconnect])

  // Fetch conversations function with useCallback to prevent infinite re-renders
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/direct-messages')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      
      const result = await response.json()
      if (result.success) {
        // Transform the API response to match the expected format
        const formattedConversations = result.data.conversations.map((conv: any) => ({
          user: {
            id: conv.user.id,
            name: conv.user.name || 'Unknown User',
            email: conv.user.email,
            role: conv.user.role,
            profileImage: conv.user.image,
            organizerProfile: conv.user.OrganizerProfile,
            talentProfile: conv.user.TalentProfile
          },
          latestMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt
          } : null,
          unreadCount: conv.unreadCount || 0,
          messageCount: 0 // This will be updated when we fetch messages
        }))
        
        setConversations(formattedConversations)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  // Listen for real-time new messages
  useEffect(() => {
    if (!session?.user?.id) return

    const handleNewMessage = (event: CustomEvent) => {
      try {
        const messageData = event.detail
        if (!messageData) {
          console.warn('Received empty message data')
          return
        }
        
        console.log('📨 New message received (Organizer):', messageData)
        
        // Check if we have valid sender and receiver data
        const hasValidSender = messageData.sender && messageData.sender.id
        const hasValidReceiver = messageData.receiver && messageData.receiver.id
        
        if (!hasValidSender || !hasValidReceiver) {
          console.warn('Invalid message data - missing sender or receiver:', messageData)
          return
        }
        
        // Add message to current conversation if it matches
        if (selectedConversation && 
            (messageData.sender.id === selectedConversation || messageData.receiver.id === selectedConversation)) {
          setMessages(prev => [...prev, {
            id: messageData.id || Date.now().toString(),
            content: messageData.content,
            createdAt: messageData.createdAt || new Date().toISOString(),
            isRead: messageData.isRead || false,
            sender: {
              id: messageData.sender.id,
              name: messageData.sender.name || 'Unknown Sender',
              email: messageData.sender.email,
              role: messageData.sender.role,
              profileImage: messageData.sender.image,
              organizerProfile: messageData.sender.organizerProfile,
              talentProfile: messageData.sender.talentProfile
            },
            receiver: {
              id: messageData.receiver.id,
              name: messageData.receiver.name || 'Unknown Recipient',
              email: messageData.receiver.email,
              role: messageData.receiver.role,
              profileImage: messageData.receiver.image,
              organizerProfile: messageData.receiver.organizerProfile,
              talentProfile: messageData.receiver.talentProfile
            }
          }])
          
          // Mark as read if we're the receiver
          if (messageData.receiver.id === session.user.id) {
            fetch('/api/direct-messages', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                otherUserId: messageData.sender.id,
                markAsRead: true
              })
            })
          }
        }
      
        // Refresh conversations to update last message and unread count
        fetchConversations()
      } catch (error) {
        console.error('Error handling new message:', error)
      }
    }

    const handleMessageSent = (event: CustomEvent) => {
      const messageData = event.detail
      console.log('✅ Message sent confirmation (Organizer):', messageData)
    }

    // Add event listeners
    window.addEventListener('newMessage', handleNewMessage as EventListener)
    window.addEventListener('realtime-message-sent', handleMessageSent as EventListener)

    return () => {
      window.removeEventListener('newMessage', handleNewMessage as EventListener)
      window.removeEventListener('realtime-message-sent', handleMessageSent as EventListener)
    }
  }, [selectedConversation, fetchConversations, session?.user?.id])

  // This is the only fetchConversations function now

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/direct-messages?otherUserId=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const result = await response.json()
      if (result.success) {
        // Transform the API response to match the expected format
        const formattedMessages = result.data.messages.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          isRead: msg.isRead,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name || 'Unknown Sender',
            email: msg.sender.email,
            role: msg.sender.role,
            profileImage: msg.sender.image,
            organizerProfile: msg.sender.organizerProfile,
            talentProfile: msg.sender.talentProfile
          },
          receiver: {
            id: msg.receiver.id,
            name: msg.receiver.name || 'Unknown Recipient',
            email: msg.receiver.email,
            role: msg.receiver.role,
            profileImage: msg.receiver.image,
            organizerProfile: msg.receiver.organizerProfile,
            talentProfile: msg.receiver.talentProfile
          }
        }))
        
        setMessages(formattedMessages)
        
        // Mark messages as read using POST
        await fetch('/api/direct-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            otherUserId: userId,
            markAsRead: true
          })
        })
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSendingMessage(true)
      const response = await fetch('/api/direct-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedConversation,
          content: newMessage
        })
      })

      if (response.ok) {
        setNewMessage('')
        // The real-time message handler will update the UI when the message is sent
        // But we'll refresh the messages to ensure everything is in sync
        await fetchMessages(selectedConversation)
        await fetchConversations() // Update conversations list
      } else {
        const errorData = await response.json()
        console.error('Failed to send message:', errorData.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-KE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('en-KE', { 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  const filteredConversations = conversations.filter(conv => {
    const userName = conv.user?.name?.toLowerCase() || ''
    const category = conv.user?.talentProfile?.category?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return userName.includes(search) || category.includes(search)
  })

  const selectedUser = conversations.find(c => c.user?.id === selectedConversation)?.user || null

  // Search for talents
  const searchTalents = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/talents/search?q=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.data.users || [])
      } else {
        console.error('Error searching users:', await response.text())
        setSearchResults([])
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (talentSearchTerm.trim()) {
        searchTalents(talentSearchTerm)
      } else {
        setSearchResults([])
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [talentSearchTerm])

  const handleStartNewChat = async (user: User) => {
    try {
      // Check if conversation already exists
      const existingConvo = conversations.find(c => c.user?.id === user.id)
      
      if (existingConvo) {
        setSelectedConversation(user.id)
      } else {
        // Create a new direct message conversation
        const response = await fetch('/api/direct-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiverId: user.id,
            content: `Hello! I'd like to ${user.role === 'TALENT' ? 'discuss a potential booking' : 'connect with you'}.`
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Refresh conversations and select the new one
            await fetchConversations()
            setSelectedConversation(user.id)
          }
        } else {
          const errorData = await response.json()
          console.error('Failed to start chat:', errorData.error || 'Unknown error')
        }
      }
      
      setShowNewChatModal(false)
      setTalentSearchTerm('')
      setSearchResults([])
    } catch (error) {
      console.error('Error starting new chat:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="grid grid-cols-12 gap-6 h-[600px]">
          <div className="col-span-4 animate-pulse">
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
          <div className="col-span-8 animate-pulse">
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with talents about your events
          </p>
        </div>
        <Dialog open={showNewChatModal} onOpenChange={setShowNewChatModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Start a New Chat</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search for talents by name or category..."
                  value={talentSearchTerm}
                  onChange={(e) => setTalentSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Separator />
              <ScrollArea className="h-96">
                {isSearching ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {talentSearchTerm ? 
                      'No talents found. Try a different search term.' : 
                      'Start typing to search for talents...'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((talent) => (
                        <div
                          key={talent.id}
                          className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => handleStartNewChat(talent)}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            {talent.profileImage ? (
                              <img 
                                src={talent.profileImage} 
                                alt={talent.name}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <AvatarFallback>
                                {talent.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{talent.name}</p>
                            <div className="flex items-center gap-2">
                              {talent.category && (
                                <span className="text-sm text-muted-foreground truncate">
                                  {talent.category}
                                </span>
                              )}
                              {talent.rating !== undefined && (
                                <span className="flex items-center text-sm text-amber-500">
                                  ★ {typeof talent.rating === 'number' ? talent.rating.toFixed(1) : 'N/A'}
                                  {talent.reviewCount ? ` (${talent.reviewCount})` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {talent.role === 'TALENT' ? '🎭 Talent' : '🏢 Organizer'}
                              </span>
                              {talent.location && (
                                <span className="text-xs text-muted-foreground">
                                  📍 {talent.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleStartNewChat(talent)
                            }}
                          >
                            Message
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages Interface */}
      <div className="grid grid-cols-12 gap-6 h-[600px]">
        {/* Conversations List */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[440px]">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Conversations</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm 
                        ? 'No conversations match your search.' 
                        : 'Start conversations with talents to see them here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.user?.id || 'unknown'}
                        className={`p-4 cursor-pointer hover:bg-calm-light-grey border-b transition-colors ${
                          selectedConversation === conversation.user?.id ? 'bg-calm-soft-blue/10 border-calm-soft-blue/30' : ''
                        }`}
                        onClick={() => conversation.user?.id && setSelectedConversation(conversation.user.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {conversation.user?.name?.charAt(0).toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">
                                {conversation.user?.name || 'Unknown User'}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                            {conversation.user?.talentProfile?.category && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {conversation.user.talentProfile.category}
                              </Badge>
                            )}
                            {conversation.latestMessage && (
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-muted-foreground truncate">
                                  {conversation.latestMessage.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatTime(conversation.latestMessage.createdAt)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Area */}
        <div className="col-span-8">
          <Card className="h-full flex flex-col">
            {selectedConversation && selectedUser ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {selectedUser?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedUser?.name || 'Unknown User'}</CardTitle>
                      {selectedUser?.talentProfile?.category && (
                        <Badge variant="outline" className="text-xs">
                          {selectedUser.talentProfile.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[400px] p-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.sender.id !== selectedConversation
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  isOwnMessage
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-calm-light-grey text-calm-dark-grey'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <div className={`flex items-center gap-1 mt-1 text-xs ${
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  <Clock className="h-3 w-3" />
                                  {formatTime(message.createdAt)}
                                  {isOwnMessage && (
                                    message.isRead ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <Circle className="h-3 w-3" />
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={sendingMessage || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* No Conversation Selected */
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
