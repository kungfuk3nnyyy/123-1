
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_your_secret_key_here'

interface HealthStatus {
  status: 'operational' | 'degraded' | 'down'
  message: string
  responseTime?: number
}

interface SystemHealth {
  system: HealthStatus
  database: HealthStatus
  paymentGateway: HealthStatus
  notifications: HealthStatus
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const healthChecks: SystemHealth = {
      system: { status: 'operational', message: 'All systems operational' },
      database: { status: 'operational', message: 'Connected' },
      paymentGateway: { status: 'operational', message: 'Active' },
      notifications: { status: 'operational', message: 'Enabled' }
    }

    // Database Health Check
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const dbResponseTime = Date.now() - dbStart
      
      healthChecks.database = {
        status: dbResponseTime < 1000 ? 'operational' : 'degraded',
        message: dbResponseTime < 1000 ? 'Connected' : 'Slow response',
        responseTime: dbResponseTime
      }
    } catch (dbError) {
      console.error('Database health check failed:', dbError)
      healthChecks.database = {
        status: 'down',
        message: 'Connection failed'
      }
    }

    // Paystack Health Check
    try {
      const paystackStart = Date.now()
      const response = await fetch('https://api.paystack.co/bank', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      const paystackResponseTime = Date.now() - paystackStart
      
      if (response.ok) {
        healthChecks.paymentGateway = {
          status: paystackResponseTime < 2000 ? 'operational' : 'degraded',
          message: paystackResponseTime < 2000 ? 'Active' : 'Slow response',
          responseTime: paystackResponseTime
        }
      } else {
        healthChecks.paymentGateway = {
          status: 'degraded',
          message: 'API response error'
        }
      }
    } catch (paystackError) {
      console.error('Paystack health check failed:', paystackError)
      healthChecks.paymentGateway = {
        status: 'down',
        message: 'API unavailable'
      }
    }

    // Overall System Status
    const hasDown = Object.values(healthChecks).some(check => check.status === 'down')
    const hasDegraded = Object.values(healthChecks).some(check => check.status === 'degraded')
    
    if (hasDown) {
      healthChecks.system = {
        status: 'down',
        message: 'Some services are down'
      }
    } else if (hasDegraded) {
      healthChecks.system = {
        status: 'degraded',
        message: 'Some services are degraded'
      }
    }

    // Get additional system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: {
        health: healthChecks,
        metrics: systemMetrics
      }
    })

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      success: true,
      data: {
        health: {
          system: { status: 'down', message: 'Health check failed' },
          database: { status: 'down', message: 'Unknown' },
          paymentGateway: { status: 'down', message: 'Unknown' },
          notifications: { status: 'down', message: 'Unknown' }
        },
        metrics: {
          uptime: 0,
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString()
        }
      }
    })
  }
}
