const express = require('express');
const mysql = require('mysql2');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;