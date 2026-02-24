import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
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
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const displayHour = ((hours + 11) % 12) + 1;
  return `${day}/${month}/${year} ${displayHour}:${minutes} ${suffix}`;
};

export default function LiveHistoryScreen() {
  const { isDark } = useTheme();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [items, setItems] = useState<LiveHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${ENV.API_BASE_URL}/api/app/live/history/${currentUserId}`
        );
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setLoading(false);
          return;
        }
        const mapped: LiveHistoryItem[] = data.map((item: any) => ({
          sessionId: String(item.sessionId),
          title: item.title || 'Live Session',
          type: item.type || 'VIDEO',
          createdAt: item.createdAt || null,
          endedAt: item.endedAt || null,
          status: item.status || 'ENDED',
          viewerCount:
            typeof item.viewerCount === 'number' ? item.viewerCount : null,
        }));
        setItems(mapped);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [currentUserId]);

  const renderItem = ({ item }: { item: LiveHistoryItem }) => {
    const isEnded = item.status === 'ENDED';
    const typeLabel =
      item.type === 'AUDIO'
        ? 'Audio live'
        : item.type === 'VIDEO'
        ? 'Video live'
        : item.type;
    const timeLabel = item.endedAt || item.createdAt;
    const timeText = timeLabel ? formatDateTime(timeLabel) : '';
    const viewers =
      item.viewerCount !== null && item.viewerCount !== undefined
        ? `${item.viewerCount} viewers`
        : '';
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? '#1e1e1e' : 'white' },
        ]}
      >
        <View style={styles.cardHeader}>
          <ThemedText
            style={[
              styles.cardTitle,
              { color: isDark ? 'white' : '#222' },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>
          <ThemedText
            style={[
              styles.cardType,
              { color: isDark ? '#f7c14d' : '#127d96' },
            ]}
          >
            {typeLabel}
          </ThemedText>
        </View>
        <View style={styles.cardFooter}>
          <ThemedText
            style={[
              styles.cardTime,
              { color: isDark ? '#aaa' : '#666' },
            ]}
          >
            {timeText}
          </ThemedText>
          <View style={styles.badgesRow}>
            {viewers ? (
              <ThemedText
                style={[
                  styles.cardBadge,
                  { color: isDark ? '#ddd' : '#555' },
                ]}
              >
                {viewers}
              </ThemedText>
            ) : null}
            <ThemedText
              style={[
                styles.statusBadge,
                {
                  borderColor: isEnded ? '#28a745' : '#ffc107',
                  color: isEnded ? '#28a745' : '#ffc107',
                },
              ]}
            >
              {isEnded ? 'Ended' : item.status}
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#f8f9fa' },
      ]}
    >
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? 'black' : 'white'}
            onPress={() => router.back()}
          />
        </View>
        <ThemedText
          style={[
            styles.headerTitle,
            { color: isDark ? 'black' : 'white' },
          ]}
        >
          Live history
        </ThemedText>
        <View style={styles.headerRight} />
      </LinearGradient>

      {loading && (
        <View style={styles.loader}>
          <ActivityIndicator
            size="small"
            color={isDark ? '#f7c14d' : '#127d96'}
          />
        </View>
      )}

      {!loading && items.length === 0 && (
        <View style={styles.emptyState}>
          <ThemedText
            style={[
              styles.emptyText,
              { color: isDark ? '#777' : '#999' },
            ]}
          >
            No live sessions yet.
          </ThemedText>
          <ThemedText
            style={[
              styles.emptySubText,
              { color: isDark ? '#666' : '#888' },
            ]}
          >
            Start a live to see your history here.
          </ThemedText>
        </View>
      )}

      {!loading && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={item => item.sessionId}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },
  headerLeft: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 32,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loader: {
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  cardType: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTime: {
    fontSize: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBadge: {
    fontSize: 11,
    marginRight: 8,
  },
  statusBadge: {
    fontSize: 11,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  emptyState: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
  },
});
