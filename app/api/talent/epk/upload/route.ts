import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { withFileUploadSecurity } from '@/lib/security/middleware'
import { secureFileUpload, uploadConfigs } from '@/lib/security/fileUpload'
import { sanitizeFileName } from '@/lib/security/sanitization'

export const dynamic = 'force-dynamic'

const postHandler = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the talent profile associated with the user
    const talentProfile = await prisma.talentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!talentProfile) {
      return NextResponse.json({ error: 'Talent profile not found' }, { status: 404 });
    }

    const formData = await request.formData()
    const file = formData.get('epk') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Use secure file upload
    let uploadResult;
    try {
      uploadResult = await secureFileUpload(
        file,
        uploadConfigs.epkFiles,
        session.user.id
      );
    } catch (error) {
      console.error('Secure file upload error:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'File upload failed' 
      }, { status: 400 });
    }

    // Use the correct talentProfile.id for the foreign key
    const portfolioItem = await prisma.file.create({
      data: {
        filename: uploadResult.fileName,
        originalName: sanitizeFileName(uploadResult.originalName),
        mimeType: uploadResult.mimeType,
        size: uploadResult.fileSize,
        url: uploadResult.fileUrl,
        talentId: talentProfile.id
      }
    })

    return NextResponse.json({
      success: true,
      data: portfolioItem
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withFileUploadSecurity({
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/mov', 'video/avi', 'video/quicktime',
    'application/pdf', 'text/plain'
  ],
  maxFiles: 1
})(postHandler);

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'File ID required' }, { status: 400 })
    }

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        TalentProfile: {
          userId: session.user.id,
        },
      }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    await prisma.file.delete({
      where: { id: fileId }
    })

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('File deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}