#!/bin/bash

# Test Overview Section Refactor with Intelligent Insights
echo "🧪 Testing Overview Section Refactor..."

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

# Test 1: Get overview stats for insights
echo "📊 Test 1: Get overview stats"
OVERVIEW_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/transactions/director/summary-stats")
ACCEPTED=$(echo $OVERVIEW_STATS | jq '.accepted')
PENDING=$(echo $OVERVIEW_STATS | jq '.pending')
REJECTED=$(echo $OVERVIEW_STATS | jq '.rejected')
TOTAL=$(echo $OVERVIEW_STATS | jq '.total')
APPROVAL_RATE=$(echo "scale=1; $ACCEPTED * 100 / $TOTAL" | bc)
REJECTION_RATE=$(echo "scale=1; $REJECTED * 100 / $TOTAL" | bc)

echo "   Accepted: $ACCEPTED, Pending: $PENDING, Rejected: $REJECTED"
echo "   Approval Rate: $APPROVAL_RATE%, Rejection Rate: $REJECTION_RATE%"

# Test 2: Get current stats for financial insights
echo "📊 Test 2: Get current financial stats"
CURRENT_STATS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/transactions/statistics")
INCOME=$(echo $CURRENT_STATS | jq '.totalIncome')
SPENDING=$(echo $CURRENT_STATS | jq '.totalSpending')
PROFIT=$(echo $CURRENT_STATS | jq '.netProfit')

echo "   Income: $INCOME, Spending: $SPENDING, Profit: $PROFIT"

# Test 3: Get workers for top performer insights
echo "📊 Test 3: Get workers data"
WORKERS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/users" | jq '[.[] | select(.role == "WORKER")]')
WORKER_COUNT=$(echo $WORKERS | jq '. | length')
echo "   Workers found: $WORKER_COUNT"

# Test 4: Get historical data for trend chart
echo "📊 Test 4: Get historical data"
HISTORY=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:8080/api/statistics/history?days=30")
HISTORY_COUNT=$(echo $HISTORY | jq '. | length')
echo "   Historical data points: $HISTORY_COUNT"

# Test 5: Test frontend accessibility
echo "📊 Test 5: Test frontend accessibility"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_STATUS" == "200" ]; then
  echo "   ✅ Frontend accessible"
else
  echo "   ❌ Frontend not accessible (HTTP $FRONTEND_STATUS)"
fi

# Expected Insights Analysis
echo "🔍 Expected Insights Analysis:"

# Business Profit Analysis
if [ "$PROFIT" -gt 0 ]; then
  echo "   ✅ Positive profit insight expected"
else
  echo "   ⚠️ Negative profit insight expected"
fi

# Transaction Volume Analysis
if [ "$TOTAL" -gt 500 ]; then
  echo "   ✅ High volume insight expected"
else
  echo "   📊 Normal volume insight expected"
fi

# Approval Rate Analysis
if (( $(echo "$APPROVAL_RATE > 90" | bc -l) )); then
  echo "   ✅ Excellent approval rate insight expected"
elif (( $(echo "$APPROVAL_RATE < 80" | bc -l) )); then
  echo "   ⚠️ Low approval rate warning expected"
else
  echo "   📊 Good approval rate insight expected"
fi

# Risk Alerts Analysis
echo "🚨 Expected Risk Alerts:"

# Pending Volume Risk
if [ "$PENDING" -gt 30 ]; then
  echo "   🚨 High pending volume alert expected"
elif [ "$PENDING" -gt 20 ]; then
  echo "   ⚠️ Moderate pending insight expected"
else
  echo "   ✅ No pending alerts expected"
fi

# Rejection Rate Risk
if (( $(echo "$REJECTION_RATE > 10" | bc -l) )); then
  echo "   🚨 High rejection rate alert expected"
else
  echo "   ✅ No rejection rate alerts expected"
fi

# Spending Ratio Risk
SPENDING_RATIO=$(echo "scale=2; $SPENDING * 100 / $INCOME" | bc)
if (( $(echo "$SPENDING_RATIO > 80" | bc -l) )); then
  echo "   🚨 High spending ratio alert expected"
else
  echo "   ✅ No spending ratio alerts expected"
fi

# Top Performers Analysis
echo "🏆 Expected Top Performers:"
echo "   ✅ Top worker card expected"
echo "   ✅ Manager efficiency card expected"
echo "   ✅ Transaction volume card expected"

# Trend Chart Analysis
if [ "$HISTORY_COUNT" -gt 0 ]; then
  echo "   ✅ 30-day trend chart expected with $HISTORY_COUNT data points"
else
  echo "   ⚠️ No trend data available"
fi

echo ""
echo "🎉 Overview Section Refactor Test Complete!"
echo "🌐 Access Dashboard: http://localhost:3000"
echo "👤 Login: director / director123"
echo ""
echo "📋 Manual Testing Checklist:"
echo "   ✅ Business Insights section displays 4 intelligent insights"
echo "   ✅ Risk & Alerts section shows appropriate warnings"
echo "   ✅ Top Performers section displays 3 performance cards"
echo "   ✅ 30-Day Trend chart shows income vs spending"
echo "   ✅ All sections are responsive and visually appealing"
echo "   ✅ Design is clean, minimal, and professional"
echo "   ✅ Performance remains fast with no lag"
