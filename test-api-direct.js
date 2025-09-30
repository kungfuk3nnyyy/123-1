
// Direct test of the API transformation logic
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testApiTransformation() {
    console.log('🔍 Testing API Transformation Logic...\n');
    
    // Get bookings directly from database (simulating what the API does)
    const bookings = await prisma.booking.findMany({
        where: {
            talent: {
                email: 'sarah.photographer@example.com'
            }
        },
        include: {
            event: true,
            organizer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    organizerProfile: {
                        select: {
                            companyName: true,
                            phoneNumber: true
                        }
                    }
                }
            },
            reviews: {
                select: {
                    id: true,
                    giverId: true,
                    reviewerType: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    // Apply the same transformation logic as our updated API
    const transformedBookings = bookings.map(booking => ({
        ...booking,
        // Convert Decimal to number for JSON serialization
        amount: Number(booking.amount),
        platformFee: Number(booking.platformFee),
        talentAmount: Number(booking.talentAmount),
        // Add clearly named calculated fields
        gross_amount: Number(booking.amount),
        platform_fee: Number(booking.platformFee),
        net_payout_amount: Number(booking.talentAmount)
    }));

    console.log('📊 Transformed Booking Data for Sarah (Talent):');
    transformedBookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. ${booking.event.title}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Original Fields:`);
        console.log(`   - amount: KES ${booking.amount}`);
        console.log(`   - platformFee: KES ${booking.platformFee}`);
        console.log(`   - talentAmount: KES ${booking.talentAmount}`);
        console.log(`   New API Fields:`);
        console.log(`   - gross_amount: KES ${booking.gross_amount}`);
        console.log(`   - platform_fee: KES ${booking.platform_fee}`);
        console.log(`   - net_payout_amount: KES ${booking.net_payout_amount}`);
        
        // Test frontend display logic
        console.log(`   Frontend Display Logic:`);
        if (booking.status === 'ACCEPTED' || booking.status === 'IN_PROGRESS' || booking.status === 'COMPLETED') {
            console.log(`   ✅ Will show: KES ${booking.net_payout_amount} (net) prominently`);
            console.log(`   📝 Will show: (Total Booking: KES ${booking.gross_amount}) as secondary`);
        } else {
            console.log(`   📊 Will show: KES ${booking.amount} (gross) for PENDING status`);
        }
    });

    await prisma.$disconnect();
    console.log('\n🎉 API Transformation Test Complete!');
}

testApiTransformation().catch(console.error);
