import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function Index() {
  return (
    <AuthProvider>
      <Redirect href="/login" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});