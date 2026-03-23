import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, Dimensions, ActivityIndicator, RefreshControl,
  Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/contexts/ThemeContext';
import { ENV } from '@/config/env';

const { width, height } = Dimensions.get('window');

const resolveUri = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
  if (value.length > 100) return `data:image/jpeg;base64,${value}`;
  return null;
};

export default function UserProfileScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const targetUserId = typeof params.userId === 'string' ? params.userId : '';

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('userId').then(id => setCurrentUserId(id)).catch(() => {});
  }, []);

  const loadProfile = useCallback(async () => {
    if (!targetUserId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${targetUserId}`);
      if (!res.ok) return;
      const data = await res.json();
      setProfile(data);
    } catch {}
  }, [targetUserId]);

  const checkFollowing = useCallback(async (viewerId: string) => {
    if (!viewerId || !targetUserId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/following/${viewerId}`);
      if (!res.ok) return;
      const list = await res.json();
      setIsFollowing(Array.isArray(list) && list.some((f: any) => f.userId === targetUserId));
    } catch {}
  }, [targetUserId]);

  const checkBlocked = useCallback(async (viewerId: string) => {
    if (!viewerId || !targetUserId) return;
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/block/status?blockerId=${viewerId}&targetId=${targetUserId}`);
      if (!res.ok) return;
      const data = await res.json();
      setIsBlocked(data.blocked);
    } catch {}
  }, [targetUserId]);

  useFocusEffect(
    useCallback(() => {
      const init = async () => {
        setLoading(true);
        await loadProfile();
        const id = await SecureStore.getItemAsync('userId').catch(() => null);
        setCurrentUserId(id);
        if (id) await checkFollowing(id);
        if (id) await checkBlocked(id);
        setLoading(false);
      };
      init();
    }, [loadProfile, checkFollowing, checkBlocked])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    if (currentUserId) await checkFollowing(currentUserId);
    if (currentUserId) await checkBlocked(currentUserId);
    setRefreshing(false);
  };

  const toggleFollow = async () => {
    if (!currentUserId || !targetUserId) return;
    setIsFollowing(prev => !prev);
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/follow/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId: currentUserId, followeeId: targetUserId }),
      });
    } catch {
      setIsFollowing(prev => !prev); // revert on error
    }
  };

  const toggleBlock = async () => {
    if (!currentUserId || !targetUserId) return;
    const newBlocked = !isBlocked;
    setIsBlocked(newBlocked);
    try {
      await fetch(`${ENV.API_BASE_URL}/api/app/block/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockerId: currentUserId, targetId: targetUserId }),
      });
    } catch {
      setIsBlocked(!newBlocked);
    }
  };

  const submitReport = async () => {
    if (!reportText.trim()) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterId: currentUserId, reportedUserId: targetUserId, reason: reportText.trim() }),
      });
      if (res.ok) {
        setShowReport(false);
        setReportText('');
        Alert.alert('Reported', 'Your report has been submitted.');
      } else {
        Alert.alert('Error', 'Failed to submit report.');
      }
    } catch {
      Alert.alert('Error', 'Failed to submit report.');
    }
    setReportSubmitting(false);
  };

  const goToChat = () => {
    const name = profile?.user?.username || profile?.user?.fullName || targetUserId;
    router.push({
      pathname: '/chat',
      params: { otherUserId: targetUserId, otherName: name },
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={isDark ? '#F7C14D' : '#127d96'} />
      </View>
    );
  }

  const user = profile?.user ?? {};
  const followers = profile?.followers ?? 0;
  const following = profile?.following ?? 0;
  const profileUri = resolveUri(user.profileImage);
  const coverUri = resolveUri(user.coverImage);
  const displayName = user.fullName || user.username || targetUserId;
  const username = user.username || '';
  const bio = user.bio || '';
  const location = user.location || user.country || '';
  const hostLevel = user.hostLevel || 0;
  const viewerLevel = user.viewerLevel || 0;
  const isSelf = currentUserId === targetUserId;

  const accent = isDark ? '#F7C14D' : '#127d96';
  const accentText = isDark ? 'black' : 'white';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} tintColor={accent} />}
      >
        {/* Cover image */}
        <View style={styles.coverContainer}>
          {coverUri
            ? <Image source={{ uri: coverUri }} style={styles.coverImage} />
            : <LinearGradient colors={isDark ? ['#2a2a2a', '#1a1a1a'] : ['#127d96', '#15a3c7']} style={styles.coverImage} />
          }
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>

          {/* Report button - only for other users */}
          {!isSelf && (
            <TouchableOpacity style={styles.reportBtn} onPress={() => setShowReport(true)}>
              <Ionicons name="flag-outline" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {profileUri
              ? <Image source={{ uri: profileUri }} style={[styles.avatar, { borderColor: isDark ? '#F7C14D' : '#127d96' }]} />
              : <View style={[styles.avatar, styles.avatarPlaceholder, { borderColor: accent, backgroundColor: isDark ? '#333' : '#e5e7eb' }]}>
                  <Ionicons name="person" size={38} color={isDark ? '#888' : '#aaa'} />
                </View>
            }
          </View>

          {/* Name & bio */}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={[styles.displayName, { color: isDark ? 'white' : '#111' }]}>{displayName}</Text>
              {username && username !== displayName && (
                <Text style={[styles.username, { color: isDark ? '#888' : '#999' }]}>@{username}</Text>
              )}
            </View>
            <Text style={[styles.userId, { color: isDark ? '#666' : '#aaa' }]}>ID: {targetUserId}</Text>
            {!!bio && <Text style={[styles.bio, { color: isDark ? '#aaa' : '#666' }]}>{bio}</Text>}
            {!!location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={isDark ? '#888' : '#999'} />
                <Text style={[styles.locationText, { color: isDark ? '#888' : '#999' }]}>{location}</Text>
              </View>
            )}
          </View>

          {/* Level badges */}
          {(hostLevel > 0 || viewerLevel > 0) && (
            <View style={styles.badgesRow}>
              {hostLevel > 0 && (
                <View style={[styles.badge, { backgroundColor: '#FF9800' }]}>
                  <Ionicons name="star" size={11} color="white" />
                  <Text style={styles.badgeText}>Host Lv.{hostLevel}</Text>
                </View>
              )}
              {viewerLevel > 0 && (
                <View style={[styles.badge, { backgroundColor: '#9C27B0' }]}>
                  <Ionicons name="eye" size={11} color="white" />
                  <Text style={styles.badgeText}>Viewer Lv.{viewerLevel}</Text>
                </View>
              )}
            </View>
          )}

          {/* Action buttons */}
          {!isSelf && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  isFollowing
                    ? { backgroundColor: isDark ? '#333' : '#e5e7eb', borderWidth: 1, borderColor: isDark ? '#555' : '#ccc' }
                    : { backgroundColor: accent },
                ]}
                onPress={toggleFollow}
              >
                <Ionicons
                  name={isFollowing ? 'checkmark' : 'person-add'}
                  size={16}
                  color={isFollowing ? (isDark ? '#ccc' : '#555') : accentText}
                />
                <Text style={[styles.followBtnText, { color: isFollowing ? (isDark ? '#ccc' : '#555') : accentText }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.msgBtn, { borderColor: isBlocked ? '#999' : accent }]}
                onPress={isBlocked ? undefined : goToChat}
                disabled={isBlocked}
              >
                <Ionicons name="chatbubble-outline" size={16} color={isBlocked ? '#999' : accent} />
                <Text style={[styles.msgBtnText, { color: isBlocked ? '#999' : accent }]}>Message</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.blockBtn, { backgroundColor: isBlocked ? '#e5e7eb' : '#FF4B2B' }]}
                onPress={toggleBlock}
              >
                <Ionicons name={isBlocked ? 'lock-open-outline' : 'ban-outline'} size={16} color={isBlocked ? '#555' : 'white'} />
                <Text style={[styles.blockBtnText, { color: isBlocked ? '#555' : 'white' }]}>
                  {isBlocked ? 'Unblock' : 'Block'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats bar */}
        <View style={[styles.statsBar, { backgroundColor: accent }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: accentText }]}>{followers}</Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)' }]}>Followers</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)' }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: accentText }]}>{following}</Text>
            <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)' }]}>Following</Text>
          </View>
        </View>

        {/* Level cards */}
        <View style={styles.levelRow}>
          <View style={[styles.levelCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <View style={[styles.levelIconCircle, { backgroundColor: '#FF9800' }]}>
              <Ionicons name="star" size={22} color="white" />
            </View>
            <Text style={[styles.levelNum, { color: isDark ? 'white' : '#111' }]}>Lv.{hostLevel}</Text>
            <Text style={[styles.levelLabel, { color: isDark ? '#888' : '#999' }]}>Host Level</Text>
          </View>
          <View style={[styles.levelCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <View style={[styles.levelIconCircle, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="eye" size={22} color="white" />
            </View>
            <Text style={[styles.levelNum, { color: isDark ? 'white' : '#111' }]}>Lv.{viewerLevel}</Text>
            <Text style={[styles.levelLabel, { color: isDark ? '#888' : '#999' }]}>Viewer Level</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReport} transparent animationType="slide" onRequestClose={() => setShowReport(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? 'white' : '#1a202c' }]}>Report User</Text>
            <Text style={[styles.modalSub, { color: isDark ? '#aaa' : '#718096' }]}>Describe why you are reporting this user</Text>
            <TextInput
              style={[styles.reportInput, { backgroundColor: isDark ? '#2a2a2a' : '#f7f8fc', color: isDark ? 'white' : '#1a202c', borderColor: isDark ? '#333' : '#e2e8f0' }]}
              placeholder="Enter reason..."
              placeholderTextColor={isDark ? '#666' : '#aaa'}
              multiline
              numberOfLines={4}
              value={reportText}
              onChangeText={setReportText}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: isDark ? '#333' : '#e2e8f0' }]} onPress={() => { setShowReport(false); setReportText(''); }}>
                <Text style={{ color: isDark ? '#ccc' : '#4a5568', fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: reportText.trim() ? '#e53e3e' : '#ccc' }]}
                onPress={submitReport}
                disabled={!reportText.trim() || reportSubmitting}
              >
                <Text style={{ color: 'white', fontWeight: '600' }}>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const COVER_H = height * 0.28;
