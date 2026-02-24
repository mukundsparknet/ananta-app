import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, StatusBar, Dimensions, Animated, Alert, PermissionsAndroid } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createAgoraEngine } from '@/agoraClient';

const { width, height } = Dimensions.get('window');
import { ENV } from '@/config/env';


export default function AudioLiveScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Morning Meditation';
  const user = (params.user as string) || 'Sarah Wilson';
  const location = (params.location as string) || 'India';
  const listeners = (params.listeners as string) || '1.2K';
  const sessionId = params.sessionId as string | undefined;
  const channelName = params.channelName as string | undefined;
  const token = params.token as string | undefined;
  const appId = params.appId as string | undefined;
  const userId = params.userId as string | undefined;
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liveComments, setLiveComments] = useState<any[]>([
    { id: 1, user: user, message: 'Welcome to my audio session! 🎵', avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', isHost: true },
    { id: 2, user: 'Alex', message: 'This is so relaxing!', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50', isHost: false },
    { id: 3, user: user, message: 'Thanks for joining! How are you feeling today?', avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500', isHost: true }
  ]);
  const [messageText, setMessageText] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<any[]>([]);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const engineRef = useRef<any | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  const hostMessages = [
    'Great to have you here! 🎶',
    'What do you think of this vibe?',
    'Any song requests?',
    'Thanks for listening! ❤️',
    'How\'s your day going?',
    'Love this energy!',
    'You have great taste in music!'
  ];

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

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
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

  const sendMessage = () => {
    if (messageText.trim()) {
      const newComment = {
        id: Date.now(),
        user: 'You',
        message: messageText.trim(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50',
        isHost: false
      };
      setLiveComments(prev => {
        const updated = [...prev, newComment];
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return updated;
      });
      setMessageText('');
      Keyboard.dismiss();
      
      // Host responds after 2-3 seconds
      setTimeout(() => {
        const randomHostMessage = hostMessages[Math.floor(Math.random() * hostMessages.length)];
        const hostResponse = {
          id: Date.now() + 1,
          user: user,
          message: randomHostMessage,
          avatar: 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500',
          isHost: true
        };
        setLiveComments(prev => {
          const updated = [...prev, hostResponse];
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return updated;
        });
      }, Math.random() * 2000 + 2000);
    }
  };

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
      if (!engine) {
        if (Platform.OS === 'web') {
          Alert.alert('Live audio', 'Live audio works only in the mobile app, not in browser.');
        }
        return;
      }
      engineRef.current = engine;
      if (engine.enableAudio) {
        await engine.enableAudio();
      }
      if (engine.setChannelProfile) {
        await engine.setChannelProfile(1);
      }
      if (engine.setClientRole) {
        await engine.setClientRole(1);
      }
      if (engine.joinChannel) {
        await engine.joinChannel(token, channelName, null, 0);
      }
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
        if (engine.destroy) {
          await engine.destroy();
        }
      } catch {
      }
      engineRef.current = null;
    }
  };

  useEffect(() => {
    initAgora();
    return () => {
      cleanupAgora();
    };
  }, [appId, token, channelName]);

  const toggleMute = async () => {
    const engine = engineRef.current;
    if (!engine || !engine.muteLocalAudioStream) {
      setIsMuted(prev => !prev);
      return;
    }
    const next = !isMuted;
    try {
      await engine.muteLocalAudioStream(next);
      setIsMuted(next);
    } catch {
    }
  };

  const endLive = async () => {
    try {
      if (sessionId && userId) {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userId,
          }),
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
          <Text style={styles.headerSubtitle}>@{user} • {location}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]} 
          onPress={handleFollow}
        >
          <Text style={styles.followText}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="headset" size={16} color="white" />
          <Text style={styles.statText}>{listeners} listening</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#ff4444" />
          <Text style={styles.statText}>2.5K</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={16} color="white" />
          <Text style={styles.statText}>12:34</Text>
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
          <Image 
            source={require('../../assets/images/audio image.webp')}
            style={styles.profileImage}
          />
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
          <View key={comment.id} style={[
            styles.commentItem,
            comment.isHost ? styles.hostComment : styles.userComment
          ]}>
            <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
            <View style={[
              styles.commentBubble,
              comment.isHost ? styles.hostBubble : styles.userBubble
            ]}>
              <Text style={[
                styles.commentUser,
                comment.isHost ? styles.hostUserText : styles.userUserText
              ]}>@{comment.user}</Text>
              <Text style={[
                styles.commentText,
                comment.isHost ? styles.hostCommentText : styles.userCommentText
              ]}>{comment.message}</Text>
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
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={endLive}>
            <Ionicons name="stop-circle" size={20} color="#ff4444" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={addFloatingHeart}>
            <Ionicons name="heart" size={20} color="#ff4444" />
          </TouchableOpacity>
        </View>
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
  hostComment: {
    justifyContent: 'flex-start',
  },
  userComment: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
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
  },
  hostBubble: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: 'rgba(18,125,150,0.9)',
    borderBottomRightRadius: 4,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  hostUserText: {
    color: '#127d96',
  },
  userUserText: {
    color: 'rgba(255,255,255,0.9)',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  hostCommentText: {
    color: '#333',
  },
  userCommentText: {
    color: 'white',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
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
