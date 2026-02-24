import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { ENV } from '@/config/env';


const resolveAvatarUri = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${trimmed}`;
  if (trimmed.length > 100) return `data:image/jpeg;base64,${trimmed}`;
  return trimmed;
};

const initialFollowing = [
  { id: '1', name: 'Alex Brown', username: '@alexb', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '2', name: 'Emma Davis', username: '@emmad', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '3', name: 'Chris Wilson', username: '@chrisw', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '4', name: 'Lisa Garcia', username: '@lisag', avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face', isFollowing: true },
];

export default function FollowingScreen() {
  const { isDark } = useTheme();
  const [following, setFollowing] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const mapApiFollowing = (raw: any[]): any[] => {
    console.log('[Following] mapApiFollowing raw:', raw);
    return raw.map((item, index) => {
      const rawAvatar =
        item.avatar ??
        item.profileImage ??
        initialFollowing[index % initialFollowing.length].avatar;
      const avatar = resolveAvatarUri(rawAvatar);
      return {
        id: String(item.userId ?? item.id ?? index),
        name: item.name ?? item.fullName ?? 'User',
        username: item.username ? `@${item.username}` : (item.handle ?? '@user'),
        avatar,
        isFollowing: item.isFollowing === undefined ? true : !!item.isFollowing,
      };
    });
  };

  const fetchFollowing = async () => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    if (!userId) {
      userId = 'guest';
    }
    console.log('[Following] fetchFollowing for userId:', userId);
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
      console.log('[Following] profile response status:', res.status);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const raw = (data && Array.isArray(data.followingList)) ? data.followingList : [];
      console.log('[Following] followingList length:', Array.isArray(raw) ? raw.length : 'not array');
      if (!Array.isArray(raw)) {
        return;
      }
      const mapped = mapApiFollowing(raw);
      console.log('[Following] mapped following length:', mapped.length);
      setFollowing(mapped);
    } catch (err) {
      console.log('[Following] fetchFollowing error:', err);
    }
  };

  useEffect(() => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    if (!userId) {
      userId = 'guest';
    }
    setCurrentUserId(userId);
    fetchFollowing();
    const interval = setInterval(fetchFollowing, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUserId || !targetUserId) {
      return;
    }
    console.log('[Following] handleToggleFollow', { currentUserId, targetUserId });
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/follow/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          followerId: currentUserId,
          followeeId: targetUserId,
        }),
      });
      console.log('[Following] toggle response status:', response.status);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      console.log('[Following] toggle response body:', data);
      if (typeof data.isFollowing !== 'boolean') {
        return;
      }
      setFollowing(prev =>
        prev.map(f =>
          String(f.id) === String(targetUserId)
            ? { ...f, isFollowing: data.isFollowing }
            : f
        )
      );
    } catch {
    }
  };

  const renderFollowing = ({ item }) => (
    <View style={[styles.followingItem, { backgroundColor: isDark ? '#333' : 'white' }]}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={[styles.name, { color: isDark ? 'white' : '#333' }]}>{item.name}</Text>
        <Text style={[styles.username, { color: isDark ? '#ccc' : '#666' }]}>{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={[
          styles.unfollowButton,
          {
            backgroundColor: item.isFollowing ? (isDark ? '#f7c14d' : '#e9ecef') : 'transparent',
            borderWidth: 1,
            borderColor: isDark ? '#f7c14d' : '#127d96',
          },
        ]}
        onPress={() => handleToggleFollow(item.id)}
      >
        <Text
          style={[
            styles.unfollowText,
            { color: item.isFollowing ? (isDark ? 'black' : '#333') : (isDark ? '#f7c14d' : '#127d96') },
          ]}
        >
          {item.isFollowing ? 'Unfollow' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Following</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <FlatList
        data={following}
        renderItem={renderFollowing}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>
            Not following anyone yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    height: 120,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  placeholder: {
    width: 24,
  },
  listContainer: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  followingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
  },
  unfollowButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  unfollowText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
