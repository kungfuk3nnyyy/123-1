const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function testMessagingSystem() {
  console.log('🚀 COMPLETE MESSAGING SYSTEM TEST');
  console.log('===============================\n');
  
  console.log('📋 Phase 1: System Health Check');
  console.log('------------------------------');
  
  try {
    // Test the debug endpoint
    const { stdout: debugResult } = await execAsync('curl -s "http://localhost:3000/api/debug-messaging"');
    const debugData = JSON.parse(debugResult);
    
    if (debugData.success) {
      console.log('✅ Database and API files: OK');
      console.log(`   Messages: ${debugData.testResults.tests[1].details.messageCount}`);
      console.log(`   Bookings: ${debugData.testResults.tests[2].details.bookingCount}`);
      console.log(`   Active connections: ${debugData.testResults.tests[3].details.activeConnections}`);
    } else {
      console.log('❌ System health check failed');
      return;
    }
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error.message);
    return;
  }
  
  console.log('\n📋 Phase 2: Frontend Component Tests');
  console.log('-----------------------------------');
  
  // Check if the messaging pages exist and are accessible
  const pagesToCheck = [
    '/organizer/messages',
    '/talent/messages'  
  ];
  
  for (const page of pagesToCheck) {
    try {
      const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000${page}"`);
      const statusCode = stdout.trim();
      
      if (statusCode === '200') {
        console.log(`✅ ${page}: Accessible`);
      } else if (statusCode === '302' || statusCode === '307') {
        console.log(`⚠️  ${page}: Redirects (likely to login - this is expected)`);
      } else {
        console.log(`❌ ${page}: Status ${statusCode}`);
      }
    } catch (error) {
      console.log(`❌ ${page}: Error checking`);
    }
  }
  
  console.log('\n📋 Phase 3: API Endpoint Protection Check');
  console.log('----------------------------------------');
  
  const apiEndpoints = [
    '/api/messages',
    '/api/organizer/messages',
    '/api/talent/messages',
    '/api/websocket'
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      const { stdout } = await execAsync(`curl -s "http://localhost:3000${endpoint}"`);
      
      if (stdout.includes('/api/auth/signin')) {
        console.log(`✅ ${endpoint}: Properly protected (redirects to login)`);
      } else if (stdout.includes('error')) {
        console.log(`⚠️  ${endpoint}: Returns error (check authentication)`);
      } else {
        console.log(`❌ ${endpoint}: Not properly protected`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Test failed`);
    }
  }
  
  console.log('\n📋 Phase 4: Real-time System Analysis');
  console.log('------------------------------------');
  
  // Check the real-time messaging hook and components
  const filesToCheck = [
    'hooks/use-real-time-messaging.ts',
    'lib/real-time-messaging.ts',
    'app/api/websocket/route.ts'
  ];
  
  for (const file of filesToCheck) {
    try {
      await execAsync(`test -f "${file}"`);
      console.log(`✅ ${file}: Exists`);
    } catch (error) {
      console.log(`❌ ${file}: Missing`);
    }
  }
  
  console.log('\n📋 Phase 5: Message Flow Test Simulation');
  console.log('---------------------------------------');
  
  // Check existing messages and their structure
  try {
    const { stdout: debugResult } = await execAsync('curl -s "http://localhost:3000/api/debug-messaging"');
    const debugData = JSON.parse(debugResult);
    const messages = debugData.testResults.tests[1].details.messages;
    
    console.log(`✅ Found ${messages.length} existing messages:`);
    messages.forEach((msg, i) => {
      console.log(`   ${i + 1}. ${msg.from} -> ${msg.to}: "${msg.content}" (Read: ${msg.isRead})`);
    });
    
    // Check for unread messages (potential real-time delivery issue)
    const unreadMessages = messages.filter(m => !m.isRead);
    if (unreadMessages.length > 0) {
      console.log(`⚠️  Found ${unreadMessages.length} unread messages - real-time notifications might not be working`);
    } else {
      console.log('✅ All messages have been read');
    }
    
  } catch (error) {
    console.log('❌ Could not analyze message flow');
  }
  
  console.log('\n📋 Phase 6: Identified Issues Summary');
  console.log('-----------------------------------');
  
  const issues = [];
  
  // Check for common issues based on our analysis
  try {
    const { stdout: debugResult } = await execAsync('curl -s "http://localhost:3000/api/debug-messaging"');
    const debugData = JSON.parse(debugResult);
    const activeConnections = debugData.testResults.tests[3].details.activeConnections;
    
    if (activeConnections === 0) {
      issues.push('🔴 CRITICAL: No active real-time connections detected');
      issues.push('   - Users may not receive real-time message notifications');  
      issues.push('   - WebSocket/SSE connection is not being established');
    }
    
    const messages = debugData.testResults.tests[1].details.messages;
    const unreadCount = messages.filter(m => !m.isRead).length;
    
    if (unreadCount > 0) {
      issues.push(`🟡 WARNING: ${unreadCount} unread messages found`);
      issues.push('   - Message read status may not be updating properly');
    }
    
  } catch (error) {
    issues.push('🔴 CRITICAL: Cannot access debug information');
  }
  
  if (issues.length === 0) {
    console.log('✅ No critical issues detected');
    console.log('   The messaging system appears to be functioning correctly');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log(issue));
  }
  
  console.log('\n📋 Phase 7: Recommended Actions');
  console.log('------------------------------');
  
  if (issues.some(i => i.includes('real-time connections'))) {
    console.log('🔧 Real-time Connection Fixes Needed:');
    console.log('   1. Check if useRealTimeMessaging hook is being used in frontend');
    console.log('   2. Verify WebSocket/SSE endpoint is accessible');
    console.log('   3. Test browser console for connection errors');
    console.log('   4. Ensure proper authentication for WebSocket connections');
  }
  
  if (issues.some(i => i.includes('unread messages'))) {
    console.log('🔧 Message Read Status Fixes:');
    console.log('   1. Check if markAsRead API is being called');
    console.log('   2. Verify message read status updates in UI');
  }
  
  console.log('\n🏁 COMPLETE MESSAGING SYSTEM TEST FINISHED');
  console.log('==========================================');
}

testMessagingSystem().catch(console.error);
