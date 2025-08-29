require('dotenv').config();
const CollectionCalculator = require('./collection-calculator');

async function testCollectionCalculations() {
  const calculator = new CollectionCalculator();
  
  console.log('🔍 Testing Collection Calculations...\n');

  try {
    // Test monthly collections
    console.log('📊 Monthly Collections:');
    const monthlyData = await calculator.calculateMonthlyCollections();
    console.log(`Found ${monthlyData.length} months of data`);
    if (monthlyData.length > 0) {
      console.log('Sample:', monthlyData[0]);
    }
    console.log('');

    // Test daily collections
    console.log('📅 Daily Collections (Last 7 days):');
    const dailyData = await calculator.calculateDailyCollections();
    console.log(`Found ${dailyData.length} days of data`);
    if (dailyData.length > 0) {
      console.log('Sample:', dailyData[0]);
    }
    console.log('');

    // Test branch-wise collections
    console.log('🏢 Branch-wise Collections:');
    const branchData = await calculator.calculateBranchWiseCollections();
    console.log(`Found ${branchData.length} branches`);
    if (branchData.length > 0) {
      console.log('Top performing branch:', branchData[0]);
    }
    console.log('');

    // Test overdue analysis
    console.log('⚠️ Overdue Analysis:');
    const overdueData = await calculator.calculateOverdueAnalysis();
    console.log(`Found ${overdueData.length} overdue buckets`);
    overdueData.forEach(bucket => {
      console.log(`${bucket.overdue_bucket}: ${bucket.count} EMIs, ₹${bucket.overdue_amount}`);
    });
    console.log('');

    // Test today's summary
    console.log('📈 Today\'s Summary:');
    const todayData = await calculator.getTodayCollectionSummary();
    console.log('Today\'s collection data:', todayData);
    console.log('');

    // Generate comprehensive report
    console.log('📋 Generating Comprehensive Report...');
    const report = await calculator.generateCollectionReport();
    console.log('Report generated successfully!');
    console.log('Report summary:', {
      monthlyRecords: report.monthlyCollections.length,
      dailyRecords: report.dailyCollections.length,
      branches: report.branchWiseCollections.length,
      overdueBuckets: report.overdueAnalysis.length,
      trendMonths: report.collectionTrends.length
    });

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  }

  process.exit(0);
}

// Run the test
testCollectionCalculations();