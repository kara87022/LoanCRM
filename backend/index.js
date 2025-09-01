require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const { authenticateToken, authorizeRole } = require('./middleware/auth');
const { validateLoan, validateUser, validateLogin } = require('./middleware/validation');
const collectionsRouter = require('./routes/collections');
const installmentsRouter = require('./routes/installments');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: ['http://localhost:3000', 'http://localhost:3001'] }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rate limiting - increased limits
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Public routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// MySQL DB setup with connection pooling
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loan_crm',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err.message);
    console.log('Using default database configuration. Please check your .env file.');
  } else {
    console.log('Connected to MySQL database.');
    connection.release();
  }
});

// Create loans_master table if not exist
const createLoansMasterTable = `CREATE TABLE IF NOT EXISTS loans_master (
  loan_id VARCHAR(32) PRIMARY KEY,
  branch VARCHAR(64),
  sourced_by VARCHAR(64),
  customer_name VARCHAR(128),
  loan_amount INT,
  processing_fee INT,
  pf INT,
  gst INT,
  net_disbursement INT,
  repayment_amount INT,
  interest_earned INT,
  roi FLOAT,
  tenure_days INT,
  date_of_disbursement DATE,
  installment_amount INT,
  total_installments INT,
  no_of_installment INT,
  status VARCHAR(32) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(createLoansMasterTable, (err) => { if (err) throw err; });

// Create disbursed_cases table
const createDisbursedCasesTable = `CREATE TABLE IF NOT EXISTS disbursed_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id VARCHAR(32),
  branch VARCHAR(64),
  sourced_by VARCHAR(64),
  customer_name VARCHAR(128),
  loan_amount INT,
  pf INT,
  gst INT,
  net_disbursement INT,
  repayment_amount INT,
  interest_earned INT,
  date_of_disbursement DATE,
  installment_amount INT,
  no_of_installment INT,
  status VARCHAR(32) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
db.query(createDisbursedCasesTable, (err) => { if (err) throw err; });

// Create installments table
const createInstallmentsTable = `CREATE TABLE IF NOT EXISTS installments (
  installment_id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id VARCHAR(32),
  installment_number INT,
  due_date DATE,
  amount INT,
  status VARCHAR(32),
  FOREIGN KEY(loan_id) REFERENCES loans_master(loan_id)
)`;
db.query(createInstallmentsTable, (err) => { if (err) throw err; });

// Create collections table if not exist
db.query(`CREATE TABLE IF NOT EXISTS collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id VARCHAR(32),
  date DATE,
  amount INT,
  FOREIGN KEY(loan_id) REFERENCES loans_master(loan_id)
)`, (err) => { if (err) throw err; });
db.query(`CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) UNIQUE,
  password VARCHAR(255),
  role VARCHAR(32)
)`, (err) => { if (err) throw err; });
db.query(`CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`, (err) => { if (err) throw err; });
db.query(`CREATE TABLE IF NOT EXISTS dropdowns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(64),
  value VARCHAR(255)
)`, (err) => { if (err) throw err; });

