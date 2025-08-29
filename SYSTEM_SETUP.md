# Loan CRM System Setup Guide

## Fixed Issues:
1. ✅ Fixed typo: `reresetForm()` → `resetForm()`
2. ✅ Added missing form fields: branch, sourced_by, repayment_amount, interest_earned
3. ✅ Fixed field mapping between frontend and backend
4. ✅ Updated database schema to support all required fields
5. ✅ Added proper error handling and logging

## Quick Start:
1. Run `start-crm-system.bat` to start the entire system
2. Access the application at http://localhost:3000
3. Login with: admin / admin123

## Manual Setup:

### Backend Setup:
```bash
cd backend
npm install
node create-admin.js
node init-database.js
npm start
```

### Frontend Setup:
```bash
cd frontend
npm install
npm start
```

## Database Requirements:
- MySQL Server running on localhost:3306
- Database: `loancrm`
- User: `root` with password: `Aujla@1422`

## API Endpoints:
- GET /api/loans - Fetch all loans
- POST /api/loans - Create new loan
- PUT /api/loans/:id - Update loan
- POST /api/installments/generate - Generate EMI schedule

## Form Fields Mapping:
Frontend → Backend:
- processing_fee → processing_fee (also stored as pf for compatibility)
- total_installments → total_installments (also stored as no_of_installment)

## Troubleshooting:
1. **Backend not starting**: Check MySQL connection in .env file
2. **Frontend API errors**: Ensure backend is running on port 4000
3. **Login issues**: Run `node create-admin.js` to create admin user
4. **Database errors**: Run `node init-database.js` to update schema

## System Architecture:
- Frontend: React.js (Port 3000)
- Backend: Node.js/Express (Port 4000)
- Database: MySQL
- Authentication: JWT tokens