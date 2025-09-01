import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator, Searchbar, Chip } from 'react-native-paper';
import { installmentsService } from '../services/api';

const CollectionsScreen = ({ navigation }) => {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'paid', 'bounced'

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await installmentsService.getDueInstallments();
      setInstallments(response);
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError('Failed to load installments. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInstallments();
  };

  const handleUpdatePayment = async (installmentId) => {
    // Navigate to payment update screen or show modal
    // For now, we'll just show an alert
    alert(`Update payment for installment ${installmentId}`);
  };

  const handleMarkBounced = async (installmentId) => {
    // Navigate to bounce reason screen or show modal
    // For now, we'll just show an alert
    alert(`Mark installment ${installmentId} as bounced`);
  };

  const onChangeSearch = (query) => setSearchQuery(query);

  const filteredInstallments = installments.filter(item => {
    // Apply search filter
    const matchesSearch = 
      item.loan_id.toString().includes(searchQuery) || 
      item.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply status filter
    let matchesFilter = true;
    if (filter === 'pending') {
      matchesFilter = item.status === 'pending';
    } else if (filter === 'paid') {
      matchesFilter = item.status === 'paid';
    } else if (filter === 'bounced') {
      matchesFilter = item.status === 'bounced';
    }
    
    return matchesSearch && matchesFilter;
  });

  const renderInstallmentItem = ({ item }) => {
    const statusColor = {
      pending: '#f39c12',
      paid: '#27ae60',
      bounced: '#e74c3c'
    };

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View>
              <Title style={styles.customerName}>{item.customer_name}</Title>
              <Paragraph style={styles.loanId}>Loan ID: {item.loan_id}</Paragraph>
            </View>
            <Chip 
              mode="outlined" 
              style={[styles.statusChip, { borderColor: statusColor[item.status] }]}
              textStyle={{ color: statusColor[item.status] }}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Chip>
          </View>
          
          <View style={styles.installmentDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>₹{item.amount.toLocaleString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailValue}>{new Date(item.due_date).toLocaleDateString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Installment #</Text>
              <Text style={styles.detailValue}>{item.installment_number}</Text>
            </View>
          </View>

          {item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                onPress={() => handleUpdatePayment(item.id)}
                style={[styles.actionButton, styles.payButton]}
                labelStyle={styles.buttonLabel}
              >
                Update Payment
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleMarkBounced(item.id)}
                style={[styles.actionButton, styles.bounceButton]}
                labelStyle={{ color: '#e74c3c' }}
              >
                Mark Bounced
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Collections</Title>
        <Searchbar
          placeholder="Search by loan ID or name"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterContainer}>
        <Chip 
          selected={filter === 'all'} 
          onPress={() => setFilter('all')} 
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip 
          selected={filter === 'pending'} 
          onPress={() => setFilter('pending')} 
          style={styles.filterChip}
        >
          Pending
        </Chip>
        <Chip 
          selected={filter === 'paid'} 
          onPress={() => setFilter('paid')} 
          style={styles.filterChip}
        >
          Paid
        </Chip>
        <Chip 
          selected={filter === 'bounced'} 
          onPress={() => setFilter('bounced')} 
          style={styles.filterChip}
        >
          Bounced
        </Chip>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading installments...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchInstallments} style={styles.retryButton}>
            Retry
          </Button>
        </View>
      ) : filteredInstallments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || filter !== 'all' 
              ? 'No installments match your search or filter criteria' 
              : 'No installments found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredInstallments}
          renderItem={renderInstallmentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <Button 
        mode="contained" 
        icon="upload" 
        onPress={() => navigation.navigate('CSV Upload')} 
        style={styles.uploadButton}
      >
        Upload CSV
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginHorizontal: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#7f8c8d',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    marginBottom: 4,
  },
  loanId: {
    color: '#7f8c8d',
  },
  statusChip: {
    height: 28,
  },
  installmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#7f8c8d',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  payButton: {
    backgroundColor: '#27ae60',
  },
  bounceButton: {
    borderColor: '#e74c3c',
  },
  buttonLabel: {
    fontSize: 12,
  },
  uploadButton: {
    margin: 16,
    backgroundColor: '#3498db',
  },
});

export default CollectionsScreen;