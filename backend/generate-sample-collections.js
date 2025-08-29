require('dotenv').config();
const mysql = require('mysql2');

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function generateSampleCollections() {
  console.log('🔄 Generating sample collection data...\n');

  try {
    // First, get all loans from loans_master
    const loans = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM loans_master WHERE date_of_disbursement IS NOT NULL ORDER BY date_of_disbursement', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    console.log(`📊 Found ${loans.length} loans to process`);

    let totalInstallments = 0;
    let processedLoans = 0;

    // Process loans in batches
    for (let i = 0; i < loans.length; i += 50) {
      const batch = loans.slice(i, i + 50);
      
      for (const loan of batch) {
        try {
          // Calculate installment details
          const loanAmount = parseFloat(loan.loan_amount) || 0;
          const repaymentAmount = parseFloat(loan.repayment_amount) || (loanAmount * 1.2); // 20% interest if not specified
          const totalInstallmentsCount = parseInt(loan.total_installments) || parseInt(loan.no_of_installment) || 14;
          const installmentAmount = Math.round(repaymentAmount / totalInstallmentsCount);
          
          if (loanAmount === 0 || !loan.date_of_disbursement) {
            continue;
          }

          // Generate installment schedule
          const installments = [];
          const disbursementDate = new Date(loan.date_of_disbursement);
          
          for (let installmentNum = 1; installmentNum <= totalInstallmentsCount; installmentNum++) {
            const dueDate = new Date(disbursementDate);
            dueDate.setDate(dueDate.getDate() + (installmentNum * 7)); // Weekly installments
            
            // Simulate payment status based on due date
            let status = 'Pending';
            const today = new Date();
            const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 0) {
              // Past due dates - simulate some payments
              const paymentProbability = Math.max(0.3, 0.9 - (daysDiff / 30)); // Higher probability for recent dates
              if (Math.random() < paymentProbability) {
                status = 'Paid';
              } else if (daysDiff > 7) {
                status = 'Overdue';
              }
            }
            
            installments.push([
              loan.loan_id,
              installmentNum,
              dueDate.toISOString().split('T')[0],
              installmentAmount,
              status
            ]);
          }

          // Insert installments for this loan
          if (installments.length > 0) {
            await new Promise((resolve, reject) => {
              const query = 'INSERT IGNORE INTO installments (loan_id, installment_number, due_date, amount, status) VALUES ?';
              db.query(query, [installments], (err, result) => {
                if (err) reject(err);
                else {
                  totalInstallments += result.affectedRows;
                  resolve(result);
                }
              });
            });
          }

          processedLoans++;
          
          // Progress indicator
          if (processedLoans % 100 === 0) {
            console.log(`✅ Processed ${processedLoans}/${loans.length} loans...`);
          }

        } catch (error) {
          console.error(`❌ Error processing loan ${loan.loan_id}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Sample collection data generation completed!`);
    console.log(`📈 Statistics:`);
    console.log(`   - Processed Loans: ${processedLoans}`);
    console.log(`   - Generated Installments: ${totalInstallments}`);

    // Generate some sample payment records for paid installments
    console.log('\n💰 Generating sample payment records...');
    
    const paidInstallments = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM installments WHERE status = "Paid" ORDER BY due_date DESC LIMIT 500', (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    let paymentRecords = 0;
    for (const installment of paidInstallments) {
      try {
        // Create payment record
        const paymentDate = new Date(installment.due_date);
        paymentDate.setDate(paymentDate.getDate() + Math.floor(Math.random() * 7)); // Payment within a week of due date
        
        await new Promise((resolve, reject) => {
          const query = 'INSERT IGNORE INTO payments (loan_id, amount, method, payment_date, remarks, recorded_by) VALUES (?, ?, ?, ?, ?, ?)';
          const values = [
            installment.loan_id,
            installment.amount,
            ['Cash', 'UPI', 'Bank Transfer'][Math.floor(Math.random() * 3)],
            paymentDate.toISOString().split('T')[0],
            'Sample payment record',
            'System Generated'
          ];
          
          db.query(query, values, (err, result) => {
            if (err) reject(err);
            else {
              if (result.affectedRows > 0) paymentRecords++;
              resolve(result);
            }
          });
        });
      } catch (error) {
        console.error(`❌ Error creating payment record:`, error.message);
      }
    }

    console.log(`💳 Generated ${paymentRecords} payment records`);

    // Display summary statistics
    const stats = await new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_installments,
          COUNT(CASE WHEN status = 'Paid' THEN 1 END) as paid_installments,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_installments,
          COUNT(CASE WHEN status = 'Overdue' THEN 1 END) as overdue_installments,
          SUM(amount) as total_amount,
          SUM(CASE WHEN status = 'Paid' THEN amount ELSE 0 END) as collected_amount,
          SUM(CASE WHEN status != 'Paid' THEN amount ELSE 0 END) as pending_amount
        FROM installments
      `;
      
      db.query(query, (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    console.log(`\n📊 Collection Summary:`);
    console.log(`   - Total Installments: ${stats.total_installments}`);
    console.log(`   - Paid: ${stats.paid_installments} (${((stats.paid_installments / stats.total_installments) * 100).toFixed(2)}%)`);
    console.log(`   - Pending: ${stats.pending_installments}`);
    console.log(`   - Overdue: ${stats.overdue_installments}`);
    console.log(`   - Total Amount: ₹${stats.total_amount?.toLocaleString()}`);
    console.log(`   - Collected: ₹${stats.collected_amount?.toLocaleString()}`);
    console.log(`   - Pending: ₹${stats.pending_amount?.toLocaleString()}`);
    console.log(`   - Collection Rate: ${((stats.collected_amount / stats.total_amount) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error generating sample collections:', error.message);
  } finally {
    db.end();
  }
}

// Run the generation
generateSampleCollections();