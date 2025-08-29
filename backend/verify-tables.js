require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
  
  // Check tables
  const tables = ['loans_master', 'disbursed_cases', 'installments', 'collections'];
  
  tables.forEach(table => {
    db.query(`SHOW TABLES LIKE '${table}'`, (err, results) => {
      if (err) {
        console.error(`Error checking table ${table}:`, err);
      } else if (results.length > 0) {
        console.log(`✓ Table ${table} exists`);
        
        // Show table structure
        db.query(`DESCRIBE ${table}`, (err, columns) => {
          if (err) {
            console.error(`Error describing table ${table}:`, err);
          } else {
            console.log(`  Columns in ${table}:`, columns.map(col => col.Field).join(', '));
          }
        });
        
        // Show record count
        db.query(`SELECT COUNT(*) as count FROM ${table}`, (err, count) => {
          if (err) {
            console.error(`Error counting records in ${table}:`, err);
          } else {
            console.log(`  Records in ${table}: ${count[0].count}`);
          }
        });
      } else {
        console.log(`✗ Table ${table} does not exist`);
      }
    });
  });
  
  setTimeout(() => {
    db.end();
    console.log('\nDatabase verification complete.');
  }, 2000);
});