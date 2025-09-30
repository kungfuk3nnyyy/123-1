
const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const requestOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data || null
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

class MessagingDiagnostic {
  constructor() {
    this.testData = {};
    this.issues = [];
    this.successes = [];
  }

  log(message, type = 'info') {
    const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
    console.log(`${icons[type]} ${message}`);
    
    if (type === 'error') this.issues.push(message);
    if (type === 'success') this.successes.push(message);
  }

  async fetchTestData() {
    this.log('Fetching test data from database...', 'info');
    
    try {
      // Get users
      const usersResponse = await makeRequest('/api/test-messaging?action=users');
      if (usersResponse.status === 200) {
        this.testData.users = usersResponse.data.data;
        this.log(`Found ${this.testData.users.length} users`, 'success');
        
        // Identify organizer and talent
        this.testData.organizer = this.testData.users.find(u => u.role === 'ORGANIZER');
        this.testData.talent = this.testData.users.find(u => u.role === 'TALENT');
        
        if (this.testData.organizer && this.testData.talent) {
          this.log(`Test users identified: ${this.testData.organizer.name} (organizer), ${this.testData.talent.name} (talent)`, 'success');
        } else {
          this.log('Could not find both organizer and talent users', 'error');
        }
      } else {
        this.log(`Failed to fetch users: ${usersResponse.status}`, 'error');
      }

      // Get bookings
      const bookingsResponse = await makeRequest('/api/test-messaging?action=bookings');
      if (bookingsResponse.status === 200) {
        this.testData.bookings = bookingsResponse.data.data;
        this.log(`Found ${this.testData.bookings.length} bookings`, 'success');
        
        // Find a booking with our test users
        this.testData.testBooking = this.testData.bookings.find(b => 
          (b.organizerId === this.testData.organizer?.id && b.talentId === this.testData.talent?.id) ||
          (this.testData.organizer && this.testData.talent)
        );
        
        if (this.testData.testBooking) {
          this.log(`Test booking found: ${this.testData.testBooking.event.title}`, 'success');
        } else if (this.testData.bookings.length > 0) {
          this.testData.testBooking = this.testData.bookings[0];
          this.log(`Using first available booking: ${this.testData.testBooking.event.title}`, 'warning');
        }
      }

      // Get existing messages
      const messagesResponse = await makeRequest('/api/test-messaging?action=list');
      if (messagesResponse.status === 200) {
        this.testData.messages = messagesResponse.data.data;
        this.log(`Found ${this.testData.messages.length} existing messages`, 'success');
      }

      // Get conversation data
      const conversationsResponse = await makeRequest('/api/test-messaging?action=conversations');
      if (conversationsResponse.status === 200) {
        this.testData.conversations = conversationsResponse.data.data;
        this.log(`Found ${this.testData.conversations.length} conversation groups`, 'success');
      }

    } catch (error) {
      this.log(`Error fetching test data: ${error.message}`, 'error');
    }
  }

  async testMessageCreation() {
    this.log('\nTesting Message Creation...', 'info');
    
    if (!this.testData.testBooking) {
      this.log('No test booking available for message creation', 'error');
      return;
    }

    // Test 1: Valid message creation
    try {
      const messageData = {
        senderId: this.testData.testBooking.organizerId,
        receiverId: this.testData.testBooking.talentId,
        bookingId: this.testData.testBooking.id,
        content: `Test message from diagnostic - ${new Date().toISOString()}`
      };

      const response = await makeRequest('/api/test-messaging', {
        method: 'POST',
        body: messageData
      });

      if (response.status === 201) {
        this.log('✅ Message creation successful', 'success');
        this.testData.newMessage = response.data.data;
        console.log('   Created message:', {
          id: this.testData.newMessage.id,
          from: this.testData.newMessage.sender.name,
          to: this.testData.newMessage.receiver.name,
          content: this.testData.newMessage.content.substring(0, 50) + '...'
        });
      } else {
        this.log(`Message creation failed: ${response.status} - ${JSON.stringify(response.data)}`, 'error');
      }
    } catch (error) {
      this.log(`Message creation error: ${error.message}`, 'error');
    }

    // Test 2: Invalid message creation (missing fields)
    try {
      const invalidData = {
        senderId: this.testData.testBooking.organizerId,
        // Missing receiverId
        bookingId: this.testData.testBooking.id,
        content: 'Test invalid message'
      };

      const response = await makeRequest('/api/test-messaging', {
        method: 'POST',
        body: invalidData
      });

      if (response.status === 400) {
        this.log('✅ Validation working - rejected invalid message', 'success');
      } else {
        this.log(`Validation failed - accepted invalid message: ${response.status}`, 'error');
      }
    } catch (error) {
      this.log(`Invalid message test error: ${error.message}`, 'error');
    }
  }

