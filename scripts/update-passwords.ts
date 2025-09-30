
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// User credentials to update with proper bcrypt hashing
const userCredentials = [
  { email: 'admin@example.com', password: 'superadminpassword' },
  { email: 'talent1@example.com', password: 'password123' },
  { email: 'organizer1@example.com', password: 'password123' }
];

async function updatePasswords() {
  console.log('Starting password update process...');

  try {
    for (const credential of userCredentials) {
      console.log(`Updating password for ${credential.email}...`);
      
      // Hash the password with bcrypt (salt rounds: 12)
      const hashedPassword = await bcrypt.hash(credential.password, 12);
      
      // Update the user's password in the database
      const updatedUser = await prisma.user.update({
        where: { email: credential.email },
        data: { password: hashedPassword },
        select: { id: true, email: true, role: true }
      });
      
      console.log(`✅ Updated password for ${updatedUser.email} (${updatedUser.role})`);
    }
    
    console.log('\n🎉 All passwords updated successfully with secure bcrypt hashing!');
    console.log('\nUpdated credentials:');
    console.log('- admin@example.com: superadminpassword');
    console.log('- talent1@example.com: password123');
    console.log('- organizer1@example.com: password123');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the password update
updatePasswords();
