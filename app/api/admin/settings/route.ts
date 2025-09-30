
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = "force-dynamic"

// Mock settings store - in production, this would be stored in database
let platformSettings = {
  general: {
    platformName: 'Event Talents',
    platformUrl: 'https://eventtalents.com',
    platformDescription: 'Professional talent booking platform connecting event organizers with skilled talents across Kenya.',
    supportEmail: 'support@eventtalents.com'
  },
  payment: {
    platformFee: 10,
    minPayout: 5000,
    paystackKey: 'sk_test_cb7e7c559969f7612a2bea66c25c135855f21148',
    webhookUrl: 'https://dooonda.co.ke/api/webhooks/paystack',
    autoPayouts: true
  },
  security: {
    twoFactor: false,
    emailVerification: true,
    profileApproval: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5
  },
  notifications: {
    bookingNotifications: true,
    paymentNotifications: true,
    disputeNotifications: true,
    systemNotifications: true
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUsername: 'admin@eventtalents.com',
    smtpPassword: '',
    fromEmail: 'noreply@eventtalents.com'
  },
  system: {
    maintenanceMode: false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      settings: platformSettings,
      lastUpdated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updates = await request.json()

    // Validate and update settings
    if (updates.general) {
      platformSettings.general = { ...platformSettings.general, ...updates.general }
    }
    
    if (updates.payment) {
      platformSettings.payment = { ...platformSettings.payment, ...updates.payment }
    }
    
    if (updates.security) {
      platformSettings.security = { ...platformSettings.security, ...updates.security }
    }
    
    if (updates.notifications) {
      platformSettings.notifications = { ...platformSettings.notifications, ...updates.notifications }
    }
    
    if (updates.email) {
      platformSettings.email = { ...platformSettings.email, ...updates.email }
    }
    
    if (updates.system) {
      platformSettings.system = { ...platformSettings.system, ...updates.system }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: platformSettings
    })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Reset to default settings
    platformSettings = {
      general: {
        platformName: 'Event Talents',
        platformUrl: 'https://eventtalents.com',
        platformDescription: 'Professional talent booking platform connecting event organizers with skilled talents across Kenya.',
        supportEmail: 'support@eventtalents.com'
      },
      payment: {
        platformFee: 10,
        minPayout: 5000,
        paystackKey: 'sk_test_cb7e7c559969f7612a2bea66c25c135855f21148',
        webhookUrl: 'https://dooonda.co.ke/api/webhooks/paystack',
        autoPayouts: true
      },
      security: {
        twoFactor: false,
        emailVerification: true,
        profileApproval: false,
        sessionTimeout: 60,
        maxLoginAttempts: 5
      },
      notifications: {
        bookingNotifications: true,
        paymentNotifications: true,
        disputeNotifications: true,
        systemNotifications: true
      },
      email: {
        smtpHost: 'smtp.gmail.com',
        smtpPort: 587,
        smtpUsername: 'admin@eventtalents.com',
        smtpPassword: '',
        fromEmail: 'noreply@eventtalents.com'
      },
      system: {
        maintenanceMode: false
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings reset to defaults',
      settings: platformSettings
    })

  } catch (error) {
    console.error('Error resetting settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
