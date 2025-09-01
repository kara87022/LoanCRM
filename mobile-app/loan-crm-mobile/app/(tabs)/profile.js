import React, { useContext } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Text, Avatar, Button, List, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => logout(),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleFeatureNotAvailable = () => {
    Alert.alert(
      'Coming Soon',
      'This feature will be available in a future update.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* User Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={80} 
              label={user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'} 
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Title style={styles.userName}>{user?.name || 'User'}</Title>
              <Paragraph style={styles.userEmail}>{user?.email || 'user@example.com'}</Paragraph>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{user?.role || 'Staff'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Account Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Account Settings</Title>
            <List.Section>
              <List.Item
                title="Edit Profile"
                description="Update your personal information"
                left={props => <List.Icon {...props} icon="account-edit" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleFeatureNotAvailable}
              />
              <Divider />
              <List.Item
                title="Change Password"
                description="Update your security credentials"
                left={props => <List.Icon {...props} icon="lock-reset" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleFeatureNotAvailable}
              />
              <Divider />
              <List.Item
                title="Notification Settings"
                description="Manage your notification preferences"
                left={props => <List.Icon {...props} icon="bell-outline" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleFeatureNotAvailable}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* App Settings */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>App Settings</Title>
            <List.Section>
              <List.Item
                title="Language"
                description="Change app language"
                left={props => <List.Icon {...props} icon="translate" />}
                right={() => <Text style={styles.settingValue}>English</Text>}
                onPress={handleFeatureNotAvailable}
              />
              <Divider />
              <List.Item
                title="Theme"
                description="Change app appearance"
                left={props => <List.Icon {...props} icon="theme-light-dark" />}
                right={() => <Text style={styles.settingValue}>Light</Text>}
                onPress={handleFeatureNotAvailable}
              />
              <Divider />
              <List.Item
                title="About"
                description="App information and version"
                left={props => <List.Icon {...props} icon="information-outline" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleFeatureNotAvailable}
              />
            </List.Section>
          </Card.Content>
        </Card>

        {/* Logout Button */}
        <Button 
          mode="contained" 
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor="#e74c3c"
        >
          Logout
        </Button>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Loan CRM Mobile v1.0.0</Text>
        </View>
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
  profileCard: {
    marginBottom: 16,
    elevation: 2,
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#3498db',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#7f8c8d',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#3498db20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#3498db',
    fontWeight: '500',
  },
  sectionCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  settingValue: {
    color: '#7f8c8d',
    marginRight: 8,
  },
  logoutButton: {
    marginBottom: 24,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  versionText: {
    color: '#7f8c8d',
    fontSize: 12,
  },
});