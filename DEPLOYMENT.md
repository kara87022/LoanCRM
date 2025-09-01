# 🚀 Loan CRM Deployment Guide

## Quick Deploy (5 minutes)

### 1. Backend on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your forked repo
5. Choose `backend` folder
6. Add environment variables:
   ```
   DB_HOST=your-mysql-host
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=loan_crm
   JWT_SECRET=your-secret-key
   PORT=4000
   ```
7. Deploy! Get your Railway URL

### 2. Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repo
5. Set Root Directory to `frontend`
6. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-railway-url.railway.app/api
   ```
7. Deploy!

### 3. Database Setup
Use Railway's MySQL or any cloud MySQL:
- Import `backend/database/schema.sql`
- Run: `npm run create-admin`
- Login: admin@loancrm.com / admin123

## Alternative: Netlify + Heroku
- Frontend: Netlify (drag & drop build folder)
- Backend: Heroku (git push)

## Local Testing
```bash
# Backend
cd backend
npm install
npm start

# Frontend  
cd frontend
npm install
npm start
```

Your CRM will be live at your Vercel URL! 🎉