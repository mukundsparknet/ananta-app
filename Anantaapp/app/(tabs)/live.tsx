import { StyleSheet, TouchableOpacity, View, StatusBar, Text, Dimensions, Platform, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LiveScreen() {
  const { isDark } = useTheme();
  const [selectedType, setSelectedType] = useState<'video' | 'audio'>('video');
  const [starting, setStarting] = useState(false);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [followedSessionKeys, setFollowedSessionKeys] = useState<string[]>([]);

  const API_BASE = 'https://ecofuelglobal.com';

  const handleStartLive = async () => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    if (!userId) {
      userId = 'guest';
    }

    try {
      setStarting(true);
      const response = await fetch(`${API_BASE}/api/app/live/start`, {
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
      const params = {
        sessionId: data.sessionId,
        channelName: data.channelName,
        token: data.token,
        appId: data.appId,
        type: data.type,
        title: data.title,
        userId,
        role: 'host',
      };

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

  const fetchLiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch(`${API_BASE}/api/app/live/list`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const videoSessions = sessions.filter((s: any) => s.type === 'VIDEO');
      setLiveSessions(videoSessions);
    } catch {
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCardFollow = async (session: any) => {
    const followKey = session.sessionId || session.id;
    if (!followKey) {
      return;
    }
    const isFollowing = followedSessionKeys.includes(followKey);
    setFollowedSessionKeys(prev =>
      isFollowing ? prev.filter(key => key !== followKey) : [...prev, followKey]
    );
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    if (!userId) {
      userId = 'guest';
    }
    if (!session.hostUserId) {
      return;
    }
    try {
      await fetch(`${API_BASE}/api/app/follow/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: userId,
          followeeId: session.hostUserId,
        }),
      });
    } catch {
    }
  };

  useEffect(() => {
    fetchLiveSessions();
    const interval = setInterval(fetchLiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinLive = async (session: any) => {
    try {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      }
      if (!userId) {
        userId = 'guest';
      }

      const response = await fetch(`${API_BASE}/api/app/live/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          userId,
        }),
      });

      if (!response.ok) {
        Alert.alert('Error', 'Unable to join live session');
        return;
      }

      const data = await response.json();
      const params = {
        sessionId: data.sessionId,
        channelName: data.channelName,
        token: data.token,
        appId: data.appId,
        type: data.type,
        title: data.title,
        userId,
        role: 'viewer',
        hostUserId: data.hostUserId,
        hostUsername: data.hostUsername,
        hostCountry: data.hostCountry,
        hostProfileImage: data.hostProfileImage,
        isFollowing: data.isFollowing,
      };

      router.push({ pathname: '/live/video', params });
    } catch {
      Alert.alert('Error', 'Something went wrong while joining live');
    }
  };

  const renderLiveCards = () => {
    if (loadingSessions) {
      return (
        <View style={styles.sessionsLoading}>
          <ActivityIndicator color={isDark ? '#f7c14d' : Colors.light.primary} />
        </View>
      );
    }

    if (!liveSessions.length) {
      return (
        <View style={styles.sessionsEmpty}>
          <ThemedText style={{ color: isDark ? 'white' : '#555' }}>
            No video live sessions right now.
          </ThemedText>
        </View>
      );
    }

    const sorted = [...liveSessions].sort((a, b) => (b.viewerCount || 0) - (a.viewerCount || 0));
    const main = sorted[0];
    const others = sorted.slice(1);

    const resolveProfileImageSource = (value: string | null | undefined) => {
      if (!value) return null;
      if (value.startsWith('blob:')) return null;
      if (value.startsWith('http') || value.startsWith('data:')) return { uri: value };
      if (value.startsWith('/uploads/')) return { uri: `https://ecofuelglobal.com${value}` };
      if (value.length > 100) return { uri: `data:image/jpeg;base64,${value}` };
      return { uri: value };
    };

    const renderCard = (session: any, large: boolean) => {
      const viewers = session.viewerCount || 0;
      const username = session.username || session.hostUserId || 'User';
      const country = session.country || '';
      const hashtag = session.title || '';
      const imageSource = resolveProfileImageSource(session.profileImage);
      const followKey = session.sessionId || session.id;
      const isFollowing = followKey ? followedSessionKeys.includes(followKey) : false;
      return (
        <TouchableOpacity
          key={session.sessionId}
          style={large ? styles.mainCard : styles.smallCard}
          onPress={() => handleJoinLive(session)}
        >
          <View style={styles.cardImageWrapper}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={large ? styles.mainCardImage : styles.smallCardImage}
              />
            ) : (
              <View
                style={[
                  large ? styles.mainCardImage : styles.smallCardImage,
                  { backgroundColor: '#222' },
                ]}
              />
            )}
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <View style={styles.viewsBadge}>
              <Ionicons name="eye" size={14} color="white" />
              <Text style={styles.viewsBadgeText}>{viewers} viewers</Text>
            </View>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{hashtag}</Text>
            <View style={styles.cardUserRow}>
              <View>
                <Text style={styles.cardUserName}>@{username}</Text>
                {country ? (
                  <Text style={styles.cardCountry}>{country}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.cardFollowButton}
                onPress={() => handleCardFollow(session)}
              >
                <Text style={styles.cardFollowText}>{isFollowing ? 'Following' : 'Follow'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.sessionsContainer}>
        {renderCard(main, true)}
        <View style={styles.smallCardsRow}>
          {others.map((s) => renderCard(s, false))}
        </View>
      </View>
    );
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

        <ScrollView style={styles.sessionsScroll} contentContainerStyle={{ paddingBottom: 40 }}>
          {selectedType === 'video' && renderLiveCards()}
        </ScrollView>
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
