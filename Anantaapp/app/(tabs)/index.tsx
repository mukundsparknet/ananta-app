import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View, Animated, Text, StatusBar, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '@/config/env';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;
const scale = width / 375;

export default function HomeScreen() {
  const { isDark } = useTheme();
  const [followedKeys, setFollowedKeys] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerScrollRef = useRef<ScrollView>(null);
  const [videoLives, setVideoLives] = useState<any[]>([]);
  const [audioLives, setAudioLives] = useState<any[]>([]);
  const [heroItems, setHeroItems] = useState<any[]>([]);
  
  // Smooth animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Load real following list from backend to seed followedKeys
  const fetchFollowingIds = async (userId: string) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/following/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const ids: string[] = Array.isArray(data)
        ? data.map((f: any) => String(f.userId)).filter(Boolean)
        : [];
      setFollowedKeys(ids);
    } catch {}
  };

  const handleFollow = async (item: any) => {
    const followKey = (item as any).followKey || String(item.id);
    const isFollowing = followedKeys.includes(followKey);
    setFollowedKeys(prev =>
      isFollowing ? prev.filter(key => key !== followKey) : [...prev, followKey]
    );
    if (!item.hostUserId || !currentUserId) return;
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/follow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followerId: currentUserId,
          followeeId: item.hostUserId,
        }),
      });
    } catch {}
  };
  

  useEffect(() => {
    if (heroItems.length < 2) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentBannerIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % heroItems.length;
        bannerScrollRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [heroItems.length]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const id = window.localStorage.getItem('userId');
      setCurrentUserId(id);
      if (id) fetchFollowingIds(id);
    } else {
      AsyncStorage.getItem('userId').then(id => {
        setCurrentUserId(id);
        if (id) fetchFollowingIds(id);
      }).catch(() => {});
    }
  }, []);

  const resolveProfileImageSource = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('blob:')) return null;
    if (value.startsWith('http') || value.startsWith('data:')) return { uri: value };
    if (value.startsWith('/uploads/')) return { uri: `${ENV.API_BASE_URL}${value}` };
    if (value.length > 100) return { uri: `data:image/jpeg;base64,${value}` };
    return { uri: value };
  };

  const resolveHeroMediaUrl = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('blob:')) return null;
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
    if (value.length > 100) return `data:application/octet-stream;base64,${value}`;
    return value;
  };

  const fetchHeroItems = async () => {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/hero`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setHeroItems(items);
      setCurrentBannerIndex(prevIndex => (items.length === 0 || prevIndex >= items.length ? 0 : prevIndex));
    } catch {
    }
  };

  const fetchHomeLiveSessions = async () => {
    try {
      const uid = currentUserId || '';
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/live/list${uid ? `?userId=${uid}` : ''}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const sessions = Array.isArray(data.sessions) ? data.sessions : [];
      const videoSessions = sessions.filter((s: any) => s.type === 'VIDEO');
      const audioSessions = sessions.filter((s: any) => s.type === 'AUDIO');

      const mapToCards = (items: any[]) => {
        if (!items.length) return [];
        return items.map((session: any) => {
          const isVideo = session.type === 'VIDEO';
          const viewers = session.viewerCount || 0;
          return {
            id: session.sessionId ?? session.id,
            sessionId: session.sessionId,
            hostUserId: session.hostUserId,
            title: session.title || '#LIVE',
            user: session.username || session.hostUserId || 'LIVE',
            location: session.location || session.country || 'Unknown',
            views: isVideo ? String(viewers) : undefined,
            listeners: !isVideo ? String(viewers) : undefined,
            image: resolveProfileImageSource(session.profileImage),
            followKey:
              session.hostUserId != null
                ? String(session.hostUserId)
                : session.sessionId ?? session.id ?? undefined,
          };
        });
      };

      setVideoLives(mapToCards(videoSessions));
      setAudioLives(mapToCards(audioSessions));
    } catch {
    }
  };

  useEffect(() => {
    fetchHomeLiveSessions();
    const interval = setInterval(fetchHomeLiveSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchHeroItems();
    const interval = setInterval(fetchHeroItems, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentVideos = videoLives;
  const currentAudios = audioLives;

  const hasLive = activeTab === 'video' ? videoLives.length > 0 : audioLives.length > 0;
  const hasHero = heroItems.length > 0;
  const getCurrentList = () => (activeTab === 'video' ? currentVideos : currentAudios);
  const currentList = getCurrentList();
  const primaryItem = currentList[0];
  const extraItem = currentList[5];
  const resolveImage = (item: any) => item?.image ?? null;
  const renderImage = (source: any, style: any) =>
    source ? <Image source={source} style={style} /> : <View style={[style, styles.imagePlaceholder, { backgroundColor: isDark ? '#222' : '#e5e7eb' }]} />;

  const handleJoinFromHome = async (item: any, type: 'video' | 'audio') => {
    if (!item.sessionId) {
      if (type === 'video') {
        router.push({
          pathname: '/live/video',
          params: {
            title: item.title,
            user: item.user,
            location: item.location,
            views: (item as any).views,
            image: JSON.stringify(item.image)
          }
        });
      } else {
        router.push({
          pathname: '/live/audio',
          params: {
            title: item.title,
            user: item.user,
            location: item.location,
            listeners: (item as any).listeners,
            image: JSON.stringify(item.image)
          }
        });
      }
      return;
    }

    try {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      } else {
        try {
          userId = await AsyncStorage.getItem('userId');
        } catch { }
      }
      if (!userId) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const response = await fetch(`${ENV.API_BASE_URL}/api/app/live/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: item.sessionId,
          userId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        Alert.alert('Cannot Join', errData.message || 'Unable to join live session');
        return;
      }

      const data = await response.json();
      
      // Get current user profile info for messages
      let username = '';
      let profileImage = '';
      try {
        const profileRes = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          username = profileData.user?.username || '';
          profileImage = profileData.user?.profileImage || '';
        }
      } catch { }
      
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
        hostUid: String(data.hostUid || '0'),
        isFollowing: data.isFollowing,
        username: String(username),
        profileImage: String(profileImage),
      };

      if (type === 'video') {
        router.push({ pathname: '/live/video', params });
      } else {
        router.push({ pathname: '/live/audio', params });
      }
    } catch {
      Alert.alert('Error', 'Something went wrong while joining live');
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>ANANTA</Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/search')}>
              <Ionicons name="search" size={22} color={isDark ? 'black' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notification')}>
              <Ionicons name="notifications-outline" size={22} color={isDark ? 'black' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/leaderboard')}>
              <Ionicons name="trophy-outline" size={22} color={isDark ? 'black' : 'white'} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </LinearGradient>
      
      {/* Modern Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)' }, activeTab === 'video' && { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]}
            onPress={() => setActiveTab('video')}
          >
            <Ionicons 
              name="videocam" 
              size={18} 
              color={activeTab === 'video' ? (isDark ? 'black' : 'white') : (isDark ? '#F7C14D' : '#127d96')} 
            />
            <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText, { color: activeTab === 'video' ? (isDark ? 'black' : 'white') : (isDark ? '#F7C14D' : '#127d96') }]}>Video Live</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)' }, activeTab === 'audio' && { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]}
            onPress={() => setActiveTab('audio')}
          >
            <Ionicons 
              name="musical-notes" 
              size={18} 
              color={activeTab === 'audio' ? (isDark ? 'black' : 'white') : (isDark ? '#F7C14D' : '#127d96')} 
            />
            <Text style={[styles.tabText, activeTab === 'audio' && styles.activeTabText, { color: activeTab === 'audio' ? (isDark ? 'black' : 'white') : (isDark ? '#F7C14D' : '#127d96') }]}>Audio Live</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {hasHero ? (
        <Animated.View style={[styles.bannerSection, { opacity: fadeAnim }]}>
          <ScrollView 
            ref={bannerScrollRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            pagingEnabled 
            style={styles.bannerContainer}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
              setCurrentBannerIndex(newIndex);
            }}
          >
            {heroItems.map((item: any, index: number) => {
              const mediaUrl = resolveHeroMediaUrl(item.mediaUrl);
              const isVideo = String(item.mediaType || '').toUpperCase() === 'VIDEO';
              return (
                <View key={item.id ?? index} style={styles.featuredCard}>
                  {isVideo && mediaUrl ? (
                    <Video
                      source={{ uri: mediaUrl }}
                      style={styles.featuredImage}
                      resizeMode="cover"
                      shouldPlay={index === currentBannerIndex}
                      isLooping
                      isMuted
                    />
                  ) : mediaUrl ? (
                    <Image source={{ uri: mediaUrl }} style={styles.featuredImage} />
                  ) : (
                    <View style={[styles.featuredImage, styles.imagePlaceholder, { backgroundColor: isDark ? '#222' : '#e5e7eb' }]} />
                  )}
                  <View style={styles.heroOverlay}>
                    {item.title ? (
                      <Text style={styles.heroTitle}>{item.title}</Text>
                    ) : null}
                    {item.subtitle ? (
                      <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  {isVideo ? (
                    <View style={styles.featuredOverlay}>
                      <View style={[styles.playButton, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                        <Ionicons name="play" size={24} color="white" />
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
          
          {/* Banner Indicators */}
          <View style={styles.bannerIndicators}>
            {heroItems.map((_, index) => (
              <View 
                key={index} 
                style={[styles.indicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.3)' : 'rgba(18,125,150,0.3)' }, currentBannerIndex === index && { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]} 
              />
            ))}
          </View>
        </Animated.View>
        ) : null}
        
        {hasLive ? (
        <Animated.View style={[styles.contentGrid, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.leftColumn}>
            {/* Large card on left */}
            {primaryItem ? (
              <TouchableOpacity 
                style={[styles.largeCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                onPress={() => handleJoinFromHome(primaryItem, activeTab)}
              >
                <View style={styles.largeCardImageContainer}>
                  {renderImage(resolveImage(primaryItem), styles.largeCardImage)}
                  {activeTab === 'audio' && (
                    <View style={[styles.audioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                      <Ionicons name="musical-notes" size={24} color="white" />
                    </View>
                  )}
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>LIVE</Text>
                  </View>
                  <View style={styles.viewerCount}>
                    <Ionicons 
                      name={activeTab === 'video' ? 'eye' : 'headset'} 
                      size={14} 
                      color="white" 
                    />
                    <Text style={styles.viewerText}>
                      {activeTab === 'video'
                        ? `${(primaryItem as any).views ?? 0}`
                        : `${(primaryItem as any).listeners ?? 0}`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.largeCardContent}>
                  <Text style={[styles.largeCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={2}>
                    {primaryItem.title}
                  </Text>
                  
                  <View style={styles.userSection}>
                    {renderImage(resolveImage(primaryItem), styles.userAvatar)}
                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: isDark ? '#ccc' : '#666' }]}>
                        {primaryItem.user}
                      </Text>
                      <Text style={[styles.userLocation, { color: isDark ? '#888' : '#999' }]}>
                        {primaryItem.location}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={[
                        styles.followBtn,
                        { backgroundColor: isDark ? '#F7C14D' : '#127d96' },
                        followedKeys.includes((primaryItem as any).followKey || String(primaryItem.id)) && styles.followingBtn
                      ]}
                      onPress={() => handleFollow(primaryItem)}
                    >
                      <Text style={[styles.followBtnText, { color: isDark ? 'black' : 'white' }]}>
                        {followedKeys.includes((primaryItem as any).followKey || String(primaryItem.id)) ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ) : null}
            
            {/* Two medium cards below large card */}
            <View style={styles.mediumCardsRow}>
              {currentList.slice(5, 7).map((item, index) => (
                <TouchableOpacity 
                  key={item.id || item.sessionId || index} 
                  style={[styles.mediumCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                  onPress={() => handleJoinFromHome(item, activeTab)}
                >
                  <View style={styles.mediumCardImageContainer}>
                    {renderImage(resolveImage(item), styles.mediumCardImage)}
                    {activeTab === 'audio' && (
                      <View style={[styles.smallAudioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                        <Ionicons name="musical-notes" size={16} color="white" />
                      </View>
                    )}
                    <View style={styles.smallLiveTag}>
                      <Text style={styles.smallLiveTagText}>LIVE</Text>
                    </View>
                  </View>
                  
                  <View style={styles.mediumCardContent}>
                    <Text style={[styles.mediumCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.smallUserName, { color: isDark ? '#ccc' : '#666' }]}>
                      {item.user}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Two additional medium cards below */}
            <View style={styles.mediumCardsRow}>
              {currentList.slice(7, 9).map((item, index) => (
                <TouchableOpacity 
                  key={item.id || item.sessionId || index} 
                  style={[styles.mediumCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                  onPress={() => handleJoinFromHome(item, activeTab)}
                >
                  <View style={styles.mediumCardImageContainer}>
                    {renderImage(resolveImage(item), styles.mediumCardImage)}
                    {activeTab === 'audio' && (
                      <View style={[styles.smallAudioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                        <Ionicons name="musical-notes" size={16} color="white" />
                      </View>
                    )}
                    <View style={styles.smallLiveTag}>
                      <Text style={styles.smallLiveTagText}>LIVE</Text>
                    </View>
                  </View>
                  
                  <View style={styles.mediumCardContent}>
                    <Text style={[styles.mediumCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.smallUserName, { color: isDark ? '#ccc' : '#666' }]}>
                      {item.user}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            {/* Three smaller cards on right */}
            {currentList.slice(1, 4).map((item, index) => (
              <TouchableOpacity 
                key={item.id || item.sessionId || index} 
                style={[styles.smallCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                onPress={() => handleJoinFromHome(item, activeTab)}
              >
                <View style={styles.smallCardImageContainer}>
                  {renderImage(resolveImage(item), styles.smallCardImage)}
                  {activeTab === 'audio' && (
                    <View style={[styles.smallAudioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                      <Ionicons name="musical-notes" size={16} color="white" />
                    </View>
                  )}
                  <View style={styles.smallLiveTag}>
                    <Text style={styles.smallLiveTagText}>LIVE</Text>
                  </View>
                </View>
                
                <View style={styles.smallCardContent}>
                  <Text style={[styles.smallCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={[styles.smallUserName, { color: isDark ? '#ccc' : '#666' }]}>
                    {item.user}
                  </Text>
                  <Text style={[styles.smallViewerText, { color: isDark ? '#888' : '#999' }]}>
                    {activeTab === 'video' ? `${(item as any).views} views` : `${(item as any).listeners} listening`}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Music session card moved below */}
            {extraItem ? (
              <TouchableOpacity 
                style={[styles.smallCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
                onPress={() => handleJoinFromHome(extraItem, activeTab)}
              >
                <View style={styles.smallCardImageContainer}>
                  {renderImage(resolveImage(extraItem), styles.smallCardImage)}
                  {activeTab === 'audio' && (
                    <View style={[styles.smallAudioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                      <Ionicons name="musical-notes" size={16} color="white" />
                    </View>
                  )}
                  <View style={styles.smallLiveTag}>
                    <Text style={styles.smallLiveTagText}>LIVE</Text>
                  </View>
                </View>
                
                <View style={styles.smallCardContent}>
                  <Text style={[styles.smallCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={1}>
                    {extraItem.title}
                  </Text>
                  <Text style={[styles.smallUserName, { color: isDark ? '#ccc' : '#666' }]}>
                    {extraItem.user}
                  </Text>
                  <Text style={[styles.smallViewerText, { color: isDark ? '#888' : '#999' }]}>
                    {activeTab === 'video'
                      ? `${(extraItem as any).views} views`
                      : `${(extraItem as any).listeners} listening`}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
        ) : (
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.emptyStateText, { color: isDark ? '#ccc' : '#666' }]}>
              No live sessions right now
            </Text>
          </View>
        )}
        
        <Animated.View style={[styles.bottomRow, { opacity: fadeAnim }]}>
          {currentList.slice(7, 8).map((item, index) => (
            <TouchableOpacity 
              key={item.id || item.sessionId || index} 
              style={[styles.bottomCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
              onPress={() => handleJoinFromHome(item, activeTab)}
            >
              <View style={styles.bottomCardImageContainer}>
                {renderImage(resolveImage(item), styles.bottomCardImage)}
                {activeTab === 'audio' && (
                  <View style={[styles.audioIndicator, { backgroundColor: isDark ? 'rgba(247,193,77,0.9)' : 'rgba(18,125,150,0.9)' }]}>
                    <Ionicons name="musical-notes" size={20} color="white" />
                  </View>
                )}
                <View style={styles.liveTag}>
                  <Text style={styles.liveTagText}>LIVE</Text>
                </View>
                <View style={styles.viewerCount}>
                  <Ionicons 
                    name={activeTab === 'video' ? 'eye' : 'headset'} 
                    size={12} 
                    color="white" 
                  />
                  <Text style={styles.viewerText}>
                    {activeTab === 'video' ? (item as any).views : (item as any).listeners}
                  </Text>
                </View>
              </View>
              
              <View style={styles.bottomCardContent}>
                <Text style={[styles.bottomCardTitle, { color: isDark ? 'white' : '#333' }]} numberOfLines={2}>
                  {item.title}
                </Text>
                
                <View style={styles.userSection}>
                  {renderImage(resolveImage(item), styles.userAvatar)}
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: isDark ? '#ccc' : '#666' }]}>
                      {item.user}
                    </Text>
                    <Text style={[styles.userLocation, { color: isDark ? '#888' : '#999' }]}>
                      {item.location}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[
                      styles.followBtn,
                      { backgroundColor: isDark ? '#F7C14D' : '#127d96' },
                      followedKeys.includes((item as any).followKey || String(item.id)) && styles.followingBtn
                    ]}
                    onPress={() => handleFollow(item)}
                  >
                    <Text style={[styles.followBtnText, { color: isDark ? 'black' : 'white' }]}>
                      {followedKeys.includes((item as any).followKey || String(item.id)) ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    flexGrow: 1,
    justifyContent: 'center',
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
    paddingHorizontal: 20,
    paddingBottom: height * 0.1,
  },
  bannerSection: {
    marginVertical: 20,
  },
  bannerContainer: {
    height: 200,
  },
  featuredCard: {
    width: width - 40,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 15,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    backgroundColor: '#e5e7eb',
  },
  featuredOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(18,125,150,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  heroTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },

  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(18,125,150,0.3)',
  },
  activeIndicator: {
    backgroundColor: '#127d96',
  },
  contentGrid: {
    flexDirection: 'row',
    gap: 15,
    paddingBottom: 20,
  },
  leftColumn: {
    flex: 1.2,
  },
  rightColumn: {
    flex: 0.8,
    gap: 10,
  },
  largeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  largeCardImageContainer: {
    position: 'relative',
    height: 220,
  },
  largeCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  largeCardContent: {
    padding: 16,
  },
  largeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 22,
  },
  smallCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  smallCardImageContainer: {
    position: 'relative',
    height: 85,
  },
  smallCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  smallCardContent: {
    padding: 8,
  },
  smallCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
  },
  smallUserName: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 2,
  },
  smallViewerText: {
    fontSize: 9,
  },
  smallAudioIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(18,125,150,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallLiveTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  smallLiveTagText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  mediumCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  mediumCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mediumCardImageContainer: {
    position: 'relative',
    height: 100,
  },
  mediumCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mediumCardContent: {
    padding: 10,
  },
  mediumCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 16,
  },
  bottomRow: {
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 20,
  },
  bottomCard: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomCardImageContainer: {
    position: 'relative',
    height: 120,
  },
  bottomCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomCardContent: {
    padding: 12,
  },
  bottomCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 18,
  },
  audioIndicator: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(18,125,150,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveTag: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveTagText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  viewerCount: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  userLocation: {
    fontSize: 10,
  },
  followBtn: {
    backgroundColor: '#127d96',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  followingBtn: {
    backgroundColor: '#666',
  },
  followBtnText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
