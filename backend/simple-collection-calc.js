require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function calculateRealCollections() {
  console.log('📊 Calculating Real Collection Data...\n');

  try {
    // Get actual loan data
    const loans = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          loan_id, customer_name, branch, loan_amount, repayment_amount, 
          installment_amount, total_installments, no_of_installment,
          date_of_disbursement, status
        FROM loans_master 
        WHERE date_of_disbursement IS NOT NULL 
        ORDER BY date_of_disbursement DESC
        LIMIT 10
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('📋 Sample Loan Data:');
    console.log('='.repeat(80));
    loans.forEach((loan, i) => {
      if (i < 5) {
        console.log(`${loan.loan_id}: ${loan.customer_name}`);
        console.log(`  Loan: ₹${loan.loan_amount?.toLocaleString()}`);
        console.log(`  Repayment: ₹${loan.repayment_amount?.toLocaleString()}`);
        console.log(`  EMI: ₹${loan.installment_amount} x ${loan.total_installments || loan.no_of_installment}`);
        console.log(`  Date: ${loan.date_of_disbursement}`);
        console.log('');
      }
    });

    // Get installment data
    const installments = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          COUNT(*) as total_installments,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_count,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_count,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected_amount,
          SUM(CASE WHEN status != 'Paid' THEN amount ELSE 0 END) as pending_amount
        FROM installments
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    console.log('💰 Real Collection Status:');
    console.log('='.repeat(80));
    console.log(`Total Installments: ${installments.total_installments}`);
    console.log(`Paid: ${installments.paid_count} (${((installments.paid_count/installments.total_installments)*100).toFixed(2)}%)`);
    console.log(`Pending: ${installments.pending_count}`);
    console.log(`Overdue: ${installments.overdue_count}`);
    console.log(`Total Amount: ₹${installments.total_amount?.toLocaleString()}`);
    console.log(`Collected: ₹${installments.collected_amount?.toLocaleString()}`);
    console.log(`Pending: ₹${installments.pending_amount?.toLocaleString()}`);
    console.log(`Collection Rate: ${((installments.collected_amount/installments.total_amount)*100).toFixed(2)}%`);

    // Today's collections
    const today = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          COUNT(*) as today_emis,
          SUM(amount) as today_amount,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as today_paid,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as today_collected
        FROM installments 
        WHERE DATE(due_date) = CURDATE()
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    console.log('\n📅 Today\'s Collections:');
    console.log('='.repeat(80));
    console.log(`EMIs Due Today: ${today.today_emis}`);
    console.log(`Amount Due: ₹${today.today_amount?.toLocaleString()}`);
    console.log(`Paid Today: ${today.today_paid}`);
    console.log(`Collected Today: ₹${today.today_collected?.toLocaleString()}`);

    // Monthly summary
    const monthly = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          DATE_FORMAT(due_date, '%Y-%m') as month,
          COUNT(*) as month_emis,
          SUM(amount) as month_amount,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as month_paid,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as month_collected
        FROM installments 
        GROUP BY DATE_FORMAT(due_date, '%Y-%m')
        ORDER BY month DESC
        LIMIT 6
      `, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log('\n📊 Monthly Collection Summary:');
    console.log('='.repeat(80));
    monthly.forEach(m => {
      const rate = ((m.month_collected/m.month_amount)*100).toFixed(2);
      console.log(`${m.month}: ${m.month_emis} EMIs, ₹${m.month_amount?.toLocaleString()} due, ${rate}% collected`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    db.end();
  }
}

calculateRealCollections();