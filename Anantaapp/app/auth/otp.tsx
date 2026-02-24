import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, StatusBar, Dimensions, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const API_BASE = 'https://ecofuelglobal.com';

export default function OTPScreen() {
  const params = useLocalSearchParams();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 5) {
      Alert.alert('Error', 'Please enter the 5-digit OTP (12345)');
      return;
    }
    if (!phone) {
      Alert.alert('Error', 'Phone number missing, please go back and enter phone');
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE}/api/app/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const message = err?.message || 'Invalid OTP';
        Alert.alert('Error', message);
        return;
      }
      const data = await response.json();
      const userId = data.userId as string;
      const kycStatus = data.kycStatus as string;
      const hasProfile = !!data.hasProfile;

      if (userId) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.localStorage.setItem('userId', userId);
        } else {
          try {
            await SecureStore.setItemAsync('userId', userId);
          } catch {
          }
        }
      }

      if (kycStatus === 'APPROVED') {
        router.replace('/(tabs)');
        return;
      }

      if (kycStatus === 'REJECTED') {
        router.replace({ pathname: '/auth/kyc-rejected', params: { userId } });
        return;
      }

      if (hasProfile) {
        router.replace({ pathname: '/auth/kyc-review', params: { userId } });
      } else {
        router.replace({ pathname: '/auth/profile', params: { userId } });
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while verifying OTP');
    } finally {
      setSubmitting(false);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('@/assets/images/auth-bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(18,125,150,0.85)', 'rgba(10,93,117,0.9)', 'rgba(8,61,79,0.95)']}
          style={styles.overlay}
        >
          <View style={styles.backgroundShapes}>
            <View style={[styles.shape, styles.shape1]} />
            <View style={[styles.shape, styles.shape2]} />
            <View style={[styles.shape, styles.shape3]} />
          </View>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.content}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                  style={styles.backButtonGradient}
                >
                  <Ionicons name="arrow-back" size={24} color="white" />
                </LinearGradient>
              </TouchableOpacity>
              
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.2)']}
                  style={styles.logoCircle}
                >
                  <Ionicons name="diamond" size={50} color="white" />
                </LinearGradient>
                <ThemedText style={styles.title}>ANANTA</ThemedText>
                <ThemedText style={styles.description}>
                  Enter the OTP sent to{"\n"}+91 XXXXX XXXXX
                </ThemedText>
              </View>
              
              <View style={styles.otpContainer}>
                {[0,1,2,3,4].map((index) => (
                  <LinearGradient
                    key={index}
                    colors={['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
                    style={styles.otpInputGradient}
                  >
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={styles.otpInput}
                      maxLength={1}
                      keyboardType="numeric"
                      value={otp[index]}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      selectionColor="#127D96"
                    />
                  </LinearGradient>
                ))}
              </View>
              
              <TouchableOpacity 
                style={styles.verifyButtonContainer}
                onPress={handleVerify}
                disabled={submitting}
              >
                <LinearGradient
                  colors={['#127d96', '#15a3c7', '#1bb5d8']}
                  style={styles.verifyButton}
                >
                  <ThemedText style={styles.buttonText}>Verify OTP</ThemedText>
                  <Ionicons name="checkmark-circle" size={22} color="white" style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.resendContainer}>
                <ThemedText style={styles.resendText}>Didn't receive OTP? </ThemedText>
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.resendLinkContainer}
                >
                  <ThemedText style={styles.resendLink}>Resend</ThemedText>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  backgroundShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  shape: {
    position: 'absolute',
    borderRadius: 50,
    opacity: 0.08,
  },
  shape1: {
    width: 180,
    height: 180,
    backgroundColor: '#fff',
    top: -40,
    right: -40,
    borderRadius: 90,
  },
  shape2: {
    width: 120,
    height: 120,
    backgroundColor: '#fff',
    bottom: 150,
    left: -30,
    borderRadius: 60,
  },
  shape3: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    top: 200,
    left: 60,
    borderRadius: 50,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.02,
  },
  backButton: {
    position: 'absolute',
    top: height * 0.06,
    left: width * 0.05,
  },
  backButtonGradient: {
    padding: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logoCircle: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
  },
  title: {
    fontSize: width * 0.1,
    fontWeight: '700',
    color: 'white',
    letterSpacing: width * 0.025,
    marginBottom: height * 0.025,
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  description: {
    fontSize: width * 0.042,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: height * 0.02,
    fontFamily: 'Inter_400Regular',
    lineHeight: width * 0.065,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '85%',
    marginBottom: height * 0.04,
  },
  otpInputGradient: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: width * 0.055,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
    color: '#333',
    backgroundColor: 'transparent',
  },
  verifyButtonContainer: {
    width: '100%',
    marginBottom: height * 0.025,
  },
  verifyButton: {
    height: height * 0.07,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#127d96',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: width * 0.048,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  buttonIcon: {
    marginLeft: width * 0.03,
  },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: width * 0.038,
    fontFamily: 'Inter_400Regular',
  },
  resendLinkContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginLeft: 5,
  },
  resendLink: {
    color: 'white',
    fontSize: width * 0.038,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
});
