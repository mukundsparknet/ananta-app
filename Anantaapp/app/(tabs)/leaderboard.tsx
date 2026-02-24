import { useEffect, useState } from 'react';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View, StatusBar, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
import { ENV } from '@/config/env';

const avatars = [
  require('@/assets/images/h1.png.png'),
  require('@/assets/images/h2.png.png'),
  require('@/assets/images/h3.png.png'),
  require('@/assets/images/h4.png.png'),
  require('@/assets/images/h1.png.png'),
  require('@/assets/images/h2.png.png'),
];

type LeaderItem = {
  userId: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
  location?: string;
  coins: number;
  rank: number;
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('earning');
  const [timeFilter, setTimeFilter] = useState('today');
  const [earningData, setEarningData] = useState<LeaderItem[]>([]);
  const [spentData, setSpentData] = useState<LeaderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const currentData = activeTab === 'earning' ? earningData : spentData;

  const getAvatarSource = (user: LeaderItem, index: number) => {
    if (user.profileImage) {
      let uri = user.profileImage.trim();
      if (uri && !uri.startsWith('http') && !uri.startsWith('data:')) {
        uri = `data:image/jpeg;base64,${uri}`;
      }
      return { uri };
    }
    return avatars[index % avatars.length];
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [earningRes, spentRes] = await Promise.all([
          fetch(`${ENV.API_BASE_URL}/api/app/wallet/leaderboard/earning`),
          fetch(`${ENV.API_BASE_URL}/api/app/wallet/leaderboard/spent`),
        ]);

        if (earningRes.ok) {
          const data = await earningRes.json();
          if (Array.isArray(data)) {
            setEarningData(
              data.map((item: any) => ({
                userId: String(item.userId || ''),
                username: item.username || undefined,
                fullName: item.fullName || undefined,
                profileImage: item.profileImage || undefined,
                location: item.location || undefined,
                coins: Number(item.coins || 0),
                rank: Number(item.rank || 0),
              }))
            );
          }
        }

        if (spentRes.ok) {
          const data = await spentRes.json();
          if (Array.isArray(data)) {
            setSpentData(
              data.map((item: any) => ({
                userId: String(item.userId || ''),
                username: item.username || undefined,
                fullName: item.fullName || undefined,
                profileImage: item.profileImage || undefined,
                location: item.location || undefined,
                coins: Number(item.coins || 0),
                rank: Number(item.rank || 0),
              }))
            );
          }
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>Leaderboard</Text>
          </View>
          
          <View style={styles.headerActions}>
          </View>
        </View>
      </LinearGradient>
      
      {/* Modern Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
        <View style={styles.tabScrollContent}>
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)' }, activeTab === 'earning' && { backgroundColor: isDark ? '#f7c14d' : '#127d96' }]}
            onPress={() => setActiveTab('earning')}
          >
            <Ionicons 
              name="trophy" 
              size={18} 
              color={activeTab === 'earning' ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96')} 
            />
            <Text style={[styles.tabText, { color: activeTab === 'earning' ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96') }, activeTab === 'earning' && styles.activeTabText]}>Earning</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.tab, { backgroundColor: isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)' }, activeTab === 'spent' && { backgroundColor: isDark ? '#f7c14d' : '#127d96' }]}
            onPress={() => setActiveTab('spent')}
          >
            <Ionicons 
              name="cash-outline" 
              size={18} 
              color={activeTab === 'spent' ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96')} 
            />
            <Text style={[styles.tabText, { color: activeTab === 'spent' ? (isDark ? 'black' : 'white') : (isDark ? '#f7c14d' : '#127d96') }, activeTab === 'spent' && styles.activeTabText]}>Spent</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentData.map((user, index) => {
          const displayName =
            user.fullName ||
            (user.username ? `@${user.username}` : user.userId) ||
            'User';
          const displayLocation = user.location || '';
          const color = user.rank <= 3
            ? (user.rank === 1 ? '#D4AF37' : user.rank === 2 ? '#C0C0C0' : '#CD7F32')
            : '#D4AF37';
          return (
          <View key={user.userId + '_' + user.rank} style={styles.userCard}>
            {user.rank <= 3 ? (
              <LinearGradient
                colors={[color, `${color}80`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientCard}
              >
                <View style={styles.leftRankSection}>
                  <ThemedText style={styles.leftRankNumber}>{user.rank}</ThemedText>
                </View>
                <Image source={getAvatarSource(user, index)} style={styles.userImage} />
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{displayName}</ThemedText>
                  {displayLocation ? (
                    <ThemedText style={styles.userLocation}>{displayLocation}</ThemedText>
                  ) : null}
                  <View style={styles.coinBadge}>
                    <View style={styles.coinIcon}>
                      <ThemedText style={styles.dollarSign}>$</ThemedText>
                    </View>
                    <ThemedText style={styles.coinAmount}>{user.coins}</ThemedText>
                  </View>
                </View>
                <View style={styles.rightSection}>
                  <View style={styles.trophySection}>
                    <View style={styles.trophyContainer}>
                      <ThemedText style={styles.trophyIcon}>🏆</ThemedText>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <View style={[styles.solidCard, { backgroundColor: color }]}>
                <Image source={getAvatarSource(user, index)} style={styles.userImage} />
                <View style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{displayName}</ThemedText>
                  {displayLocation ? (
                    <ThemedText style={styles.userLocation}>{displayLocation}</ThemedText>
                  ) : null}
                  <View style={styles.coinBadge}>
                    <View style={styles.coinIcon}>
                      <ThemedText style={styles.dollarSign}>$</ThemedText>
                    </View>
                    <ThemedText style={styles.coinAmount}>{user.coins}</ThemedText>
                  </View>
                </View>
                <View style={styles.rightSection}>
                  <View style={styles.trophySection}>
                    <View style={styles.trophyContainer}>
                      <ThemedText style={styles.trophyIcon}>🏆</ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        );
        })}
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
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
    gap: 15,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tabScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    marginHorizontal: 5,
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
    paddingTop: 20,
  },
  userCard: {
    borderRadius: 15,
    marginBottom: 12,
    position: 'relative',
    overflow: 'visible',
    minHeight: 100,
    marginTop: 15,
  },
  gradientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    position: 'relative',
  },
  solidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    position: 'relative',
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
    color: 'white',
    opacity: 0.9,
    marginBottom: 8,
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  coinIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  dollarSign: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20,
  },
  coinAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
  },
  leftRankSection: {
    position: 'absolute',
    left: -10,
    top: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  leftRankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#127d96',
  },
  rightSection: {
    position: 'relative',
    width: 120,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 80,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    position: 'absolute',
    right: 10,
    top: -5,
    zIndex: 1,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  trophySection: {
    position: 'absolute',
    right: 15,
    bottom: 10,
    zIndex: 3,
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    right: 5,
    top: 5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
    borderWidth: 2,
    borderColor: '#127d96',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#127d96',
  },
  trophyContainer: {
    backgroundColor: '#127d96',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  trophyIcon: {
    fontSize: 30,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  star: {
    fontSize: 12,
    color: '#FF6B35',
    marginHorizontal: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 15,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});