// Authentication routes
app.post('/auth/login', validateLogin, async (req, res) => {
  const { username, password } = req.body;
  
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

// Use collections and installments routers
app.use('/api/collections', collectionsRouter);
app.use('/api/installments', installmentsRouter);

// Real-time collection query endpoint
app.post('/api/collections/query', authenticateToken, (req, res) => {
  const { query } = req.body;
  
  // Security: Only allow SELECT queries
  if (!query || !query.trim().toLowerCase().startsWith('select')) {
    return res.status(400).json({ error: 'Only SELECT queries allowed' });
  }
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Query error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API routes
app.get('/api/loans', authenticateToken, (req, res) => {
  console.log('Fetching loans from database...');
  
  // First check if created_at column exists
  db.query('SHOW COLUMNS FROM loans_master LIKE "created_at"', (err, columnCheck) => {
    let orderBy = 'ORDER BY loan_id DESC';
    if (!err && columnCheck.length > 0) {
      orderBy = 'ORDER BY created_at DESC';
    }
    
    db.query(`SELECT * FROM loans_master ${orderBy}`, (err, results) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Found ${results.length} loans in database`);
      res.json(results);
    });
  });
});

// Test endpoint to check database connection and data
app.get('/api/test-db', authenticateToken, authorizeRole(['admin']), (req, res) => {
  db.query('SELECT COUNT(*) as count FROM loans_master', (err, results) => {
    if (err) {
      console.error('Database test error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    const count = results[0].count;
    console.log(`Database test: Found ${count} records in loans_master table`);
    res.json({ message: 'Database connection successful', recordCount: count });
  });
});

app.post('/api/loans', authenticateToken, authorizeRole(['admin', 'employee']), validateLoan, (req, res) => {
  const { loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments } = req.body;
  
  console.log('Creating loan with data:', req.body);
  
  // Insert into loans_master table
  db.query('INSERT INTO loans_master (loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, pf, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, processing_fee, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, total_installments],
    (err, result) => {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      // Also insert into disbursed_cases table for tracking
      db.query('INSERT INTO disbursed_cases (loan_id, branch, sourced_by, customer_name, loan_amount, pf, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, total_installments],
        (err2) => {
          if (err2) console.error('Error inserting into disbursed_cases:', err2.message);
        });
      
      console.log('Loan created successfully:', loan_id);
      res.json({ loan_id, message: 'Loan created successfully' });
    });
});

const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Bulk import loans from CSV data (frontend sends parsed data)
app.post('/api/loans/bulk-import', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const { loans } = req.body;
  
  if (!loans || !Array.isArray(loans)) {
    return res.status(400).json({ error: 'Invalid loans data' });
  }

  let imported = 0;
  let errors = 0;
  const errorDetails = [];
  
  const processLoan = (loan, index) => {
    return new Promise((resolve) => {
      // Calculate ROI if not provided
      const loanAmount = parseFloat(loan.loan_amount) || 0;
      const repaymentAmount = parseFloat(loan.repayment_amount) || 0;
      const roi = loan.roi || (loanAmount > 0 ? ((repaymentAmount - loanAmount) / loanAmount * 100).toFixed(2) : 20);
      const tenure = loan.tenure_days || 100;
      
      // Insert into loans_master
      db.query('INSERT IGNORE INTO loans_master (loan_id, branch, sourced_by, customer_name, loan_amount, processing_fee, pf, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          loan.loan_id,
          loan.branch,
          loan.sourced_by,
          loan.customer_name,
          loanAmount,
          loan.processing_fee || 0,
          loan.processing_fee || 0,
          loan.gst || 0,
          loan.net_disbursement || 0,
          repaymentAmount,
          loan.interest_earned || 0,
          roi,
          tenure,
          loan.date_of_disbursement,
          loan.installment_amount || 0,
          loan.total_installments || 14,
          loan.total_installments || 14
        ],
        (err, result) => {
          if (err) {
            console.error('Error importing loan:', loan.loan_id, err.message);
            errors++;
            errorDetails.push({ loan_id: loan.loan_id, error: err.message });
            resolve();
          } else if (result.affectedRows > 0) {
            // Also insert into disbursed_cases
            db.query('INSERT IGNORE INTO disbursed_cases (loan_id, branch, sourced_by, customer_name, loan_amount, pf, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [loan.loan_id, loan.branch, loan.sourced_by, loan.customer_name, loanAmount, loan.processing_fee || 0, loan.gst || 0, loan.net_disbursement || 0, repaymentAmount, loan.interest_earned || 0, loan.date_of_disbursement, loan.installment_amount || 0, loan.total_installments || 14],
              (err2) => {
                if (err2) console.error('Error inserting into disbursed_cases:', err2.message);
              });
            imported++;
            resolve();
          } else {
            // Duplicate entry, not counted as error
            resolve();
          }
        });
    });
  };
  
  // Process all loans
  Promise.all(loans.map(processLoan))
    .then(() => {
      res.json({ 
        imported, 
        errors, 
        message: `Successfully imported ${imported} records with ${errors} errors`,
        errorDetails: errorDetails.slice(0, 5)
      });
    })
    .catch((err) => {
      console.error('Bulk import error:', err);
      res.status(500).json({ error: 'Failed to process bulk import' });
    });
});

app.get('/api/collections', authenticateToken, (req, res) => {
  console.log('Fetching collections from database...');
  db.query('SELECT * FROM collections', (err, results) => {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`Found ${results.length} collections in database`);
    res.json(results);
  });
});



app.post('/api/collections', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const { loan_id, date, amount } = req.body;
  db.query('INSERT INTO collections (loan_id, date, amount) VALUES (?, ?, ?)', [loan_id, date, amount], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
});

app.get('/api/loans/:id', authenticateToken, (req, res) => {
  db.query('SELECT * FROM loans_master WHERE loan_id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// Update only loan status (Active, Closed, Foreclosed)
app.put('/api/loans/:id/status', authenticateToken, authorizeRole(['admin','employee']), (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Missing status' });
  db.query('UPDATE loans_master SET status = ? WHERE loan_id = ?', [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Loan not found' });
    res.json({ message: 'Status updated' });
  });
});

app.get('/api/report', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const query = `
    SELECT 
      l.loan_id,
      l.customer_name AS borrower,
      l.loan_amount AS amount,
      (COALESCE(l.repayment_amount, 0) - COALESCE(SUM(p.amount), 0)) AS balance,
      COUNT(p.id) AS collections_count
    FROM loans_master l
    LEFT JOIN payments p ON l.loan_id = p.loan_id
    GROUP BY l.loan_id, l.customer_name, l.loan_amount, l.repayment_amount
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get repayment schedule for a loan
app.get('/api/loans/:id/repayment-schedule', authenticateToken, (req, res) => {
  db.query('SELECT loan_id, date_of_disbursement, installment_amount, total_installments, repayment_amount FROM loans_master WHERE loan_id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const loan = results[0];
    const start_date = loan.date_of_disbursement;
    const total_installments = loan.total_installments || 14;
    const installment_amount = loan.installment_amount || Math.round((loan.repayment_amount || 0) / total_installments);
    const repayment_schedule = [];
    for (let i = 1; i <= total_installments; i++) {
      let dueDate = new Date(start_date);
      dueDate.setDate(dueDate.getDate() + 7 * i);
      repayment_schedule.push({ installment: i, amount: installment_amount, due_date: dueDate.toISOString().slice(0, 10) });
    }
    res.json({ loan_id: loan.loan_id, repayment_schedule });
  });
});



// Add user management endpoints
app.post('/api/users', authenticateToken, authorizeRole(['admin']), validateUser, async (req, res) => {
  const { username, password, role } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to create user' });
      res.json({ id: result.insertId });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add notifications endpoint
app.get('/api/notifications', authenticateToken, (req, res) => {
  db.query('SELECT * FROM notifications', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add loan update endpoint
app.put('/api/loans/:id', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const { id } = req.params;
  const { branch, sourced_by, customer_name, loan_amount, processing_fee, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, status } = req.body;
  
  console.log('Updating loan:', id, 'with data:', req.body);
  
  db.query('UPDATE loans_master SET branch = ?, sourced_by = ?, customer_name = ?, loan_amount = ?, processing_fee = ?, pf = ?, gst = ?, net_disbursement = ?, repayment_amount = ?, interest_earned = ?, roi = ?, tenure_days = ?, date_of_disbursement = ?, installment_amount = ?, total_installments = ?, no_of_installment = ?, status = ? WHERE loan_id = ?', 
    [branch, sourced_by, customer_name, loan_amount, processing_fee, processing_fee, gst, net_disbursement, repayment_amount, interest_earned, roi, tenure_days, date_of_disbursement, installment_amount, total_installments, total_installments, status || 'Active', id], 
    (err) => {
      if (err) {
        console.error('Update error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      console.log('Loan updated successfully:', id);
      res.json({ message: 'Loan updated successfully' });
    });
});

// API for managing dropdown options
app.get('/api/dropdowns/:type', authenticateToken, (req, res) => {
  const { type } = req.params;
  db.query('SELECT * FROM dropdowns WHERE type = ?', [type], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/dropdowns', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { type, value } = req.body;
  db.query('INSERT INTO dropdowns (type, value) VALUES (?, ?)', [type, value], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
});

app.delete('/api/dropdowns/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM dropdowns WHERE id = ?', [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Dropdown option deleted successfully' });
  });
});

// API for generating reports
app.get('/api/reports/loan-pipeline', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  db.query('SELECT application_status, COUNT(*) AS count FROM loan_applications GROUP BY application_status', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/conversion-rate', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  db.query('SELECT lead_status, COUNT(*) AS count FROM leads GROUP BY lead_status', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/reports/source-performance', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  db.query('SELECT lead_source, COUNT(*) AS count FROM leads GROUP BY lead_source', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// API to generate installment schedule for single loan
app.post('/api/installments/generate', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const { loan_id, loan_amount, date_of_disbursement } = req.body;

  // Calculate installment amount
  const total_interest = (loan_amount * 0.2); // 20% ROI for 100 days
  const total_repayment = loan_amount + total_interest;
  const installment_amount = Math.round(total_repayment / 14); // 14 installments

  // Generate installment schedule
  const installments = [];
  for (let i = 1; i <= 14; i++) {
    const due_date = new Date(date_of_disbursement);
    due_date.setDate(due_date.getDate() + (i * 7)); // First installment after 7 days, then every 7 days

    installments.push([loan_id, i, due_date.toISOString().split('T')[0], installment_amount, 'Pending']);
  }

  // Insert installments into the database
  const query = 'INSERT IGNORE INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?';
  db.query(query, [installments], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Installment schedule generated successfully', installments });
  });
});

// Generate 14 installments for a loan if none exist
app.post('/api/installments/generate-if-missing/:id', authenticateToken, authorizeRole(['admin','employee']), (req, res) => {
  const loanId = req.params.id;
  const q = 'SELECT loan_id, date_of_disbursement, installment_amount, repayment_amount FROM loans_master WHERE loan_id = ?';
  db.query(q, [loanId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const loan = rows[0];
    if (!loan.date_of_disbursement) return res.status(400).json({ error: 'Loan missing date_of_disbursement' });
    db.query('SELECT COUNT(*) as c FROM installments WHERE loan_id = ?', [loanId], (err2, r2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if ((r2[0].c || 0) > 0) return res.json({ message: 'Installments already exist' });
      const amount = loan.installment_amount || Math.round((loan.repayment_amount || 0) / 14);
      const all = [];
      for (let i = 1; i <= 14; i++) {
        const due_date = new Date(loan.date_of_disbursement);
        due_date.setDate(due_date.getDate() + (i * 7));
        all.push([loanId, i, due_date.toISOString().slice(0,10), amount, 'Pending']);
      }
      db.query('INSERT INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?', [all], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ message: 'Installments generated', generated: 14 });
      });
    });
  });
});

// API to generate installment schedules for all loans
app.post('/api/installments/generate-all', authenticateToken, authorizeRole(['admin']), (req, res) => {
  // Get all loans that don't have installments yet
  db.query(`
    SELECT l.loan_id, l.loan_amount, l.repayment_amount, l.date_of_disbursement, l.installment_amount
    FROM loans_master l
    LEFT JOIN installments i ON l.loan_id = i.loan_id
    WHERE i.loan_id IS NULL AND l.date_of_disbursement IS NOT NULL
  `, (err, loans) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (loans.length === 0) {
      return res.json({ message: 'No loans found without installment schedules', generated: 0 });
    }

    let generated = 0;
    const allInstallments = [];

    loans.forEach(loan => {
      const installment_amount = loan.installment_amount || Math.round(loan.repayment_amount / 14);
      
      for (let i = 1; i <= 14; i++) {
        const due_date = new Date(loan.date_of_disbursement);
        due_date.setDate(due_date.getDate() + (i * 7));
        
        allInstallments.push([loan.loan_id, i, due_date.toISOString().split('T')[0], installment_amount, 'Pending']);
      }
      generated++;
    });

    // Bulk insert all installments
    const query = 'INSERT IGNORE INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?';
    db.query(query, [allInstallments], (err, result) => {
      if (err) {
        console.error('Error generating installments:', err.message);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ 
        message: `Generated installment schedules for ${generated} loans`, 
        generated,
        totalInstallments: result.affectedRows
      });
    });
  });
});

// API to get dashboard statistics
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      COUNT(*) as totalCases,
      SUM(COALESCE(net_disbursement, 0)) as totalDisbursement,
      SUM(COALESCE(repayment_amount, 0)) as totalRepayment,
      SUM(COALESCE(interest_earned, 0)) as totalInterest,
      SUM(CASE WHEN COALESCE(status, 'Active') = 'Active' THEN 1 ELSE 0 END) as activeLoans
    FROM loans_master
  `;
  
  const installmentQuery = `
    SELECT 
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingInstallments,
      COUNT(CASE WHEN status = 'Pending' AND due_date < CURDATE() THEN 1 END) as overdueInstallments
    FROM installments
  `;

  Promise.all([
    new Promise((resolve, reject) => {
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(installmentQuery, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([loanStats, installmentStats]) => {
    const response = {
      totalCases: parseInt(loanStats.totalCases) || 0,
      totalDisbursement: parseFloat(loanStats.totalDisbursement) || 0,
      totalRepayment: parseFloat(loanStats.totalRepayment) || 0,
      totalInterest: parseFloat(loanStats.totalInterest) || 0,
      activeLoans: parseInt(loanStats.activeLoans) || 0,
      pendingInstallments: parseInt(installmentStats.pendingInstallments) || 0,
      overdueInstallments: parseInt(installmentStats.overdueInstallments) || 0
    };
    console.log('Dashboard API Response:', response);
    res.json(response);
  })
  .catch(err => {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: err.message });
  });
});

// API to filter reports
app.get('/api/reports/filter', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { status, dateRange, loanType, officer, leadSource } = req.query;

  let query = 'SELECT * FROM loan_applications WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND application_status = ?';
    params.push(status);
  }
  if (dateRange) {
    const [startDate, endDate] = dateRange.split(',');
    query += ' AND date_of_application BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }
  if (loanType) {
    query += ' AND loan_type = ?';
    params.push(loanType);
  }
  if (officer) {
    query += ' AND assigned_officer = ?';
    params.push(officer);
  }
  if (leadSource) {
    query += ' AND lead_source = ?';
    params.push(leadSource);
  }

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// API to export reports
app.get('/api/reports/export', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { format } = req.query;

  db.query('SELECT * FROM loan_applications', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (format === 'csv') {
      const csv = results.map(row => Object.values(row).join(',')).join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment('report.csv');
      return res.send(csv);
    }

    res.status(400).json({ error: 'Invalid format' });
  });
});

// Branches API
db.query(`CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  address TEXT,
  manager VARCHAR(255),
  phone VARCHAR(20)
)`, (err) => { if (err) throw err; });

app.get('/api/branches', authenticateToken, (req, res) => {
  db.query('SELECT * FROM branches', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/branches', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { name, address, manager, phone } = req.body;
  db.query('INSERT INTO branches (name, address, manager, phone) VALUES (?, ?, ?, ?)',
    [name, address, manager, phone], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId });
    });
});

// Products API
db.query(`CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  type VARCHAR(50),
  minAmount INT,
  maxAmount INT,
  interestRate FLOAT,
  tenure INT,
  processingFee FLOAT,
  eligibility TEXT
)`, (err) => { if (err) throw err; });

app.get('/api/products', authenticateToken, (req, res) => {
  const { type } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/products', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { name, type, minAmount, maxAmount, interestRate, tenure, processingFee, eligibility } = req.body;
  db.query('INSERT INTO products (name, type, minAmount, maxAmount, interestRate, tenure, processingFee, eligibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, type, minAmount, maxAmount, interestRate, tenure, processingFee, eligibility], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId });
    });
});

// Leads API
db.query(`CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  loanType VARCHAR(50),
  loanAmount INT,
  source VARCHAR(50),
  notes TEXT,
  priority VARCHAR(20),
  status VARCHAR(20) DEFAULT 'open',
  assignedTo VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  convertedAt TIMESTAMP NULL,
  convertedBy VARCHAR(255),
  loanId VARCHAR(32)
)`, (err) => { if (err) throw err; });

app.get('/api/leads', authenticateToken, (req, res) => {
  const { status } = req.query;
  let query = 'SELECT * FROM leads';
  const params = [];
  if (status) {
    query += ' WHERE status = ?';
    params.push(status);
  }
  query += ' ORDER BY createdAt DESC';
  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/leads', authenticateToken, (req, res) => {
  const { firstName, lastName, phone, email, loanType, loanAmount, source, notes, priority } = req.body;
  db.query('INSERT INTO leads (firstName, lastName, phone, email, loanType, loanAmount, source, notes, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [firstName, lastName, phone, email, loanType, loanAmount, source, notes, priority], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId });
    });
});

app.put('/api/leads/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, assignedTo, loanId } = req.body;
  let query = 'UPDATE leads SET status = ?';
  const params = [status];
  
  if (assignedTo) {
    query += ', assignedTo = ?';
    params.push(assignedTo);
  }
  if (loanId) {
    query += ', loanId = ?';
    params.push(loanId);
  }
  if (status === 'converted') {
    query += ', convertedAt = NOW(), convertedBy = ?';
    params.push(req.user.username);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.query(query, params, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Lead updated successfully' });
  });
});

// Overdue Cases API
app.get('/api/overdue-cases', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      i.loan_id,
      l.customer_name,
      '9876543210' as phone,
      i.amount as overdue_amount,
      DATEDIFF(CURDATE(), i.due_date) as days_overdue,
      l.date_of_disbursement as last_payment,
      'pending' as status,
      CASE 
        WHEN DATEDIFF(CURDATE(), i.due_date) > 60 THEN 'critical'
        WHEN DATEDIFF(CURDATE(), i.due_date) > 30 THEN 'high'
        WHEN DATEDIFF(CURDATE(), i.due_date) > 15 THEN 'medium'
        ELSE 'low'
      END as priority
    FROM installments i
    JOIN loans_master l ON i.loan_id = l.loan_id
    WHERE i.status = 'Pending' AND i.due_date < CURDATE()
    ORDER BY days_overdue DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map((row, index) => ({ id: index + 1, ...row })));
  });
});

app.post('/api/overdue-cases/:id/follow-up', authenticateToken, (req, res) => {
  const { type, notes, nextDate, status } = req.body;
  const caseId = req.params.id;
  
  db.query(
    'INSERT INTO follow_ups (case_id, type, notes, next_date, created_by, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [caseId, type, notes, nextDate, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Follow-up added successfully' });
    }
  );
});

app.put('/api/overdue-cases/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const caseId = req.params.id;
  
  db.query(
    'UPDATE case_status SET status = ?, updated_at = NOW() WHERE case_id = ?',
    [status, caseId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Status updated successfully' });
    }
  );
});

// Create repayment and collection tables
db.query(`CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installment_id INT,
  loan_id VARCHAR(32),
  amount DECIMAL(10,2),
  method VARCHAR(32),
  proof_url VARCHAR(255),
  remarks TEXT,
  utr VARCHAR(100) NULL,
  received_date DATE NULL,
  cycle_delay_days INT NULL,
  recorded_by INT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(loan_id) REFERENCES loans_master(loan_id)
)`, (err) => { if (err) throw err; });

// Backward-compatible: ensure columns exist if table was created earlier (robust for MySQL without IF NOT EXISTS)
function addColumnIfMissing(table, columnDef) {
  const colName = columnDef.split(' ')[0];
  db.query('SHOW COLUMNS FROM ?? LIKE ?', [table, colName], (err, rows) => {
    if (err) return; // silent
    if (!rows || rows.length === 0) {
      db.query(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`, () => {});
    }
  });
}
addColumnIfMissing('payments', 'utr VARCHAR(100) NULL');
addColumnIfMissing('payments', 'received_date DATE NULL');
addColumnIfMissing('payments', 'cycle_delay_days INT NULL');
// Track total received and close date on loans
addColumnIfMissing('loans_master', 'amount_received DECIMAL(12,2) NULL');
addColumnIfMissing('loans_master', 'date_closed DATE NULL');
addColumnIfMissing('loans_master', 'noc_shared TINYINT(1) DEFAULT 0');
addColumnIfMissing('loans_master', 'noc_shared_at DATETIME NULL');

db.query(`CREATE TABLE IF NOT EXISTS bounce_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  installment_id INT,
  loan_id VARCHAR(32),
  customer_name VARCHAR(128),
  emi_amount DECIMAL(10,2),
  due_date DATE,
  bounce_date DATE,
  reason VARCHAR(100),
  remarks TEXT,
  status VARCHAR(32) DEFAULT 'pending',
  assigned_to INT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(loan_id) REFERENCES loans_master(loan_id)
)`, (err) => { if (err) throw err; });

db.query(`CREATE TABLE IF NOT EXISTS bounce_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bounce_case_id INT,
  amount DECIMAL(10,2),
  method VARCHAR(32),
  proof_url VARCHAR(255),
  collected_by INT,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(bounce_case_id) REFERENCES bounce_cases(id)
)`, (err) => { if (err) throw err; });

db.query(`CREATE TABLE IF NOT EXISTS follow_ups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  type VARCHAR(32),
  notes TEXT,
  next_date DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) throw err; });

db.query(`CREATE TABLE IF NOT EXISTS case_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  case_id INT,
  status VARCHAR(32),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) throw err; });

