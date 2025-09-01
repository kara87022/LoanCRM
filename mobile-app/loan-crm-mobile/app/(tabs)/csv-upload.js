import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Button, Card, Title, Paragraph, Text, ActivityIndicator, List, Divider } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { installmentsService } from '../../services/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CSVUploadScreen() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      setSelectedFile(result.assets[0]);
      setUploadResult(null);
      setError(null);
    } catch (err) {
      console.error('Error picking document:', err);
      setError('Failed to select document. Please try again.');
    }
  };

  const uploadCSV = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setError(null);
      setUploadResult(null);

      // Read the file content
      const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri);
      
      // Upload to API
      const response = await installmentsService.uploadCSV(fileContent);
      
      setUploadResult(response);
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setError(err.response?.data?.message || 'Failed to upload CSV. Please check the file format and try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderUploadResult = () => {
    if (!uploadResult) return null;

    return (
      <Card style={styles.resultCard}>
        <Card.Content>
          <Title style={styles.resultTitle}>Upload Successful</Title>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Records Processed:</Text>
            <Text style={styles.resultValue}>{uploadResult.total_records}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Records Added:</Text>
            <Text style={styles.resultValue}>{uploadResult.records_added}</Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Records Updated:</Text>
            <Text style={styles.resultValue}>{uploadResult.records_updated}</Text>
          </View>
          {uploadResult.errors && uploadResult.errors.length > 0 && (
            <>
              <Divider style={styles.divider} />
              <Title style={styles.errorTitle}>Errors</Title>
              {uploadResult.errors.map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Text style={styles.errorRow}>Row {error.row}: {error.message}</Text>
                </View>
              ))}
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Card style={styles.errorCard}>
        <Card.Content>
          <Title style={styles.errorCardTitle}>Upload Failed</Title>
          <Paragraph style={styles.errorCardText}>{error}</Paragraph>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>Upload Installments CSV</Title>
            <Paragraph style={styles.description}>
              Upload a CSV file containing installment data. The file should follow the required format.
            </Paragraph>
            
            <Button 
              mode="contained" 
              onPress={pickDocument} 
              style={styles.pickButton}
              icon="file-upload"
            >
              Select CSV File
            </Button>
            
            {selectedFile && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileInfoTitle}>Selected File:</Text>
                <Text style={styles.fileName}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{(selectedFile.size / 1024).toFixed(2)} KB</Text>
                
                <Button 
                  mode="contained" 
                  onPress={uploadCSV} 
                  style={styles.uploadButton}
                  loading={uploading}
                  disabled={uploading}
                >
                  Upload File
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
        
        {renderError()}
        {renderUploadResult()}
        
        <Card style={styles.formatCard}>
          <Card.Content>
            <Title style={styles.formatTitle}>CSV Format Guide</Title>
            <Paragraph style={styles.formatDescription}>
              Your CSV file should include the following columns in order:
            </Paragraph>
            
            <List.Section>
              <List.Item 
                title="loan_id" 
                description="Unique identifier for the loan"
                left={props => <List.Icon {...props} icon="identifier" />}
              />
              <List.Item 
                title="customer_name" 
                description="Full name of the customer"
                left={props => <List.Icon {...props} icon="account" />}
              />
              <List.Item 
                title="branch" 
                description="Branch name"
                left={props => <List.Icon {...props} icon="office-building" />}
              />
              <List.Item 
                title="amount_due" 
                description="Amount due for this installment"
                left={props => <List.Icon {...props} icon="currency-inr" />}
              />
              <List.Item 
                title="due_date" 
                description="Due date in YYYY-MM-DD format"
                left={props => <List.Icon {...props} icon="calendar" />}
              />
              <List.Item 
                title="status" 
                description="Status: pending, paid, overdue, or bounced"
                left={props => <List.Icon {...props} icon="information" />}
              />
            </List.Section>
            
            <Paragraph style={styles.sampleHeader}>Sample CSV:</Paragraph>
            <View style={styles.sampleContainer}>
              <Text style={styles.sampleText}>
                loan_id,customer_name,branch,amount_due,due_date,status{"\n"}
                L001,John Doe,Main Branch,5000,2023-06-15,pending{"\n"}
                L002,Jane Smith,North Branch,7500,2023-06-20,paid
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
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
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  description: {
    marginBottom: 16,
    color: '#7f8c8d',
  },
  pickButton: {
    marginBottom: 16,
  },
  fileInfo: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  fileInfoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    marginBottom: 4,
  },
  fileSize: {
    color: '#7f8c8d',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#fdeded',
    elevation: 2,
  },
  errorCardTitle: {
    color: '#e74c3c',
  },
  errorCardText: {
    color: '#c0392b',
  },
  resultCard: {
    marginBottom: 16,
    backgroundColor: '#edfff5',
    elevation: 2,
  },
  resultTitle: {
    color: '#27ae60',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    color: '#2c3e50',
  },
  resultValue: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  errorTitle: {
    color: '#e74c3c',
    fontSize: 18,
    marginBottom: 8,
  },
  errorItem: {
    backgroundColor: '#fdeded',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  errorRow: {
    color: '#c0392b',
  },
  formatCard: {
    marginBottom: 16,
    elevation: 2,
  },
  formatTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  formatDescription: {
    marginBottom: 16,
    color: '#7f8c8d',
  },
  sampleHeader: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  sampleContainer: {
    backgroundColor: '#ecf0f1',
    padding: 16,
    borderRadius: 8,
  },
  sampleText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
});