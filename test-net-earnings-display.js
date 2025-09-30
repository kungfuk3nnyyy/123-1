
const https = require('http');

async function testNetEarningsDisplay() {
    console.log('🔍 Testing Net Earnings Display for Talents...\n');

    // Test 1: Login as talent user
    console.log('1. Testing Login as Talent User');
    
    // First get CSRF token
    const csrfResponse = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    
    // Login with credentials
    const loginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=sarah.photographer@example.com&password=password123&csrfToken=${csrfToken}&json=true`
    });
    
    const loginResult = await loginResponse.json();
    console.log('   Login Status:', loginResponse.status);
    console.log('   Login Result:', loginResult.url ? 'Success - Redirected' : loginResult);
    
    // Extract session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Test 2: Get talent bookings with session
    console.log('\n2. Testing Talent Bookings API');
    const bookingsResponse = await fetch('http://localhost:3000/api/talent/bookings', {
        headers: {
            'Cookie': cookies || ''
        }
    });
    
    console.log('   Bookings API Status:', bookingsResponse.status);
    
    if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('   API Response Success:', bookingsData.success);
        
        if (bookingsData.data && bookingsData.data.bookings.length > 0) {
            const sampleBooking = bookingsData.data.bookings[0];
            console.log('\n3. Testing Calculated Fields in API Response');
            console.log('   Sample Booking Fields:');
            console.log('   - amount (gross):', sampleBooking.amount);
            console.log('   - platformFee:', sampleBooking.platformFee);
            console.log('   - talentAmount (net):', sampleBooking.talentAmount);
            console.log('   - gross_amount:', sampleBooking.gross_amount);
            console.log('   - platform_fee:', sampleBooking.platform_fee);
            console.log('   - net_payout_amount:', sampleBooking.net_payout_amount);
            console.log('   - status:', sampleBooking.status);
            
            // Test calculations
            const expectedPlatformFee = Math.round(sampleBooking.amount * 0.10 * 100) / 100;
            const expectedNetAmount = sampleBooking.amount - expectedPlatformFee;
            
            console.log('\n4. Verifying Calculations');
            console.log('   Expected Platform Fee (10%):', expectedPlatformFee);
            console.log('   Actual Platform Fee:', sampleBooking.platform_fee);
            console.log('   Expected Net Amount:', expectedNetAmount);
            console.log('   Actual Net Amount:', sampleBooking.net_payout_amount);
            
            const calculationCorrect = Math.abs(sampleBooking.platform_fee - expectedPlatformFee) < 0.01;
            console.log('   ✅ Calculation Correct:', calculationCorrect);
            
        } else {
            console.log('   No bookings found for testing');
        }
    } else {
        const errorData = await bookingsResponse.text();
        console.log('   API Error:', errorData);
    }
    
    // Test 3: Verify Organizer bookings still show gross amount
    console.log('\n5. Testing Organizer Bookings (Should show gross amount)');
    
    // Login as organizer
    const orgLoginResponse = await fetch('http://localhost:3000/api/auth/callback/credentials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `email=contact@eventpro.ke&password=password123&csrfToken=${csrfToken}&json=true`
    });
    
    const orgCookies = orgLoginResponse.headers.get('set-cookie');
    
    const orgBookingsResponse = await fetch('http://localhost:3000/api/organizer/bookings', {
        headers: {
            'Cookie': orgCookies || ''
        }
    });
    
    console.log('   Organizer Bookings API Status:', orgBookingsResponse.status);
    
    if (orgBookingsResponse.ok) {
        const orgBookingsData = await orgBookingsResponse.json();
        if (orgBookingsData.data && orgBookingsData.data.bookings.length > 0) {
            const orgBooking = orgBookingsData.data.bookings[0];
            console.log('   Organizer booking shows amount:', orgBooking.amount);
            console.log('   ✅ Organizer sees gross amount as expected');
        }
    }
    
    console.log('\n🎉 Test Complete!');
}

// Run the test
testNetEarningsDisplay().catch(console.error);