// NOCs table to track issued NOCs per loan
db.query(`CREATE TABLE IF NOT EXISTS nocs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id VARCHAR(32) UNIQUE,
  reference_no VARCHAR(64),
  issued_by VARCHAR(128),
  borrower_name VARCHAR(128),
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note VARCHAR(255) NULL,
  FOREIGN KEY(loan_id) REFERENCES loans_master(loan_id)
)`, (err) => { if (err) throw err; });

// Repayment and Collection APIs
app.get('/api/installments/due', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      i.installment_id,
      i.loan_id,
      l.customer_name,
      i.amount,
      i.due_date,
      i.status,
      CASE 
        WHEN i.due_date < CURDATE() THEN DATEDIFF(CURDATE(), i.due_date)
        ELSE 0
      END as days_overdue
    FROM installments i
    JOIN loans_master l ON i.loan_id = l.loan_id
    WHERE i.status IN ('Pending', 'Overdue')
    ORDER BY i.due_date ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// List installments by loan
app.get('/api/installments/by-loan/:id', authenticateToken, (req, res) => {
  const sql = `
    SELECT installment_id, loan_id, installment_number, due_date, amount, status
    FROM installments
    WHERE loan_id = ?
    ORDER BY installment_number ASC
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

app.post('/api/payments/record', authenticateToken, (req, res) => {
  const { installment_id, method, amount, remarks, utr, received_date } = req.body;
  if (!installment_id) return res.status(400).json({ error: 'installment_id required' });

  // Fetch installment for loan_id and due_date to compute delay
  db.query('SELECT loan_id, due_date FROM installments WHERE installment_id = ?', [installment_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Installment not found' });
    const loanId = rows[0].loan_id;
    const due = rows[0].due_date;
    let cycleDelay = null;
    if (received_date) {
      cycleDelay = Math.round((new Date(received_date) - new Date(due)) / (1000*60*60*24));
    }

    db.query(
      'INSERT INTO payments (installment_id, loan_id, amount, method, remarks, utr, received_date, cycle_delay_days, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [installment_id, loanId, amount, method || 'bank', remarks || null, utr || null, received_date || null, cycleDelay, req.user.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        // Update installment status
        db.query(
          'UPDATE installments SET status = ? WHERE installment_id = ?',
          [parseFloat(amount) >= 0 ? 'Paid' : 'Partial', installment_id],
          (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ message: 'Payment recorded successfully', cycle_delay_days: cycleDelay });
          }
        );
      }
    );
  });
});

// Mark earliest pending installment as paid and record payment
app.post('/api/installments/mark-next-paid', authenticateToken, authorizeRole(['admin','employee']), (req, res) => {
  const { loan_id, amount, method, remarks, utr, received_date } = req.body || {};
  if (!loan_id) return res.status(400).json({ error: 'loan_id required' });
  const amt = Number(amount) || 0;
  db.query(
    `SELECT installment_id, amount, due_date FROM installments 
     WHERE loan_id = ? AND status IN ('Pending','Overdue') 
     ORDER BY due_date ASC LIMIT 1`,
    [loan_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0) return res.status(400).json({ error: 'No pending installments found' });
      const inst = rows[0];
      const delay = received_date ? Math.round((new Date(received_date) - new Date(inst.due_date)) / (1000*60*60*24)) : null;
      db.query(
        'INSERT INTO payments (installment_id, loan_id, amount, method, remarks, utr, received_date, cycle_delay_days, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [inst.installment_id, loan_id, amt > 0 ? amt : inst.amount, method || 'cash', remarks || null, utr || null, received_date || null, delay, req.user.id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query('UPDATE installments SET status = ? WHERE installment_id = ?', ['Paid', inst.installment_id], (err3) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ message: 'Installment marked as paid', installment_id: inst.installment_id, cycle_delay_days: delay });
          });
        }
      );
    }
  );
});

// Update single installment (due_date, amount, status)
app.put('/api/installments/:id', authenticateToken, authorizeRole(['admin','employee']), (req, res) => {
  const { id } = req.params;
  const { due_date, amount, status } = req.body || {};
  const fields = [];
  const params = [];
  if (due_date !== undefined) { fields.push('due_date = ?'); params.push(due_date); }
  if (amount !== undefined) { fields.push('amount = ?'); params.push(amount); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  params.push(id);
  const sql = `UPDATE installments SET ${fields.join(', ')} WHERE installment_id = ?`;
  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Installment not found' });
    res.json({ message: 'Installment updated' });
  });
});

app.post('/api/installments/bounce', authenticateToken, (req, res) => {
  const { installment_id, bounce_date, reason, remarks } = req.body;
  
  // Get installment details
  db.query(
    'SELECT i.*, l.customer_name FROM installments i JOIN loans_master l ON i.loan_id = l.loan_id WHERE i.installment_id = ?',
    [installment_id],
    (err, results) => {
      if (err || results.length === 0) return res.status(404).json({ error: 'Installment not found' });
      
      const installment = results[0];
      
      // Create bounce case
      db.query(
        'INSERT INTO bounce_cases (installment_id, loan_id, customer_name, emi_amount, due_date, bounce_date, reason, remarks, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [installment_id, installment.loan_id, installment.customer_name, installment.amount, installment.due_date, bounce_date, reason, remarks, req.user.id],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          
          // Update installment status to overdue
          db.query(
            'UPDATE installments SET status = ? WHERE installment_id = ?',
            ['Overdue', installment_id],
            (err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({ message: 'Bounce case created successfully', caseId: result.insertId });
            }
          );
        }
      );
    }
  );
});

app.get('/api/collection/dashboard', authenticateToken, (req, res) => {
  const queries = {
    totalBounced: 'SELECT COUNT(*) as count FROM bounce_cases WHERE status != "settled"',
    totalOverdue: 'SELECT SUM(emi_amount) as amount FROM bounce_cases WHERE status != "settled"',
    buckets: `
      SELECT 
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 1 AND 30 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN 1 ELSE 0 END) as highRisk,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN 1 ELSE 0 END) as escalated,
        SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN 1 ELSE 0 END) as legal
      FROM bounce_cases WHERE status != "settled"
    `
  };
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(queries.totalBounced, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].count);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.totalOverdue, (err, results) => {
        if (err) reject(err);
        else resolve(results[0].amount || 0);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(queries.buckets, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([totalBounced, totalOverdueAmount, buckets]) => {
    res.json({
      totalBounced,
      totalOverdueAmount,
      buckets,
      officerStats: [],
      branchStats: []
    });
  })
  .catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// NOC PDF generation
app.get('/api/loans/:id/noc.pdf', authenticateToken, async (req, res) => {
  const loanId = req.params.id;
  try {
    // Fetch noc and loan
    const noc = await new Promise((resolve) => {
      db.query('SELECT * FROM nocs WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? null : (rows && rows[0]) || null));
    });
    if (!noc) return res.status(404).json({ error: 'NOC not issued' });
    const loan = await new Promise((resolve) => {
      db.query('SELECT * FROM loans_master WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? null : (rows && rows[0]) || null));
    });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="NOC-${loanId}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Header / Branding
    doc
      .fontSize(18)
      .fillColor('#333')
      .text('No Objection Certificate', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .fillColor('#666')
      .text('Mini Business Loan Pvt. Ltd.', { align: 'center' })
      .text('Registered Office: 123, Finance Street, City, State - 400001', { align: 'center' })
      .text('Phone: +91-99999-99999 | Email: support@minibusinessloan.in', { align: 'center' })
      .moveDown(1);

    // Reference and date block
    const issuedAt = new Date(noc.issued_at);
    doc
      .fontSize(11)
      .fillColor('#000')
      .text(`Reference No: ${noc.reference_no}`)
      .text(`Date: ${issuedAt.toISOString().slice(0,10)}`)
      .moveDown(1);

    // Recipient / Subject
    doc
      .fontSize(12)
      .text(`To,`)
      .text(`${noc.borrower_name}`)
      .text(`${loan.customer_address || ''}`)
      .moveDown(1);

    // Body
    doc.fontSize(12).fillColor('#000');
    const body = `This is to certify that the borrower named above has fully and finally closed the loan account ${loan.loan_id} with our company. There are no outstanding dues payable by the borrower as of the date of issuance of this certificate.

