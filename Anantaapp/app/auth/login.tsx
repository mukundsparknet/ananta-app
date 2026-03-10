import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Inter_400Regular, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { GoogleAuthService } from '../../services/GoogleAuthService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_700Bold,
  });

  // Handle Google OAuth callback on page load
  useEffect(() => {
    const handleGoogleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && !isLoading) {
        setIsLoading(true);
        try {
          const googleUser = await GoogleAuthService.signIn();
          const authResult = await GoogleAuthService.authenticateWithBackend(googleUser);
          
          await AsyncStorage.setItem('userId', authResult.userId);
          await AsyncStorage.setItem('userEmail', authResult.email);
          
          if (authResult.redirectTo === 'home') {
            router.replace('/(tabs)');
          } else {
            router.replace({ 
              pathname: '/auth/profile', 
              params: { 
                userId: authResult.userId,
                email: authResult.email 
              } 
            });
          }
        } catch (error: any) {
          Alert.alert('Google Sign In Failed', error.message || 'Something went wrong');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    if (Platform.OS === 'web') {
      handleGoogleCallback();
    }
  }, []);

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Sign in with Google
      const googleUser = await GoogleAuthService.signIn();
      
      // Authenticate with backend
      const authResult = await GoogleAuthService.authenticateWithBackend(googleUser);
      
      // Store user data
      await AsyncStorage.setItem('userId', authResult.userId);
      await AsyncStorage.setItem('userEmail', authResult.email);
      
      // Navigate based on backend response
      if (authResult.redirectTo === 'home') {
        Alert.alert('Welcome Back!', 'Signed in successfully!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        // New user - redirect to profile setup
        router.replace({ 
          pathname: '/auth/profile', 
          params: { 
            userId: authResult.userId,
            email: authResult.email 
          } 
        });
      }
    } catch (error: any) {
      Alert.alert('Google Sign In Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetOtp = () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    router.push({ pathname: '/auth/otp', params: { phone: phone.trim() } });
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
          colors={['rgba(18,125,150,0.8)', 'rgba(10,93,117,0.9)', 'rgba(8,61,79,0.95)']}
          style={styles.overlay}
        >
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.content}>
                <View style={styles.logoContainer}>
                  <LinearGradient
                    colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.15)']}
                    style={styles.logoCircle}
                  >
                    <Ionicons name="diamond" size={50} color="white" />
                  </LinearGradient>
                  <ThemedText style={styles.title}>ANANTA</ThemedText>
                  <ThemedText style={styles.subtitle}>Welcome Back!</ThemedText>
                  <ThemedText style={styles.description}>
                    Sign in to continue your journey
                  </ThemedText>
                </View>
                
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                      style={styles.inputGradient}
                    >
                      <Ionicons name="call-outline" size={22} color="#127d96" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your phone number"
                        placeholderTextColor="#888"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </LinearGradient>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.otpButtonContainer}
                    onPress={handleGetOtp}
                  >
                    <LinearGradient
                      colors={['#127d96', '#15a3c7', '#1bb5d8']}
                      style={styles.otpButton}
                    >
                      <ThemedText style={styles.buttonText}>Get OTP</ThemedText>
                      <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <View style={styles.dividerContainer}>
                    <View style={styles.dividerLine} />
                    <View style={styles.orContainer}>
                      <ThemedText style={styles.orText}>OR</ThemedText>
                    </View>
                    <View style={styles.dividerLine} />
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.googleButton, { opacity: isLoading ? 0.7 : 1 }]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.9)']}
                      style={styles.googleGradient}
                    >
                      {isLoading ? (
                        <>
                          <View style={styles.loadingSpinner} />
                          <ThemedText style={styles.googleText}>Signing in...</ThemedText>
                        </>
                      ) : (
                        <>
                          <Image 
                            source={require('@/assets/images/Google-icon.png')}
                            style={styles.googleIcon}
                          />
                          <ThemedText style={styles.googleText}>Continue with Google</ThemedText>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: height,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: width * 0.1,
    fontWeight: '700',
    color: 'white',
    letterSpacing: width * 0.025,
    marginBottom: 8,
    fontFamily: 'Inter_700Bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.95)',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  inputIcon: {
    marginRight: 15,
  },
  input: {
    flex: 1,
    height: height * 0.07,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  otpButtonContainer: {
    marginBottom: 35,
  },
  otpButton: {
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
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  orContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 15,
  },
  orText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_700Bold',
  },
  googleButton: {
    width: '100%',
  },
  googleGradient: {
    height: height * 0.07,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  googleIcon: {
    width: 26,
    height: 26,
    marginRight: 15,
  },
  googleText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_700Bold',
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    borderTopColor: 'transparent',
    marginRight: 15,
  },
});
