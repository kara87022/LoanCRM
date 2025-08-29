const fs = require('fs');
const csv = require('csv-parser');

class DataAnalyzer {
  constructor() {
    this.loans = [];
    this.monthlyStats = {};
    this.dailyStats = {};
    this.branchStats = {};
  }

  // Parse CSV data
  async parseCSVData(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // Parse and clean the data
          const loan = {
            loan_id: data['LOAN ID'],
            branch: data['BRANCH'],
            sourced_by: data['SOURCED BY'],
            customer_name: data['CUSTOMER NAME'],
            loan_amount: parseInt(data['LOAN AMOUNT']) || 0,
            processing_fee: parseInt(data['PF']) || 0,
            gst: parseInt(data['GST']) || 0,
            net_disbursement: parseInt(data['NET DISBURSEMENT']) || 0,
            repayment_amount: parseInt(data['REPAYMENT AMOUNT']) || 0,
            interest_earned: parseInt(data['INTEREST EARNED']) || 0,
            date_of_disbursement: this.parseDate(data['DATE OF DISBURSEMENT']),
            no_of_installments: parseInt(data['NO OF INSTALLMENT']) || 14,
            installment_amount: parseInt(data['INSTALLMENT AMOUNT']) || 0
          };
          
          if (loan.loan_id && loan.date_of_disbursement) {
            results.push(loan);
          }
        })
        .on('end', () => {
          this.loans = results;
          resolve(results);
        })
        .on('error', reject);
    });
  }

  // Parse date from DD/MM/YYYY format
  parseDate(dateStr) {
    if (!dateStr) return null;
    
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    return null;
  }

  // Calculate monthly disbursement statistics
  calculateMonthlyStats() {
    this.monthlyStats = {};
    
    this.loans.forEach(loan => {
      if (!loan.date_of_disbursement) return;
      
      const date = new Date(loan.date_of_disbursement);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!this.monthlyStats[monthKey]) {
        this.monthlyStats[monthKey] = {
          month: monthKey,
          month_name: monthName,
          total_loans: 0,
          total_amount: 0,
          total_disbursement: 0,
          total_repayment: 0,
          total_interest: 0,
          avg_loan_amount: 0,
          avg_installment: 0,
          branches: new Set()
        };
      }
      
      const stats = this.monthlyStats[monthKey];
      stats.total_loans++;
      stats.total_amount += loan.loan_amount;
      stats.total_disbursement += loan.net_disbursement;
      stats.total_repayment += loan.repayment_amount;
      stats.total_interest += loan.interest_earned;
      stats.branches.add(loan.branch);
    });
    
    // Calculate averages
    Object.values(this.monthlyStats).forEach(stats => {
      stats.avg_loan_amount = Math.round(stats.total_amount / stats.total_loans);
      stats.avg_installment = Math.round(stats.total_repayment / (stats.total_loans * 14)); // Assuming 14 installments
      stats.branch_count = stats.branches.size;
      delete stats.branches; // Remove Set object for JSON serialization
    });
    
    return Object.values(this.monthlyStats).sort((a, b) => b.month.localeCompare(a.month));
  }

  // Calculate daily disbursement statistics
  calculateDailyStats() {
    this.dailyStats = {};
    
    this.loans.forEach(loan => {
      if (!loan.date_of_disbursement) return;
      
      const dateKey = loan.date_of_disbursement;
      const date = new Date(dateKey);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateFormatted = date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!this.dailyStats[dateKey]) {
        this.dailyStats[dateKey] = {
          date: dateKey,
          date_formatted: dateFormatted,
          day_name: dayName,
          total_loans: 0,
          total_amount: 0,
          total_disbursement: 0,
          total_repayment: 0,
          branches: new Set()
        };
      }
      
      const stats = this.dailyStats[dateKey];
      stats.total_loans++;
      stats.total_amount += loan.loan_amount;
      stats.total_disbursement += loan.net_disbursement;
      stats.total_repayment += loan.repayment_amount;
      stats.branches.add(loan.branch);
    });
    
    // Clean up and sort
    Object.values(this.dailyStats).forEach(stats => {
      stats.branch_count = stats.branches.size;
      delete stats.branches;
    });
    
    return Object.values(this.dailyStats).sort((a, b) => b.date.localeCompare(a.date));
  }

  // Calculate branch-wise statistics
  calculateBranchStats() {
    this.branchStats = {};
    
    this.loans.forEach(loan => {
      const branch = loan.branch || 'Unknown';
      
      if (!this.branchStats[branch]) {
        this.branchStats[branch] = {
          branch: branch,
          total_loans: 0,
          total_amount: 0,
          total_disbursement: 0,
          total_repayment: 0,
          total_interest: 0,
          avg_loan_amount: 0,
          first_disbursement: null,
          last_disbursement: null
        };
      }
      
      const stats = this.branchStats[branch];
      stats.total_loans++;
      stats.total_amount += loan.loan_amount;
      stats.total_disbursement += loan.net_disbursement;
      stats.total_repayment += loan.repayment_amount;
      stats.total_interest += loan.interest_earned;
      
      // Track date range
      if (!stats.first_disbursement || loan.date_of_disbursement < stats.first_disbursement) {
        stats.first_disbursement = loan.date_of_disbursement;
      }
      if (!stats.last_disbursement || loan.date_of_disbursement > stats.last_disbursement) {
        stats.last_disbursement = loan.date_of_disbursement;
      }
    });
    
    // Calculate averages and sort by total amount
    return Object.values(this.branchStats)
      .map(stats => ({
        ...stats,
        avg_loan_amount: Math.round(stats.total_amount / stats.total_loans)
      }))
      .sort((a, b) => b.total_amount - a.total_amount);
  }

  // Calculate collection projections based on disbursement data
  calculateCollectionProjections() {
    const projections = {};
    
    this.loans.forEach(loan => {
      if (!loan.date_of_disbursement || !loan.no_of_installments) return;
      
      const disbursementDate = new Date(loan.date_of_disbursement);
      const installmentAmount = loan.installment_amount || Math.round(loan.repayment_amount / loan.no_of_installments);
      
      // Generate EMI schedule (assuming weekly installments)
      for (let i = 1; i <= loan.no_of_installments; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setDate(dueDate.getDate() + (i * 7)); // Weekly installments
        
        const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = dueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!projections[monthKey]) {
          projections[monthKey] = {
            month: monthKey,
            month_name: monthName,
            total_emis: 0,
            unique_loans: new Set(),
            total_demand: 0
          };
        }
        
        projections[monthKey].total_emis++;
        projections[monthKey].unique_loans.add(loan.loan_id);
        projections[monthKey].total_demand += installmentAmount;
      }
    });
    
    // Convert and sort
    return Object.values(projections)
      .map(proj => ({
        ...proj,
        unique_loans: proj.unique_loans.size
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // Generate comprehensive analysis report
  generateReport() {
    const monthlyStats = this.calculateMonthlyStats();
    const dailyStats = this.calculateDailyStats();
    const branchStats = this.calculateBranchStats();
    const collectionProjections = this.calculateCollectionProjections();
    
    // Overall statistics
    const totalLoans = this.loans.length;
    const totalAmount = this.loans.reduce((sum, loan) => sum + loan.loan_amount, 0);
    const totalDisbursement = this.loans.reduce((sum, loan) => sum + loan.net_disbursement, 0);
    const totalRepayment = this.loans.reduce((sum, loan) => sum + loan.repayment_amount, 0);
    const totalInterest = this.loans.reduce((sum, loan) => sum + loan.interest_earned, 0);
    const avgLoanAmount = Math.round(totalAmount / totalLoans);
    const avgROI = ((totalRepayment - totalAmount) / totalAmount * 100).toFixed(2);
    
    const uniqueBranches = [...new Set(this.loans.map(loan => loan.branch))];
    const dateRange = {
      start: Math.min(...this.loans.map(loan => new Date(loan.date_of_disbursement))),
      end: Math.max(...this.loans.map(loan => new Date(loan.date_of_disbursement)))
    };
    
    return {
      summary: {
        total_loans: totalLoans,
        total_amount: totalAmount,
        total_disbursement: totalDisbursement,
        total_repayment: totalRepayment,
        total_interest: totalInterest,
        avg_loan_amount: avgLoanAmount,
        avg_roi: parseFloat(avgROI),
        unique_branches: uniqueBranches.length,
        branches: uniqueBranches,
        date_range: {
          start: new Date(dateRange.start).toISOString().split('T')[0],
          end: new Date(dateRange.end).toISOString().split('T')[0]
        },
        analysis_date: new Date().toISOString()
      },
      monthly_disbursements: monthlyStats,
      daily_disbursements: dailyStats.slice(0, 30), // Last 30 days
      branch_performance: branchStats,
      collection_projections: collectionProjections
    };
  }
}

// Main execution
async function analyzeData() {
  const analyzer = new DataAnalyzer();
  const csvPath = 'c:\\Users\\DELL\\OneDrive\\Desktop\\Loan CRM\\DATA\\Disbursement.xlsx.csv';
  
  console.log('📊 Starting Data Analysis...\n');
  
  try {
    // Parse CSV data
    console.log('📁 Reading CSV file...');
    await analyzer.parseCSVData(csvPath);
    console.log(`✅ Loaded ${analyzer.loans.length} loan records\n`);
    
    // Generate comprehensive report
    console.log('🔍 Generating analysis report...');
    const report = analyzer.generateReport();
    
    // Display summary
    console.log('📋 ANALYSIS SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Loans: ${report.summary.total_loans.toLocaleString()}`);
    console.log(`Total Loan Amount: ₹${report.summary.total_amount.toLocaleString()}`);
    console.log(`Total Disbursement: ₹${report.summary.total_disbursement.toLocaleString()}`);
    console.log(`Total Repayment Expected: ₹${report.summary.total_repayment.toLocaleString()}`);
    console.log(`Total Interest: ₹${report.summary.total_interest.toLocaleString()}`);
    console.log(`Average Loan Amount: ₹${report.summary.avg_loan_amount.toLocaleString()}`);
    console.log(`Average ROI: ${report.summary.avg_roi}%`);
    console.log(`Unique Branches: ${report.summary.unique_branches}`);
    console.log(`Date Range: ${report.summary.date_range.start} to ${report.summary.date_range.end}\n`);
    
    // Monthly breakdown
    console.log('📅 MONTHLY DISBURSEMENT BREAKDOWN:');
    console.log('='.repeat(50));
    report.monthly_disbursements.forEach(month => {
      console.log(`${month.month_name}: ${month.total_loans} loans, ₹${month.total_amount.toLocaleString()}`);
    });
    console.log('');
    
    // Top branches
    console.log('🏢 TOP PERFORMING BRANCHES:');
    console.log('='.repeat(50));
    report.branch_performance.slice(0, 10).forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.branch}: ${branch.total_loans} loans, ₹${branch.total_amount.toLocaleString()}`);
    });
    console.log('');
    
    // Collection projections
    console.log('💰 COLLECTION PROJECTIONS (Next 6 months):');
    console.log('='.repeat(50));
    report.collection_projections.slice(0, 6).forEach(proj => {
      console.log(`${proj.month_name}: ${proj.total_emis} EMIs, ₹${proj.total_demand.toLocaleString()} expected`);
    });
    
    // Save report to file
    const reportPath = 'c:\\Users\\DELL\\OneDrive\\Desktop\\Loan CRM\\analysis-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Full report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  }
}

// Run analysis if called directly
if (require.main === module) {
  analyzeData();
}

module.exports = DataAnalyzer;