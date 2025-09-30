const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Since we can't easily test with cookies in Node.js, let's test the API logic directly
async function testPayoutLogic() {
  try {
    console.log('=== COMPREHENSIVE PAYOUT SYSTEM TEST ===\n');

    // 1. Get booking data that should be ready for payout
    console.log('1. FETCHING COMPLETED BOOKINGS FOR PAYOUT...');
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        isPaidOut: false
      },
      include: {
        talent: {
          include: {
            talentProfile: true
          }
        },
        event: {
          select: {
            title: true
          }
        }
      }
    });

    console.log(`   Found ${completedBookings.length} completed bookings ready for payout\n`);

    // 2. Test each booking individually
    for (const booking of completedBookings) {
      console.log(`2. TESTING BOOKING: ${booking.event.title}`);
      console.log(`   Booking ID: ${booking.id}`);
      console.log(`   Talent: ${booking.talent.name} (${booking.talent.email})`);
      console.log(`   KYC Status: ${booking.talent.verificationStatus}`);
      console.log(`   M-Pesa Number: ${booking.talent.talentProfile?.mpesaPhoneNumber || 'Not Set'}`);
      console.log(`   Amount: KES ${booking.amount}`);

      // Simulate the API validation logic
      console.log('\n   API VALIDATION CHECKS:');

      // Check 1: Booking status
      if (booking.status !== 'COMPLETED') {
        console.log('   ❌ FAIL: Booking status is not COMPLETED');
        continue;
      } else {
        console.log('   ✅ PASS: Booking status is COMPLETED');
      }

      // Check 2: Already paid out
      if (booking.isPaidOut) {
        console.log('   ❌ FAIL: Booking already paid out');
        continue;
      } else {
        console.log('   ✅ PASS: Booking not yet paid out');
      }

      // Check 3: M-Pesa number configured
      if (!booking.talent.talentProfile?.mpesaPhoneNumber) {
        console.log('   ❌ FAIL: No M-Pesa phone number configured');
        continue;
      } else {
        console.log('   ✅ PASS: M-Pesa phone number configured');
      }

      // Check 4: KYC verification (CRITICAL)
      if (booking.talent.verificationStatus !== 'VERIFIED') {
        console.log(`   ❌ FAIL: KYC verification required (status: ${booking.talent.verificationStatus})`);
        continue;
      } else {
        console.log('   ✅ PASS: KYC verification complete');
      }

      // Calculate payout amount
      const platformFeePercentage = 0.10;
      const payoutAmount = Number(booking.amount) * (1 - platformFeePercentage);
      const payoutAmountInKobo = Math.round(payoutAmount * 100);

      console.log(`\n   PAYOUT CALCULATION:`);
      console.log(`   - Booking Amount: KES ${booking.amount}`);
      console.log(`   - Platform Fee (10%): KES ${Number(booking.amount) * platformFeePercentage}`);
      console.log(`   - Payout Amount: KES ${payoutAmount}`);
      console.log(`   - Payout in Kobo: ${payoutAmountInKobo}`);

      // Simulate Paystack recipient data
      const recipientData = {
        name: booking.talent.name || 'Talent',
        account_number: booking.talent.talentProfile.mpesaPhoneNumber,
        bank_code: 'MPESA',
        currency: 'KES'
      };

      console.log(`\n   PAYSTACK RECIPIENT DATA:`);
      console.log(`   - Name: ${recipientData.name}`);
      console.log(`   - Account (M-Pesa): ${recipientData.account_number}`);
      console.log(`   - Bank Code: ${recipientData.bank_code}`);
      console.log(`   - Currency: ${recipientData.currency}`);

      // Generate transfer reference
      const transferReference = `payout_${booking.id}_${Date.now()}`;
      console.log(`   - Transfer Reference: ${transferReference}`);

      console.log('\n   🎯 THIS BOOKING SHOULD WORK FOR PAYOUT!\n');
      console.log('   Next step would be actual Paystack API calls:');
      console.log('   1. POST /transferrecipient to create recipient');
      console.log('   2. POST /transfer to initiate transfer');
      console.log('   3. Create payout record in database');
      console.log('   4. Update booking.isPaidOut = true');
      
      break; // Test only the first valid booking
    }

    console.log('\n=== NEXT STEPS FOR DEBUGGING ===');
    console.log('1. Test Paystack API connectivity');
    console.log('2. Check Paystack account balance'); 
    console.log('3. Test with minimal amount (KES 10)');
    console.log('4. Add comprehensive logging to API endpoint');
    console.log('5. Test through admin interface with browser dev tools');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPayoutLogic();
