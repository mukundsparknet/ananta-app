import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ProfileContext = createContext();

const defaultProfile = {
  name: '@Micale clarke',
  title: 'Mr. Perfect billa',
  bio: 'It not easy without taking one word with life,',
  location: '',
  profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  headerBackground: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=400&fit=crop',
  gender: '',
  profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  coverPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=400&fit=crop',
  birthday: '',
  addressLine1: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',
  UserName: '@Micale clarke',
  followers: 0,
  following: 0,
  coins: 0
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState(defaultProfile);

  const updateProfile = (newData) => {
    setProfileData(prev => ({ ...prev, ...newData }));
  };

  const logout = () => {
    setProfileData(defaultProfile);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.localStorage.removeItem('userId');
    } else {
      SecureStore.deleteItemAsync('userId').catch(() => {});
    }
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfile, logout }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within ProfileProvider');
  }
  return context;
};
