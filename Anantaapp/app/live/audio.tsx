import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView, StatusBar, Dimensions, Animated, Alert, PermissionsAndroid, BackHandler, Modal, FlatList } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createAgoraEngine, ChannelProfileType, ClientRoleType } from '@/agoraClient';
import { WebView } from 'react-native-webview';
import VideoGiftPlayer from '@/components/VideoGiftPlayer';
import { useLive } from '@/contexts/LiveContext';

const { width, height } = Dimensions.get('window');
import { ENV } from '@/config/env';

const resolveGiftImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
  return value;
};

const resolveProfileImageUrl = (value: string | null | undefined) => {
  if (!value) return '';
  if (value.startsWith('blob:')) return '';
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
  if (value.length > 100) return `data:image/jpeg;base64,${value}`;
  return value;
};

const isVideoFile = (url: string) => {
  if (!url) return false;
  return /\.(mp4|mov|avi|webm|mkv|flv)$/i.test(url);
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
  const [isHostMuted, setIsHostMuted] = useState(false);
  const [isRoomAdmin, setIsRoomAdmin] = useState(false);
  const [micRequests, setMicRequests] = useState<any[]>([]);
  const [activeMicUsers, setActiveMicUsers] = useState<any[]>([]);
  const [showMicRequests, setShowMicRequests] = useState(false);
  const [showActiveMicUsers, setShowActiveMicUsers] = useState(false);
  const [hasPendingMicRequest, setHasPendingMicRequest] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState<any[]>([]);
  const [viewerSearch, setViewerSearch] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [likes, setLikes] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [floatingHearts, setFloatingHearts] = useState<any[]>([]);
  const [joined, setJoined] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [giftList, setGiftList] = useState<any[]>([]);
  const [showGifts, setShowGifts] = useState(false);
  const [loadingGifts, setLoadingGifts] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState<{ senderName: string; giftImageUrl: string; giftName: string } | null>(null);
  const [videoGift, setVideoGift] = useState<{ senderName: string; videoUrl: string; giftName: string } | null>(null);
  const giftAnimScale = useRef(new Animated.Value(0)).current;
  const giftAnimY = useRef(new Animated.Value(0)).current;
  const giftAnimOpacity = useRef(new Animated.Value(0)).current;
  const shownGiftIds = useRef<Set<number>>(new Set());
  const processedGiftMessages = useRef<Set<number>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const engineRef = useRef<any | null>(null);
  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (role !== 'viewer' || !hostUserId || !userId) return;
    fetch(`${ENV.API_BASE_URL}/api/app/room-admins/${hostUserId}`)
      .then(res => res.ok ? res.json() : [])
      .then((admins: any[]) => {
        if (Array.isArray(admins) && admins.some((a: any) => a.userId === userId)) {
          setIsRoomAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

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

  const filteredViewers = viewerSearch.trim()
    ? viewersList.filter(v =>
        (v.username || '').toLowerCase().includes(viewerSearch.toLowerCase()) ||
        (v.userId || '').toLowerCase().includes(viewerSearch.toLowerCase())
      )
    : viewersList;

  const loadViewers = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/viewers/${sessionId}`);
      if (res.ok) setViewersList(await res.json());
    } catch {}
  };

  const kickViewer = async (viewerUserId: string) => {
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/live/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, callerUserId: userId, viewerUserId }),
      });
      setViewersList(prev => prev.filter(v => v.userId !== viewerUserId));
    } catch {}
  };

  const banViewer = async (viewerUserId: string) => {
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/live/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, callerUserId: userId, viewerUserId }),
      });
      setViewersList(prev => prev.filter(v => v.userId !== viewerUserId));
    } catch {}
  };

  const checkIfKicked = async () => {
    if (role !== 'viewer' || !sessionId || !userId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/check-kicked/${sessionId}/${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.kicked) {
          await cleanupAgora();
          Alert.alert('Removed', 'You have been removed from this live session.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
      }
    } catch {}
  };

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
        if (data.isFollowing) {
          // viewer followed host → HOST_FOLLOWED for viewer (drained on daily-tasks screen)
          const prev = parseFloat(await AsyncStorage.getItem('pendingHostFollowed') || '0');
          await AsyncStorage.setItem('pendingHostFollowed', String(prev + 1));
          // host received a follow → post FOLLOW_RECEIVED directly to host's tasks (different device)
          fetch(`${ENV.API_BASE_URL}/api/app/daily-tasks/progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: hostUserId, taskType: 'host', triggerEvent: 'FOLLOW_RECEIVED', addValue: 1 }),
          }).catch(() => {});
        }
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

  const handleGift = async () => {
    if (role !== 'viewer') return;
    if (!hostUserId) return;
    let viewerUserId = userId;
    if (!viewerUserId || viewerUserId === 'guest') {
      viewerUserId = Platform.OS === 'web' && typeof window !== 'undefined'
        ? window.localStorage.getItem('userId') || undefined
        : (await SecureStore.getItemAsync('userId')) || undefined;
    }
    if (!viewerUserId) return;
    setShowGifts(true);
    if (giftList.length === 0) loadGifts();
    if (walletBalance === null) loadWallet();
  };

  const loadWallet = async () => {
    try {
      let walletUserId = (!userId || userId === 'guest') ? null : userId;
      if (!walletUserId) {
        walletUserId = Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.localStorage.getItem('userId')
          : await SecureStore.getItemAsync('userId');
      }
      if (!walletUserId || walletUserId === 'guest') return;
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/wallet/${walletUserId}`);
      if (!res.ok) return;
      const data = await res.json();
      setWalletBalance(typeof data.balance === 'number' ? data.balance : Number(data.balance) || 0);
    } catch {}
  };

  const loadGifts = async () => {
    try {
      setLoadingGifts(true);
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/gifts`);
      if (!res.ok) {
        setLoadingGifts(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const processedGifts = data.map((item: any) => {
          const resolvedUrl = resolveGiftImageUrl(item.imageUrl);
          return {
            id: item.id,
            name: item.name,
            coinValue: item.coinValue,
            imageUrl: resolvedUrl,
          };
        });
        setGiftList(processedGifts);
        
        // Preload small images for better performance
        processedGifts.forEach((gift: any) => {
          if (gift.imageUrl && !isVideoFile(gift.imageUrl)) {
            Image.prefetch(gift.imageUrl).catch(() => {});
          }
        });
      }
      setLoadingGifts(false);
    } catch {
      setLoadingGifts(false);
    }
  };

  const triggerGiftAnimation = (senderName: string, giftImageUrl: string, giftName: string) => {
    // Check if it's a video gift
    if (isVideoFile(giftImageUrl)) {
      setVideoGift({ senderName, videoUrl: giftImageUrl, giftName });
      return;
    }
    
    // Regular image gift animation
    giftAnimScale.setValue(0);
    giftAnimY.setValue(0);
    giftAnimOpacity.setValue(1);
    setGiftAnimation({ senderName, giftImageUrl, giftName });
    Animated.sequence([
      Animated.spring(giftAnimScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(giftAnimY, { toValue: -80, duration: 600, useNativeDriver: true }),
        Animated.timing(giftAnimOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start(() => setGiftAnimation(null));
  };

  const handleSendGift = async (gift: any) => {
    let senderUserId = userId;
    if (!senderUserId) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        senderUserId = window.localStorage.getItem('userId') || undefined;
      } else {
        senderUserId = (await SecureStore.getItemAsync('userId')) || undefined;
      }
    }
    if (!senderUserId || !hostUserId) return;
    const cost = typeof gift.coinValue === 'number' ? gift.coinValue : Number(gift.coinValue) || 0;
    if (cost <= 0) return;
    if (walletBalance !== null && walletBalance < cost) {
      Alert.alert('Insufficient balance', 'You do not have enough coins to send this gift.');
      return;
    }
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/gifts/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromUserId: senderUserId,
          toUserId: hostUserId,
          giftId: gift.id,
          sessionId: sessionId,
          sessionType: 'AUDIO',
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
      // Track gift sent value (for viewer's own tasks)
      const prevSpent = parseFloat(await AsyncStorage.getItem('pendingGiftSentValue') || '0');
      await AsyncStorage.setItem('pendingGiftSentValue', String(prevSpent + cost));
      // Track unique host gifted (store as JSON array of hostUserIds)
      const uniqueHostsRaw = await AsyncStorage.getItem('pendingGiftUniqueHosts');
      const uniqueHosts: string[] = uniqueHostsRaw ? JSON.parse(uniqueHostsRaw) : [];
      if (hostUserId && !uniqueHosts.includes(hostUserId)) {
        uniqueHosts.push(hostUserId);
        await AsyncStorage.setItem('pendingGiftUniqueHosts', JSON.stringify(uniqueHosts));
      }
      // Post GIFT_RECEIVED_VALUE directly to host's tasks (host is on a different device)
      fetch(`${ENV.API_BASE_URL}/api/app/daily-tasks/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: hostUserId, taskType: 'host', triggerEvent: 'GIFT_RECEIVED_VALUE', addValue: cost }),
      }).catch(() => {});
      // Broadcast gift animation to all viewers via message system
      const senderName = currentUsername !== 'User' ? currentUsername : (senderUserId || 'Someone');
      const giftMsgId = Date.now();
      shownGiftIds.current.add(giftMsgId);
      const giftPayload = JSON.stringify({ __gift: true, giftImageUrl: gift.imageUrl, giftName: gift.name });
      await fetch(`${ENV.API_BASE_URL}/api/app/live/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          username: senderName,
          message: giftPayload,
          avatar: resolveProfileImageUrl(currentUserProfileImage) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50',
        }),
      }).catch(() => {});
      triggerGiftAnimation(senderName, gift.imageUrl, gift.name);
      addFloatingHeart();
      setShowGifts(false);
    } catch {
      Alert.alert('Error', 'Unable to send gift');
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !sessionId) return;
    // Track message sent
    const prevMsg = parseFloat(await AsyncStorage.getItem('pendingMessageSent') || '0');
    await AsyncStorage.setItem('pendingMessageSent', String(prevMsg + 1));
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
    
    // Load mic requests and active mic users
    if (role === 'host') {
      loadMicRequests();
    }
    loadActiveMicUsers();
  };

  const loadMessages = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/messages/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const regularComments: any[] = [];
          data.forEach((msg: any) => {
            try {
              const parsed = JSON.parse(msg.message);
              if (parsed.__gift && msg.id && !processedGiftMessages.current.has(msg.id)) {
                processedGiftMessages.current.add(msg.id);
                // Only show gift animation if this is a new message (not from rejoining)
                const messageAge = Date.now() - new Date(msg.createdAt || msg.timestamp || 0).getTime();
                if (messageAge < 30000) { // Only show gifts from last 30 seconds
                  triggerGiftAnimation(msg.user, parsed.giftImageUrl, parsed.giftName);
                }
              }
            } catch {
              regularComments.push(msg);
            }
          });
          setLiveComments(regularComments.slice(-5));
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
    const kickCheckInterval = role === 'viewer' ? setInterval(checkIfKicked, 3000) : null;
    if (!startedAtRef.current) {
      startedAtRef.current = Date.now();
    }
    const syncElapsedTime = () => {
      if (!startedAtRef.current) return;
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAtRef.current) / 1000));
      setElapsedTime(elapsedSeconds);
    };
    syncElapsedTime();
    timerIntervalRef.current = setInterval(syncElapsedTime, 1000);
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (kickCheckInterval) clearInterval(kickCheckInterval);
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

  const toggleHostMute = async () => {
    const engine = engineRef.current;
    if (!engine || role !== 'viewer') return;
    try {
      const nextMuted = !isHostMuted;
      // Mute all remote audio streams (including host)
      await engine.muteAllRemoteAudioStreams(nextMuted);
      setIsHostMuted(nextMuted);
    } catch (e) {
      console.error('Toggle host mute error:', e);
    }
  };

  const { startLive, minimizeLive, clearLive, liveSession } = useLive();
  const endLiveRef = useRef<() => Promise<void>>(async () => {});
  const keepAliveRef = useRef(false);

  useEffect(() => {
    if (role === 'host') {
      const existingStartedAt = liveSession?.sessionId === (sessionId || '') ? liveSession.startedAt : undefined;
      const startedAt = existingStartedAt || Date.now();
      startedAtRef.current = startedAt;
      startLive({
        type: 'audio',
        title,
        hostUsername,
        sessionId: sessionId || '',
        routeParams: params as Record<string, string>,
        endLive: () => endLiveRef.current(),
        startedAt,
      });
    }
  }, []);

  const handleMinimize = () => {
    if (role === 'host') {
      keepAliveRef.current = true;
      minimizeLive();
    } else {
      endLive();
    }
    router.back();
  };

  const endLive = async () => {
    clearLive();
    try {
      if (role === 'host' && sessionId && userId && !keepAliveRef.current) {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        });
      } else if (role === 'viewer' && sessionId) {
        await fetch(`${ENV.API_BASE_URL}/api/app/live/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userId }),
        });
      }
    } catch {
    } finally {
      if (!keepAliveRef.current) {
        await cleanupAgora();
      }
      router.back();
    }
  };
  endLiveRef.current = endLive;

  // Mic Request Functions
  const requestMic = async () => {
    if (role !== 'viewer' || !sessionId || !userId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/mic/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userId }),
      });
      if (res.ok) {
        setHasPendingMicRequest(true);
        Alert.alert('Request Sent', 'Your mic request has been sent to the host.');
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'Failed to send mic request');
      }
    } catch {
      Alert.alert('Error', 'Failed to send mic request');
    }
  };

  const loadMicRequests = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/mic/requests/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMicRequests(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const loadActiveMicUsers = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/mic/active/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveMicUsers(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const respondToMicRequest = async (requestId: number, action: 'accept' | 'reject') => {
    if (role !== 'host' || !sessionId || !userId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/mic/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, hostUserId: userId, requestId, action }),
      });
      if (res.ok) {
        loadMicRequests();
        loadActiveMicUsers();
      }
    } catch {}
  };

  const removeFromMic = async (targetUserId: string) => {
    if (role !== 'host' || !sessionId || !userId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/mic/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, hostUserId: userId, targetUserId }),
      });
      if (res.ok) {
        loadActiveMicUsers();
      }
    } catch {}
  };

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBackPress = () => {
      if (role === 'host') {
        Alert.alert('End Live Session', 'Do you want to end this live session?', [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => endLiveRef.current() },
        ]);
      } else {
        Alert.alert('Leave Live Session', 'Do you want to leave this live session?', [
          { text: 'No', style: 'cancel' },
          { text: 'Yes', style: 'destructive', onPress: () => endLiveRef.current() },
        ]);
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [role]);

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
        <TouchableOpacity style={styles.backButton} onPress={handleMinimize}>
          <Ionicons name="chevron-down" size={24} color="white" />
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
        {liveComments.map((comment) => {
          const isSystemMsg = comment.isSystemMessage === true;
          return (
            <View key={comment.id} style={isSystemMsg ? styles.systemMessageItem : styles.commentItem}>
              {!isSystemMsg && <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />}
              <View style={isSystemMsg ? styles.systemMessageBubble : styles.commentBubble}>
                {isSystemMsg ? (
                  <Text style={styles.systemMessageText}>{comment.message}</Text>
                ) : (
                  <>
                    <Text style={styles.commentUser}>@{comment.user}</Text>
                    <Text style={styles.commentText}>{comment.message}</Text>
                  </>
                )}
              </View>
            </View>
          );
        })}
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

              <TouchableOpacity style={styles.actionButton} onPress={() => { setViewerSearch(''); loadViewers(); setShowViewers(true); }}>
                <Ionicons name="people" size={20} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, micRequests.length > 0 && { backgroundColor: 'rgba(255,215,0,0.3)' }]} 
                onPress={() => { loadMicRequests(); setShowMicRequests(true); }}
              >
                <Ionicons 
                  name="mic" 
                  size={20} 
                  color={micRequests.length > 0 ? '#FFD700' : 'white'} 
                />
                {micRequests.length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{micRequests.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {activeMicUsers.length > 0 && (
                <TouchableOpacity style={styles.actionButton} onPress={() => setShowActiveMicUsers(true)}>
                  <Ionicons name="radio" size={20} color="white" />
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{activeMicUsers.length}</Text>
                  </View>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.actionButton} onPress={endLive}>
                <Ionicons name="stop-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.viewerBottomRow}>
            <View style={styles.viewerInputContainer}>
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
            
            <TouchableOpacity 
              style={[styles.actionButton, isHostMuted && styles.mutedButton]} 
              onPress={toggleHostMute}
            >
              <Ionicons 
                name={isHostMuted ? "volume-mute" : "volume-high"} 
                size={20} 
                color="white" 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, hasPendingMicRequest && { backgroundColor: 'rgba(255,215,0,0.3)' }]} 
              onPress={requestMic}
              disabled={hasPendingMicRequest}
            >
              <Ionicons 
                name="mic" 
                size={20} 
                color={hasPendingMicRequest ? '#FFD700' : 'white'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleGift}>
              <Ionicons name="gift" size={20} color="#ffd93d" />
            </TouchableOpacity>
            
            {isRoomAdmin && (
              <TouchableOpacity style={styles.actionButton} onPress={() => { setViewerSearch(''); loadViewers(); setShowViewers(true); }}>
                <Ionicons name="people" size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      {giftAnimation && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.giftAnimOverlay,
            {
              opacity: giftAnimOpacity,
              transform: [{ scale: giftAnimScale }, { translateY: giftAnimY }],
            },
          ]}
        >
          {giftAnimation.giftImageUrl ? (
            <Image source={{ uri: giftAnimation.giftImageUrl }} style={styles.giftAnimImage} />
          ) : (
            <Text style={{ fontSize: 80 }}>🎁</Text>
          )}
          <Text style={styles.giftAnimName}>{giftAnimation.giftName}</Text>
          <Text style={styles.giftAnimSender}>from @{giftAnimation.senderName}</Text>
        </Animated.View>
      )}

      {videoGift && (
        <VideoGiftPlayer
          videoUrl={videoGift.videoUrl}
          giftName={videoGift.giftName}
          senderName={videoGift.senderName}
          onComplete={() => setVideoGift(null)}
        />
      )}

      {/* Mic Requests Modal */}
      <Modal visible={showMicRequests} transparent animationType="slide" onRequestClose={() => setShowMicRequests(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mic Requests ({micRequests.length})</Text>
              <TouchableOpacity onPress={() => setShowMicRequests(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            {micRequests.length === 0 ? (
              <Text style={styles.emptyText}>No pending mic requests</Text>
            ) : (
              <FlatList
                data={micRequests}
                keyExtractor={item => item.id.toString()}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <View style={styles.micRequestRow}>
                    <Image
                      source={{ uri: resolveProfileImageUrl(item.requesterProfileImage) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50' }}
                      style={styles.viewerAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewerName}>@{item.requesterUsername || item.requesterUserId}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Wants to join mic</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => respondToMicRequest(item.id, 'accept')}
                    >
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => respondToMicRequest(item.id, 'reject')}
                    >
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Active Mic Users Modal */}
      <Modal visible={showActiveMicUsers} transparent animationType="slide" onRequestClose={() => setShowActiveMicUsers(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>On Mic ({activeMicUsers.length})</Text>
              <TouchableOpacity onPress={() => setShowActiveMicUsers(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            {activeMicUsers.length === 0 ? (
              <Text style={styles.emptyText}>No users on mic</Text>
            ) : (
              <FlatList
                data={activeMicUsers}
                keyExtractor={item => item.userId}
                style={{ maxHeight: 400 }}
                renderItem={({ item }) => (
                  <View style={styles.micUserRow}>
                    <Image
                      source={{ uri: resolveProfileImageUrl(item.profileImage) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50' }}
                      style={styles.viewerAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewerName}>@{item.username || item.userId}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>On mic</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeMicBtn}
                      onPress={() => Alert.alert('Remove from Mic', `Remove ${item.username} from mic?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove', style: 'destructive', onPress: () => removeFromMic(item.userId) },
                      ])}
                    >
                      <Text style={styles.removeMicBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showViewers} transparent animationType="slide" onRequestClose={() => setShowViewers(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { marginBottom: keyboardHeight }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viewers ({viewersList.length})</Text>
              <TouchableOpacity onPress={() => setShowViewers(false)}>
                <Text style={styles.modalClose}>×</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.viewerSearch}
              placeholder="Search by username or ID..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={viewerSearch}
              onChangeText={setViewerSearch}
              autoCapitalize="none"
            />
            {filteredViewers.length === 0 ? (
              <Text style={styles.emptyText}>{viewerSearch ? 'No viewers found' : 'No viewers yet'}</Text>
            ) : (
              <FlatList
                data={filteredViewers}
                keyExtractor={item => item.userId}
                style={{ maxHeight: keyboardHeight > 0 ? 150 : 400 }}
                renderItem={({ item }) => (
                  <View style={styles.viewerRow}>
                    <Image
                      source={{ uri: resolveProfileImageUrl(item.profileImage) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50' }}
                      style={styles.viewerAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.viewerName}>@{item.username || item.userId}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{item.userId}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.kickBtn}
                      onPress={() => Alert.alert('Kick', `Remove ${item.username} from this live?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Kick', style: 'destructive', onPress: () => kickViewer(item.userId) },
                      ])}
                    >
                      <Text style={styles.kickBtnText}>Kick</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.banBtn}
                      onPress={() => Alert.alert('Ban', `Ban ${item.username} from all your lives?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Ban', style: 'destructive', onPress: () => banViewer(item.userId) },
                      ])}
                    >
                      <Text style={styles.banBtnText}>Ban</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

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
                        isVideoFile(item.imageUrl) ? (
                          <WebView
                            source={{
                              html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                  <style>
                                    body { margin: 0; padding: 0; background: transparent; }
                                    video { width: 100%; height: 100%; object-fit: cover; border-radius: 14px; }
                                  </style>
                                </head>
                                <body>
                                  <video autoplay muted loop playsInline>
                                    <source src="${item.imageUrl}" type="video/mp4">
                                  </video>
                                </body>
                                </html>
                              `
                            }}
                            style={styles.giftVideo}
                            javaScriptEnabled
                            domStorageEnabled
                            allowsInlineMediaPlayback
                            mediaPlaybackRequiresUserAction={false}
                            scrollEnabled={false}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                          />
                        ) : (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.giftImage}
                          />
                        )
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
  systemMessageItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemMessageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.4)',
  },
  systemMessageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
    textAlign: 'center',
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
  viewerInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'rgba(15,15,16,0.98)',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalClose: {
    color: 'white',
    fontSize: 22,
    fontWeight: '700',
  },
  viewerSearch: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: 'white',
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    paddingVertical: 20,
    textAlign: 'center',
  },
  viewerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  viewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  viewerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  kickBtn: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  kickBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  banBtn: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  banBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
  giftVideo: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'transparent',
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
  videoThumbnailContainer: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  videoThumbnailIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  videoLabel: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  giftAnimOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  giftAnimImage: {
    width: 160,
    height: 160,
    borderRadius: 24,
    marginBottom: 12,
  },
  giftAnimName: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  giftAnimSender: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  micRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  micUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  acceptBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rejectBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  removeMicBtn: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  removeMicBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});
