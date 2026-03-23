import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProfileProvider } from '../contexts/ProfileContext';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';
import { startAccountStatusCheck, stopAccountStatusCheck } from '../utils/accountStatus';
import { LiveProvider, useLive } from '../contexts/LiveContext';
import MiniLivePlayer from '../components/MiniLivePlayer';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const { liveSession, isMinimized } = useLive();

  useEffect(() => {
    startAccountStatusCheck();
    return () => stopAccountStatusCheck();
  }, []);

  return (
    <CustomThemeProvider>
      <ProfileProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/otp" />
            <Stack.Screen name="auth/profile" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="followers" />
            <Stack.Screen name="following" />
            <Stack.Screen name="room-admin" />
            <Stack.Screen name="entries-frames" />
            <Stack.Screen name="back-pack" />
            <Stack.Screen name="notification" />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="user-profile" />
            <Stack.Screen name="live-history" />
            <Stack.Screen name="live/video" options={{ animation: 'none' }} />
            <Stack.Screen name="live/audio" options={{ animation: 'none' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
        <MiniLivePlayer />
      </ProfileProvider>
    </CustomThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LiveProvider>
      <AppContent />
    </LiveProvider>
  );
}
