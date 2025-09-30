
'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'

export default function PayoutsRedirect() {
  useEffect(() => {
    redirect('/talent/mpesa')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to M-Pesa setup...</p>
      </div>
    </div>
  )
}
