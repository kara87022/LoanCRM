import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, ActivityIndicator, Button, Searchbar, Chip, Dialog, Portal, TextInput } from 'react-native-paper';
import { collectionsService } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CollectionsScreen() {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await collectionsService.getInstallments();
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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  const openPaymentDialog = (installment) => {
    setSelectedInstallment(installment);
    setPaymentAmount(installment.amount_due.toString());
    setPaymentNote('');
    setPaymentDialogVisible(true);
  };

  const closePaymentDialog = () => {
    setPaymentDialogVisible(false);
    setSelectedInstallment(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handlePayment = async () => {
    if (!selectedInstallment || !paymentAmount) return;
    
    try {
      setProcessingPayment(true);
      await collectionsService.updatePayment(selectedInstallment.id, {
        amount_paid: parseFloat(paymentAmount),
        notes: paymentNote,
        status: 'paid'
      });
      
      // Update local state
      const updatedInstallments = installments.map(item => {
        if (item.id === selectedInstallment.id) {
          return {
            ...item,
            amount_paid: parseFloat(paymentAmount),
            status: 'paid',
            notes: paymentNote
          };
        }
        return item;
      });
      
      setInstallments(updatedInstallments);
      closePaymentDialog();
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleMarkAsBounced = async (installment) => {
    try {
      await collectionsService.updatePayment(installment.id, {
        status: 'bounced',
        notes: 'Marked as bounced via mobile app'
      });
      
      // Update local state
      const updatedInstallments = installments.map(item => {
        if (item.id === installment.id) {
          return {
            ...item,
            status: 'bounced',
            notes: 'Marked as bounced via mobile app'
          };
        }
        return item;
      });
      
      setInstallments(updatedInstallments);
    } catch (err) {
      console.error('Error marking as bounced:', err);
      setError('Failed to update status. Please try again.');
    }
  };

  const filteredInstallments = installments.filter(item => {
    // Apply status filter
    if (statusFilter !== 'all' && item.status !== statusFilter) {
      return false;
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        item.customer_name.toLowerCase().includes(query) ||
        item.loan_id.toLowerCase().includes(query) ||
        item.branch.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'overdue': return '#e74c3c';
      case 'bounced': return '#8e44ad';
      default: return '#7f8c8d';
    }
  };

  const renderInstallmentItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Title style={styles.customerName}>{item.customer_name}</Title>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + '20' }]}
            textStyle={{ color: getStatusColor(item.status) }}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Chip>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Loan ID:</Text>
          <Text style={styles.detailValue}>{item.loan_id}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Branch:</Text>
          <Text style={styles.detailValue}>{item.branch}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Due Date:</Text>
          <Text style={styles.detailValue}>{new Date(item.due_date).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Amount Due</Text>
            <Text style={styles.amountValue}>₹{item.amount_due.toLocaleString()}</Text>
          </View>
          
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>₹{item.amount_paid ? item.amount_paid.toLocaleString() : '0'}</Text>
          </View>
        </View>
        
        {item.notes && (
          <Paragraph style={styles.notes}>Note: {item.notes}</Paragraph>
        )}
        
        <View style={styles.actionButtons}>
          {(item.status === 'pending' || item.status === 'overdue') && (
            <>
              <Button 
                mode="contained" 
                onPress={() => openPaymentDialog(item)}
                style={[styles.actionButton, { backgroundColor: '#27ae60' }]}
              >
                Update Payment
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleMarkAsBounced(item)}
                style={styles.actionButton}
                textColor="#8e44ad"
              >
                Mark as Bounced
              </Button>
            </>
          )}
          
          {item.status === 'paid' && (
            <Button 
              mode="text" 
              icon="check-circle" 
              textColor="#27ae60"
              style={styles.actionButton}
              disabled
            >
              Payment Completed
            </Button>
          )}
          
          {item.status === 'bounced' && (
            <Button 
              mode="outlined" 
              onPress={() => openPaymentDialog(item)}
              style={styles.actionButton}
            >
              Update Payment
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading installments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Searchbar
          placeholder="Search by name, loan ID or branch"
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity onPress={() => handleStatusFilter('all')}>
              <Chip 
                selected={statusFilter === 'all'} 
                style={styles.filterChip}
                mode={statusFilter === 'all' ? 'flat' : 'outlined'}
              >
                All
              </Chip>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusFilter('pending')}>
              <Chip 
                selected={statusFilter === 'pending'} 
                style={styles.filterChip}
                mode={statusFilter === 'pending' ? 'flat' : 'outlined'}
              >
                Pending
              </Chip>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusFilter('paid')}>
              <Chip 
                selected={statusFilter === 'paid'} 
                style={styles.filterChip}
                mode={statusFilter === 'paid' ? 'flat' : 'outlined'}
              >
                Paid
              </Chip>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusFilter('overdue')}>
              <Chip 
                selected={statusFilter === 'overdue'} 
                style={styles.filterChip}
                mode={statusFilter === 'overdue' ? 'flat' : 'outlined'}
              >
                Overdue
              </Chip>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleStatusFilter('bounced')}>
              <Chip 
                selected={statusFilter === 'bounced'} 
                style={styles.filterChip}
                mode={statusFilter === 'bounced' ? 'flat' : 'outlined'}
              >
                Bounced
              </Chip>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button mode="contained" onPress={fetchInstallments} style={styles.retryButton}>
              Retry
            </Button>
          </View>
        )}
        
        {!error && filteredInstallments.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all' 
                ? 'No installments match your filters' 
                : 'No installments available'}
            </Text>
          </View>
        )}
        
        <FlatList
          data={filteredInstallments}
          renderItem={renderInstallmentItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        
        <Portal>
          <Dialog visible={paymentDialogVisible} onDismiss={closePaymentDialog}>
            <Dialog.Title>Update Payment</Dialog.Title>
            <Dialog.Content>
              {selectedInstallment && (
                <>
                  <Paragraph style={styles.dialogText}>
                    Customer: {selectedInstallment.customer_name}
                  </Paragraph>
                  <Paragraph style={styles.dialogText}>
                    Due Amount: ₹{selectedInstallment.amount_due.toLocaleString()}
                  </Paragraph>
                  <TextInput
                    label="Payment Amount"
                    value={paymentAmount}
                    onChangeText={setPaymentAmount}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.dialogInput}
                  />
                  <TextInput
                    label="Note (Optional)"
                    value={paymentNote}
                    onChangeText={setPaymentNote}
                    mode="outlined"
                    style={styles.dialogInput}
                    multiline
                  />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closePaymentDialog}>Cancel</Button>
              <Button 
                onPress={handlePayment} 
                loading={processingPayment}
                disabled={processingPayment || !paymentAmount}
              >
                Confirm
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    marginBottom: 8,
    color: '#7f8c8d',
    fontWeight: 'bold',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
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
    padding: 20,
    alignItems: 'center',
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
    paddingBottom: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 18,
    flex: 1,
  },
  statusChip: {
    height: 28,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    width: 80,
    color: '#7f8c8d',
  },
  detailValue: {
    flex: 1,
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#ecf0f1',
    borderRadius: 8,
    padding: 12,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    color: '#7f8c8d',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  notes: {
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  dialogText: {
    marginBottom: 8,
  },
  dialogInput: {
    marginBottom: 16,
  },
});