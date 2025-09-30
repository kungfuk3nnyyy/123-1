
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
  { params }: { params: { path: string[] } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileName = params.path.join('/')
    const filePath = path.join(process.cwd(), 'uploads', 'kyc', fileName)

    // For admin users, allow access to any KYC document
    if (session.user.role === UserRole.ADMIN) {
      try {
        const fileBuffer = await readFile(filePath)
        
        // Determine content type from file extension
        const ext = path.extname(fileName).toLowerCase()
        const contentTypeMap: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.pdf': 'application/pdf'
        }
        
        const contentType = contentTypeMap[ext] || 'application/octet-stream'
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${path.basename(fileName)}"`,
            'Cache-Control': 'private, no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        })
      } catch (fileError) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
    }

    // For regular users, only allow access to their own documents
    // Extract user ID from filename pattern: kyc_userId_submissionId_docType_timestamp_random.ext
    const fileNameParts = fileName.split('_')
    if (fileNameParts.length >= 3 && fileNameParts[0] === 'kyc') {
      const fileUserId = fileNameParts[1]
      
      if (fileUserId === session.user.id) {
        try {
          const fileBuffer = await readFile(filePath)
          
          const ext = path.extname(fileName).toLowerCase()
          const contentTypeMap: { [key: string]: string } = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.pdf': 'application/pdf'
          }
          
          const contentType = contentTypeMap[ext] || 'application/octet-stream'
          
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `inline; filename="${path.basename(fileName)}"`,
              'Cache-Control': 'private, no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          })
        } catch (fileError) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  } catch (error) {
    console.error('Error serving KYC file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
