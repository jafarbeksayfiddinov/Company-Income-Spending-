#!/bin/bash

# Director Dashboard Filtering Test Script
echo "🧪 Testing Director Dashboard Filtering System..."

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

# Test 1: All transactions (should show pending, rejected, accepted)
echo "📊 Test 1: All transactions (default view)"
ALL_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5")

ALL_COUNT=$(echo $ALL_RESULT | jq '.totalElements')
ALL_STATUSES=$(echo $ALL_RESULT | jq '.content[0:3] | .[] | .status')

echo "   Total: $ALL_COUNT"
echo "   Sample statuses: $ALL_STATUSES"

# Test 2: Pending transactions only
echo "📊 Test 2: Pending transactions only"
PENDING_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5&status=pending")

PENDING_COUNT=$(echo $PENDING_RESULT | jq '.totalElements')
echo "   Pending: $PENDING_COUNT"

# Test 3: Rejected transactions only
echo "📊 Test 3: Rejected transactions only"
REJECTED_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5&status=rejected")

REJECTED_COUNT=$(echo $REJECTED_RESULT | jq '.totalElements')
echo "   Rejected: $REJECTED_COUNT"

# Test 4: Accepted transactions only
echo "📊 Test 4: Accepted transactions only"
ACCEPTED_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5&status=accepted")

ACCEPTED_COUNT=$(echo $ACCEPTED_RESULT | jq '.totalElements')
echo "   Accepted: $ACCEPTED_COUNT"

# Test 5: Worker filtering
echo "📊 Test 5: Worker filtering (worker username)"
WORKER_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5&workerUsername=worker")

WORKER_COUNT=$(echo $WORKER_RESULT | jq '.totalElements')
echo "   Worker transactions: $WORKER_COUNT"

# Test 6: Combined filtering (status + worker)
echo "📊 Test 6: Combined filtering (accepted + worker)"
COMBINED_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=0&size=5&status=accepted&workerUsername=worker")

COMBINED_COUNT=$(echo $COMBINED_RESULT | jq '.totalElements')
echo "   Combined filter result: $COMBINED_COUNT"

# Test 7: Pagination
echo "📊 Test 7: Pagination (page 1)"
PAGE1_RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/transactions/director-filtered?page=1&size=3")

PAGE1_COUNT=$(echo $PAGE1_RESULT | jq '.totalElements')
PAGE1_PAGE=$(echo $PAGE1_RESULT | jq '.page')
echo "   Page 1 has $PAGE1_PAGE with total $PAGE1_COUNT elements"

# Verification
echo "🔍 Verification:"
TOTAL_CALCULATED=$((PENDING_COUNT + REJECTED_COUNT + ACCEPTED_COUNT))
echo "   Calculated total: $TOTAL_CALCULATED"
echo "   API total: $ALL_COUNT"

if [ "$TOTAL_CALCULATED" -eq "$ALL_COUNT" ]; then
  echo "✅ Data integrity check PASSED"
else
  echo "❌ Data integrity check FAILED"
fi

if [ "$PENDING_COUNT" -gt 0 ] && [ "$REJECTED_COUNT" -gt 0 ]; then
  echo "✅ Pending and rejected transactions are visible"
else
  echo "❌ Pending or rejected transactions missing"
fi

echo "🎉 Test completed!"
echo "🌐 Frontend available at: http://localhost:3000"
echo "🔗 Backend API at: http://localhost:8080"
