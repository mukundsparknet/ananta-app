import { StyleSheet, ScrollView, TouchableOpacity, View, Dimensions, Animated, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ENV } from '@/config/env';

const { width } = Dimensions.get('window');

const BackIcon = ({ color = 'black' }) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L9 12L15 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const StarIcon = ({ size = 24, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color}/>
  </Svg>
);

const CoinIcon = ({ size = 16, color = '#FFD700' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.31 11.14C10.54 10.69 9.97 10.2 9.97 9.47C9.97 8.63 10.76 8.04 12.07 8.04C13.45 8.04 13.97 8.7 14.01 9.68H15.72C15.67 8.34 14.85 7.11 13.23 6.71V5H10.9V6.69C9.39 7.01 8.18 7.99 8.18 9.5C8.18 11.29 9.67 12.19 11.84 12.71C13.79 13.17 14.18 13.86 14.18 14.58C14.18 15.11 13.79 15.97 12.08 15.97C10.48 15.97 9.85 15.25 9.76 14.33H8.04C8.14 16.03 9.4 17 10.9 17.3V19H13.24V17.33C14.76 17.04 15.96 16.17 15.97 14.56C15.96 12.36 14.07 11.6 12.31 11.14Z" fill={color}/>
  </Svg>
);

type Level = {
  id: number;
  level: number;
  coinsRequired: number;
};

const LevelBadge = ({ level, size = 'small', isDark = false }: { level: number; size?: string; isDark?: boolean }) => {
  const badgeSize = size === 'large' ? 60 : size === 'medium' ? 40 : 24;
  const fontSize = size === 'large' ? 20 : size === 'medium' ? 14 : 10;
  return (
    <View style={{ width: badgeSize, height: badgeSize, position: 'relative' }}>
      <LinearGradient
        colors={['#FFD700', '#FFA500']}
        style={{ width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2, justifyContent: 'center', alignItems: 'center' }}
      >
        <ThemedText style={{ fontSize, color: 'white', fontWeight: 'bold' }}>{level}</ThemedText>
      </LinearGradient>
      <View style={[styles.starBadge, { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]}>
        <StarIcon size={size === 'large' ? 16 : 12} color="white" />
      </View>
    </View>
  );
};

export default function LevelManagementScreen() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'host' | 'viewer'>('host');
  const [hostLevels, setHostLevels] = useState<Level[]>([]);
  const [viewerLevels, setViewerLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);

  const levels = activeTab === 'host' ? hostLevels : viewerLevels;

  useEffect(() => {
    const fetchLevels = async () => {
      setLoading(true);
      try {
        const [hostRes, viewerRes] = await Promise.all([
          fetch(`${ENV.API_BASE_URL}/api/app/levels/host`),
          fetch(`${ENV.API_BASE_URL}/api/app/levels/viewer`),
        ]);
        const hostData = await hostRes.json();
        const viewerData = await viewerRes.json();
        setHostLevels(hostData.levels || []);
        setViewerLevels(viewerData.levels || []);
      } catch (e) {
        setHostLevels([]);
        setViewerLevels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLevels();
  }, []);

  const primaryColor = isDark ? '#F7C14D' : '#127d96';
  const textColor = isDark ? 'white' : '#333';
  const cardBg = isDark ? '#2a2a2a' : 'white';
  const itemBg = isDark ? '#333' : '#f8f9fa';
  const subText = isDark ? '#999' : '#666';

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <BackIcon color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Level Management</ThemedText>
        <View style={styles.placeholder} />
      </LinearGradient>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: cardBg, borderBottomColor: isDark ? '#444' : '#e2e8f0' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'host' && { borderBottomColor: primaryColor, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('host')}
        >
          <ThemedText style={[styles.tabText, { color: activeTab === 'host' ? primaryColor : subText, fontWeight: activeTab === 'host' ? '700' : '500' }]}>
            🎙️ Host Level
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'viewer' && { borderBottomColor: primaryColor, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('viewer')}
        >
          <ThemedText style={[styles.tabText, { color: activeTab === 'viewer' ? primaryColor : subText, fontWeight: activeTab === 'viewer' ? '700' : '500' }]}>
            👁️ Viewer Level
          </ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <LinearGradient
          colors={isDark ? ['#F7C14D', '#E6B143', '#D4A03A'] : ['#127d96', '#0a5d75', '#083d4f']}
          style={styles.infoCard}
        >
          <ThemedText style={styles.infoTitle}>
            {activeTab === 'host' ? '🎙️ Host Levels' : '👁️ Viewer Levels'}
          </ThemedText>
          <ThemedText style={styles.infoSubtitle}>
            {activeTab === 'host'
              ? 'Levels based on coins earned from live streams'
              : 'Levels based on coins spent on gifts'}
          </ThemedText>
          <ThemedText style={styles.infoCount}>
            {loading ? '...' : `${levels.length} Levels Configured`}
          </ThemedText>
        </LinearGradient>

        {/* Levels List */}
        <View style={[styles.listContainer, { backgroundColor: cardBg }]}>
          <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
            {activeTab === 'host' ? 'Host Level Ladder' : 'Viewer Level Ladder'}
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={primaryColor} />
              <ThemedText style={[styles.loadingText, { color: subText }]}>Loading levels...</ThemedText>
            </View>
          ) : levels.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={[styles.emptyText, { color: subText }]}>No levels configured yet.</ThemedText>
              <ThemedText style={[styles.emptySubText, { color: subText }]}>Admin can add levels from the admin panel.</ThemedText>
            </View>
          ) : (
            levels.map((levelData, index) => {
              const cumulative = levels.slice(0, index + 1).reduce((sum, l) => sum + l.coinsRequired, 0);
              return (
                <View
                  key={levelData.id}
                  style={[styles.levelItem, { backgroundColor: itemBg, borderColor: isDark ? '#555' : '#e0e0e0' }]}
                >
                  <LevelBadge level={levelData.level} size="medium" isDark={isDark} />
                  <View style={styles.levelInfo}>
                    <ThemedText style={[styles.levelTitle, { color: textColor }]}>
                      Level {levelData.level}
                    </ThemedText>
                    <View style={styles.coinsRow}>
                      <CoinIcon size={14} color="#FFD700" />
                      <ThemedText style={[styles.coinsText, { color: subText }]}>
                        {levelData.coinsRequired.toLocaleString()} coins {activeTab === 'host' ? 'to earn' : 'to spend'}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.cumulativeContainer}>
                    <ThemedText style={[styles.cumulativeLabel, { color: subText }]}>Total</ThemedText>
                    <View style={[styles.cumulativeBadge, { backgroundColor: primaryColor }]}>
                      <ThemedText style={styles.cumulativeValue}>
                        {cumulative.toLocaleString()}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    height: 120,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  placeholder: { width: 24 },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 15 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  infoCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  infoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  infoCount: { fontSize: 16, color: '#FFD700', fontWeight: '600' },
  listContainer: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  emptySubText: { fontSize: 13 },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    gap: 12,
  },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  coinsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  coinsText: { fontSize: 12 },
  cumulativeContainer: { alignItems: 'center' },
  cumulativeLabel: { fontSize: 10, marginBottom: 4 },
  cumulativeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  cumulativeValue: { fontSize: 11, color: 'white', fontWeight: '700' },
  starBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: 8,
    padding: 2,
  },
});
