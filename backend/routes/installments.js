const express = require('express');
const mysql = require('mysql2');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'installments-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only csv files
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// GET /api/installments/by-loan/:id
router.get('/by-loan/:id', authenticateToken, (req, res) => {
  const sql = `
    SELECT installment_id, loan_id, installment_number, due_date, amount, status
    FROM installments
    WHERE loan_id = ?
    ORDER BY installment_number ASC
  `;
  db.query(sql, [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch installments by loan' });
    res.json(rows || []);
  });
});

// GET /api/installments/monthly-demand
router.get('/monthly-demand', authenticateToken, (req, res) => {
  const query = `
    SELECT 
      DATE_FORMAT(i.due_date, '%M %Y') as month,
      COUNT(*) as total_emis,
      COUNT(DISTINCT i.loan_id) as unique_loans,
      SUM(i.amount) as total_demand,
      SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
      SUM(CASE WHEN i.status != 'Paid' THEN i.amount ELSE 0 END) as pending,
      ROUND((SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / NULLIF(SUM(i.amount), 0)) * 100, 2) as collection_percentage
    FROM installments i
    JOIN loans_master l ON l.loan_id = i.loan_id
    WHERE l.status = 'Active'
    GROUP BY DATE_FORMAT(i.due_date, '%Y-%m')
    ORDER BY DATE_FORMAT(i.due_date, '%Y-%m') DESC
    LIMIT 8
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching monthly demand:', err);
      return res.status(500).json({ error: 'Failed to fetch monthly demand data' });
    }
    res.json(results || []);
  });
});

// POST /api/installments/bulk-create
router.post('/bulk-create', authenticateToken, (req, res) => {
  const { installments } = req.body;
  
  if (!installments || !Array.isArray(installments) || installments.length === 0) {
    return res.status(400).json({ error: 'Invalid installments data' });
  }
  
  // Prepare bulk insert data
  const values = installments.map(inst => [
    inst.loan_id,
    inst.installment_number,
    inst.due_date,
    inst.amount,
    inst.status || 'Pending'
  ]);
  
  const query = 'INSERT IGNORE INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?';
  
  db.query(query, [values], (err, result) => {
    if (err) {
      console.error('Error creating installments:', err);
      return res.status(500).json({ error: 'Failed to create installments' });
    }
    
    res.json({ 
      message: 'Installments created successfully', 
      count: result.affectedRows,
      total: installments.length
    });
  });
});

// POST /api/installments/upload-csv
router.post('/upload-csv', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  let rowCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => {
      rowCount++;
      
      // Validate required fields
      if (!data.loan_id || !data.installment_number || !data.due_date || !data.amount) {
        errors.push(`Row ${rowCount}: Missing required fields`);
        return;
      }

      // Validate data types
      const amount = parseFloat(data.amount);
      const installmentNumber = parseInt(data.installment_number);
      
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${rowCount}: Invalid amount value`);
        return;
      }

      if (isNaN(installmentNumber) || installmentNumber <= 0) {
        errors.push(`Row ${rowCount}: Invalid installment number`);
        return;
      }

      // Add valid row to results
      results.push({
        loan_id: data.loan_id,
        installment_number: installmentNumber,
        due_date: data.due_date,
        amount: amount,
        status: data.status || 'Pending'
      });
    })
    .on('end', () => {
      // Delete the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      // If there are validation errors, return them
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors: errors,
          message: 'Validation errors in CSV file'
        });
      }

      // If no valid rows found
      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid data found in CSV file'
        });
      }

      // Prepare bulk insert data
      const values = results.map(inst => [
        inst.loan_id,
        inst.installment_number,
        inst.due_date,
        inst.amount,
        inst.status
      ]);
      
      const query = 'INSERT INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ? ON DUPLICATE KEY UPDATE due_date=VALUES(due_date), amount=VALUES(amount), status=VALUES(status)';
      
      db.query(query, [values], (err, result) => {
        if (err) {
          console.error('Error uploading installments:', err);
          return res.status(500).json({ 
            success: false,
            error: 'Failed to upload installments'
          });
        }
        
        res.json({ 
          success: true,
          message: 'Installments uploaded successfully', 
          count: result.affectedRows,
          total: results.length
        });
      });
    })
    .on('error', (err) => {
      console.error('Error parsing CSV:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse CSV file'
      });
    });
});

module.exports = router;