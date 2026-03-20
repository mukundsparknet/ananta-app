import { StyleSheet, ScrollView, TouchableOpacity, View, Image, Dimensions, Alert, ActivityIndicator, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';
import { useFocusEffect } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function BlockScreen() {
  const { isDark } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getUserId = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') return window.localStorage.getItem('userId');
    return AsyncStorage.getItem('userId').catch(() => null);
  };

  const fetchBlockedUsers = async (userId: string) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/block/list/${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const ids: string[] = data.blockedUsers || [];

      // Fetch profile for each blocked user
      const profiles = await Promise.all(
        ids.map(async (id) => {
          try {
            const r = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${id}`);
            if (!r.ok) return { userId: id, username: id, profileImage: null };
            const d = await r.json();
            return {
              userId: id,
              username: d.user?.username || id,
              profileImage: d.user?.profileImage || null,
            };
          } catch {
            return { userId: id, username: id, profileImage: null };
          }
        })
      );
      setBlockedUsers(profiles);
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setLoading(true);
        const id = await getUserId();
        setCurrentUserId(id);
        if (id) await fetchBlockedUsers(id);
        setLoading(false);
      };
      init();
    }, [])
  );

  const resolveUri = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('http') || value.startsWith('data:')) return value;
    if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
    return null;
  };

  const handleUnblock = (targetId: string, name: string) => {
    Alert.alert('Unblock User', `Are you sure you want to unblock ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        style: 'destructive',
        onPress: async () => {
          try {
            await fetch(`${ENV.API_BASE_URL}/api/app/block/toggle`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blockerId: currentUserId, targetId }),
            });
            setBlockedUsers(prev => prev.filter(u => u.userId !== targetId));
          } catch {
            Alert.alert('Error', 'Failed to unblock user');
          }
        },
      },
    ]);
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Blocked Users</ThemedText>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={isDark ? ['#F7C14D', '#E6B143'] : ['#127d96', '#0a5d75']}
          style={styles.infoCard}
        >
          <Ionicons name="information-circle" size={24} color={isDark ? 'black' : 'white'} style={{ marginRight: 12 }} />
          <ThemedText style={[styles.infoText, { color: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            Blocked users cannot message you or join your live streams.
          </ThemedText>
        </LinearGradient>

        {loading ? (
          <ActivityIndicator size="large" color={isDark ? '#F7C14D' : '#127d96'} style={{ marginTop: 60 }} />
        ) : blockedUsers.length > 0 ? (
          <View style={styles.usersList}>
            {blockedUsers.map((user) => {
              const uri = resolveUri(user.profileImage);
              return (
                <View key={user.userId} style={[styles.userItem, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                  <TouchableOpacity
                    style={styles.userLeft}
                    onPress={() => router.push({ pathname: '/user-profile', params: { userId: user.userId } })}
                  >
                    <View style={styles.imageContainer}>
                      {uri ? (
                        <Image source={{ uri }} style={styles.profileImage} />
                      ) : (
                        <View style={[styles.profileImage, { backgroundColor: isDark ? '#444' : '#ddd', justifyContent: 'center', alignItems: 'center' }]}>
                          <Ionicons name="person" size={24} color={isDark ? '#888' : '#aaa'} />
                        </View>
                      )}
                      <View style={styles.blockedBadge}>
                        <Ionicons name="ban" size={12} color="white" />
                      </View>
                    </View>
                    <View style={styles.userInfo}>
                      <ThemedText style={[styles.userName, { color: isDark ? 'white' : '#333' }]}>{user.username}</ThemedText>
                      <ThemedText style={[styles.userHandle, { color: isDark ? '#aaa' : '#888' }]}>@{user.username}</ThemedText>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.unblockButton} onPress={() => handleUnblock(user.userId, user.username)}>
                    <LinearGradient colors={['#DC3545', '#C82333']} style={styles.unblockGradient}>
                      <Ionicons name="lock-open-outline" size={16} color="white" />
                      <ThemedText style={styles.unblockText}>Unblock</ThemedText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="ban" size={64} color={isDark ? '#555' : '#ccc'} />
            <ThemedText style={[styles.emptyText, { color: isDark ? '#ccc' : '#666' }]}>No blocked users</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: isDark ? '#999' : '#888' }]}>
              Users you block will appear here
            </ThemedText>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, height: 120,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { width: 24 },
  content: { flex: 1, paddingTop: 20 },
  infoCard: {
    marginHorizontal: 20, borderRadius: 15, padding: 20, marginBottom: 25,
    flexDirection: 'row', alignItems: 'center',
  },
  infoText: { flex: 1, fontSize: 14, lineHeight: 20 },
  usersList: { paddingHorizontal: 20, gap: 15 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  userLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  imageContainer: { position: 'relative', marginRight: 14 },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  blockedBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#DC3545', width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', marginBottom: 3 },
  userHandle: { fontSize: 13 },
  unblockButton: { borderRadius: 20, overflow: 'hidden' },
  unblockGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9, gap: 6,
  },
  unblockText: { color: 'white', fontSize: 13, fontWeight: '600' },
  emptyContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 80, paddingHorizontal: 40, gap: 12,
  },
  emptyText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  emptySubtext: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