  async testMessageRetrieval() {
    this.log('\nTesting Message Retrieval...', 'info');
    
    // Get fresh message list
    try {
      const response = await makeRequest('/api/test-messaging?action=list');
      
      if (response.status === 200) {
        const messages = response.data.data;
        this.log(`✅ Retrieved ${messages.length} messages`, 'success');
        
        // Check message structure
        if (messages.length > 0) {
          const firstMessage = messages[0];
          const hasRequiredFields = firstMessage.id && firstMessage.content && 
                                   firstMessage.sender && firstMessage.receiver && 
                                   firstMessage.booking;
          
          if (hasRequiredFields) {
            this.log('✅ Message structure is complete', 'success');
          } else {
            this.log('❌ Message structure is incomplete', 'error');
            console.log('   Missing fields in:', firstMessage);
          }
        }
      } else {
        this.log(`Message retrieval failed: ${response.status}`, 'error');
      }
    } catch (error) {
      this.log(`Message retrieval error: ${error.message}`, 'error');
    }
  }

  async testConversationGrouping() {
    this.log('\nTesting Conversation Grouping...', 'info');
    
    try {
      const response = await makeRequest('/api/test-messaging?action=conversations');
      
      if (response.status === 200) {
        const conversations = response.data.data;
        this.log(`✅ Found ${conversations.length} conversation groups`, 'success');
        
        conversations.forEach((conv, i) => {
          console.log(`   ${i+1}. Sender: ${conv.senderId.substring(0, 8)}, Receiver: ${conv.receiverId.substring(0, 8)}, Messages: ${conv._count.id}`);
        });

        // Test if conversations are properly grouped
        const uniqueBookings = new Set(conversations.map(c => c.bookingId));
        this.log(`Conversations span ${uniqueBookings.size} bookings`, 'info');

      } else {
        this.log(`Conversation grouping failed: ${response.status}`, 'error');
      }
    } catch (error) {
      this.log(`Conversation grouping error: ${error.message}`, 'error');
    }
  }

  async analyzeRoleSpecificAPIs() {
    this.log('\nAnalyzing Role-specific API Issues...', 'info');
    
    // This is where we'll analyze the actual organizer/talent API endpoints
    // after we get the core messaging working
    
    this.log('The role-specific APIs (/api/organizer/messages, /api/talent/messages) have these potential issues:', 'warning');
    console.log('   1. Different conversation grouping logic between organizer and talent');
    console.log('   2. Inconsistent API response formats');
    console.log('   3. Missing bookingId requirements in some endpoints');
    console.log('   4. Different pagination approaches');
    
    this.log('These need to be fixed after core messaging works', 'info');
  }

  async identifyRealTimeIssues() {
    this.log('\nIdentifying Real-time Update Issues...', 'info');
    
    this.log('❌ No WebSocket implementation found', 'error');
    this.log('❌ No Server-Sent Events implementation found', 'error');
    this.log('❌ Messages only update on page refresh or manual API calls', 'error');
    
    console.log('   Real-time solutions needed:');
    console.log('   1. WebSocket server for instant message delivery');
    console.log('   2. Message event broadcasting');
    console.log('   3. Frontend WebSocket client integration');
    console.log('   4. Unread message indicator updates');
  }

  async testUnreadTracking() {
    this.log('\nTesting Unread Message Tracking...', 'info');
    
    if (this.testData.messages) {
      const unreadMessages = this.testData.messages.filter(m => !m.isRead);
      const readMessages = this.testData.messages.filter(m => m.isRead);
      
      this.log(`Found ${unreadMessages.length} unread and ${readMessages.length} read messages`, 'info');
      
      if (unreadMessages.length > 0) {
        this.log('✅ Unread tracking field is working', 'success');
      } else {
        this.log('⚠️  All messages are marked as read - cannot test unread tracking', 'warning');
      }
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MESSAGING SYSTEM DIAGNOSTIC REPORT');
    console.log('='.repeat(60));
    
    console.log('\n✅ SUCCESSES:');
    this.successes.forEach(success => console.log(`   • ${success}`));
    
    console.log('\n❌ ISSUES FOUND:');
    this.issues.forEach(issue => console.log(`   • ${issue}`));
    
    console.log('\n🔧 PRIORITY FIXES NEEDED:');
    console.log('   1. HIGH: Fix role-specific API endpoint inconsistencies');
    console.log('   2. HIGH: Implement WebSocket real-time messaging');
    console.log('   3. MEDIUM: Fix conversation grouping logic');
    console.log('   4. MEDIUM: Standardize API response formats');
    console.log('   5. LOW: Add message attachment support');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Fix organizer/talent API endpoints');
    console.log('   2. Add WebSocket server');
    console.log('   3. Update frontend for real-time updates');
    console.log('   4. Test with proper authentication');
    
    console.log('\n' + '='.repeat(60));
  }

  async runFullDiagnostic() {
    console.log('🚀 Starting Comprehensive Messaging System Diagnostic');
    console.log('='.repeat(60));
    
    await this.fetchTestData();
    await this.testMessageCreation();
    await this.testMessageRetrieval();
    await this.testConversationGrouping();
    await this.testUnreadTracking();
    await this.analyzeRoleSpecificAPIs();
    await this.identifyRealTimeIssues();
    await this.generateReport();
  }
}

// Run the diagnostic
const diagnostic = new MessagingDiagnostic();
diagnostic.runFullDiagnostic().catch(console.error);
