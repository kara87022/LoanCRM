const mysql = require('mysql2');
require('dotenv').config();

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

class CollectionCalculator {
  constructor() {
    this.db = db;
  }

  // Calculate monthly collection summary
  async calculateMonthlyCollections() {
    const query = `
      SELECT 
        DATE_FORMAT(i.due_date, '%Y-%m') as month,
        DATE_FORMAT(MIN(i.due_date), '%M %Y') as month_name,
        COUNT(i.installment_id) as total_emis,
        COUNT(DISTINCT i.loan_id) as unique_loans,
        SUM(i.amount) as total_demand,
        SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
        SUM(CASE WHEN i.status != 'Paid' THEN i.amount ELSE 0 END) as pending,
        ROUND(
          (SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / 
           NULLIF(SUM(i.amount), 0)) * 100, 2
        ) as collection_percentage,
        COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pending_emis,
        COUNT(CASE WHEN i.status = 'Overdue' THEN 1 END) as overdue_emis
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE l.status = 'Active'
      GROUP BY DATE_FORMAT(i.due_date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Calculate daily collection summary
  async calculateDailyCollections(startDate = null, endDate = null) {
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(i.due_date) BETWEEN ? AND ?';
      params = [startDate, endDate];
    } else if (startDate) {
      dateFilter = 'AND DATE(i.due_date) >= ?';
      params = [startDate];
    } else {
      // Default to last 30 days
      dateFilter = 'AND DATE(i.due_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }

    const query = `
      SELECT 
        DATE(i.due_date) as date,
        DATE_FORMAT(MIN(i.due_date), '%d %M %Y') as date_formatted,
        DAYNAME(MIN(i.due_date)) as day_name,
        COUNT(i.installment_id) as total_emis,
        COUNT(DISTINCT i.loan_id) as unique_loans,
        SUM(i.amount) as total_demand,
        SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
        SUM(CASE WHEN i.status != 'Paid' THEN i.amount ELSE 0 END) as pending,
        ROUND(
          (SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / 
           NULLIF(SUM(i.amount), 0)) * 100, 2
        ) as collection_percentage,
        COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pending_emis,
        COUNT(CASE WHEN i.status = 'Overdue' THEN 1 END) as overdue_emis
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE l.status = 'Active' ${dateFilter}
      GROUP BY DATE(i.due_date)
      ORDER BY date DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, params, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Calculate branch-wise collection performance
  async calculateBranchWiseCollections() {
    const query = `
      SELECT 
        l.branch,
        COUNT(i.installment_id) as total_emis,
        COUNT(DISTINCT i.loan_id) as unique_loans,
        SUM(i.amount) as total_demand,
        SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
        SUM(CASE WHEN i.status != 'Paid' THEN i.amount ELSE 0 END) as pending,
        ROUND(
          (SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / 
           NULLIF(SUM(i.amount), 0)) * 100, 2
        ) as collection_percentage,
        COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pending_emis,
        COUNT(CASE WHEN i.status = 'Overdue' THEN 1 END) as overdue_emis
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE l.status = 'Active'
      GROUP BY l.branch
      ORDER BY collection_percentage DESC, total_demand DESC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Calculate overdue analysis
  async calculateOverdueAnalysis() {
    const query = `
      SELECT 
        CASE 
          WHEN DATEDIFF(CURDATE(), i.due_date) BETWEEN 1 AND 7 THEN '1-7 Days'
          WHEN DATEDIFF(CURDATE(), i.due_date) BETWEEN 8 AND 15 THEN '8-15 Days'
          WHEN DATEDIFF(CURDATE(), i.due_date) BETWEEN 16 AND 30 THEN '16-30 Days'
          WHEN DATEDIFF(CURDATE(), i.due_date) BETWEEN 31 AND 60 THEN '31-60 Days'
          WHEN DATEDIFF(CURDATE(), i.due_date) BETWEEN 61 AND 90 THEN '61-90 Days'
          WHEN DATEDIFF(CURDATE(), i.due_date) > 90 THEN '90+ Days'
        END as overdue_bucket,
        COUNT(i.installment_id) as count,
        COUNT(DISTINCT i.loan_id) as unique_loans,
        SUM(i.amount) as overdue_amount,
        ROUND(AVG(DATEDIFF(CURDATE(), i.due_date)), 0) as avg_days_overdue
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE i.status IN ('Pending', 'Overdue')
        AND i.due_date < CURDATE()
        AND l.status = 'Active'
      GROUP BY overdue_bucket
      ORDER BY MIN(DATEDIFF(CURDATE(), i.due_date))
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results.filter(row => row.overdue_bucket !== null));
      });
    });
  }

  // Calculate collection trends
  async calculateCollectionTrends() {
    const query = `
      SELECT 
        DATE_FORMAT(i.due_date, '%Y-%m') as month,
        SUM(i.amount) as demand,
        SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
        ROUND(
          (SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / 
           NULLIF(SUM(i.amount), 0)) * 100, 2
        ) as collection_rate,
        COUNT(DISTINCT i.loan_id) as active_loans
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE l.status = 'Active'
        AND i.due_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(i.due_date, '%Y-%m')
      ORDER BY month ASC
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  // Get today's collection summary
  async getTodayCollectionSummary() {
    const query = `
      SELECT 
        COUNT(i.installment_id) as total_emis_due,
        COUNT(DISTINCT i.loan_id) as unique_loans,
        SUM(i.amount) as total_demand,
        SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) as collected,
        SUM(CASE WHEN i.status != 'Paid' THEN i.amount ELSE 0 END) as pending,
        ROUND(
          (SUM(CASE WHEN i.status = 'Paid' THEN i.amount ELSE 0 END) / 
           NULLIF(SUM(i.amount), 0)) * 100, 2
        ) as collection_percentage,
        COUNT(CASE WHEN i.status = 'Paid' THEN 1 END) as paid_emis,
        COUNT(CASE WHEN i.status = 'Pending' THEN 1 END) as pending_emis
      FROM installments i
      JOIN loans_master l ON i.loan_id = l.loan_id
      WHERE DATE(i.due_date) = CURDATE()
        AND l.status = 'Active'
    `;

    return new Promise((resolve, reject) => {
      this.db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0] || {});
      });
    });
  }

  // Generate comprehensive collection report
  async generateCollectionReport() {
    try {
      const [
        monthlyCollections,
        dailyCollections,
        branchWiseCollections,
        overdueAnalysis,
        collectionTrends,
        todaySummary
      ] = await Promise.all([
        this.calculateMonthlyCollections(),
        this.calculateDailyCollections(),
        this.calculateBranchWiseCollections(),
        this.calculateOverdueAnalysis(),
        this.calculateCollectionTrends(),
        this.getTodayCollectionSummary()
      ]);

      return {
        summary: {
          reportGeneratedAt: new Date().toISOString(),
          todaySummary
        },
        monthlyCollections,
        dailyCollections,
        branchWiseCollections,
        overdueAnalysis,
        collectionTrends
      };
    } catch (error) {
      throw new Error(`Error generating collection report: ${error.message}`);
    }
  }
}

module.exports = CollectionCalculator;