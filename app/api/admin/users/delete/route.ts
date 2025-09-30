
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated and is an approved admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get the current admin's approval status
    const currentAdmin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { adminApprovalStatus: true }
    });
    
    if (currentAdmin?.adminApprovalStatus !== 'APPROVED') {
      return NextResponse.json({ 
        error: 'Only approved admins can delete admin users' 
      }, { status: 403 });
    }
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Prevent self-deletion
    if (userId === session.user.id) {
      return NextResponse.json({ 
        error: 'You cannot delete your own admin account' 
      }, { status: 400 });
    }
    
    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true,
        adminApprovalStatus: true
      }
    });
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (targetUser.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Only admin users can be deleted through this endpoint' 
      }, { status: 400 });
    }
    
    // Check if this would leave no approved admins
    const approvedAdminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
        adminApprovalStatus: 'APPROVED',
        id: { not: userId } // Exclude the user being deleted
      }
    });
    
    if (approvedAdminCount === 0) {
      return NextResponse.json({ 
        error: 'Cannot delete the last approved admin. At least one approved admin must remain.' 
      }, { status: 400 });
    }
    
    // Delete the admin user
    await prisma.user.delete({
      where: { id: userId }
    });
    
    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        targetUserId: userId,
        targetUserEmail: targetUser.email || '',
        action: 'DELETE_ADMIN',
        details: `Deleted admin user: ${targetUser.name || targetUser.email}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin user deleted successfully'
    });
    
  } catch (error) {
    console.error('Admin deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
