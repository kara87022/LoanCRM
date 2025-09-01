import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, ActivityIndicator, Button } from 'react-native-paper';
import { collectionsService } from '../services/api';

const DashboardScreen = ({ navigation }) => {
  const [monthlyData, setMonthlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data in parallel
      const [monthlyResponse, dailyResponse, branchResponse, overdueResponse] = await Promise.all([
        collectionsService.getMonthlyCollection(),
        collectionsService.getDailyCollection(),
        collectionsService.getBranchPerformance(),
        collectionsService.getOverdueAnalysis()
      ]);
      
      setMonthlyData(monthlyResponse);
      setDailyData(dailyResponse);
      setBranchData(branchResponse);
      setOverdueData(overdueResponse);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchDashboardData} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Collections Dashboard</Title>
        <Paragraph style={styles.headerSubtitle}>Overview of collection performance</Paragraph>
      </View>

      {/* Monthly Collection Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Monthly Collection</Title>
          {monthlyData ? (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Target</Paragraph>
                <Text style={styles.statValue}>₹{monthlyData.target.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Collected</Paragraph>
                <Text style={[styles.statValue, { color: '#27ae60' }]}>₹{monthlyData.collected.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Achievement</Paragraph>
                <Text style={[styles.statValue, { color: monthlyData.achievement >= 100 ? '#27ae60' : '#e74c3c' }]}>
                  {monthlyData.achievement}%
                </Text>
              </View>
            </View>
          ) : (
            <Paragraph>No data available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Daily Collection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Today's Collection</Title>
          {dailyData ? (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Target</Paragraph>
                <Text style={styles.statValue}>₹{dailyData.target.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Collected</Paragraph>
                <Text style={[styles.statValue, { color: '#27ae60' }]}>₹{dailyData.collected.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Paragraph style={styles.statLabel}>Pending</Paragraph>
                <Text style={[styles.statValue, { color: '#e74c3c' }]}>₹{dailyData.pending.toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            <Paragraph>No data available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Branch Performance */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Branch Performance</Title>
          {branchData && branchData.length > 0 ? (
            branchData.map((branch, index) => (
              <View key={index} style={styles.branchItem}>
                <Text style={styles.branchName}>{branch.name}</Text>
                <View style={styles.branchStats}>
                  <Text style={styles.branchTarget}>Target: ₹{branch.target.toLocaleString()}</Text>
                  <Text style={styles.branchAchievement}>
                    {branch.achievement}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[styles.progressBar, { width: `${Math.min(branch.achievement, 100)}%` }]}
                  />
                </View>
              </View>
            ))
          ) : (
            <Paragraph>No branch data available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* Overdue Analysis */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Overdue Analysis</Title>
          {overdueData ? (
            <View style={styles.overdueContainer}>
              <View style={styles.overdueItem}>
                <Text style={styles.overdueLabel}>1-30 Days</Text>
                <Text style={[styles.overdueValue, { color: '#f39c12' }]}>₹{overdueData.days30.toLocaleString()}</Text>
              </View>
              <View style={styles.overdueItem}>
                <Text style={styles.overdueLabel}>31-60 Days</Text>
                <Text style={[styles.overdueValue, { color: '#e67e22' }]}>₹{overdueData.days60.toLocaleString()}</Text>
              </View>
              <View style={styles.overdueItem}>
                <Text style={styles.overdueLabel}>61-90 Days</Text>
                <Text style={[styles.overdueValue, { color: '#d35400' }]}>₹{overdueData.days90.toLocaleString()}</Text>
              </View>
              <View style={styles.overdueItem}>
                <Text style={styles.overdueLabel}>90+ Days</Text>
                <Text style={[styles.overdueValue, { color: '#c0392b' }]}>₹{overdueData.days90plus.toLocaleString()}</Text>
              </View>
            </View>
          ) : (
            <Paragraph>No overdue data available</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* View Collections Button */}
      <Button 
        mode="contained" 
        onPress={() => navigation.navigate('Collections')} 
        style={styles.viewCollectionsButton}
      >
        View Collections
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    width: 120,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  headerSubtitle: {
    color: '#7f8c8d',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: '#2c3e50',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  branchItem: {
    marginBottom: 16,
  },
  branchName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  branchStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  branchTarget: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  branchAchievement: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#ecf0f1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3498db',
  },
  overdueContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  overdueItem: {
    width: '48%',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  overdueLabel: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  overdueValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewCollectionsButton: {
    marginVertical: 16,
  },
});

export default DashboardScreen;