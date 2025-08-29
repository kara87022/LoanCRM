require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkAndCreateUser() {
  try {
    // First, check existing users
    db.query('SELECT * FROM users', (err, results) => {
      if (err) {
        console.log('Error checking users:', err.message);
        return;
      }
      
      console.log('Existing users:');
      results.forEach(user => {
        console.log(`- Username: ${user.username}, Role: ${user.role}`);
      });
      
      // Delete existing admin and create new one
      db.query('DELETE FROM users WHERE username = ?', ['admin'], async (err) => {
        if (err) console.log('Error deleting admin:', err.message);
        
        // Create fresh admin
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 
          ['admin', hashedPassword, 'admin'], 
          (err, result) => {
            if (err) {
              console.log('Error creating admin:', err.message);
            } else {
              console.log('\n✅ Fresh admin user created!');
              console.log(`Username: admin\nPassword: ${defaultPassword}`);
            }
            db.end();
          }
        );
      });
    });
  } catch (error) {
    console.error('Error:', error);
    db.end();
  }
}

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to database\n');
  checkAndCreateUser();
});