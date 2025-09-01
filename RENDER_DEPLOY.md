# 🚀 Render Backend Deployment

## ✅ Why Render?
- **Free Tier**: 750 hours/month
- **Auto-deploy**: Git push triggers deployment
- **Built-in SSL**: HTTPS included
- **Easy setup**: Connect GitHub in 2 clicks

## 🔧 Deploy Backend on Render:

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy Backend
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. **Configure:**
   - **Name**: `loan-crm-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

### Step 3: Environment Variables
Add these in Render dashboard:
```
DATABASE_URL=mysql://root:WRkYUjwGRmhKnmtFdolUfVFgCzHLubFn@caboose.proxy.rlwy.net:55701/railway
JWT_SECRET=loan_crm_secret_2024
PORT=10000
NODE_ENV=production
```

### Step 4: Deploy!
- Render auto-builds and deploys
- Get your URL: `https://your-app.onrender.com`
- Test: `https://your-app.onrender.com/api/health`

## 🎯 Benefits:
- ✅ **Free hosting** (750 hours/month)
- ✅ **Auto-deploy** on git push
- ✅ **Custom domains** supported
- ✅ **Environment variables** built-in
- ✅ **Logs & monitoring** included

Your backend will be live in 5 minutes! 🚀