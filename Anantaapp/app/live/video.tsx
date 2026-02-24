import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TextInput, TouchableOpacity, View, Text, KeyboardAvoidingView, Platform, Alert, Modal, FlatList, PermissionsAndroid } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createAgoraEngine, RtcSurfaceView } from '@/agoraClient';

const API_BASE = 'https://ecofuelglobal.com';

const resolveGiftImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `https://ecofuelglobal.com${value}`;
  return value;
};

const resolveProfileImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (value.startsWith('blob:')) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `https://ecofuelglobal.com${value}`;
  if (value.length > 100) return `data:image/jpeg;base64,${value}`;
  return value;
};

export default function VideoLiveScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Live session';
  const hostUsername = (params.hostUsername as string) || (params.user as string) || 'Micale clarke';
  const hostProfileImage = (params.hostProfileImage as string) || '';
  const hostUserId = (params.hostUserId as string) || '';
  const location = (params.location as string) || 'Location';
  const views = (params.views as string) || '20';
  const sessionId = params.sessionId as string | undefined;
  const channelName = params.channelName as string | undefined;
  const token = params.token as string | undefined;
  const appId = params.appId as string | undefined;
  const userId = params.userId as string | undefined;
  
  const [likes, setLikes] = useState(15000);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(() => {
    const value = params.isFollowing as string | undefined;
    if (value === undefined) return false;
    if (typeof value === 'string') {
      return value === 'true' || value === '1';
    }
    return false;
  });
  const [floatingHearts, setFloatingHearts] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [giftList, setGiftList] = useState<any[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const resolvedHostProfileImage = resolveProfileImageUrl(hostProfileImage);
  
  const engineRef = useRef<any | null>(null);
  const role = (params.role as string) || 'host';
  
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const animatedValues = useRef<{[key: number]: Animated.Value}>({});
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  
  const comments: any[] = [];

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
  const handleGift = () => {
    if (role !== 'viewer') {
      return;
    }
    if (!userId) {
      return;
    }
    if (!hostUserId) {
      return;
    }
    setShowGifts(true);
    if (giftList.length === 0) {
      loadGifts();
    }
    if (walletBalance === null) {
      loadWallet();
    }
  };

  const loadWallet = async () => {
    if (!userId) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/app/wallet/${userId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const value = typeof data.balance === 'number' ? data.balance : Number(data.balance) || 0;
      setWalletBalance(value);
    } catch {
    }
  };

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const res = await fetch(`${API_BASE}/api/app/gifts`);
      if (!res.ok) {
        setLoadingGifts(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setGiftList(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            coinValue: item.coinValue,
            imageUrl: resolveGiftImageUrl(item.imageUrl),
          }))
        );
      }
      setLoadingGifts(false);
    } catch {
      setLoadingGifts(false);
    }
  };

  const handleSendGift = async (gift: any) => {
    if (!userId || !hostUserId) {
      return;
    }
    const cost = typeof gift.coinValue === 'number' ? gift.coinValue : Number(gift.coinValue) || 0;
    if (cost <= 0) {
      return;
    }
    if (walletBalance !== null && walletBalance < cost) {
      Alert.alert('Insufficient balance', 'You do not have enough coins to send this gift.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/app/gifts/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUserId: userId,
          toUserId: hostUserId,
          giftId: gift.id,
        }),
      });
      if (!res.ok) {
        Alert.alert('Error', 'Unable to send gift');
        return;
      }
      const data = await res.json();
      if (typeof data.fromBalance === 'number') {
        setWalletBalance(data.fromBalance);
      }
      addFloatingHeart();
      setShowGifts(false);
    } catch {
      Alert.alert('Error', 'Unable to send gift');
    }
  };

  const handleFollow = async () => {
    if (role !== 'viewer') {
      return;
    }
    if (!userId || !hostUserId) {
      setIsFollowing(prev => !prev);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/app/follow/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: userId,
          followeeId: hostUserId,
        }),
      });
      if (!response.ok) {
        setIsFollowing(prev => !prev);
        return;
      }
      const data = await response.json();
      if (typeof data.isFollowing === 'boolean') {
        setIsFollowing(data.isFollowing);
      } else {
        setIsFollowing(prev => !prev);
      }
    } catch {
      setIsFollowing(prev => !prev);
    }
  };
  
  const handleLike = () => {
    setLikes(prev => prev + 1);
    setIsLiked(true);
    addFloatingHeart();
  };
  
  const sendMessage = () => {
    if (messageText.trim()) {
      const newComment = {
        id: Date.now(),
        user: 'You',
        message: messageText.trim(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50'
      };
      setLiveComments(prev => [...prev, newComment].slice(-5));
      setMessageText('');
    }
  };

  const requestMediaPermissions = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const cameraGranted =
        result[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
      const audioGranted =
        result[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      return cameraGranted && audioGranted;
    } catch {
      return false;
    }
  };

  const initAgora = async () => {
    if (!appId || !token || !channelName) return;
    try {
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        Alert.alert('Permission required', 'Camera and microphone permissions are needed for live.');
        return;
      }
      const engine = await createAgoraEngine(appId);
      if (!engine) {
        if (Platform.OS === 'web') {
          Alert.alert('Live video', 'Live video works only in the mobile app, not in browser.');
        }
        return;
      }
      engineRef.current = engine;
      if (engine.enableVideo) {
        await engine.enableVideo();
      }
      if (engine.startPreview) {
        await engine.startPreview();
      }
      if (engine.setChannelProfile) {
        await engine.setChannelProfile(1);
      }
      if (engine.setClientRole) {
        const clientRole = role === 'viewer' ? 2 : 1;
        await engine.setClientRole(clientRole);
      }
      if (engine.addListener) {
        engine.addListener('JoinChannelSuccess', () => {
          setJoined(true);
        });
        engine.addListener('UserJoined', (uid: number) => {
          setRemoteUid(uid);
        });
        engine.addListener('UserOffline', (uid: number) => {
          setRemoteUid(prev => (prev === uid ? null : prev));
        });
      }
      if (engine.joinChannel) {
        await engine.joinChannel(token, channelName, null, 0);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to start video live');
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
    if (!engine || !engine.muteLocalAudioStream) return;
    const next = !isMuted;
    try {
      await engine.muteLocalAudioStream(next);
      setIsMuted(next);
    } catch {
    }
  };

  const toggleCamera = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      if (isCameraOn) {
        if (engine.enableLocalVideo) {
          await engine.enableLocalVideo(false);
        }
        setIsCameraOn(false);
      } else {
        if (engine.enableLocalVideo) {
          await engine.enableLocalVideo(true);
        }
        setIsCameraOn(true);
      }
      if (engine.switchCamera) {
        await engine.switchCamera();
      }
    } catch {
    }
  };

  const endLive = async () => {
    try {
      if (role === 'host' && sessionId && userId) {
        await fetch(`${API_BASE}/api/app/live/end`, {
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

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.backgroundImage}>
        {Platform.OS !== 'web' && joined && (
          <RtcSurfaceView
            canvas={{
              uid: role === 'viewer' && remoteUid != null ? remoteUid : 0,
            }}
            style={styles.videoSurface}
          />
        )}
      </View>
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          {role === 'viewer' && (
            <>
              <View style={styles.userInfo}>
                <Image 
                  source={
                    resolvedHostProfileImage
                      ? { uri: resolvedHostProfileImage }
                      : { uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face' }
                  }
                  style={styles.userAvatar}
                />
                <View style={styles.userDetails}>
                  <ThemedText style={styles.username}>@{hostUsername}</ThemedText>
                  <ThemedText style={styles.liveText}>{title}</ThemedText>
                </View>
              </View>
              
              <View style={styles.headerRight}>
                <TouchableOpacity style={[styles.followButton, { backgroundColor: isDark ? '#FFD700' : Colors.light.primary }, isFollowing && styles.followingButton]} onPress={handleFollow}>
                  <ThemedText style={[styles.followText, { color: isDark ? 'black' : 'white' }, isFollowing && styles.followingText]}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={endLive}
                >
                  <ThemedText style={styles.closeText}>×</ThemedText>
                </TouchableOpacity>
              </View>
            </>
          )}
          {role === 'host' && (
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={endLive}
              >
                <ThemedText style={styles.closeText}>×</ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statIcon, { color: 'white' }]}>👁</ThemedText>
            <ThemedText style={styles.statText}>{views} Viewers</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>💛</ThemedText>
            <ThemedText style={styles.statText}>{likes.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>🎯</ThemedText>
            <ThemedText style={styles.statText}>55</ThemedText>
          </View>
        </View>

        <View style={styles.commentsSection}>
          {liveComments.map((comment) => (
            <View key={comment.id} style={styles.liveCommentItem}>
              <Image source={{ uri: comment.avatar }} style={styles.liveCommentAvatar} />
              <View style={styles.liveCommentContent}>
                <Text style={styles.liveCommentUser}>@{comment.user}</Text>
                <Text style={styles.liveCommentText}>{comment.message}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.floatingHeartsContainer}>
          {floatingHearts.map((heart) => (
            <View 
              key={heart.id} 
              style={[
                styles.floatingHeart,
                { bottom: heart.bottom, right: heart.right }
              ]}
            >
              <Text style={styles.heartEmoji}>❤️</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Say Something..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={messageText}
              onChangeText={setMessageText}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <ThemedText style={styles.sendIcon}>▶</ThemedText>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            {role === 'host' ? (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={toggleMute}>
                  <ThemedText style={styles.actionIcon}>{isMuted ? '🔇' : '🎤'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={toggleCamera}>
                  <ThemedText style={styles.actionIcon}>📷</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={endLive}>
                  <ThemedText style={styles.actionIcon}>⏹</ThemedText>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                  <ThemedText style={[styles.actionIcon, { color: isLiked ? '#ff4444' : 'white' }]}>❤️</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={handleGift}>
                  <ThemedText style={[styles.actionIcon, { color: '#ffd93d' }]}>🎁</ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Modal
          visible={showGifts}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGifts(false)}
        >
          <View style={styles.giftModalOverlay}>
            <View style={styles.giftModalContainer}>
              <View style={styles.giftModalHeader}>
                <Text style={styles.giftModalTitle}>Send a gift</Text>
                <TouchableOpacity onPress={() => setShowGifts(false)}>
                  <Text style={styles.giftModalClose}>×</Text>
                </TouchableOpacity>
              </View>
              {walletBalance !== null && (
                <Text style={styles.giftBalanceText}>
                  Your balance: {walletBalance} coins
                </Text>
              )}
              {loadingGifts ? (
                <Text style={styles.giftLoadingText}>Loading gifts...</Text>
              ) : giftList.length === 0 ? (
                <Text style={styles.giftLoadingText}>No gifts available.</Text>
              ) : (
                <FlatList
                  data={giftList}
                  keyExtractor={item => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.giftList}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.giftItem}
                      onPress={() => handleSendGift(item)}
                    >
                      <View style={styles.giftImageWrapper}>
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.giftImage}
                          />
                        ) : (
                          <Text style={styles.giftPlaceholder}>🎁</Text>
                        )}
                      </View>
                      <Text style={styles.giftName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.giftCoins}>{item.coinValue} coins</Text>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  videoSurface: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  userDetails: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    opacity: 0.8,
  },
  followButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  followText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#4CAF50',
  },
  followingText: {
    color: 'white',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 5,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  commentsSection: {
    position: 'absolute',
    bottom: 120,
    left: 5,
    right: 5,
    height: 250,
    justifyContent: 'flex-end',
  },
  liveCommentItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  liveCommentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  liveCommentContent: {
    flex: 1,
  },
  liveCommentUser: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  liveCommentText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 16,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
    paddingHorizontal: 15,
  },
  messageInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    paddingVertical: 10,
  },
  sendButton: {
    padding: 5,
  },
  sendIcon: {
    color: 'white',
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 18,
  },
  giftModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  giftModalContainer: {
    backgroundColor: 'rgba(15,15,16,0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  giftModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  giftModalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  giftModalClose: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  giftBalanceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 10,
  },
  giftLoadingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  giftList: {
    paddingTop: 8,
  },
  giftItem: {
    width: 90,
    marginRight: 12,
    alignItems: 'center',
  },
  giftImageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  giftImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  giftPlaceholder: {
    fontSize: 30,
  },
  giftName: {
    color: 'white',
    fontSize: 12,
    marginBottom: 2,
  },
  giftCoins: {
    color: '#ffd93d',
    fontSize: 11,
  },
  floatingHeartsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    pointerEvents: 'none',
  },
  floatingHeart: {
    position: 'absolute',
    opacity: 0.8,
  },
  heartEmoji: {
    fontSize: 24,
    color: '#FF6B6B',
  },
})
