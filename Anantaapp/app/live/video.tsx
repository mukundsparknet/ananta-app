import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, TextInput, TouchableOpacity, View, Text, KeyboardAvoidingView, Platform, Alert, Modal, FlatList, PermissionsAndroid } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { createAgoraEngine, RtcSurfaceView, ChannelProfileType, ClientRoleType } from '@/agoraClient';
import { ENV } from '@/config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function VideoLiveScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const title = (params.title as string) || 'Live session';
  const hostUsername = (params.hostUsername as string) || (params.user as string) || 'User';
  const hostProfileImage = (params.hostProfileImage as string) || '';
  const hostUserId = (params.hostUserId as string) || '';
  const hostCountry = (params.hostCountry as string) || '';
  const sessionId = params.sessionId as string | undefined;
  const channelName = params.channelName as string | undefined;
  const token = params.token as string | undefined;
  const appId = String(params.appId || '').trim();
  const userId = params.userId as string | undefined;
  // hostUid is the Agora UID the backend assigned to the host.
  // Both host and viewers need it: host joins with it, viewers subscribe to it.
  const hostUid = params.hostUid ? Number(params.hostUid) : 0;

  console.log('Video params:', { appId, channelName, token: token?.substring(0, 20), sessionId, hostUid });

  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
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
  const [giftAnimation, setGiftAnimation] = useState<{ senderName: string; giftImageUrl: string; giftName: string } | null>(null);
  const giftAnimScale = useRef(new Animated.Value(0)).current;
  const giftAnimY = useRef(new Animated.Value(0)).current;
  const giftAnimOpacity = useRef(new Animated.Value(0)).current;
  const shownGiftIds = useRef<Set<number>>(new Set());
  const resolvedHostProfileImage = resolveProfileImageUrl(hostProfileImage);

  const engineRef = useRef<any | null>(null);
  const role = (params.role as string) || 'host';

  const [liveComments, setLiveComments] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const animatedValues = useRef<{ [key: number]: Animated.Value }>({});
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const messagesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUsername = (params.username as string) || 'User';
  const currentUserProfileImage = (params.profileImage as string) || '';

  console.log('=== MESSAGE PARAMS ===');
  console.log('currentUsername:', currentUsername);
  console.log('currentUserProfileImage:', currentUserProfileImage);
  console.log('All params:', params);
  console.log('======================');

  // Fallback: If username is still 'User', try to fetch profile directly
  useEffect(() => {
    if (currentUsername === 'User' && userId) {
      console.log('Username is User, fetching profile for userId:', userId);
      fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log('Fetched profile in video screen:', data);
          if (data.user?.username) {
            console.log('Found username:', data.user.username);
          }
        })
        .catch(e => console.error('Profile fetch error in video:', e));
    }
  }, []);

  const comments: any[] = [];

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
        : (await AsyncStorage.getItem('userId')) || undefined;
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
          : await AsyncStorage.getItem('userId');
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

  const triggerGiftAnimation = (senderName: string, giftImageUrl: string, giftName: string) => {
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
        senderUserId = (await AsyncStorage.getItem('userId')) || undefined;
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

  const handleLike = async () => {
    setLikes(prev => prev + 1);
    setIsLiked(true);
    addFloatingHeart();
    
    // Send like to backend
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

  const sendMessage = async () => {
    if (!messageText.trim() || !sessionId) return;
    console.log('Sending message with username:', currentUsername, 'avatar:', currentUserProfileImage);
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
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  const requestMediaPermissions = async () => {
    if (Platform.OS === 'android') {
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
    }
    return true;
  };

  const initAgora = async () => {
    console.log('=== INIT AGORA START ===');
    console.log('AppId:', appId);
    console.log('Token:', token?.substring(0, 30));
    console.log('Channel:', channelName);
    console.log('HostUid:', hostUid);
    console.log('Role:', role);
    
    // CRITICAL DEBUG: Check if appId matches token
    if (token && !token.startsWith('006' + appId)) {
      console.error('❌ TOKEN MISMATCH!');
      console.error('Expected token to start with: 006' + appId);
      console.error('Actual token starts with:', token.substring(0, 35));
      Alert.alert('Token Error', 'App ID and token do not match. Please restart the app.');
      return;
    }
    
    if (!appId || appId === 'undefined' || appId === 'null' || !token || !channelName) {
      console.error('Missing params:', { appId, token: !!token, channelName });
      Alert.alert('Connection Error', 'Failed to connect to Agora');
      return;
    }

    try {
      console.log('Step 1: Requesting permissions...');
      const hasPermission = await requestMediaPermissions();
      if (!hasPermission) {
        console.error('Permissions denied');
        Alert.alert('Permission required', 'Camera and microphone permissions are needed.');
        return;
      }
      console.log('Step 1: Permissions granted');

      console.log('Step 2: Creating Agora engine...');
      const engine = await createAgoraEngine(appId);
      console.log('Step 2: Engine created successfully');
      engineRef.current = engine;

      console.log('Step 3: Setting channel profile...');
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
      console.log('Step 3: Channel profile set');
      
      console.log('Step 4: Setting client role...');
      const clientRole = role === 'viewer' ? ClientRoleType.ClientRoleAudience : ClientRoleType.ClientRoleBroadcaster;
      await engine.setClientRole(clientRole);
      console.log('Step 4: Client role set to', clientRole);

      console.log('Step 5: Enabling video...');
      await engine.enableVideo();
      console.log('Step 5: Video enabled');

      if (role === 'host') {
        console.log('Step 6: Starting preview (host only)...');
        await engine.startPreview();
        console.log('Step 6: Preview started');
      }

      console.log('Step 7: Registering event handlers...');
      engine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('[SUCCESS] Joined channel successfully');
          setJoined(true);
          // viewer joined a room
          if (role === 'viewer') {
            AsyncStorage.getItem('pendingRoomJoined').then(raw => {
              const prev = parseFloat(raw || '0');
              AsyncStorage.setItem('pendingRoomJoined', String(prev + 1));
            });
          }
        },
        onUserJoined: (_connection: any, uid: number) => {
          console.log('[EVENT] Remote user joined:', uid);
          setRemoteUid(uid);
          // host tracks unique viewers joined (stored as JSON array of UIDs)
          if (role === 'host') {
            AsyncStorage.getItem('pendingViewerJoinedUids').then(raw => {
              const uids: number[] = raw ? JSON.parse(raw) : [];
              if (!uids.includes(uid)) {
                uids.push(uid);
                AsyncStorage.setItem('pendingViewerJoinedUids', JSON.stringify(uids));
              }
            });
          }
        },
        onUserOffline: (_connection: any, uid: number) => {
          console.log('[EVENT] Remote user offline:', uid);
          const offlineUid = typeof uid === 'number' ? uid : _connection;
          setRemoteUid(prev => (prev === offlineUid ? null : prev));
          if (role === 'viewer' && offlineUid === hostUid) {
            if (statsIntervalRef.current) {
              clearInterval(statsIntervalRef.current);
              statsIntervalRef.current = null;
            }
            saveMinutes().then(() => cleanupAgora()).then(() => {
              Alert.alert('Live Ended', 'The host has left the session.', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            });
          }
        },
        onError: (error: any) => {
          console.error('[ERROR] Agora error:', error);
        },
      });
      console.log('Step 7: Event handlers registered');

      const joinUid = role === 'host' ? hostUid : 0;
      console.log('Step 8: Joining channel with UID:', joinUid);
      await engine.joinChannel(null, channelName, joinUid, {
        clientRoleType: clientRole,
      });
      console.log('Step 8: Join channel called successfully');
      console.log('=== INIT AGORA COMPLETE ===');
    } catch (e: any) {
      console.error('=== AGORA ERROR ===');
      console.error('Error message:', e.message);
      console.error('Error code:', e.code);
      console.error('Error stack:', e.stack);
      console.error('Full error:', JSON.stringify(e, null, 2));
      Alert.alert('Connection Error', 'Failed to connect to Agora');
    }
  };

  const cleanupAgora = async () => {
    const engine = engineRef.current;
    if (engine) {
      try {
        await engine.leaveChannel();
        await engine.release();
      } catch (e) {
        console.error('Cleanup error:', e);
      }
      engineRef.current = null;
    }
  };

  const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    initAgora();
    loadSessionStats();
    loadMessages();
    checkFollowStatus();
    statsIntervalRef.current = setInterval(loadSessionStats, 5000);
    messagesIntervalRef.current = setInterval(loadMessages, 2000);
    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => { elapsedTimeRef.current = prev + 1; return prev + 1; });
    }, 1000);
    return () => {
      if (statsIntervalRef.current) clearInterval(statsIntervalRef.current);
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      cleanupAgora();
    };
  }, []);

  const loadSessionStats = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/stats/${sessionId}`);
      if (res.status === 404) {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
        if (messagesIntervalRef.current) {
          clearInterval(messagesIntervalRef.current);
          messagesIntervalRef.current = null;
        }
        if (role === 'viewer') {
          await saveMinutes();
          await cleanupAgora();
          Alert.alert('Live Ended', 'The host has ended this live session.', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (typeof data.viewerCount === 'number') {
          setViewerCount(data.viewerCount);
        }
        if (typeof data.likes === 'number') {
          setLikes(data.likes);
        }
        if (role === 'viewer' && data.status && data.status.toUpperCase() === 'ENDED') {
          if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
          }
          if (messagesIntervalRef.current) {
            clearInterval(messagesIntervalRef.current);
            messagesIntervalRef.current = null;
          }
          await saveMinutes();
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
          const regularComments: any[] = [];
          data.forEach((msg: any) => {
            try {
              const parsed = JSON.parse(msg.message);
              if (parsed.__gift && msg.id && !shownGiftIds.current.has(msg.id)) {
                shownGiftIds.current.add(msg.id);
                triggerGiftAnimation(msg.user, parsed.giftImageUrl, parsed.giftName);
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

  const toggleCamera = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    try {
      await engine.switchCamera();
    } catch (e) {
      console.error('Toggle camera error:', e);
    }
  };

  const saveMinutes = async () => {
    const elapsedMinutes = elapsedTimeRef.current / 60;
    if (elapsedMinutes <= 0) return;
    if (role === 'viewer') {
      const prev = parseFloat(await AsyncStorage.getItem('pendingWatchMinutes') || '0');
      await AsyncStorage.setItem('pendingWatchMinutes', String(prev + elapsedMinutes));
    } else if (role === 'host') {
      const prev = parseFloat(await AsyncStorage.getItem('pendingLiveMinutes') || '0');
      await AsyncStorage.setItem('pendingLiveMinutes', String(prev + elapsedMinutes));
    }
    elapsedTimeRef.current = 0; // prevent double-saving
  };

  const endLive = async () => {
    try {
      await saveMinutes();
      if (role === 'host' && sessionId && userId) {
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
      } else if (role === 'viewer' && sessionId) {
        // Decrement viewer count when viewer leaves
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View style={styles.backgroundImage}>
        {joined && (
          <RtcSurfaceView
            canvas={{
              uid: role === 'host' ? 0 : (remoteUid || hostUid || 0),
            }}
            style={styles.videoSurface}
            zOrderMediaOverlay={false}
          />
        )}
        {!joined && (
          <View style={styles.webPlaceholder}>
            <Text style={styles.webPlaceholderText}>📹</Text>
            <Text style={styles.webPlaceholderSubtext}>Connecting...</Text>
          </View>
        )}
      </View>

      <View style={styles.overlay}>
        <View style={styles.header}>
          {role === 'viewer' ? (
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
                  <ThemedText style={styles.liveTitleText}>{title}</ThemedText>
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
          ) : role === 'host' ? (
            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={styles.liveBadge}>
                <Animated.View style={[styles.liveCircle, { transform: [{ scale: pulseAnim }] }]} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={endLive}
              >
                <ThemedText style={styles.closeText}>×</ThemedText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <ThemedText style={[styles.statIcon, { color: 'white' }]}>👁</ThemedText>
            <ThemedText style={styles.statText}>{viewerCount} Viewers</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>💛</ThemedText>
            <ThemedText style={styles.statText}>{likes.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statIcon}>⏱</ThemedText>
            <ThemedText style={styles.statText}>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}</ThemedText>
          </View>
          {!!hostCountry && (
            <View style={styles.statItem}>
              <ThemedText style={styles.statIcon}>📍</ThemedText>
              <ThemedText style={styles.statText}>{hostCountry}</ThemedText>
            </View>
          )}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  webPlaceholderText: {
    fontSize: 80,
    marginBottom: 20,
  },
  webPlaceholderSubtext: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  webPlaceholderHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
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
  liveTitleText: {
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
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  liveCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF0000',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
})
