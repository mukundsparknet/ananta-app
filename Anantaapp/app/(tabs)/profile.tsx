import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useProfile } from '../../contexts/ProfileContext';
import { useTheme } from '../../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'https://ecofuelglobal.com';

const resolveProfileUri = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `https://ecofuelglobal.com${value}`;
  if (value.length > 100) return `data:image/jpeg;base64,${value}`;
  return value;
};

export default function ProfileScreen() {
  const { profileData, updateProfile, logout } = useProfile();
  const { isDark } = useTheme();

  useEffect(() => {
    const init = async () => {
      let storedUserId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        storedUserId = window.localStorage.getItem('userId');
      } else {
        try {
          storedUserId = await SecureStore.getItemAsync('userId');
        } catch {
          storedUserId = null;
        }
      }
      if (storedUserId) {
        loadProfile(storedUserId);
      }
    };
    init();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/app/profile/${userId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      console.log('[Profile] loadProfile userId:', userId);
      console.log('[Profile] counts:', {
        followers: data.followers,
        following: data.following,
        coins: data.coins,
        followersListLength: Array.isArray(data.followersList) ? data.followersList.length : 'n/a',
        followingListLength: Array.isArray(data.followingList) ? data.followingList.length : 'n/a',
      });
      const user = data.user;
      const profileUri = resolveProfileUri(user.profileImage);
      updateProfile({
        name: user.fullName || user.username || profileData.name,
        title: user.username || profileData.title,
        bio: user.bio || profileData.bio,
        location: user.location || profileData.location,
        addressLine1: user.addressLine1 || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pinCode: user.pinCode || '',
        profileImage: profileUri || profileData.profileImage,
        profilePhoto: profileUri || profileData.profileImage,
        followers: typeof data.followers === 'number' ? data.followers : profileData.followers,
        following: typeof data.following === 'number' ? data.following : profileData.following,
        coins: typeof data.coins === 'number' ? data.coins : profileData.coins,
      });
    } catch {
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      updateProfile({ headerBackground: result.assets[0].uri });
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/auth/login');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header with background image */}
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: profileData.headerBackground }}
          style={styles.headerBackgroundImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)']}
          style={styles.headerOverlay}
        >
          {/* Top navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
              <Ionicons name="camera" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </View>
      
      {/* Profile info card */}
      <View style={[styles.profileCard, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profileData.profileImage }}
              style={styles.profileAvatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.userInfo}>
            <View style={styles.nameContainer}>
              <Text style={[styles.username, { color: isDark ? 'white' : '#333' }]}>{profileData.name}</Text>
              <Ionicons name="checkmark-circle" size={16} color="#127d96" />
            </View>
            <Text style={[styles.userTitle, { color: isDark ? '#ccc' : '#666' }]}>{profileData.title}</Text>
            <Text style={[styles.userBio, { color: isDark ? '#aaa' : '#888' }]}>{profileData.bio}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
          <LinearGradient
            colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
            style={styles.editButtonGradient}
          >
            <Ionicons name="create" size={16} color={isDark ? 'black' : 'white'} />
            <Text style={[styles.editButtonText, { color: isDark ? 'black' : 'white' }]}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Stats section */}
      <View style={[styles.statsContainer, { backgroundColor: isDark ? '#f7c14d' : '#127d96' }]}>
        <TouchableOpacity style={styles.statItem} onPress={() => router.push('/followers')}>
          <Ionicons name="people" size={20} color={isDark ? 'black' : 'white'} />
          <Text style={[styles.statNumber, { color: isDark ? 'black' : 'white' }]}>{profileData.followers}</Text>
          <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>Followers</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <TouchableOpacity style={styles.statItem} onPress={() => router.push('/following')}>
          <Ionicons name="person-add" size={20} color={isDark ? 'black' : 'white'} />
          <Text style={[styles.statNumber, { color: isDark ? 'black' : 'white' }]}>{profileData.following}</Text>
          <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>Following</Text>
        </TouchableOpacity>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="diamond" size={20} color={isDark ? 'black' : 'white'} />
          <Text style={[styles.statNumber, { color: isDark ? 'black' : 'white' }]}>{profileData.coins}</Text>
          <Text style={[styles.statLabel, { color: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)' }]}>Coins</Text>
        </View>
      </View>
      
      {/* Action buttons */}
      <View style={styles.actionGrid}>
        {/* First row - 3 icons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/verification')}>
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#f7c14d' : '#127d96' }]}>
              <Ionicons name="checkmark-circle" size={24} color={isDark ? 'black' : 'white'} />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Verify</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/wallet')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FF6B35' }]}>
              <Ionicons name="wallet" size={24} color="white" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Wallet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/messages')}>
            <View style={[styles.actionIcon, { backgroundColor: '#28A745' }]}>
              <Ionicons name="chatbubbles" size={24} color="white" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Messages</Text>
          </TouchableOpacity>
        </View>
        
        {/* Second row - 3 icons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/settings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#9C27B0' }]}>
              <Ionicons name="settings-outline" size={24} color="white" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/earnings')}>
            <View style={[styles.actionIcon, { backgroundColor: '#B8860B' }]}>
              <Ionicons name="cash" size={24} color="white" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/recharge')}>
            <View style={[styles.actionIcon, { backgroundColor: '#DC3545' }]}>
              <Ionicons name="card" size={24} color="white" />
            </View>
            <Text style={[styles.actionText, { color: isDark ? 'white' : '#333' }]}>Recharge</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#FF4B2B', '#FF416C']}
          style={styles.logoutGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="log-out-outline" size={22} color="white" />
          <Text style={styles.logoutText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 100 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    height: 280,
  },
  headerBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 50,
  },
  cameraButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholder: {
    width: 40,
  },
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#127d96',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#28A745',
    borderWidth: 3,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  userBio: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  editButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 30,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 25,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  actionGrid: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 28,
    overflow: 'hidden',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
