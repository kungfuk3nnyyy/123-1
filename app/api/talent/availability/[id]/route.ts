
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { deleteAvailability } from '@/lib/availability'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// DELETE - Delete availability entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== UserRole.TALENT) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify the availability entry belongs to the current talent
    const existingEntry = await prisma.talentAvailability.findUnique({
      where: { id }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Availability entry not found' },
        { status: 404 }
      )
    }

    if (existingEntry.talentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this availability entry' },
        { status: 403 }
      )
    }

    await deleteAvailability(id)

    return NextResponse.json({
      success: true,
      message: 'Availability entry deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
