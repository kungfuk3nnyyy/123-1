
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// GET /api/files/epk/[...filename] - Serve EPK files
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string[] } }
) {
  try {
    const filename = params.filename?.join('/') || ''
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename)
    
    // Construct file path
    const filepath = path.join(process.cwd(), 'uploads', 'epk', sanitizedFilename)

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read file
    const fileBuffer = await readFile(filepath)
    
    // Return PDF file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${sanitizedFilename}"`
      }
    })

  } catch (error) {
    console.error('Error serving EPK file:', error)
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}
