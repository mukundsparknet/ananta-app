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

const initialFollowers = [
  { id: '1', name: 'Raj Patel', username: '@rajpatel', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '2', name: 'Priya Shah', username: '@priyashah', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face', isFollowing: false },
  { id: '3', name: 'Arjun Modi', username: '@arjunmodi', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '4', name: 'Kavya Joshi', username: '@kavyajoshi', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', isFollowing: false },
  { id: '5', name: 'Dhruv Sharma', username: '@dhruvsharma', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face', isFollowing: true },
  { id: '6', name: 'Riya Mehta', username: '@riyamehta', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face', isFollowing: false },
];

export default function FollowersScreen() {
  const { isDark } = useTheme();
  const [followers, setFollowers] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const mapApiFollowers = (raw: any[]): any[] => {
    console.log('[Followers] mapApiFollowers raw:', raw);
    return raw.map((item, index) => {
      const rawId = String(item.userId ?? item.id ?? index);
      const name = item.name ?? item.fullName ?? item.username ?? 'User';
      const username =
        item.username && String(item.username).trim().length > 0
          ? `@${item.username}`
          : item.handle
          ? item.handle
          : '@user';
      const rawAvatar =
        item.avatar ??
        item.profileImage ??
        initialFollowers[index % initialFollowers.length].avatar;
      const avatar = resolveAvatarUri(rawAvatar);
      return {
        id: rawId,
        name,
        username,
        avatar,
        isFollowing: item.isFollowing === undefined ? false : !!item.isFollowing,
      };
    });
  };

  const fetchFollowers = async () => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    if (!userId) {
      userId = 'guest';
    }
    console.log('[Followers] fetchFollowers for userId:', userId);
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
      console.log('[Followers] profile response status:', res.status);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const raw = (data && Array.isArray(data.followersList)) ? data.followersList : [];
      console.log('[Followers] followersList length:', Array.isArray(raw) ? raw.length : 'not array');
      if (!Array.isArray(raw)) {
        return;
      }
      const mapped = mapApiFollowers(raw);
      console.log('[Followers] mapped followers length:', mapped.length);
      setFollowers(mapped);
    } catch (err) {
      console.log('[Followers] fetchFollowers error:', err);
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
    fetchFollowers();
    const interval = setInterval(fetchFollowers, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUserId || !targetUserId) {
      return;
    }
    console.log('[Followers] handleToggleFollow', { currentUserId, targetUserId });
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
      console.log('[Followers] toggle response status:', response.status);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      console.log('[Followers] toggle response body:', data);
      if (typeof data.isFollowing !== 'boolean') {
        return;
      }
      setFollowers(prev =>
        prev.map(f =>
          String(f.id) === String(targetUserId)
            ? { ...f, isFollowing: data.isFollowing }
            : f
        )
      );
    } catch {
    }
  };

  const renderFollower = ({ item }) => (
    <View style={[styles.followerItem, { backgroundColor: isDark ? '#333' : 'white' }]}>
      <Image 
        source={{ uri: item.avatar }} 
        style={styles.avatar}
        defaultSource={require('../assets/images/icon.png')}
        onError={() => console.log('Avatar failed to load for:', item.name)}
      />
      <View style={styles.userInfo}>
        <Text style={[styles.name, { color: isDark ? 'white' : '#333' }]}>{item.name}</Text>
        <Text style={[styles.username, { color: isDark ? '#ccc' : '#666' }]}>{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.followButton, { 
          backgroundColor: item.isFollowing ? (isDark ? '#f7c14d' : '#127d96') : 'transparent', 
          borderColor: isDark ? '#f7c14d' : '#127d96' 
        }]}
        onPress={() => handleToggleFollow(item.id)}
      >
        <Text style={[styles.followText, { 
          color: item.isFollowing ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96') 
        }]}>
          {item.isFollowing ? 'Following' : 'Follow'}
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
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Followers</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <FlatList
        data={followers}
        renderItem={renderFollower}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>
            No followers yet.
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
  followerItem: {
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
    borderWidth: 2,
    borderColor: '#ddd',
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
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
