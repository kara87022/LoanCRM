const express = require('express');
const router = express.Router();
const CollectionCalculator = require('../collection-calculator');
const { authenticateToken } = require('../middleware/auth');

const calculator = new CollectionCalculator();

// Get monthly collection summary
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const monthlyCollections = await calculator.calculateMonthlyCollections();
    res.json({
      success: true,
      data: monthlyCollections,
      message: 'Monthly collection data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching monthly collections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get daily collection summary
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dailyCollections = await calculator.calculateDailyCollections(startDate, endDate);
    res.json({
      success: true,
      data: dailyCollections,
      message: 'Daily collection data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching daily collections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get branch-wise collection performance
router.get('/branch-wise', authenticateToken, async (req, res) => {
  try {
    const branchWiseCollections = await calculator.calculateBranchWiseCollections();
    res.json({
      success: true,
      data: branchWiseCollections,
      message: 'Branch-wise collection data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching branch-wise collections:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get overdue analysis
router.get('/overdue-analysis', authenticateToken, async (req, res) => {
  try {
    const overdueAnalysis = await calculator.calculateOverdueAnalysis();
    res.json({
      success: true,
      data: overdueAnalysis,
      message: 'Overdue analysis retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching overdue analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get collection trends
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const collectionTrends = await calculator.calculateCollectionTrends();
    res.json({
      success: true,
      data: collectionTrends,
      message: 'Collection trends retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching collection trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get today's collection summary
router.get('/today', authenticateToken, async (req, res) => {
  try {
    const todaySummary = await calculator.getTodayCollectionSummary();
    res.json({
      success: true,
      data: todaySummary,
      message: 'Today\'s collection summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching today\'s summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Generate comprehensive collection report
router.get('/report', authenticateToken, async (req, res) => {
  try {
    const report = await calculator.generateCollectionReport();
    res.json({
      success: true,
      data: report,
      message: 'Collection report generated successfully'
    });
  } catch (error) {
    console.error('Error generating collection report:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;