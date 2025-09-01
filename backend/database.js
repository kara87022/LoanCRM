const mysql = require('mysql2/promise');
require('dotenv').config();

let connection;

async function connectDB() {
  try {
    if (process.env.DATABASE_URL) {
      // Use Railway's MySQL URL
      connection = await mysql.createConnection(process.env.DATABASE_URL);
    } else {
      // Use individual environment variables
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
      });
    }
    
    console.log('✅ Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

module.exports = { connectDB, connection };