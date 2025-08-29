require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function resetAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    db.query('UPDATE users SET password = ? WHERE username = ?', 
      [hashedPassword, 'admin'], 
      (err, result) => {
        if (err) {
          console.log('Error updating admin password:', err.message);
        } else {
          console.log('Admin password reset successfully to: admin123');
          console.log('Username: admin');
          console.log('Password: admin123');
        }
        db.end();
      }
    );
  } catch (error) {
    console.error('Error resetting admin password:', error);
    db.end();
  }
}

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database');
  resetAdmin();
});