Loan Summary:
- Loan ID: ${loan.loan_id}
- Customer: ${loan.customer_name}
- Branch: ${loan.branch || 'N/A'}
- Disbursement Date: ${loan.date_of_disbursement || 'N/A'}
- Loan Amount: ₹${(loan.loan_amount || 0).toLocaleString()}
- Total Repayment Amount: ₹${(loan.repayment_amount || 0).toLocaleString()}
- Amount Received: ₹${(loan.amount_received || 0).toLocaleString()}
- Closure Date: ${loan.date_closed || issuedAt.toISOString().slice(0,10)}

This No Objection Certificate (NOC) is issued upon the request of the borrower for their record and use.`;
    doc.text(body, { lineGap: 4 });

    if (noc.note) {
      doc.moveDown(1).fontSize(11).fillColor('#555').text(`Note: ${noc.note}`);
    }

    // Signature block
    doc.moveDown(2);
    doc.text('For Mini Business Loan Pvt. Ltd.', { align: 'left' }).moveDown(3);
    doc.text('Authorised Signatory', { align: 'left' }).moveDown(0.5);
    doc.text(`Issued by: ${noc.issued_by}`, { align: 'left' });

    // Footer
    doc.moveDown(2).fontSize(9).fillColor('#888').text('This is a system generated document and does not require physical signature/stamp.', { align: 'center' });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// NOC APIs
app.get('/api/loans/:id/noc', authenticateToken, (req, res) => {
  db.query('SELECT * FROM nocs WHERE loan_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'NOC not issued' });
    res.json(rows[0]);
  });
});

app.post('/api/loans/:id/noc', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const loanId = req.params.id;
  const { note } = req.body || {};
  // Fetch loan to get borrower name
  db.query('SELECT loan_id, customer_name, status FROM loans_master WHERE loan_id = ?', [loanId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ error: 'Loan not found' });
    const loan = results[0];
    // Optional: restrict to closed loans only
    // if (String(loan.status || '').toLowerCase() !== 'closed') {
    //   return res.status(400).json({ error: 'Loan must be Closed to issue NOC' });
    // }
    const reference_no = `NOC-${loan.loan_id}-${Date.now()}`;
    const issued_by = req.user?.username || 'system';
    const borrower_name = loan.customer_name || '';

    // Upsert: if NOC exists, return it; else create
    db.query('SELECT * FROM nocs WHERE loan_id = ?', [loanId], (err2, existing) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (existing && existing.length > 0) {
        db.query('UPDATE loans_master SET noc_shared = 1, noc_shared_at = COALESCE(noc_shared_at, NOW()) WHERE loan_id = ?', [loanId], ()=>{});
        return res.json(existing[0]);
      }
      db.query('INSERT INTO nocs (loan_id, reference_no, issued_by, borrower_name, note) VALUES (?, ?, ?, ?, ?)',
        [loanId, reference_no, issued_by, borrower_name, note || null],
        (err3, result) => {
          if (err3) return res.status(500).json({ error: err3.message });
          db.query('SELECT * FROM nocs WHERE id = ?', [result.insertId], (err4, rows) => {
            if (err4) return res.status(500).json({ error: err4.message });
            db.query('UPDATE loans_master SET noc_shared = 1, noc_shared_at = COALESCE(noc_shared_at, NOW()) WHERE loan_id = ?', [loanId], ()=>{});
            res.json(rows[0]);
          });
        }
      );
    });
  });
});

app.post('/api/collections/record', authenticateToken, (req, res) => {
  const { bounce_case_id, amount, method, remarks } = req.body;
  
  db.query(
    'INSERT INTO bounce_collections (bounce_case_id, amount, method, collected_by) VALUES (?, ?, ?, ?)',
    [bounce_case_id, amount, method, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Update bounce case status
      db.query(
        'UPDATE bounce_cases SET status = ? WHERE id = ?',
        ['settled', bounce_case_id],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ message: 'Collection recorded successfully' });
        }
      );
    }
  );
});

// Collection APIs
app.get('/api/collections/total', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      i.loan_id,
      l.customer_name,
      i.installment_number,
      DATE_FORMAT(i.due_date, '%Y-%m-%d') as due_date,
      i.amount,
      COALESCE(p.amount, 0) as collected_amount,
      i.status,
      CASE 
        WHEN i.due_date < CURDATE() AND i.status = 'Pending' THEN DATEDIFF(CURDATE(), i.due_date)
        ELSE 0
      END as days_overdue
    FROM installments i
    JOIN loans_master l ON i.loan_id = l.loan_id
    LEFT JOIN payments p ON i.installment_id = p.installment_id
    ORDER BY i.due_date DESC
    LIMIT 100
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Total collections error:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Total collections count:', results.length);
    res.json(results);
  });
});

app.get('/api/collections/stats', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN p.amount IS NOT NULL THEN p.amount ELSE 0 END), 0) as totalCollected,
      COALESCE(SUM(CASE WHEN i.status = 'Pending' THEN i.amount ELSE 0 END), 0) as totalPending,
      ROUND(
        COALESCE(
          (COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
          0
        ), 2
      ) as collectionRate
    FROM installments i
    LEFT JOIN payments p ON i.installment_id = p.installment_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Collection stats error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const stats = results[0];
    const response = {
      totalCollected: parseFloat(stats.totalCollected) || 0,
      totalPending: parseFloat(stats.totalPending) || 0,
      collectionRate: parseFloat(stats.collectionRate) || 0
    };
    
    console.log('Collection stats response:', response);
    res.json(response);
  });
});

app.get('/api/collections/daily', authenticateToken, (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const collectionsQuery = `
    SELECT 
      i.installment_id,
      i.loan_id,
      l.customer_name,
      '9876543210' as phone,
      i.installment_number,
      i.amount,
      i.status
    FROM installments i
    JOIN loans_master l ON i.loan_id = l.loan_id
    WHERE DATE(i.due_date) = ?
    ORDER BY i.status DESC, l.customer_name
  `;
  
  const statsQuery = `
    SELECT 
      COALESCE(SUM(i.amount), 0) as totalDue,
      COALESCE(SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END), 0) as totalCollected,
      COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pendingCount
    FROM installments i
    WHERE DATE(i.due_date) = ?
  `;
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.query(collectionsQuery, [targetDate], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      db.query(statsQuery, [targetDate], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    })
  ])
  .then(([collections, stats]) => {
    const response = {
      collections,
      stats: {
        totalDue: parseFloat(stats.totalDue) || 0,
        totalCollected: parseFloat(stats.totalCollected) || 0,
        pendingCount: parseInt(stats.pendingCount) || 0
      }
    };
    console.log(`Daily collections for ${targetDate}:`, response.stats);
    res.json(response);
  })
  .catch(err => {
    console.error('Daily collections error:', err);
    res.status(500).json({ error: err.message });
  });
});

app.get('/api/collections/default-candidates', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      i.loan_id,
      l.customer_name,
      '9876543210' as phone,
      SUM(i.amount) as overdue_amount,
      MAX(DATEDIFF(CURDATE(), i.due_date)) as days_overdue,
      MAX(p.recorded_at) as last_payment
    FROM installments i
    JOIN loans_master l ON i.loan_id = l.loan_id
    LEFT JOIN payments p ON i.loan_id = p.loan_id
    WHERE i.status = 'Pending' 
      AND i.due_date < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      AND l.status != 'Default'
    GROUP BY i.loan_id, l.customer_name
    HAVING days_overdue >= 30
    ORDER BY days_overdue DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/collections/default-customers', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      l.loan_id,
      l.customer_name,
      '9876543210' as phone,
      l.repayment_amount as default_amount,
      DATE(l.created_at) as marked_date,
      'Non-payment for 30+ days' as reason
    FROM loans_master l
    WHERE l.status = 'Default'
    ORDER BY l.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/collections/mark-default', authenticateToken, authorizeRole(['admin', 'manager']), (req, res) => {
  const { loan_id, reason, marked_date } = req.body;
  
  db.query(
    'UPDATE loans_master SET status = "Default" WHERE loan_id = ?',
    [loan_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Also update related installments
      db.query(
        'UPDATE installments SET status = "Default" WHERE loan_id = ? AND status = "Pending"',
        [loan_id],
        (err) => {
          if (err) console.error('Error updating installments:', err.message);
        }
      );
      
      res.json({ message: 'Customer marked as default successfully' });
    }
  );
});

app.post('/api/collections/remove-default', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { loan_id } = req.body;
  
  db.query(
    'UPDATE loans_master SET status = "Active" WHERE loan_id = ?',
    [loan_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Also update related installments
      db.query(
        'UPDATE installments SET status = "Pending" WHERE loan_id = ? AND status = "Default"',
        [loan_id],
        (err) => {
          if (err) console.error('Error updating installments:', err.message);
        }
      );
      
      res.json({ message: 'Customer removed from default list successfully' });
    }
  );
});

// Disbursed Cases APIs
app.get('/api/disbursed-cases', authenticateToken, (req, res) => {
  // Return recent disbursed cases from disbursed_cases table
  const query = `
    SELECT id, loan_id, branch, sourced_by, customer_name, loan_amount, pf, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, no_of_installment, status, created_at
    FROM disbursed_cases
    ORDER BY date_of_disbursement DESC, id DESC
    LIMIT 200
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Day-wise disbursement summary with CSV-style dates (DD/MM/YYYY)
app.get('/api/disbursed-cases/daily', authenticateToken, (req, res) => {
  const q = `
    SELECT 
      DATE(date_of_disbursement) as date,
      DATE_FORMAT(date_of_disbursement, '%d/%m/%Y') as date_formatted,
      DAYNAME(date_of_disbursement) as day_name,
      COUNT(*) as total_cases,
      COALESCE(SUM(net_disbursement),0) as total_disbursed,
      COALESCE(SUM(loan_amount),0) as total_amount,
      COALESCE(SUM(repayment_amount),0) as total_repayment
    FROM disbursed_cases
    WHERE date_of_disbursement IS NOT NULL
    GROUP BY DATE(date_of_disbursement)
    ORDER BY DATE(date_of_disbursement)
  `;
  db.query(q, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Get single disbursed case by loan_id
app.get('/api/disbursed-cases/:loan_id', authenticateToken, (req, res) => {
  db.query('SELECT * FROM disbursed_cases WHERE loan_id = ?', [req.params.loan_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ error: 'Disbursed case not found' });
    res.json(results[0]);
  });
});

// Update disbursement entry in disbursed_cases by loan_id
app.put('/api/disbursed-cases/:loan_id', authenticateToken, authorizeRole(['admin', 'employee']), (req, res) => {
  const {
    branch,
    sourced_by,
    customer_name,
    loan_amount,
    pf,
    gst,
    net_disbursement,
    repayment_amount,
    interest_earned,
    date_of_disbursement,
    installment_amount,
    no_of_installment,
    status
  } = req.body;

  const fields = [];
  const params = [];
  const add = (col, val) => {
    if (val !== undefined) {
      fields.push(`${col} = ?`);
      params.push(val);
    }
  };

  add('branch', branch);
  add('sourced_by', sourced_by);
  add('customer_name', customer_name);
  add('loan_amount', loan_amount);
  add('pf', pf);
  add('gst', gst);
  add('net_disbursement', net_disbursement);
  add('repayment_amount', repayment_amount);
  add('interest_earned', interest_earned);
  add('date_of_disbursement', date_of_disbursement);
  add('installment_amount', installment_amount);
  add('no_of_installment', no_of_installment);
  add('status', status);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  const sql = `UPDATE disbursed_cases SET ${fields.join(', ')} WHERE loan_id = ?`;
  params.push(req.params.loan_id);

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Disbursed case not found' });
    return res.json({ message: 'Disbursement entry updated successfully' });
  });
});

