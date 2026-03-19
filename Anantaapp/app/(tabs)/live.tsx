import { StyleSheet, TouchableOpacity, View, StatusBar, Text, Dimensions, Platform, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function LiveScreen() {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<'video' | 'audio'>('video');
  const [starting, setStarting] = useState(false);

  const handleStartLive = async () => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    } else {
      try {
        userId = await AsyncStorage.getItem('userId');
      } catch { }
    }
    if (!userId) {
      Alert.alert('Error', 'Please login first to start live streaming');
      return;
    }

    try {
      setStarting(true);
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/live/start?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: selectedType,
          title: selectedType === 'video' ? 'Live session' : 'Audio live session',
        }),
      });

      if (!response.ok) {
        Alert.alert('Error', 'Unable to start live session');
        return;
      }

      const data = await response.json();
      console.log('Start live response:', data);

      // Get current user profile info
      let username = data.hostUsername || '';
      let profileImage = data.hostProfileImage || '';
      
      console.log('Initial username:', username, 'profileImage:', profileImage);
      
      // Always fetch profile to ensure we have username and profileImage
      try {
        const profileRes = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
        console.log('Profile fetch status:', profileRes.status);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          console.log('Profile data:', profileData);
          username = profileData.user?.username || username || 'User';
          profileImage = profileData.user?.profileImage || profileImage || '';
          console.log('Updated username:', username, 'profileImage:', profileImage);
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      }

      const params = {
        sessionId: String(data.sessionId),
        channelName: String(data.channelName),
        token: String(data.token),
        appId: String(data.appId),
        type: String(data.type),
        title: String(data.title),
        userId: String(userId),
        role: 'host',
        hostUserId: String(data.hostUserId || userId),
        hostUid: String(data.hostUid || '0'),
        hostUsername: String(username),
        hostCountry: String(data.hostCountry || ''),
        hostProfileImage: String(profileImage),
        username: String(username),
        profileImage: String(profileImage),
      };

      console.log('Navigating with params:', params);

      if (selectedType === 'video') {
        router.push({ pathname: '/live/video', params });
      } else if (selectedType === 'audio') {
        router.push({ pathname: '/live/audio', params });
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong while starting live');
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>ANANTA</Text>
          </View>
        </View>
      </LinearGradient>



      <View style={styles.content}>
        <View style={styles.liveOptions}>
          <TouchableOpacity
            style={[styles.liveOption, selectedType === 'video' && styles.selectedOption]}
            onPress={() => setSelectedType('video')}
          >
            <View
              style={[
                styles.optionIcon,
                { borderColor: isDark ? '#f7c14d' : Colors.light.primary },
                selectedType === 'video' && { backgroundColor: isDark ? '#f7c14d' : Colors.light.primary }
              ]}
            >
              <Ionicons
                name="videocam"
                size={30}
                color={selectedType === 'video' ? (isDark ? '#000' : '#fff') : (isDark ? '#f7c14d' : Colors.light.primary)}
              />
            </View>
            <ThemedText style={[styles.optionText, { color: isDark ? 'white' : 'black' }]}>
              Video Live
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.liveOption, selectedType === 'audio' && styles.selectedOption]}
            onPress={() => setSelectedType('audio')}
          >
            <View
              style={[
                styles.optionIcon,
                { borderColor: isDark ? '#f7c14d' : Colors.light.primary },
                selectedType === 'audio' && { backgroundColor: isDark ? '#f7c14d' : Colors.light.primary }
              ]}
            >
              <Ionicons
                name="musical-notes"
                size={30}
                color={selectedType === 'audio' ? (isDark ? '#000' : '#fff') : (isDark ? '#f7c14d' : Colors.light.primary)}
              />
            </View>
            <ThemedText style={[styles.optionText, { color: isDark ? 'white' : 'black' }]}>
              Audio Live
            </ThemedText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.startLiveButtonContainer}
          onPress={handleStartLive}
          disabled={starting}
        >
          <LinearGradient
            colors={!starting ? (isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']) : ['#ccc', '#999']}
            style={styles.startLiveButton}
          >
            {starting ? (
              <ActivityIndicator color={isDark ? 'black' : 'white'} />
            ) : (
              <ThemedText style={[styles.startLiveText, { color: isDark ? 'black' : 'white' }]}>
                Go Live
              </ThemedText>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: width * 0.04,
  },
  iconButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    gap: 15,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(18,125,150,0.1)',
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#127d96',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#127d96',
  },
  activeTabText: {
    color: 'white',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  liveOptions: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
    justifyContent: 'center',
  },
  liveOption: {
    alignItems: 'center',
  },
  selectedOption: {
    opacity: 1,
  },
  optionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionIconText: {
    fontSize: 30,
  },
  optionText: {
    fontSize: 16,
    color: 'black',
  },
  startLiveButtonContainer: {
    width: '100%',
    paddingHorizontal: 40,
  },
  startLiveButton: {
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startLiveText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
