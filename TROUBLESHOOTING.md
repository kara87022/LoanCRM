# Loan CRM Troubleshooting Guide

## Current Issues and Solutions

### 1. ERR_CONNECTION_REFUSED Error
**Problem**: Frontend cannot connect to backend server
**Solution**: Start the backend server

```bash
# Option 1: Use the batch file
double-click start-servers.bat

# Option 2: Manual start
cd backend
npm start
```

### 2. Database Connection Issues
**Problem**: Backend cannot connect to MySQL database
**Solution**: 

1. **Check MySQL Service**:
   - Open Services (services.msc)
   - Find "MySQL" service and ensure it's running
   - If not running, right-click and select "Start"

2. **Test Database Connection**:
   ```bash
   cd backend
   node test-connection.js
   ```

3. **Verify Database Credentials**:
   - Check `.env` file in backend folder
   - Ensure DB_PASSWORD matches your MySQL root password
   - Current password: `Aujla@1422`

### 3. Empty Loan List
**Problem**: No loans showing in frontend
**Causes**:
- Backend server not running
- Database connection failed
- Empty loans_master table

**Solutions**:
1. Start backend server (see solution 1)
2. Import loan data:
   ```bash
   cd backend
   node index.js
   # Then use the CSV import API endpoint
   ```

### 4. Dashboard Not Loading
**Problem**: Dashboard shows loading or errors
**Solution**: Same as loan list - ensure backend is running and database is connected

## Quick Fix Steps

1. **Start Backend Server**:
   ```bash
   cd "C:\Users\DELL\OneDrive\Desktop\Loan CRM\backend"
   npm start
   ```

2. **Start Frontend Server** (in new terminal):
   ```bash
   cd "C:\Users\DELL\OneDrive\Desktop\Loan CRM\frontend"
   npm start
   ```

3. **Check if servers are running**:
   - Backend: http://localhost:4000
   - Frontend: http://localhost:3000

## Server Status Check

### Backend Health Check
Visit: http://localhost:4000
Should show: "Backend is running"

### API Test
Visit: http://localhost:4000/api/loans
Should show JSON data or authentication error

## Common Error Messages

1. **"ERR_CONNECTION_REFUSED"** → Backend not running
2. **"Database connection failed"** → MySQL service stopped or wrong credentials
3. **"Error loading loans data"** → Backend running but database issues
4. **"Authentication failed"** → Need to login first

## Emergency Reset

If nothing works:
1. Stop all servers (Ctrl+C in terminals)
2. Restart MySQL service
3. Run: `cd backend && node test-connection.js`
4. If test passes, run: `npm start` in backend
5. Run: `npm start` in frontend