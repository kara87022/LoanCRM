import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Button, Card, Title, Paragraph, Text, ActivityIndicator, List } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { installmentsService } from '../services/api';

const CSVUploadScreen = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [uploadResult, setUploadResult] = useState(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        setFile(result);
        setUploadStatus(null);
        setUploadResult(null);
      }
    } catch (err) {
      console.error('Error picking document:', err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadCSV = async () => {
    if (!file) return;

    try {
      setLoading(true);
      setUploadStatus(null);
      setUploadResult(null);

      // Create form data
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'text/csv',
      });

      // Upload the file
      const response = await installmentsService.uploadCSV(formData);

      setUploadStatus('success');
      setUploadResult(response);
      Alert.alert('Success', 'CSV file uploaded successfully');
    } catch (err) {
      console.error('Error uploading CSV:', err);
      setUploadStatus('error');
      setUploadResult({
        error: err.response?.data?.message || 'Failed to upload CSV file',
      });
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload CSV file');
    } finally {
      setLoading(false);
    }
  };

  const renderUploadResult = () => {
    if (!uploadResult) return null;

    if (uploadStatus === 'success') {
      return (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title style={styles.successTitle}>Upload Successful</Title>
            <List.Section>
              <List.Item 
                title="Total Records" 
                description={uploadResult.totalRecords || 0}
                left={props => <List.Icon {...props} icon="file-document-outline" />}
              />
              <List.Item 
                title="Inserted Records" 
                description={uploadResult.inserted || 0}
                left={props => <List.Icon {...props} icon="plus-circle-outline" />}
              />
              <List.Item 
                title="Updated Records" 
                description={uploadResult.updated || 0}
                left={props => <List.Icon {...props} icon="update" />}
              />
            </List.Section>
          </Card.Content>
        </Card>
      );
    }

    if (uploadStatus === 'error') {
      return (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title style={styles.errorTitle}>Upload Failed</Title>
            <Paragraph style={styles.errorText}>{uploadResult.error}</Paragraph>
            {uploadResult.validationErrors && (
              <List.Section>
                <List.Subheader>Validation Errors</List.Subheader>
                {uploadResult.validationErrors.map((error, index) => (
                  <List.Item 
                    key={index}
                    title={`Row ${error.row || 'Unknown'}`}
                    description={error.message}
                    left={props => <List.Icon {...props} icon="alert-circle" color="#e74c3c" />}
                  />
                ))}
              </List.Section>
            )}
          </Card.Content>
        </Card>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>Upload Installments CSV</Title>
          <Paragraph style={styles.description}>
            Upload a CSV file containing installment data to update the system.
          </Paragraph>

          <View style={styles.fileSection}>
            <Title style={styles.sectionTitle}>File Format</Title>
            <Paragraph>
              The CSV file must include the following columns:
            </Paragraph>
            <View style={styles.columnList}>
              <Text style={styles.columnItem}>• loan_id (required)</Text>
              <Text style={styles.columnItem}>• installment_number (required)</Text>
              <Text style={styles.columnItem}>• due_date (required, YYYY-MM-DD format)</Text>
              <Text style={styles.columnItem}>• amount (required)</Text>
              <Text style={styles.columnItem}>• status (optional: pending, paid, bounced)</Text>
            </View>
          </View>

          <View style={styles.uploadSection}>
            <Button 
              mode="outlined" 
              onPress={pickDocument} 
              style={styles.pickButton}
              icon="file-upload-outline"
            >
              Select CSV File
            </Button>

            {file && (
              <View style={styles.fileInfo}>
                <Text style={styles.fileName}>Selected: {file.name}</Text>
                <Text style={styles.fileSize}>
                  Size: {(file.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}

            <Button 
              mode="contained" 
              onPress={uploadCSV} 
              style={styles.uploadButton}
              disabled={!file || loading}
              loading={loading}
            >
              {loading ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {renderUploadResult()}

      <Card style={styles.sampleCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Sample CSV Format</Title>
          <Paragraph style={styles.codeBlock}>
            loan_id,installment_number,due_date,amount,status{"\n"}
            1001,1,2023-06-01,5000,pending{"\n"}
            1001,2,2023-07-01,5000,pending{"\n"}
            1002,1,2023-06-15,7500,paid
          </Paragraph>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  description: {
    color: '#7f8c8d',
    marginBottom: 16,
  },
  fileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  columnList: {
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  columnItem: {
    marginBottom: 4,
    color: '#34495e',
  },
  uploadSection: {
    alignItems: 'center',
  },
  pickButton: {
    width: '100%',
    marginBottom: 16,
  },
  fileInfo: {
    width: '100%',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fileSize: {
    color: '#7f8c8d',
  },
  uploadButton: {
    width: '100%',
    backgroundColor: '#3498db',
  },
  resultCard: {
    marginBottom: 16,
  },
  successTitle: {
    color: '#27ae60',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#e74c3c',
    marginBottom: 8,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  sampleCard: {
    marginBottom: 16,
  },
  codeBlock: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    backgroundColor: '#ecf0f1',
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
  },
});

export default CSVUploadScreen;