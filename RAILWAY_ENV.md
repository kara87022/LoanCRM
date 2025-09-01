# 🚂 Railway Environment Variables

## ✅ Set These in Railway Dashboard:

### **Automatic Variables (Railway provides):**
- `${{ MySQL.MYSQL_URL }}` - Auto-generated MySQL connection string

### **Manual Variables (You add):**
```
DATABASE_URL=${{ MySQL.MYSQL_URL }}
JWT_SECRET=loan_crm_secret_2024
PORT=4000
NODE_ENV=production
```

## 🔧 **How to Add Variables:**

1. Go to Railway project dashboard
2. Click your **backend service**
3. Go to **"Variables"** tab
4. Click **"New Variable"**
5. Add each variable above

## 🎯 **Railway Auto-Variables:**
Railway automatically provides:
- `${{ MySQL.MYSQL_URL }}` - Full connection string
- `${{ MySQL.MYSQL_HOST }}` - Host only
- `${{ MySQL.MYSQL_PORT }}` - Port only
- `${{ MySQL.MYSQL_USER }}` - Username
- `${{ MySQL.MYSQL_PASSWORD }}` - Password
- `${{ MySQL.MYSQL_DATABASE }}` - Database name

## ✅ **Your Setup:**
Using `DATABASE_URL=${{ MySQL.MYSQL_URL }}` is the simplest approach - Railway handles everything automatically!