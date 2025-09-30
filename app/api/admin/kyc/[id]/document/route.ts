
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Serve KYC document to admin (secure temporary access)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First try to find the new KYC submission structure
    const kycSubmission = await prisma.kycSubmission.findUnique({
      where: { id: params.id },
      include: {
        KycDocument: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            mimeType: true,
          },
          take: 1, // Get the first document for backward compatibility
        },
      },
    })

    if (!kycSubmission) {
      return NextResponse.json({ error: 'KYC submission not found' }, { status: 404 })
    }

    let filePath: string
    let fileName: string
    let mimeType: string | null = null

    // Check if this is a new submission with separate documents
    if (kycSubmission.KycDocument && kycSubmission.KycDocument.length > 0) {
      const document = kycSubmission.KycDocument[0]
      filePath = document.filePath
      fileName = document.fileName
      mimeType = document.mimeType
    } else {
      // Fallback to legacy structure
      const legacySubmission = await prisma.kycSubmission.findUnique({
        where: { id: params.id },
        select: {
          documentFileName: true,
          documentFilePath: true,
        },
      })

      if (!legacySubmission?.documentFilePath) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 })
      }

      filePath = legacySubmission.documentFilePath
      fileName = legacySubmission.documentFileName
    }

    try {
      const fileBuffer = await readFile(filePath)
      
      // Determine content type
      let contentType = mimeType || 'application/octet-stream'
      
      if (!mimeType) {
        // Fallback to file extension detection
        const fileExtension = fileName.split('.').pop()?.toLowerCase()
        
        switch (fileExtension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg'
            break
          case 'png':
            contentType = 'image/png'
            break
          case 'pdf':
            contentType = 'application/pdf'
            break
        }
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Security headers for document viewing
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Referrer-Policy': 'no-referrer'
        }
      })

    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json({ 
        error: 'Document file not found or corrupted' 
      }, { status: 404 })
    }

  } catch (error) {
    console.error('KYC document serve error:', error)
    return NextResponse.json({ 
      error: 'Failed to serve document' 
    }, { status: 500 })
  }
}
