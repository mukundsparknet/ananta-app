import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { ENV } from '@/config/env';

type LiveHistoryItem = {
  sessionId: string;
  title: string;
  type: string;
  createdAt: string | null;
  endedAt: string | null;
  status: string;
  viewerCount: number | null;
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours + 11) % 12) + 1;
  return `${day}/${month}/${year}  ${displayHour}:${minutes} ${suffix}`;
};

const formatDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return null;
  const s = new Date(start), e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return null;
  const secs = Math.max(0, Math.floor((e.getTime() - s.getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const sec = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

export default function LiveHistoryScreen() {
  const { isDark } = useTheme();
  const accent = isDark ? '#f7c14d' : '#127d96';
  const [items, setItems] = useState<LiveHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let userId: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          userId = window.localStorage.getItem('userId');
        } else {
          userId = await SecureStore.getItemAsync('userId');
        }
        if (!userId) { setLoading(false); return; }

        const res = await fetch(`${ENV.API_BASE_URL}/api/app/live/history/${userId}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        if (!Array.isArray(data)) { setLoading(false); return; }

        setItems(data.map((item: any) => ({
          sessionId: String(item.sessionId),
          title: item.title || 'Live Session',
          type: item.type || 'VIDEO',
          createdAt: item.createdAt || null,
          endedAt: item.endedAt || null,
          status: item.status || 'ENDED',
          viewerCount: typeof item.viewerCount === 'number' ? item.viewerCount : null,
        })));
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const renderItem = ({ item }: { item: LiveHistoryItem }) => {
    const isAudio = item.type === 'AUDIO';
    const duration = formatDuration(item.createdAt, item.endedAt);
    const isLive = item.status === 'LIVE';

    return (
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : 'white' }]}>
        {/* Type badge */}
        <View style={styles.cardTop}>
          <View style={[styles.typeBadge, { backgroundColor: isAudio ? '#7c3aed22' : '#127d9622' }]}>
            <Ionicons name={isAudio ? 'mic' : 'videocam'} size={13} color={isAudio ? '#7c3aed' : '#127d96'} />
            <Text style={[styles.typeText, { color: isAudio ? '#7c3aed' : '#127d96' }]}>
              {isAudio ? 'Audio Live' : 'Video Live'}
            </Text>
          </View>
          <View style={[styles.statusDot, { backgroundColor: isLive ? '#22c55e' : '#94a3b8' }]} />
          <Text style={[styles.statusText, { color: isLive ? '#22c55e' : (isDark ? '#888' : '#94a3b8') }]}>
            {isLive ? 'Live' : 'Ended'}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: isDark ? 'white' : '#1a1a1a' }]} numberOfLines={1}>
          {item.title}
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Date */}
          <View style={styles.statItem}>
            <Ionicons name="calendar-outline" size={13} color={isDark ? '#888' : '#999'} />
            <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>
              {formatDateTime(item.createdAt)}
            </Text>
          </View>

          {/* Views */}
          {item.viewerCount !== null && (
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={13} color={accent} />
              <Text style={[styles.statText, { color: accent }]}>
                {item.viewerCount} {item.viewerCount === 1 ? 'view' : 'views'}
              </Text>
            </View>
          )}

          {/* Duration */}
          {duration && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={13} color={isDark ? '#888' : '#999'} />
              <Text style={[styles.statText, { color: isDark ? '#aaa' : '#666' }]}>{duration}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0d0d0d' : '#f4f6f8' }]}>
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={isDark ? 'black' : 'white'}
          onPress={() => router.back()}
          style={styles.backBtn}
        />
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Live History</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="videocam-off-outline" size={56} color={isDark ? '#444' : '#ccc'} />
          <Text style={[styles.emptyText, { color: isDark ? '#666' : '#aaa' }]}>No live sessions yet</Text>
          <Text style={[styles.emptySubText, { color: isDark ? '#555' : '#bbb' }]}>
            Start a live to see your history here
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.sessionId}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 16,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 12 },
  emptySubText: { fontSize: 13 },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  typeText: { fontSize: 11, fontWeight: '700' },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 'auto' },
  statusText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
});
