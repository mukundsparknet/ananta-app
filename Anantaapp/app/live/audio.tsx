import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, StatusBar, Dimensions, Animated, Alert, PermissionsAndroid } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createAgoraEngine, ChannelProfileType, ClientRoleType } from '@/agoraClient';

const { width, height } = Dimensions.get('window');
import { ENV } from '@/config/env';

const resolveProfileImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (value.startsWith('blob:')) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
  if (value.length > 100) return `data:image/jpeg;base64,${value}`;
  return value;
};

export default function AudioLiveScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Audio live session';
  const hostUsername = (params.hostUsername as string) || (params.user as string) || 'User';
  const hostProfileImage = (params.hostProfileImage as string) || '';
  const hostUserId = (params.hostUserId as string) || '';
  const hostCountry = (params.hostCountry as string) || '';
  const sessionId = params.sessionId as string | undefined;
  const channelName = params.channelName as string | undefined;
  const token = params.token as string | undefined;
  const appId = String(params.appId || '').trim();
  const userId = params.userId as string | undefined;
  const hostUid = params.hostUid ? Number(params.hostUid) : 0;
  const role = (params.role as string) || 'host';
  const currentUsername = (params.username as string) || 'User';
  const currentUserProfileImage = (params.profileImage as string) || '';
  const resolvedHostProfileImage = resolveProfileImageUrl(hostProfileImage);
  
  const [isFollowing, setIsFollowing] = useState(() => {
    const value = params.isFollowing as string | undefined;
    if (value === undefined) return false;
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return false;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [likes, setLikes] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const engineRef = useRef<any | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for profile image
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ])
    ).start();

    // Wave animations
    Animated.loop(
      Animated.timing(waveAnim1, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
    
    Animated.loop(
      Animated.timing(waveAnim2, { toValue: 1, duration: 4000, useNativeDriver: true })
    ).start();
    
    Animated.loop(
      Animated.timing(waveAnim3, { toValue: 1, duration: 5000, useNativeDriver: true })
    ).start();
  }, []);

  const handleFollow = async () => {
    if (role !== 'viewer') return;
    if (!userId || !hostUserId) return;
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/follow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: userId, followeeId: hostUserId }),
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (e) {
      console.error('Follow error:', e);
    }
  };

  const addFloatingHeart = () => {
    const newHeart = {
      id: Date.now(),
      bottom: Math.random() * 200 + 100,
      right: Math.random() * 50 + 20,
    };
    setFloatingHearts(prev => [...prev, newHeart]);
    
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(heart => heart.id !== newHeart.id));
    }, 3000);
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !sessionId) return;
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/live/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          username: currentUsername,
          message: messageText.trim(),
          avatar: resolveProfileImageUrl(currentUserProfileImage) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'
        }),
      });
      setMessageText('');
      Keyboard.dismiss();
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  const handleLike = async () => {
    setLikes(prev => prev + 1);
    addFloatingHeart();
    if (sessionId) {
      try {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/like`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (e) {
        console.error('Like error:', e);
      }
    }
  };

  const loadSessionStats = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/stats/${sessionId}`);
      if (res.status === 404) {
        if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
        if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
        if (role === 'viewer') {
          await cleanupAgora();
          Alert.alert('Live Ended', 'The host has ended this live session.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (typeof data.viewerCount === 'number') setViewerCount(data.viewerCount);
        if (typeof data.likes === 'number') setLikes(data.likes);
        if (role === 'viewer' && data.status === 'ended') {
          if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
          if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
          await cleanupAgora();
          Alert.alert('Live Ended', 'The host has ended this live session.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      }
    } catch { }
  };

  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/messages/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLiveComments(data.slice(-5));
        }
      }
    } catch { }
  };

  const checkFollowStatus = async () => {
    if (role !== 'viewer' || !userId || !hostUserId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.followingList)) {
          const isFollowingHost = data.followingList.some((f: any) => f.userId === hostUserId);
          setIsFollowing(isFollowingHost);
        }
      }
    } catch { }
  };

  const requestAudioPermission = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const initAgora = async () => {
    if (!appId || !token || !channelName) return;
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Microphone permission is needed for live audio.');
        return;
      }
      const engine = await createAgoraEngine(appId);
      engineRef.current = engine;
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      const clientRole = role === 'viewer' ? ClientRoleType.ClientRoleAudience : ClientRoleType.ClientRoleBroadcaster;
      await engine.setClientRole(clientRole);
      engine.registerEventHandler({
        onJoinChannelSuccess: () => setJoined(true),
        onUserOffline: (_connection: any, uid: number) => {
          const offlineUid = typeof uid === 'number' ? uid : _connection;
          if (role === 'viewer' && offlineUid === hostUid) {
            if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
            cleanupAgora().then(() => {
              Alert.alert('Live Ended', 'The host has left the session.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            });
          }
        },
      });
      const joinUid = role === 'host' ? hostUid : 0;
      await engine.joinChannel(null, channelName, joinUid, { clientRoleType: clientRole });
    } catch (e) {
      Alert.alert('Error', 'Unable to start audio live');
    }
  };

  const cleanupAgora = async () => {
    const engine = engineRef.current;
    if (engine) {
      try {
        if (engine.leaveChannel) {
          await engine.leaveChannel();
        }
        if (engine.release) {
          await engine.release();
        }
      } catch {
      }
      engineRef.current = null;
    }
  };

  useEffect(() => {
    initAgora();
    loadSessionStats();
    loadMessages();
    checkFollowStatus();
    statsIntervalRef.current = setInterval(loadSessionStats, 5000);
    messagesIntervalRef.current = setInterval(loadMessages, 2000);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      cleanupAgora();
    };
  }, [appId, token, channelName]);

  const toggleMute = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const next = !isMuted;
    try {
      await engine.muteLocalAudioStream(next);
      setIsMuted(next);
    } catch (e) {
      console.error('Toggle mute error:', e);
    }
  };

  const endLive = async () => {
    try {
      if (role === 'host' && sessionId && userId) {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        });
      } else if (role === 'viewer' && sessionId) {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      }
    } catch {
    } finally {
      await cleanupAgora();
      router.back();
    }
  };

  const wave1Scale = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3]
  });

  const wave2Scale = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5]
  });

  const wave3Scale = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7]
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#127d96', '#0a5d75', '#083d4f']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={endLive}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>@{hostUsername} • {hostCountry}</Text>
        </View>
        
        {role === 'viewer' && (
          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]} 
            onPress={handleFollow}
          >
            <Text style={styles.followText}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="headset" size={16} color="white" />
          <Text style={styles.statText}>{viewerCount} listening</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#ff4444" />
          <Text style={styles.statText}>{likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="white" />
          <Text style={styles.statText}>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Audio Visualization */}
      <View style={styles.audioVisualization}>
        {/* Animated waves */}
        <Animated.View style={[styles.wave, styles.wave1, { transform: [{ scale: wave1Scale }] }]} />
        <Animated.View style={[styles.wave, styles.wave2, { transform: [{ scale: wave2Scale }] }]} />
        <Animated.View style={[styles.wave, styles.wave3, { transform: [{ scale: wave3Scale }] }]} />
        
        {/* Profile Image */}
        <Animated.View style={[styles.profileContainer, { transform: [{ scale: pulseAnim }] }]}>
          {resolvedHostProfileImage ? (
            <Image 
              source={{ uri: resolvedHostProfileImage }}
              style={styles.profileImage}
            />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: '#127d96', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="person" size={60} color="white" />
            </View>
          )}
          <View style={styles.liveIndicator}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </Animated.View>
      </View>

      {/* Comments Section */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.commentsSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.commentsContent}
      >
        {liveComments.map((comment) => (
          <View key={comment.id} style={styles.commentItem}>
            <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
            <View style={styles.commentBubble}>
              <Text style={styles.commentUser}>@{comment.user}</Text>
              <Text style={styles.commentText}>{comment.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Hearts */}
      <View style={styles.floatingHeartsContainer}>
        {floatingHearts.map((heart) => (
          <Animated.View 
            key={heart.id} 
            style={[
              styles.floatingHeart,
              { bottom: heart.bottom, right: heart.right }
            ]}
          >
            <Ionicons name="heart" size={24} color="#ff4444" />
          </Animated.View>
        ))}
      </View>

      {/* Bottom Controls */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomContainer}
      >
        {role === 'host' ? (
          <>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Say something..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, isMuted && styles.mutedButton]}
                onPress={toggleMute}
              >
                <Ionicons 
                  name={isMuted ? "mic-off" : "mic"} 
                  size={20} 
                  color="white" 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={endLive}>
                <Ionicons name="stop-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.viewerBottomRow}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Say something..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={messageText}
                onChangeText={setMessageText}
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Ionicons name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons name="heart" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  followButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  followingButton: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  followText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  audioVisualization: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 280,
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  wave1: {
    width: 180,
    height: 180,
  },
  wave2: {
    width: 220,
    height: 220,
  },
  wave3: {
    width: 260,
    height: 260,
  },
  profileContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: 'white',
  },
  liveIndicator: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  commentsSection: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  commentsContent: {
    paddingBottom: 20,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 8,
  },
  commentBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomLeftRadius: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#127d96',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#333',
  },
  floatingHeartsContainer: {
    position: 'absolute',
    right: 20,
    top: height * 0.3,
    bottom: 120,
    width: 50,
    pointerEvents: 'none',
  },
  floatingHeart: {
    position: 'absolute',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  viewerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  messageInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    paddingVertical: 12,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#127d96',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mutedButton: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderColor: '#ff4444',
  },
});
