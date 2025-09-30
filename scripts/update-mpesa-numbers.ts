import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateMpesaNumbers() {
  try {
    console.log('Starting MPESA number update...');
    
    // Find all talent profiles with a phoneNumber but missing mpesaPhoneNumber
    const talents = await prisma.talentProfile.findMany({
      where: {
        OR: [
          { phoneNumber: { not: null } },
          { mpesaPhoneNumber: null }
        ]
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${talents.length} talent profiles to process`);

    let updatedCount = 0;
    const errors = [];

    for (const talent of talents) {
      try {
        // Skip if no phone number is available
        if (!talent.phoneNumber) {
          console.log(`Skipping ${talent.User?.name || 'Unknown Talent'}: No phone number`);
          continue;
        }

        // Normalize the phone number
        let normalizedNumber = talent.phoneNumber.replace(/\D/g, '');
        
        // Convert to 254 format if it starts with 0 or 7
        if (normalizedNumber.startsWith('0')) {
          normalizedNumber = '254' + normalizedNumber.substring(1);
        } else if (normalizedNumber.startsWith('7')) {
          normalizedNumber = '254' + normalizedNumber;
        }

        // Validate the number format
        const phoneRegex = /^254[17]\d{8}$/;
        if (!phoneRegex.test(normalizedNumber)) {
          console.warn(`Invalid phone number format for ${talent.User?.name || 'Unknown Talent'}: ${talent.phoneNumber}`);
          continue;
        }

        // Update the talent profile
        await prisma.talentProfile.update({
          where: { id: talent.id },
          data: {
            mpesaPhoneNumber: normalizedNumber,
            mpesaVerified: true // Optionally set to true if you want to auto-verify
          }
        });

        console.log(`Updated ${talent.User?.name || 'Unknown Talent'}: ${normalizedNumber}`);
        updatedCount++;
      } catch (error) {
        console.error(`Error updating talent ${talent.id}:`, error);
        errors.push({
          talentId: talent.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log('\nUpdate complete!');
    console.log(`Successfully updated ${updatedCount} talent profiles`);
    
    if (errors.length > 0) {
      console.log('\nErrors encountered:');
      console.table(errors);
    }

  } catch (error) {
    console.error('Error in updateMpesaNumbers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateMpesaNumbers()
  .catch(console.error)
  .finally(() => process.exit(0));
