
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingAdmins() {
  try {
    console.log('🔄 Starting admin approval status migration...');
    
    // Update all existing admin users to APPROVED status
    const result = await prisma.user.updateMany({
      where: {
        role: 'ADMIN'
      },
      data: {
        adminApprovalStatus: 'APPROVED',
        adminApprovedAt: new Date(),
        adminApprovedBy: 'SYSTEM_MIGRATION'
      }
    });
    
    console.log(`✅ Successfully updated ${result.count} admin users to APPROVED status`);
    
    // Create audit log entries for the migration
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    for (const admin of adminUsers) {
      await prisma.adminAuditLog.create({
        data: {
          adminId: 'SYSTEM',
          adminEmail: 'system@migration',
          targetUserId: admin.id,
          targetUserEmail: admin.email || '',
          action: 'APPROVE_ADMIN',
          details: `System migration: Auto-approved existing admin user ${admin.name || admin.email}`,
          timestamp: new Date()
        }
      });
    }
    
    console.log(`📝 Created audit log entries for ${adminUsers.length} admins`);
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateExistingAdmins()
  .then(() => {
    console.log('✨ Admin approval migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  });
