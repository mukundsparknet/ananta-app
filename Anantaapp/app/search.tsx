import React, { useState, useEffect, useRef } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, FlatList,
  Image, Text, ActivityIndicator, StatusBar, Dimensions
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { ENV } from '@/config/env';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const { isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryRef = useRef('');

  useEffect(() => {
    AsyncStorage.getItem('userId').then(id => {
      setCurrentUserId(id);
      // Re-run search with correct userId if already typed
      if (id && queryRef.current.trim().length >= 2) search(queryRef.current, id);
    }).catch(() => {});
  }, []);

  const search = async (q: string, uid?: string | null) => {
    const userId = uid !== undefined ? uid : currentUserId;
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: q.trim() });
      if (userId) params.append('currentUserId', userId);
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/search/users?${params}`);
      if (res.ok) setResults(await res.json());
    } catch { }
    setLoading(false);
  };

  const onChangeText = (text: string) => {
    setQuery(text);
    queryRef.current = text;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 400);
  };

  const toggleFollow = async (item: any) => {
    if (!currentUserId) return;
    setResults(prev => prev.map(u =>
      u.userId === item.userId ? { ...u, isFollowing: !u.isFollowing } : u
    ));
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/follow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followeeId: item.userId }),
      });
    } catch { }
  };

  const resolveImage = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('http') || value.startsWith('data:')) return { uri: value };
    if (value.startsWith('/uploads/')) return { uri: `${ENV.API_BASE_URL}${value}` };
    if (value.length > 100) return { uri: `data:image/jpeg;base64,${value}` };
    return null;
  };

  const renderItem = ({ item }: { item: any }) => {
    const imgSrc = resolveImage(item.profileImage);
    const name = item.fullName || item.username || item.userId;
    const sub = item.username && item.fullName && item.username !== item.fullName
      ? `@${item.username}` : item.location || '';

    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
        onPress={() => router.push({ pathname: '/user-profile', params: { userId: item.userId } })}
        activeOpacity={0.7}
      >
        {imgSrc
          ? <Image source={imgSrc} style={styles.avatar} />
          : <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: isDark ? '#333' : '#e5e7eb' }]}>
              <Ionicons name="person" size={22} color={isDark ? '#888' : '#aaa'} />
            </View>
        }
        <View style={styles.info}>
          <Text style={[styles.name, { color: isDark ? 'white' : '#111' }]} numberOfLines={1}>{name}</Text>
          {!!sub && <Text style={[styles.sub, { color: isDark ? '#888' : '#999' }]} numberOfLines={1}>{sub}</Text>}
        </View>
        {currentUserId && currentUserId !== item.userId && (
          <TouchableOpacity
            style={[
              styles.followBtn,
              item.isFollowing
                ? { backgroundColor: isDark ? '#333' : '#e5e7eb' }
                : { backgroundColor: isDark ? '#F7C14D' : '#127d96' }
            ]}
            onPress={() => toggleFollow(item)}
          >
            <Text style={[
              styles.followText,
              { color: item.isFollowing ? (isDark ? '#ccc' : '#555') : (isDark ? 'black' : 'white') }
            ]}>
              {item.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#F7C14D' : '#127d96', paddingTop: height * 0.06 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <View style={[styles.searchBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.25)' }]}>
          <Ionicons name="search" size={18} color={isDark ? 'black' : 'white'} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: isDark ? 'black' : 'white' }]}
            placeholder="Search users..."
            placeholderTextColor={isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)'}
            value={query}
            onChangeText={onChangeText}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); queryRef.current = ''; setResults([]); }}>
              <Ionicons name="close-circle" size={18} color={isDark ? 'black' : 'white'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <ActivityIndicator
          style={{ marginTop: 30 }}
          color={isDark ? '#F7C14D' : '#127d96'}
          size="large"
        />
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <View style={styles.empty}>
          <Ionicons name="person-outline" size={48} color={isDark ? '#444' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#666' : '#aaa' }]}>No users found</Text>
        </View>
      )}

      {!loading && query.length < 2 && (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={48} color={isDark ? '#444' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#666' : '#aaa' }]}>Search by name or username</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={item => item.userId}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: isDark ? '#222' : '#f0f0f0' }]} />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  followText: { fontSize: 13, fontWeight: '600' },
  separator: { height: 1, marginLeft: 76 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 15 },
});
