require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('Fixing database schema...');

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  // Check current table structure
  db.query('DESCRIBE loans_master', (err, results) => {
    if (err) {
      console.error('Error describing table:', err.message);
      process.exit(1);
    }

    console.log('Current table structure:');
    results.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type}`);
    });

    // Add missing columns if they don't exist
    const existingColumns = results.map(col => col.Field);
    
    const requiredColumns = [
      { name: 'branch', type: 'VARCHAR(64)' },
      { name: 'sourced_by', type: 'VARCHAR(64)' },
      { name: 'repayment_amount', type: 'INT' },
      { name: 'interest_earned', type: 'INT' },
      { name: 'status', type: 'VARCHAR(32) DEFAULT "Active"' },
      { name: 'created_at', type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
    ];

    let alterQueries = [];
    
    requiredColumns.forEach(col => {
      if (!existingColumns.includes(col.name)) {
        alterQueries.push(`ALTER TABLE loans_master ADD COLUMN ${col.name} ${col.type}`);
      }
    });

    if (alterQueries.length > 0) {
      console.log('Adding missing columns...');
      
      let completed = 0;
      alterQueries.forEach(query => {
        db.query(query, (err) => {
          if (err) {
            console.error(`Error executing: ${query}`, err.message);
          } else {
            console.log(`✅ Added column: ${query.split('ADD COLUMN ')[1]}`);
          }
          
          completed++;
          if (completed === alterQueries.length) {
            console.log('✅ Database schema fixed successfully!');
            
            // Test the loans query
            db.query('SELECT COUNT(*) as count FROM loans_master', (err, results) => {
              if (err) {
                console.error('❌ Error testing loans query:', err.message);
              } else {
                console.log(`✅ Found ${results[0].count} loans in database`);
              }
              db.end();
            });
          }
        });
      });
    } else {
      console.log('✅ All required columns exist');
      
      // Test the loans query
      db.query('SELECT COUNT(*) as count FROM loans_master', (err, results) => {
        if (err) {
          console.error('❌ Error testing loans query:', err.message);
        } else {
          console.log(`✅ Found ${results[0].count} loans in database`);
        }
        db.end();
      });
    }
  });
});