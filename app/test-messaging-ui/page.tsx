
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RealTimeMessagingTest from '@/components/real-time-messaging-test'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, TestTube } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TestMessagingPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Sample IDs for testing (you can get these from the database)
  const sampleData = {
    organizerId: 'cmdmqs42', // EventPro Kenya
    talentId: 'cmdmqs41',    // Sarah Johnson  
    bookingId: 'cmdmqs42'    // Sample booking
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={session.user.role?.toLowerCase() === 'admin' ? '/admin' : `/${session.user.role?.toLowerCase()}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <TestTube className="h-8 w-8" />
            Real-time Messaging Test
          </h1>
          <p className="text-muted-foreground">
            Test the real-time messaging system with Server-Sent Events
          </p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <strong>User:</strong> {session.user.name}
                <Badge variant="outline">{session.user.role}</Badge>
              </div>
              <div><strong>Email:</strong> {session.user.email}</div>
              <div><strong>ID:</strong> {session.user.id}</div>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold">Sample Test Data:</h4>
              <div className="bg-muted p-3 rounded mt-2 text-sm font-mono">
                <div>Organizer ID: {sampleData.organizerId}</div>
                <div>Talent ID: {sampleData.talentId}</div>
                <div>Booking ID: {sampleData.bookingId}</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold">How to Test:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Ensure the connection status shows "Connected"</li>
                <li>Fill in the Receiver User ID and Booking ID fields</li>
                <li>Type a test message and send it</li>
                <li>Open another browser tab/window with a different user session</li>
                <li>The receiver should see the message in real-time</li>
                <li>Check message status indicators (sending → delivered → read)</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold">What to Look For:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Connection status indicator should be green</li>
                <li>Messages should appear instantly without page refresh</li>
                <li>Status icons should update in real-time</li>
                <li>SSE debug info should show incoming messages</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Messaging Test Component */}
        <RealTimeMessagingTest />

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>SSE Endpoint:</strong> /api/websocket</div>
              <div><strong>Test Message API:</strong> /api/test-messaging</div>
              <div><strong>Browser Support:</strong> {typeof EventSource !== 'undefined' ? '✅ SSE Supported' : '❌ SSE Not Supported'}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
