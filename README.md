# 🏦 Loan CRM System

Complete loan management system with React frontend, Node.js backend, and MySQL database.

## 🚀 Features

- **Loan Management**: Create, track, and manage loans
- **Collection System**: Automated collection tracking and reporting
- **Dashboard**: Real-time analytics and insights
- **User Management**: Role-based access control
- **CSV Upload**: Bulk data import functionality
- **Mobile App**: React Native mobile application

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express, MySQL2
- **Database**: MySQL
- **Authentication**: JWT
- **Mobile**: React Native (Expo)

## 📦 Quick Deploy

### Railway + Vercel (Free)
1. Fork this repo
2. Deploy backend on Railway
3. Deploy frontend on Vercel
4. Update API URLs

### Local Development
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

## 🔧 Environment Variables

**Backend (.env):**
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=loan_crm
JWT_SECRET=your_secret_key
PORT=4000
```

**Frontend (.env.production):**
```
REACT_APP_API_URL=https://your-backend-url.railway.app/api
```

## 📊 Database Setup

1. Import `backend/database/schema.sql`
2. Run `npm run create-admin` to create admin user
3. Default login: admin@loancrm.com / admin123

## 🎯 Live Demo

- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Railway
- **Database**: Railway MySQL

## 📱 Mobile App

React Native app in `mobile-app/` folder with Expo setup.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - see LICENSE file for details.