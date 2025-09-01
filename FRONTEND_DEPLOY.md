# 🚀 Frontend Deployment Guide (Vercel)

## Step 1: Get Your Railway Backend URL
1. Go to Railway dashboard
2. Click your backend service
3. Copy the URL (looks like: `https://your-app.up.railway.app`)

## Step 2: Deploy Frontend on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click **"New Project"**
4. Import your GitHub repository
5. **Configure Project:**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

## Step 3: Add Environment Variable
In Vercel project settings:
```
REACT_APP_API_URL=https://your-railway-app.up.railway.app/api
```
Replace `your-railway-app` with your actual Railway URL.

## Step 4: Deploy!
- Click **"Deploy"**
- Vercel builds and deploys automatically
- Get your live URL: `https://your-project.vercel.app`

## Step 5: Test Your CRM
1. Visit your Vercel URL
2. Login: `admin@loancrm.com` / `admin123`
3. Your CRM is live! 🎉

## 🔧 Troubleshooting:
- **CORS Error**: Add your Vercel domain to backend CORS
- **API Error**: Check Railway backend is running
- **Build Error**: Ensure all dependencies in package.json

Your full-stack CRM will be live in minutes!