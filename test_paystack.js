require('dotenv').config();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

console.log('🔑 Testing Paystack API Key...');
console.log('Key present:', PAYSTACK_SECRET_KEY ? 'YES (length: ' + PAYSTACK_SECRET_KEY.length + ')' : 'NO');
console.log('Key starts with sk_test:', PAYSTACK_SECRET_KEY?.startsWith('sk_test_') ? 'YES' : 'NO');

const testPaystackAPI = async () => {
  const testData = {
    email: 'test@example.com',
    amount: 5000000, // KES 50,000 in cents
    currency: 'KES',
    reference: `test_${Date.now()}`,
    callback_url: 'https://example.com/callback'
  };

  console.log('\n💰 Test Data:');
  console.log('  - Email:', testData.email);
  console.log('  - Amount (KES):', testData.amount / 100);
  console.log('  - Amount (Cents):', testData.amount);
  console.log('  - Currency:', testData.currency);

  console.log('\n🚀 Making test request to Paystack...');

  try {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response OK:', response.ok);
    console.log('📊 Paystack Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.status) {
      console.log('\n✅ SUCCESS! Paystack API key is working correctly!');
      console.log('🔗 Test Authorization URL:', result.data.authorization_url);
    } else {
      console.log('\n❌ FAILED! Paystack API returned an error:');
      console.log('Error:', result.message || 'Unknown error');
    }
  } catch (error) {
    console.log('\n💥 REQUEST FAILED!');
    console.error('Error:', error.message);
  }
};

testPaystackAPI();
