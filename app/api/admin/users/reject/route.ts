
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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
        error: 'Only approved admins can perform rejection actions' 
      }, { status: 403 });
    }
    
    const { userId, reason } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    if (!reason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
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
        error: 'Only admin users can be rejected' 
      }, { status: 400 });
    }
    
    if (targetUser.adminApprovalStatus === 'APPROVED') {
      return NextResponse.json({ 
        error: 'Cannot reject an approved admin user' 
      }, { status: 400 });
    }
    
    // Reject the admin user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        adminApprovalStatus: 'REJECTED',
        adminRejectedAt: new Date(),
        adminRejectedBy: session.user.id,
        adminRejectionReason: reason.trim(),
        adminApprovedAt: null,
        adminApprovedBy: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        adminApprovalStatus: true,
        adminRejectedAt: true,
        adminRejectionReason: true
      }
    });
    
    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        adminEmail: session.user.email || '',
        targetUserId: userId,
        targetUserEmail: targetUser.email || '',
        action: 'REJECT_ADMIN',
        details: `Rejected admin user: ${targetUser.name || targetUser.email}. Reason: ${reason.trim()}`,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Admin user rejected successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Admin rejection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
