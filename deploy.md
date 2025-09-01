# Loan CRM Deployment Guide

## Option 1: Vercel + Railway (Recommended)

### Backend (Railway):
1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your Loan CRM repo
5. Choose "backend" folder
6. Add MySQL database service
7. Set environment variables:
   - DB_HOST=mysql-service-url
   - DB_USER=root
   - DB_PASSWORD=your-password
   - DB_NAME=loan_crm
   - JWT_SECRET=your-secret
   - PORT=4000

### Frontend (Vercel):
1. Go to https://vercel.com
2. Sign up with GitHub
3. Import your repo
4. Framework: React
5. Root Directory: frontend
6. Build Command: npm run build
7. Output Directory: build
8. Environment Variables:
   - REACT_APP_API_URL=https://your-backend.railway.app/api

## Option 2: Netlify + Heroku

### Backend (Heroku):
```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-loan-crm-backend

# Add MySQL addon
heroku addons:create cleardb:ignite

# Deploy
git subtree push --prefix backend heroku main
```

### Frontend (Netlify):
1. Go to https://netlify.com
2. Drag & drop your frontend/build folder
3. Or connect GitHub repo

## Option 3: AWS Free Tier

### Setup:
1. Create AWS account
2. Launch EC2 t2.micro instance
3. Install Node.js and MySQL
4. Upload your code
5. Configure security groups (ports 80, 443, 3000, 4000)

## Quick Commands:

### Build for production:
```bash
cd frontend
npm run build
```

### Test production build locally:
```bash
npx serve -s build -l 3000
```

## Domain Setup:
- Buy domain from Namecheap/GoDaddy ($10-15/year)
- Point to your deployment platform
- Enable SSL (free with most platforms)

## Cost Breakdown:
- **Free Option**: Vercel + Railway = $0/month
- **Paid Option**: Domain + VPS = $15-25/month
- **AWS Option**: $5-15/month (free tier)

## Post-Deployment:
1. Update REACT_APP_API_URL in frontend
2. Test all features
3. Set up monitoring
4. Configure backups