// Import disbursed cases from a CSV/XLSX file saved inside the project
// Body: { "relativePath": "DATA/disbursed_cases.csv" } (optional; defaults to DATA/disbursed_cases.csv)
app.post('/api/disbursed-cases/import-file', authenticateToken, authorizeRole(['admin']), (req, res) => {
  try {
    const { relativePath } = req.body || {};
    const rel = relativePath && typeof relativePath === 'string' && relativePath.trim().length > 0
      ? relativePath.trim()
      : 'DATA/disbursed_cases.csv';

    const absolutePath = path.resolve(__dirname, '..', rel);
    if (!fs.existsSync(absolutePath)) {
      return res.status(400).json({ error: `File not found at ${absolutePath}` });
    }

    const fileExt = path.extname(absolutePath).toLowerCase();

    let imported = 0;
    let errors = 0;
    const errorRows = [];
    
    const getField = (obj, variants) => {
    // Try direct keys, trimmed, and case-insensitive
    for (const v of variants) {
    if (Object.prototype.hasOwnProperty.call(obj, v)) return obj[v];
    const t = typeof v === 'string' ? v.trim() : v;
    if (Object.prototype.hasOwnProperty.call(obj, t)) return obj[t];
    const lower = String(v).toLowerCase();
    const upper = String(v).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(obj, lower)) return obj[lower];
    if (Object.prototype.hasOwnProperty.call(obj, upper)) return obj[upper];
    }
    // Fallback: match by removing spaces and case-insensitive
    const keys = Object.keys(obj);
    for (const key of keys) {
    const norm = key.replace(/\s+/g, '').toLowerCase();
    for (const v of variants) {
    const vnorm = String(v).replace(/\s+/g, '').toLowerCase();
    if (norm === vnorm) return obj[key];
    }
    }
    return undefined;
    };
    
    const parseIntSafe = (val) => {
    const n = parseInt(val);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : 0;
    };
    
    const excelSerialToISO = (serial) => {
    // Excel serial date to JS date (UTC) -> YYYY-MM-DD
    const ms = Math.round((serial - 25569) * 86400 * 1000);
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };
    
    const normalizeDate = (val) => {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val === 'number') {
    return excelSerialToISO(val);
    }
    let s = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // already ISO
    // unify separators
    s = s.replace(/\./g, '/').replace(/-/g, '/');
    const parts = s.split('/');
    if (parts.length === 3) {
    // assume DD/MM/YYYY or D/M/YYYY
    const dd = String(parts[0]).padStart(2, '0');
    const mm = String(parts[1]).padStart(2, '0');
    const yyyy = String(parts[2]).padStart(4, '0');
    return `${yyyy}-${mm}-${dd}`;
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };
    
    const processRow = (row) => {
    const loan_id = getField(row, ['LOAN ID', 'loan_id']);
    if (!loan_id) {
    errors++;
    errorRows.push({ row, error: 'Missing loan_id' });
    return;
    }
    const branch = getField(row, ['BRANCH', 'branch']);
    const sourced_by = getField(row, ['SOURCED BY', 'sourced_by']);
    const customer_name = getField(row, ['CUSTOMER NAME', 'customer_name']);
    const loan_amount = parseIntSafe(getField(row, ['LOAN AMOUNT', 'loan_amount']));
    const pf = parseIntSafe(getField(row, ['PF', 'pf']));
    const gst = parseIntSafe(getField(row, ['GST', 'gst']));
    const net_disbursement = parseIntSafe(getField(row, ['NET DISBURSEMENT', 'net_disbursement']));
    const repayment_amount = parseIntSafe(getField(row, ['REPAYMENT AMOUNT', 'repayment_amount']));
    const interest_earned = parseIntSafe(getField(row, ['INTEREST EARNED', 'interest_earned']));
    const date_of_disbursement = normalizeDate(getField(row, ['DATE OF DISBURSEMENT', 'date_of_disbursement', 'Date of Disbursement']));
    const installment_amount = parseIntSafe(getField(row, ['INSTALLMENT AMOUNT', 'installment_amount']));
    const no_of_installment = parseIntSafe(getField(row, ['NO OF INSTALLMENT', 'no_of_installment'])) || 14;
    
    db.query(
    'INSERT INTO disbursed_cases (loan_id, branch, sourced_by, customer_name, loan_amount, pf, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    , [
    loan_id,
    branch,
    sourced_by,
    customer_name,
    loan_amount,
    pf,
    gst,
    net_disbursement,
    repayment_amount,
    interest_earned,
    date_of_disbursement,
    installment_amount,
    no_of_installment
    ]
    , (err) => {
    if (err) {
    errors++;
    errorRows.push({ row, error: err.message });
    } else {
    imported++;
    }
    }
    );
    };

    if (fileExt === '.xlsx' || fileExt === '.xls') {
      try {
        const workbook = XLSX.readFile(absolutePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        jsonData.forEach(processRow);
        // small delay to ensure inserts complete
        setTimeout(() => {
          return res.json({ imported, errors, message: `Imported ${imported} records with ${errors} errors`, sampleErrors: errorRows.slice(0, 5) });
        }, 500);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to process Excel file: ' + e.message });
      }
    } else {
      // handle CSV
      const readStream = fs.createReadStream(absolutePath)
        .pipe(csv())
        .on('data', processRow)
        .on('end', () => {
          return res.json({ imported, errors, message: `Imported ${imported} records with ${errors} errors`, sampleErrors: errorRows.slice(0, 5) });
        })
        .on('error', (err) => {
          return res.status(500).json({ error: 'Failed to process CSV file: ' + err.message });
        });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.post('/api/disbursed-cases/upload-csv', authenticateToken, authorizeRole(['admin']), upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let imported = 0;
  let errors = 0;
  const errorRows = [];

  const processRow = (row) => {
    // Parse date from DD/MM/YYYY to YYYY-MM-DD
    let disbursementDate = row['DATE OF DISBURSEMENT'] || row['date_of_disbursement'];
    if (disbursementDate) {
      const parts = disbursementDate.toString().split('/');
      if (parts.length === 3) {
        disbursementDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    db.query(
      'INSERT INTO disbursed_cases (loan_id, branch, sourced_by, customer_name, loan_amount, pf, gst, net_disbursement, repayment_amount, interest_earned, date_of_disbursement, installment_amount, no_of_installment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        row['LOAN ID'] || row['loan_id'],
        row['BRANCH'] || row['branch'],
        row['SOURCED BY'] || row['sourced_by'],
        row['CUSTOMER NAME'] || row['customer_name'],
        parseInt(row['LOAN AMOUNT'] || row['loan_amount']) || 0,
        parseInt(row['PF'] || row['pf']) || 0,
        parseInt(row['GST'] || row['gst']) || 0,
        parseInt(row['NET DISBURSEMENT'] || row['net_disbursement']) || 0,
        parseInt(row['REPAYMENT AMOUNT'] || row['repayment_amount']) || 0,
        parseInt(row['INTEREST EARNED'] || row['interest_earned']) || 0,
        disbursementDate,
        parseInt(row['INSTALLMENT AMOUNT'] || row['installment_amount']) || 0,
        parseInt(row['NO OF INSTALLMENT'] || row['no_of_installment']) || 14
      ],
      (err) => {
        if (err) {
          console.error('Error importing row:', err.message);
          errors++;
          errorRows.push({ row, error: err.message });
        } else {
          imported++;
        }
      }
    );
  };

  if (fileExt === '.xlsx' || fileExt === '.xls') {
    // Handle Excel files
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach(processRow);
      
      setTimeout(() => {
        fs.unlinkSync(filePath);
        res.json({ 
          imported, 
          errors, 
          message: `Successfully imported ${imported} records with ${errors} errors`,
          errorRows: errorRows.slice(0, 5)
        });
      }, 1000);
    } catch (error) {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Failed to process Excel file: ' + error.message });
    }
  } else {
    // Handle CSV files
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', processRow)
      .on('end', () => {
        fs.unlinkSync(filePath);
        res.json({ 
          imported, 
          errors, 
          message: `Successfully imported ${imported} records with ${errors} errors`,
          errorRows: errorRows.slice(0, 5)
        });
      })
      .on('error', (err) => {
        console.error('Error reading CSV file:', err.message);
        fs.unlinkSync(filePath);
        res.status(500).json({ error: 'Failed to process CSV file' });
      });
  }
});



// Bulk close loans (JSON)
app.post('/api/loans/bulk-close', authenticateToken, authorizeRole(['admin','employee']), async (req, res) => {
  try {
    const items = (req.body?.loans && Array.isArray(req.body.loans)) ? req.body.loans
                : (req.body?.loan_ids && Array.isArray(req.body.loan_ids)) ? req.body.loan_ids.map(id => ({ loan_id: id }))
                : [];
    if (!items.length) return res.status(400).json({ error: 'Provide loans: [{loan_id, amount_received?}] or loan_ids: [..]' });

    const results = [];
    for (const it of items) {
      const loanId = (typeof it === 'string') ? it : it.loan_id;
      const rawProvided = (typeof it === 'object') ? (it.amount_received ?? it.total_received) : undefined;
      let providedAmt = rawProvided;
      if (providedAmt !== undefined) {
        const s = String(providedAmt).replace(/[^0-9.-]/g, '');
        providedAmt = s ? Number(s) : undefined;
      }
      if (!loanId) { results.push({ loan_id: null, ok: false, error: 'missing loan_id' }); continue; }
      // check loan exists
      const loanRow = await new Promise((resolve) => {
        db.query('SELECT loan_id FROM loans_master WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? null : (rows && rows[0]) || null));
      });
      if (!loanRow) { results.push({ loan_id: loanId, ok: false, error: 'not found' }); continue; }
      // compute amount if not provided
      let finalAmount = providedAmt;
      if (finalAmount === undefined || finalAmount === null || finalAmount === '') {
        finalAmount = await new Promise((resolve) => {
          db.query('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? 0 : (rows?.[0]?.total || 0)));
        });
      }
      finalAmount = Number(finalAmount) || 0;
      const ok = await new Promise((resolve) => {
        db.query('UPDATE loans_master SET status = "Closed", amount_received = ?, date_closed = COALESCE(date_closed, CURDATE()) WHERE loan_id = ?', [finalAmount, loanId], (err, r) => {
          resolve(!err && r && r.affectedRows > 0);
        });
      });
      if (ok) results.push({ loan_id: loanId, ok: true, amount_received: finalAmount });
      else results.push({ loan_id: loanId, ok: false, error: 'update failed' });
    }
    const closedCount = results.filter(r => r.ok).length;
    res.json({ closed: closedCount, total: results.length, results });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Bulk close loans via CSV upload: columns: LOAN ID, AMOUNT RECEIVED (optional)
app.post('/api/loans/bulk-close/upload', authenticateToken, authorizeRole(['admin','employee']), upload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const filePath = req.file.path;
  const results = [];
  const processRow = async (row) => {
    const normalize = (s) => String(s).split(' ').join('').split('_').join('').toLowerCase();
    const getRowField = (obj, variants) => {
      const keys = Object.keys(obj || {});
      for (const v of variants) {
        const nv = normalize(v);
        for (const k of keys) {
          if (normalize(k) === nv) return obj[k];
        }
      }
      return undefined;
    };
    const rawId = getRowField(row, ['LOAN ID','loan_id','Loan ID','LOANID','LOAN_ID']);
    const loanId = rawId ? String(rawId).trim() : '';
    const amtRaw = getRowField(row, ['AMOUNT RECEIVED','amount_received','TOTAL RECEIVED','total_received','TOTAL RECEIVED AMOUNT','AMOUNT TOTAL RECEIVED','total_amount_received','Total Received Amount']);
    const rawStatus = getRowField(row, ['STATUS','status','Status']);
    let statusToSet = 'Closed';
    if (rawStatus && String(rawStatus).trim()) {
      const s = String(rawStatus).trim().toLowerCase();
      if (['closed','foreclosed','active','default'].includes(s)) {
        statusToSet = s.charAt(0).toUpperCase() + s.slice(1);
      }
    }
    let amt = undefined;
    if (amtRaw !== undefined && amtRaw !== null && String(amtRaw).trim() !== '') {
      const s = String(amtRaw).replace(/[^0-9.-]/g, '');
      if (s) {
        const n = Number(s);
        if (Number.isFinite(n)) amt = n;
      }
    }
    if (!loanId) { results.push({ loan_id: null, ok: false, error: 'missing loan_id' }); return; }
    const loanRow = await new Promise((resolve) => {
      db.query('SELECT loan_id FROM loans_master WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? null : (rows && rows[0]) || null));
    });
    if (!loanRow) { results.push({ loan_id: loanId, ok: false, error: 'not found' }); return; }
    if (amt === undefined || Number.isNaN(amt)) {
      amt = await new Promise((resolve) => {
        db.query('SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE loan_id = ?', [loanId], (err, rows) => resolve(err ? 0 : (rows?.[0]?.total || 0)));
      });
    }
    const ok = await new Promise((resolve) => {
      const isClosedLike = ['Closed','Foreclosed'].includes(statusToSet);
      const sql = isClosedLike
        ? 'UPDATE loans_master SET status = ?, amount_received = ?, date_closed = COALESCE(date_closed, CURDATE()) WHERE loan_id = ?'
        : 'UPDATE loans_master SET status = ?, amount_received = ? WHERE loan_id = ?';
      const params = isClosedLike ? [statusToSet, amt || 0, loanId] : [statusToSet, amt || 0, loanId];
      db.query(sql, params, (err, r) => {
        resolve(!err && r && r.affectedRows > 0);
      });
    });
    if (ok) results.push({ loan_id: loanId, ok: true, amount_received: amt || 0, status: statusToSet });
    else results.push({ loan_id: loanId, ok: false, error: 'update failed' });
  };

  try {
    const stream = fs.createReadStream(filePath).pipe(csv());
    stream.on('data', (row) => { stream.pause(); processRow(row).then(() => stream.resume()); });
    stream.on('end', () => {
      fs.unlink(filePath, ()=>{});
      res.json({ closed: results.filter(r=>r.ok).length, total: results.length, results: results.slice(0, 50) });
    });
    stream.on('error', (err) => {
      fs.unlink(filePath, ()=>{});
      res.status(500).json({ error: 'Failed to process CSV: ' + err.message });
    });
  } catch (e) {
    fs.unlink(filePath, ()=>{});
    res.status(500).json({ error: e.message });
  }
});



// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /api/loans - Get all loans');
  console.log('- GET /api/disbursed-cases - Get disbursed cases');
  console.log('- POST /api/disbursed-cases/upload-csv - Upload CSV for disbursed cases');
  console.log('- GET /api/installments/due - Get due installments');
  console.log('- GET /api/overdue-cases - Get overdue cases');
  console.log('- GET /api/collection/dashboard - Collection dashboard');
  console.log('- POST /api/payments/record - Record payment');
  console.log('- POST /api/installments/bounce - Create bounce case');
  console.log('- POST /auth/login - User login');
});
