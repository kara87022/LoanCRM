require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('Testing database connection...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);

db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to MySQL database successfully!');
  
  // Test if loans_master table exists and has data
  db.query('SELECT COUNT(*) as count FROM loans_master', (err, results) => {
    if (err) {
      console.error('❌ Error querying loans_master table:', err.message);
    } else {
      console.log(`✅ Found ${results[0].count} records in loans_master table`);
    }
    
    db.end();
    process.exit(0);
  });
});