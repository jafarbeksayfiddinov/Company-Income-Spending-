# 📊 Database Data Population Guide

## 🚀 Quick Start - Populate Database with Sample Data

### Method 1: Automatic (Recommended)
The application already has automatic data initialization that runs when the database is empty:

1. **Start the application normally**:
   ```bash
   cd /Users/jafarbeksayfiddinov/Desktop/allllll/company_income_vs
   mvn spring-boot:run
   ```

2. **Check console output** - You should see:
   ```
   🔍 Checking database for existing data...
   📊 Database is nearly empty. Creating comprehensive demo data...
   ✅ Comprehensive demo data created successfully!
   ```

### Method 2: Manual API Endpoints

If the database already has some data but you want to add more:

1. **Check current data status**:
   ```bash
   curl http://localhost:8080/api/demo/status
   ```

2. **Create comprehensive sample data** (Director login required):
   ```bash
   # First login as director to get token
   curl -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"director","password":"director123"}'
   
   # Then use the token to create data
   curl -X POST http://localhost:8080/api/demo/create-comprehensive-data \
     -H "Authori
   zation: Bearer YOUR_JWT_TOKEN"
   ```

3. **Create basic demo data** (Director login required):
   ```bash
   curl -X POST http://localhost:8080/api/demo/create-transactions \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## 📋 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Director | director | director123 |
| Manager | manager | manager123 |
| Manager | manager2 | manager123 |
| Worker | worker | worker123 |
| Worker | worker2 | worker123 |
| Worker | worker3 | worker123 |
| Worker | worker4 | worker123 |

## 🎯 What Data Gets Created

### Automatic Initialization Creates:
- **Users**: 1 Director, 2 Managers, 4 Workers
- **Basic Transactions**: 1 sample pending transaction

### Comprehensive Data Creation Creates:
- **30 days of historical data** (5-15 transactions per day)
- **10 pending transactions** (for testing filters)
- **5 rejected transactions** (for testing filters)
- **Total**: ~400-600 transactions with realistic data

### Transaction Types:
- **Income**: Cement, Steel, Sand, Gravel, Bricks, Tiles, etc.
- **Spending**: Fuel, Equipment Rental, Tools, Safety Gear, etc.
- **Status**: Accepted, Pending, Rejected

## 🔍 Testing the Frontend

Once data is populated:

1. **Access Frontend**: http://localhost:3000/
2. **Login as Director**: director / director123
3. **Test Features**:
   - **Dashboard Overview**: Should show KPI cards with real data
   - **Financial Summary**: Monthly income/spending/profit charts
   - **Worker Performance**: Recent transactions with filters
   - **Transaction Filters**: Status (All/Accepted/Rejected) + Worker filters

## 🛠️ Troubleshooting

### Database is Empty:
- Check PostgreSQL is running: `lsof -i :5432`
- Verify database exists: `psql -h localhost -U postgres -d company_income_spend`
- Restart application to trigger initialization

### No Data Showing:
- Check browser console for errors
- Verify backend is running: `curl http://localhost:8080/api/demo/status`
- Check network tab for failed API calls

### API Endpoints Not Working:
- Ensure you're logged in as Director for data creation endpoints
- Check JWT token is valid and not expired
- Verify user roles are correctly assigned

## 📊 Expected Data Volumes

For a fully populated system:
- **Users**: 7 total (1 Director, 2 Managers, 4 Workers)
- **Transactions**: 400-600 total
  - Accepted: ~385-585
  - Pending: 10
  - Rejected: 5
- **Date Range**: 30 days of historical data
- **Transaction Types**: Mix of income and spending

## 🎉 Success Indicators

When data is successfully populated:
- ✅ Dashboard shows real numbers (not zeros)
- ✅ Financial charts display data points
- ✅ Transaction filters work correctly
- ✅ Worker performance shows recent activity
- ✅ Historical growth charts populate

---

**🚀 Your application is now ready for testing with realistic demo data!**
