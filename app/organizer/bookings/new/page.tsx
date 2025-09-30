
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Construction } from 'lucide-react'
import Link from 'next/link'

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/marketplace">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Make Offer</h1>
          <p className="text-muted-foreground">
            Create a booking offer for a talent
          </p>
        </div>
      </div>

      <Card className="p-12">
        <div className="text-center">
          <Construction className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            The booking offer system is currently under development and will be available soon.
          </p>
          <Button asChild variant="outline">
            <Link href="/marketplace">
              <Calendar className="mr-2 h-4 w-4" />
              Back to Marketplace
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
