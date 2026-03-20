import React, { createContext, useContext, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileContext = createContext();

const defaultProfile = {
  name: '',
  title: '',
  bio: '',
  location: '',
  profileImage: null,
  headerBackground: null,
  gender: '',
  birthday: '',
  profilePhoto: null,
  coverPhoto: null,
  addressLine1: '',
  city: '',
  state: '',
  country: '',
  pinCode: '',
  UserName: '',
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
      AsyncStorage.removeItem('userId').catch(() => {});
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
