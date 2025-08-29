require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
      ['admin', hashedPassword, 'admin'], 
      (err, result) => {
        if (err) {
          console.log('Admin user might already exist or error:', err.message);
        } else {
          console.log('Admin user created successfully');
        }
        db.end();
      }
    );
  } catch (error) {
    console.error('Error creating admin:', error);
    db.end();
  }
}

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database');
  createAdmin();
});