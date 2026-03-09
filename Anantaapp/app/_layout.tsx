import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ProfileProvider } from '../contexts/ProfileContext';
import { ThemeProvider as CustomThemeProvider } from '../contexts/ThemeContext';
import { startAccountStatusCheck, stopAccountStatusCheck } from '../utils/accountStatus';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Start checking account status when app loads
    startAccountStatusCheck();

    // Cleanup on unmount
    return () => {
      stopAccountStatusCheck();
    };
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
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ProfileProvider>
    </CustomThemeProvider>
  );
}
