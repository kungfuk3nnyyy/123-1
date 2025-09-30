
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing Admin Approval System Database...');
    
    // Test admin approval fields
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: {
        email: true,
        adminApprovalStatus: true,
        adminApprovedAt: true
      }
    });
    
    if (admin) {
      console.log('✅ Admin approval fields exist in database');
      console.log('📋 Admin status:', admin.adminApprovalStatus);
    }
    
    // Test audit log table
    const auditCount = await prisma.adminAuditLog.count();
    console.log('✅ AdminAuditLog table exists with', auditCount, 'entries');
    
    // Test admin statistics
    const stats = {
      total: await prisma.user.count({ where: { role: 'ADMIN' } }),
      pending: await prisma.user.count({ where: { role: 'ADMIN', adminApprovalStatus: 'PENDING' } }),
      approved: await prisma.user.count({ where: { role: 'ADMIN', adminApprovalStatus: 'APPROVED' } })
    };
    
    console.log('📊 Admin Stats - Total:', stats.total, 'Pending:', stats.pending, 'Approved:', stats.approved);
    console.log('🎉 Database schema and functionality working correctly!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
