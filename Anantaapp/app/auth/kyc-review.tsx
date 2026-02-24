import { StyleSheet, View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ENV } from '@/config/env';

export default function KycReviewScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    if (!userId) {
      router.replace('/auth/login');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/kyc-status/${userId}`);
      if (!res.ok) {
        throw new Error('Failed to check status');
      }
      const data = await res.json();
      const status = data.kycStatus as string;
      if (status === 'APPROVED') {
        router.replace('/(tabs)');
      } else if (status === 'REJECTED') {
        router.replace({ pathname: '/auth/kyc-rejected', params: { userId } });
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#127d96', '#15a3c7']}
        style={styles.card}
      >
        <Ionicons name="hourglass" size={60} color="white" style={{ marginBottom: 20 }} />
        <Text style={styles.title}>KYC Under Review</Text>
        <Text style={styles.message}>
          Your verification details have been submitted successfully. Admin will review and approve your KYC shortly.
        </Text>
        <TouchableOpacity style={styles.button} onPress={checkStatus} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Checking...' : 'Refresh Status'}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1f2a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: 'white',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#127d96',
  },
});