const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  coverContainer: { height: COVER_H, position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  backBtn: {
    position: 'absolute',
    top: height * 0.06,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBtn: {
    position: 'absolute',
    top: height * 0.06,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 28,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    marginBottom: 16,
  },
  reportInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  card: {
    marginHorizontal: 16,
    marginTop: -(AVATAR_SIZE / 2),
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: AVATAR_SIZE / 2 + 12,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarWrapper: {
    position: 'absolute',
    top: -(AVATAR_SIZE / 2),
    left: 20,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  nameSection: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  displayName: { fontSize: 20, fontWeight: '700' },
  username: { fontSize: 14 },
  userId: { fontSize: 12, marginBottom: 6 },
  bio: { fontSize: 14, lineHeight: 20, marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  badgeText: { color: 'white', fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 12 },
  followBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 24,
  },
  followBtnText: { fontSize: 14, fontWeight: '600' },
  msgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 24, borderWidth: 1.5,
  },
  msgBtnText: { fontSize: 14, fontWeight: '600' },
  blockBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 11, borderRadius: 24,
  },
  blockBtnText: { fontSize: 14, fontWeight: '600' },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, marginVertical: 4 },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '500' },
  levelRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 12,
  },
  levelCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  levelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelNum: { fontSize: 18, fontWeight: '700' },
  levelLabel: { fontSize: 12, fontWeight: '500' },
});
