#!/bin/bash

BASE_URL="http://localhost:3000"
COOKIE_FILE="/tmp/test_cookies.txt"

echo "🚀 MESSAGING SYSTEM TESTS - CURL VERSION"
echo "========================================"

# Test 1: Login as Organizer
echo ""
echo "🔐 Step 1: Login as Organizer..."
curl -s -c "$COOKIE_FILE.organizer" \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=contact@eventpro.ke&password=password123&redirect=false" \
  "$BASE_URL/api/auth/callback/credentials" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Organizer login attempt completed"
else
  echo "❌ Organizer login failed"
fi

# Test 2: Login as Talent
echo ""
echo "🔐 Step 2: Login as Talent..."
curl -s -c "$COOKIE_FILE.talent" \
  -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=sarah.photographer@example.com&password=password123&redirect=false" \
  "$BASE_URL/api/auth/callback/credentials" > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Talent login attempt completed"
else
  echo "❌ Talent login failed"
fi

# Test 3: Test Organizer Messages API
echo ""
echo "📋 Step 3: Test Organizer Messages API..."
echo "GET /api/organizer/messages"
curl -s -b "$COOKIE_FILE.organizer" \
  -H "Accept: application/json" \
  "$BASE_URL/api/organizer/messages" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# Test 4: Test Talent Messages API  
echo ""
echo "📋 Step 4: Test Talent Messages API..."
echo "GET /api/talent/messages"
curl -s -b "$COOKIE_FILE.talent" \
  -H "Accept: application/json" \
  "$BASE_URL/api/talent/messages" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# Test 5: Test General Messages API
echo ""
echo "📋 Step 5: Test General Messages API (Organizer)..."
echo "GET /api/messages"
curl -s -b "$COOKIE_FILE.organizer" \
  -H "Accept: application/json" \
  "$BASE_URL/api/messages" | jq '.' 2>/dev/null || echo "Response received (not JSON)"

# Test 6: Test WebSocket/SSE endpoint
echo ""
echo "📋 Step 6: Test WebSocket/SSE endpoint..."
echo "GET /api/websocket (with organizer cookies)"
timeout 3 curl -s -b "$COOKIE_FILE.organizer" \
  -H "Accept: text/event-stream" \
  -H "Cache-Control: no-cache" \
  "$BASE_URL/api/websocket"

echo ""
echo "📋 Step 7: Test WebSocket/SSE endpoint (with talent cookies)..."
echo "GET /api/websocket (with talent cookies)"  
timeout 3 curl -s -b "$COOKIE_FILE.talent" \
  -H "Accept: text/event-stream" \
  -H "Cache-Control: no-cache" \
  "$BASE_URL/api/websocket"

# Test 7: Send test messages
echo ""
echo "📋 Step 8: Send test message from organizer..."

# Get booking ID first
BOOKING_ID=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.booking.findFirst({ select: { id: true } }).then(b => {
  console.log(b?.id || 'none');
  prisma.\$disconnect();
});
")

echo "Booking ID: $BOOKING_ID"

if [ "$BOOKING_ID" != "none" ]; then
  # Get talent ID
  TALENT_ID=$(node -e "
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.user.findFirst({ where: { role: 'TALENT' }, select: { id: true } }).then(u => {
    console.log(u?.id || 'none');
    prisma.\$disconnect();
  });
  ")
  
  echo "POST /api/organizer/messages"
  curl -s -b "$COOKIE_FILE.organizer" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"receiverId\":\"$TALENT_ID\",\"content\":\"Test message from curl script\",\"bookingId\":\"$BOOKING_ID\"}" \
    "$BASE_URL/api/organizer/messages" | jq '.' 2>/dev/null || echo "Response received"
fi

echo ""
echo "🏁 MESSAGING TESTS COMPLETED"
echo "============================"

# Cleanup
rm -f "$COOKIE_FILE.organizer" "$COOKIE_FILE.talent"
