import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator, ImageBackground, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { ThemedText } from '@/components/themed-text';
import AnantaLogo from '@/components/AnantaLogo';

const { width, height } = Dimensions.get('window');

export default function Index() {
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const userId = window.localStorage.getItem('userId');
        setTarget(userId ? '/(tabs)' : '/auth/login');
        return;
      }
      try {
        const userId = await SecureStore.getItemAsync('userId');
        setTarget(userId ? '/(tabs)' : '/auth/login');
      } catch {
        setTarget('/auth/login');
      }
    };
    init();
  }, []);

  if (!target) {
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
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <AnantaLogo size="large" />
              </View>
              
              {/* Loading Circle */}
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>

              {/* Powered by section */}
              <View style={styles.poweredByContainer}>
                <ThemedText style={styles.poweredByText}>Powered by</ThemedText>
                <Image 
                  source={require('@/assets/images/sparknet logo.png')}
                  style={styles.sparknetLogo}
                  resizeMode="contain"
                />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return <Redirect href={target} />;
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: width * 0.08,
    paddingVertical: height * 0.05,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
    width: '100%',
  },
  loadingContainer: {
    marginBottom: 100,
  },
  poweredByContainer: {
    position: 'absolute',
    bottom: height * 0.05,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poweredByText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
    letterSpacing: 0.5,
  },
  sparknetLogo: {
    width: 160,
    height: 50,
  },
});
