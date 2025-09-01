const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let connection;

async function connectDB() {
  try {
    connection = await mysql.createConnection({
      host: 'caboose.proxy.rlwy.net',
      user: 'root',
      password: 'WRkYUjwGRmhKnmtFdolUfVFgCzHLubFn',
      database: 'railway',
      port: 55701
    });
    
    console.log('✅ Connected to Railway MySQL database');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Loan CRM Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Loan CRM API Server' });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Loan CRM API is working!' });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple auth for demo
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin', role: 'admin' },
        process.env.JWT_SECRET || 'loan_crm_secret_2024',
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: { id: 1, username: 'admin', role: 'admin' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  
  try {
    await connectDB();
  } catch (error) {
    console.log('⚠️ Starting without database connection');
  }
});