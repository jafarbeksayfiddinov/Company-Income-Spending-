#!/bin/bash

# Test Team Performance Overview Fix
echo "🧪 Testing Team Performance Overview Fix..."

# Login as Director
echo "🔐 Logging in as Director..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"director","password":"director123"}' | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to login"
  exit 1
fi

echo "✅ Login successful"

# Test 1: Get all users
echo "📊 Test 1: Get all users"
ALL_USERS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/users")
TOTAL_USERS=$(echo $ALL_USERS | jq '. | length')
echo "   Total users: $TOTAL_USERS"

# Test 2: Filter workers on frontend
echo "📊 Test 2: Filter workers (frontend approach)"
WORKERS=$(echo $ALL_USERS | jq '[.[] | select(.role == "WORKER")]')
WORKER_COUNT=$(echo $WORKERS | jq '. | length')
WORKER_NAMES=$(echo $WORKERS | jq '.[].username' | tr '\n' ' ')
echo "   Workers found: $WORKER_COUNT"
echo "   Worker names: $WORKER_NAMES"

# Test 3: Get summary stats
echo "📊 Test 3: Get director summary stats"
SUMMARY_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/transactions/director/summary-stats")
ACCEPTED=$(echo $SUMMARY_STATS | jq '.accepted')
PENDING=$(echo $SUMMARY_STATS | jq '.pending')
REJECTED=$(echo $SUMMARY_STATS | jq '.rejected')
TOTAL=$(echo $SUMMARY_STATS | jq '.total')
echo "   Accepted: $ACCEPTED, Pending: $PENDING, Rejected: $REJECTED, Total: $TOTAL"

# Test 4: Test worker filter in transactions
echo "📊 Test 4: Test worker filter in transactions"
WORKER_TXS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/transactions/director-filtered?page=0&size=3&workerUsername=worker")
WORKER_TX_COUNT=$(echo $WORKER_TXS | jq '.totalElements')
echo "   Worker 'worker' transactions: $WORKER_TX_COUNT"

# Test 5: Test another worker
echo "📊 Test 5: Test worker2 filter"
WORKER2_TXS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/transactions/director-filtered?page=0&size=3&workerUsername=worker2")
WORKER2_TX_COUNT=$(echo $WORKER2_TXS | jq '.totalElements')
echo "   Worker 'worker2' transactions: $WORKER2_TX_COUNT"

# Verification
echo "🔍 Verification:"
if [ "$WORKER_COUNT" -gt 0 ]; then
  echo "   ✅ Workers data available: $WORKER_COUNT workers found"
else
  echo "   ❌ No workers found"
fi

if [ "$TOTAL" -gt 0 ]; then
  echo "   ✅ Summary stats available: $TOTAL total transactions"
else
  echo "   ❌ No summary stats available"
fi

if [ "$WORKER_TX_COUNT" -gt 0 ]; then
  echo "   ✅ Worker filtering works: $WORKER_TX_COUNT transactions for 'worker'"
else
  echo "   ❌ Worker filtering not working"
fi

echo "🎉 Team Performance Overview fix tested!"
echo "🌐 Access Dashboard: http://localhost:3000"
echo "👤 Login: director / director123"
echo ""
echo "📋 Expected Results:"
echo "   ✅ Team Performance Overview should show worker statistics"
echo "   ✅ Worker filter dropdown should show: $WORKER_NAMES"
echo "   ✅ Worker filtering should work correctly"
