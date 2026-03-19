import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Share, Text, Alert, Clipboard } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { getUserId } from '../utils/storage';
import { getApiUrl } from '../config/env';

type Tier = { shares: number; coins: number; claimed: boolean };

export default function InvitationRewardsScreen() {
  const { isDark } = useTheme();
  const [inviteCode, setInviteCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const userId = await getUserId();
      if (!userId) return;
      const res = await fetch(getApiUrl(`/api/app/referral/info/${userId}`));
      const data = await res.json();
      setInviteCode(data.inviteCode || '');
      setReferralCount(data.referralCount || 0);
      setTiers(data.tiers || []);
    } catch (e) {
      console.error('Failed to load referral info', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCopy = () => {
    Clipboard.setString(inviteCode);
    Alert.alert('Copied!', 'Invite code copied to clipboard.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Ananta Live! Use my invite code: ${inviteCode} and get bonus coins! Download now: https://ananta.live`,
      });
    } catch (e) { console.log(e); }
  };

  const handleClaim = async (shares: number) => {
    setClaiming(shares);
    try {
      const userId = await getUserId();
      const res = await fetch(getApiUrl('/api/app/referral/claim'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, shares }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('🎉 Reward Claimed!', `You received ${data.coinsAwarded} coins!`);
        fetchData();
      } else {
        Alert.alert('Error', data.error || 'Could not claim reward.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Try again.');
    } finally {
      setClaiming(null);
    }
  };

  const accentColor = isDark ? '#F7C14D' : '#127d96';
  const accentText = isDark ? 'black' : 'white';

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      {/* Header */}
      <LinearGradient colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={accentText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentText }]}>Invitation Rewards</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <LinearGradient colors={isDark ? ['#F7C14D', '#E6B143'] : ['#127d96', '#0a5d75']} style={styles.statsCard}>
          <Ionicons name="gift" size={40} color={accentText} style={{ marginBottom: 15 }} />
          <Text style={[styles.statsTitle, { color: accentText }]}>Invite Friends & Earn Rewards!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color={accentText} />
              <Text style={[styles.statNumber, { color: accentText }]}>{referralCount}</Text>
              <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>Friends Invited</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="diamond" size={20} color={accentText} />
              <Text style={[styles.statNumber, { color: accentText }]}>
                {tiers.filter(t => t.claimed).reduce((sum, t) => sum + t.coins, 0)}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)' }]}>Coins Earned</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Invite Code */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Your Invite Code</Text>
          <View style={[styles.codeContainer, { backgroundColor: isDark ? 'rgba(247,193,77,0.1)' : 'rgba(18,125,150,0.1)', borderColor: accentColor }]}>
            <Text style={[styles.inviteCode, { color: accentColor }]}>{loading ? '...' : inviteCode}</Text>
            <TouchableOpacity style={[styles.copyButton, { backgroundColor: accentColor }]} onPress={handleCopy}>
              <Ionicons name="copy" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <LinearGradient colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']} style={styles.shareGradient}>
              <Ionicons name="share-social" size={20} color={accentText} />
              <Text style={[styles.shareText, { color: accentText }]}>Share Invite Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Reward Milestones */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Reward Milestones</Text>
          {loading ? (
            <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>Loading milestones...</Text>
          ) : tiers.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', padding: 20 }}>No reward milestones set yet.</Text>
          ) : (
            tiers.map((tier) => {
              const unlocked = referralCount >= tier.shares;
              return (
                <View key={tier.shares} style={[
                  styles.tierCard,
                  { backgroundColor: isDark ? '#333' : '#f8f9fa' },
                  tier.claimed && styles.claimedTier,
                ]}>
                  <View style={styles.tierLeft}>
                    <View style={[styles.tierIcon, { backgroundColor: tier.claimed ? '#00C851' : accentColor }]}>
                      <Ionicons name={tier.claimed ? 'checkmark' : 'people'} size={20} color="white" />
                    </View>
                    <View style={styles.tierInfo}>
                      <Text style={[styles.tierTitle, { color: isDark ? 'white' : '#333' }]}>
                        Invite {tier.shares} Friend{tier.shares > 1 ? 's' : ''}
                      </Text>
                      <View style={styles.tierReward}>
                        <Ionicons name="diamond" size={14} color="#B8860B" />
                        <Text style={[styles.tierRewardText, { color: isDark ? '#ccc' : '#666' }]}>{tier.coins} Coins</Text>
                      </View>
                    </View>
                  </View>
                  <View>
                    {tier.claimed ? (
                      <View style={styles.claimedBadge}>
                        <Text style={styles.badgeText}>Claimed</Text>
                      </View>
                    ) : unlocked ? (
                      <TouchableOpacity
                        style={[styles.claimButton, { backgroundColor: '#B8860B' }]}
                        onPress={() => handleClaim(tier.shares)}
                        disabled={claiming === tier.shares}
                      >
                        <Text style={styles.badgeText}>{claiming === tier.shares ? '...' : 'Claim'}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.lockedBadge}>
                        <Text style={[styles.lockedText, { color: '#666' }]}>{referralCount}/{tier.shares}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, height: 120 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { width: 24 },
  content: { flex: 1, paddingTop: 20 },
  statsCard: { marginHorizontal: 20, borderRadius: 20, padding: 25, alignItems: 'center', marginBottom: 25, elevation: 8 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' },
  statNumber: { fontSize: 24, fontWeight: 'bold', marginTop: 8, marginBottom: 5 },
  statLabel: { fontSize: 12, fontWeight: '500' },
  section: { marginHorizontal: 20, borderRadius: 15, padding: 20, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  codeContainer: { flexDirection: 'row', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, borderWidth: 1 },
  inviteCode: { flex: 1, fontSize: 20, fontWeight: 'bold', textAlign: 'center', letterSpacing: 2 },
  copyButton: { padding: 8, borderRadius: 8 },
  shareButton: { borderRadius: 12, overflow: 'hidden' },
  shareGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, gap: 10 },
  shareText: { fontSize: 16, fontWeight: '600' },
  tierCard: { borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  claimedTier: { borderLeftWidth: 4, borderLeftColor: '#00C851' },
  tierLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  tierIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  tierInfo: { flex: 1 },
  tierTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  tierReward: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tierRewardText: { fontSize: 14, fontWeight: '600' },
  claimedBadge: { backgroundColor: '#00C851', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  claimButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 15 },
  lockedBadge: { backgroundColor: '#C0C0C0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  badgeText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
  lockedText: { fontSize: 12, fontWeight: 'bold' },
});
