
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { readFile } from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the KYC document
    const document = await prisma.kycDocument.findUnique({
      where: { id: params.id },
      include: {
        KycSubmission: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Check if file exists
    try {
      const fileBuffer = await readFile(document.filePath)
      
      // Determine content type
      const contentType = document.mimeType || 'application/octet-stream'
      
      // Create response with proper headers
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${document.fileName}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })

      return response
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json(
        { error: 'File not found or cannot be read' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error serving KYC document:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve document' },
      { status: 500 }
    )
  }
}
