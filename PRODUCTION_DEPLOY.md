# 🚀 Production Deployment Guide
**Render + Vercel + PlanetScale**

## Step 1: Database Setup (PlanetScale)
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up → Create database: `loan-crm`
3. Get connection string from **Connect** tab
4. Import `backend/database/schema.sql` via PlanetScale console

## Step 2: Backend Deployment (Render)
1. Go to [render.com](https://render.com)
2. Connect GitHub account
3. **New Web Service** → Select your repo
4. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Environment Variables:
   ```
   DB_HOST=aws.connect.psdb.cloud
   DB_USER=your_planetscale_user
   DB_PASSWORD=your_planetscale_password
   DB_NAME=loan-crm
   JWT_SECRET=your_secret_key
   PORT=10000
   NODE_ENV=production
   ```
6. Deploy! Get your Render URL: `https://your-app.onrender.com`

## Step 3: Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Import GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
4. Environment Variable:
   ```
   REACT_APP_API_URL=https://your-app.onrender.com/api
   ```
5. Deploy! Get your Vercel URL

## Step 4: Setup Admin User
1. SSH into Render or run locally:
   ```bash
   cd backend
   npm run create-admin
   ```
2. Login: `admin@loancrm.com` / `admin123`

## 🎉 Your CRM is Live!
- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-app.onrender.com
- **Database**: PlanetScale MySQL

**Total Cost**: $0/month (all free tiers)