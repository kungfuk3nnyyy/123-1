
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-xl">
        <CardHeader className="pb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-800">Access Denied</CardTitle>
          <CardDescription className="text-red-600">
            You do not have permission to access this page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-8">
            Please contact your administrator if you believe this is an error.
          </p>
          <Button asChild className="w-full">
            <Link href="/auth/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
