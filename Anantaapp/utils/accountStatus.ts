import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { ENV } from '@/config/env';

export const checkAccountStatus = async (): Promise<boolean> => {
  try {
    let userId: string | null = null;
    
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    } else {
      try {
        userId = await AsyncStorage.getItem('userId');
      } catch {
        userId = null;
      }
    }

    if (!userId) {
      return true; // No user logged in
    }

    const response = await fetch(`${ENV.API_BASE_URL}/api/app/check-account-status/${userId}`);
    
    if (!response.ok) {
      return true; // Error checking status, allow to continue
    }

    const data = await response.json();
    
    if (data.shouldLogout) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem('userId');
      } else {
        try {
          await AsyncStorage.removeItem('userId');
        } catch { }
      }

      // Show alert and redirect to login
      Alert.alert(
        'Account Status',
        data.message || 'Your account access has been restricted.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/auth/login');
            }
          }
        ],
        { cancelable: false }
      );
      
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking account status:', error);
    return true; // On error, allow to continue
  }
};

// Start periodic check (every 30 seconds)
let statusCheckInterval: NodeJS.Timeout | null = null;

export const startAccountStatusCheck = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
  }
  
  // Check immediately
  checkAccountStatus();
  
  // Then check every 30 seconds
  statusCheckInterval = setInterval(() => {
    checkAccountStatus();
  }, 30000);
};

export const stopAccountStatusCheck = () => {
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval);
    statusCheckInterval = null;
  }
};
