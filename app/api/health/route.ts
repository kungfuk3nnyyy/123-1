
// Health check API route for Docker container health monitoring
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    // Check if essential environment variables are present
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          message: 'Missing environment variables',
          missing: missingVars,
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }

    // Return healthy status
    return NextResponse.json({
      status: 'healthy',
      message: 'Application is running correctly',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Also support HEAD requests for simple health checks
export async function HEAD() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
