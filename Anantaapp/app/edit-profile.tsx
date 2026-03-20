import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ENV } from '@/config/env';

const resolveProfileUri = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.includes('googleusercontent.com') || value.includes('google.com')) return null;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${value}`;
  return value;
};

export default function EditProfileScreen() {
  const { profileData, updateProfile } = useProfile();
  const { isDark } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [showImageSheet, setShowImageSheet] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameError, setUsernameError] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const usernameTimeout = useRef<NodeJS.Timeout | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const genderSlideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    const init = async () => {
      let storedUserId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        storedUserId = window.localStorage.getItem('userId');
      } else {
        storedUserId = await AsyncStorage.getItem('userId');
      }
      if (storedUserId) {
        setUserId(storedUserId);
        loadProfile(storedUserId);
      }
    };
    init();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const user = data.user;
      console.log('=== Profile Loaded ===');
      console.log('UserId:', user.userId);
      console.log('Username:', user.username);
      console.log('Full Name:', user.fullName);
      
      const profileUri = resolveProfileUri(user.profileImage);
      const coverUri = resolveProfileUri(user.coverImage);
      setProfileImage(profileUri);
      setCoverImage(coverUri);
      setName(user.fullName || '');
      setUserName(user.username || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setGender(user.gender || '');
      setBirthday(user.birthday || '');
      setAddressLine1(user.addressLine1 || '');
      setCity(user.city || '');
      setState(user.state || '');
      setCountry(user.country || '');
      setPinCode(user.pinCode || '');
      setUsernameStatus('available');
      setUsernameError('');
      updateProfile({
        name: user.fullName || '',
        UserName: user.username || '',
        bio: user.bio || '',
        location: user.location || '',
        gender: user.gender || '',
        birthday: user.birthday || '',
        addressLine1: user.addressLine1 || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pinCode: user.pinCode || '',
        profileImage: profileUri,
        profilePhoto: profileUri,
        headerBackground: coverUri,
      });
    } catch (e) {
      console.error('loadProfile error:', e);
    }
  };

  const toBase64Web = async (uri: string): Promise<string | null> => {
    try {
      const res = await fetch(uri);
      const blob = await res.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const openImageSheet = () => {
    setShowImageSheet(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeImageSheet = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowImageSheet(false));
  };

  const openGenderSheet = () => {
    setShowGenderSheet(true);
    Animated.spring(genderSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeGenderSheet = () => {
    Animated.timing(genderSlideAnim, {
      toValue: 300,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setShowGenderSheet(false));
  };

  const selectGender = (value: string) => {
    setGender(value);
    closeGenderSheet();
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      validateBirthday(formatted);
    }
  };

  const openDatePicker = () => {
    // Parse existing birthday or set to 18 years ago
    if (birthday) {
      const parts = birthday.split('/');
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
        }
      }
    } else {
      const eighteenYearsAgo = new Date();
      eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
      setSelectedDate(eighteenYearsAgo);
    }
    setShowDatePicker(true);
  };

  const pickFromGallery = async () => {
    closeImageSheet();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setProfileImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setProfileImage(asset.uri);
      }
    }
  };

  const takePhoto = async () => {
    closeImageSheet();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setProfileImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setProfileImage(asset.uri);
      }
    }
  };

  const removePhoto = () => {
    closeImageSheet();
    setProfileImage(null);
  };

  const validateUsername = (text: string) => {
    // Convert to lowercase automatically
    const lowercaseText = text.toLowerCase();
    setUserName(lowercaseText);
    setUsernameError('');
    
    if (lowercaseText.length < 3) {
      setUsernameStatus('idle');
      setUsernameError('Minimum 3 characters');
      return;
    }
    if (lowercaseText.length > 20) {
      setUsernameStatus('idle');
      setUsernameError('Maximum 20 characters');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(lowercaseText)) {
      setUsernameStatus('idle');
      setUsernameError('Only lowercase, numbers & underscores');
      return;
    }
    
    // Check if username is same as current
    if (profileData.UserName && lowercaseText === profileData.UserName.toLowerCase()) {
      setUsernameStatus('available');
      return;
    }
    
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current);
    setUsernameStatus('checking');
    
    usernameTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/check-username?username=${lowercaseText}&userId=${userId}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
        if (!data.available) setUsernameError('Username already taken');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  };

  const validateBirthday = (text: string) => {
    setBirthday(text);
    setBirthdayError('');
    
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = text.match(regex);
    
    if (!match) {
      if (text.length >= 10) setBirthdayError('Invalid format (DD/MM/YYYY)');
      return;
    }
    
    const [, day, month, year] = match;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 18) {
      setBirthdayError('Must be at least 18 years old');
    }
  };

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.base64) {
        setCoverImage(`data:image/jpeg;base64,${asset.base64}`);
      } else {
        setCoverImage(asset.uri);
      }
    }
  };

  const saveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User information not found, please login again');
      return;
    }
    if (usernameStatus === 'taken' || usernameError) {
      Alert.alert('Error', 'Please fix username errors');
      return;
    }
    if (birthdayError) {
      Alert.alert('Error', 'Please fix birthday errors');
      return;
    }
    try {
      console.log('Starting profile save...');
      console.log('Profile image URI:', profileImage);
      console.log('Cover image URI:', coverImage);
      
      let imageToSend: string | null = profileImage;
      let coverToSend: string | null = coverImage;

      // For web blob URIs, convert to base64
      if (Platform.OS === 'web') {
        if (profileImage && profileImage.startsWith('blob:')) {
          imageToSend = await toBase64Web(profileImage);
        }
        if (coverImage && coverImage.startsWith('blob:')) {
          coverToSend = await toBase64Web(coverImage);
        }
      }
      
      const fullName = name && name.trim().length > 0 ? name.trim() : userName.trim();
      const payload: any = {
        userId,
        username: userName.trim(),
        fullName,
        bio: bio || '',
        location: location || '',
        gender: gender || '',
        birthday: birthday || '',
        addressLine1: addressLine1 || '',
        city: city || '',
        state: state || '',
        country: country || '',
        pinCode: pinCode || '',
      };
      
      // Include images if they're base64
      if (imageToSend && imageToSend.startsWith('data:')) {
        console.log('Adding profile image to payload, size:', imageToSend.length);
        payload.profileImage = imageToSend;
      } else {
        console.log('No base64 profile image to send');
      }
      
      if (coverToSend && coverToSend.startsWith('data:')) {
        console.log('Adding cover image to payload, size:', coverToSend.length);
        payload.coverImage = coverToSend;
      } else {
        console.log('No base64 cover image to send');
      }
      
      console.log('Sending payload with fields:', Object.keys(payload));
      
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const message = err?.message || 'Failed to save profile';
        console.error('Server error:', err);
        Alert.alert('Error', message);
        return;
      }
      
      const result = await response.json();
      console.log('Save successful:', result);
      
      // Reload fresh profile from server to get saved /uploads/ paths
      await loadProfile(userId);
      
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      console.error('Save profile error:', error);
      Alert.alert('Error', 'Something went wrong while saving profile');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </LinearGradient>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <View style={[styles.coverImageSection, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.coverImageContainer}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
                style={styles.coverImage}
              />
            )}
            <TouchableOpacity style={styles.editCoverButton} onPress={pickCoverImage}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.changePhotoText, { color: isDark ? '#ccc' : '#666' }]}>Tap to change cover photo</Text>
        </View>
        
        {/* Profile Image */}
        <View style={[styles.profileImageSection, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.profileImageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} resizeMode="cover" />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: isDark ? '#f7c14d' : '#127d96', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={50} color={isDark ? 'black' : 'white'} />
              </View>
            )}
            <TouchableOpacity style={styles.editImageButton} onPress={openImageSheet}>
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.changePhotoText, { color: isDark ? '#ccc' : '#666' }]}>Tap to change photo</Text>
        </View>
        
        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Personal Information */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Personal Information</Text>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="person" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Username</Text>
              </View>
              <View>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: isDark ? '#333' : '#f8f9fa',
                    color: isDark ? 'white' : '#333',
                    borderColor: usernameStatus === 'available' ? '#4CAF50' : usernameStatus === 'taken' ? '#f44336' : isDark ? '#f7c14d' : '#127d96'
                  }]}
                  value={userName}
                  onChangeText={validateUsername}
                  placeholder="Enter username (3-20 chars)"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  autoCapitalize="none"
                />
                <View style={styles.usernameStatus}>
                  {usernameStatus === 'checking' && <Text style={styles.checkingText}>Checking...</Text>}
                  {usernameStatus === 'available' && (
                    <View style={styles.statusRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.availableText}>Available</Text>
                    </View>
                  )}
                  {usernameStatus === 'taken' && (
                    <View style={styles.statusRow}>
                      <Ionicons name="close-circle" size={16} color="#f44336" />
                      <Text style={styles.takenText}>Taken</Text>
                    </View>
                  )}
                  {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
                  <Text style={[styles.charCount, { color: isDark ? '#888' : '#666' }]}>{userName.length}/20</Text>
                </View>
              </View>
            </View>
            
            {/* Name field hidden as requested; value still used in saveProfile */}
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="male-female" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Gender</Text>
              </View>
              <TouchableOpacity
                style={[styles.textInput, styles.dropdownInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                onPress={openGenderSheet}
              >
                <Text style={[styles.dropdownText, { color: gender ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
                  {gender || 'Select your gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#f7c14d' : '#127d96'} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="calendar" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Birthday</Text>
              </View>
              <View>
                <TouchableOpacity
                  style={[styles.textInput, styles.dropdownInput, { 
                    backgroundColor: isDark ? '#333' : '#f8f9fa',
                    borderColor: birthdayError ? '#f44336' : isDark ? '#f7c14d' : '#127d96'
                  }]}
                  onPress={openDatePicker}
                >
                  <Text style={[styles.dropdownText, { color: birthday ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
                    {birthday || 'Select your birthday (Min age: 18)'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? '#f7c14d' : '#127d96'} />
                </TouchableOpacity>
                {birthdayError && (
                  <View style={styles.statusRow}>
                    <Ionicons name="alert-circle" size={16} color="#f44336" />
                    <Text style={styles.errorText}>{birthdayError}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="document-text" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Bio / Hashtags</Text>
              </View>
              <View>
                <TextInput
                  style={[styles.textInput, styles.bioInput, { 
                    backgroundColor: isDark ? '#333' : '#f8f9fa',
                    color: isDark ? 'white' : '#333',
                    borderColor: isDark ? '#f7c14d' : '#127d96'
                  }]}
                  value={bio}
                  onChangeText={(text) => text.length <= 250 && setBio(text)}
                  placeholder="Tell us about yourself... #hashtags"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  multiline
                  numberOfLines={4}
                  maxLength={250}
                />
                <Text style={[styles.charCount, { color: bio.length > 200 ? '#ff9800' : isDark ? '#888' : '#666', alignSelf: 'flex-end', marginTop: 4 }]}>
                  {bio.length}/250
                </Text>
              </View>
            </View>
          </View>
          
          {/* Address Information */}
          {/* Address Information removed as requested */}
          
          {/* Other Information */}
          <View style={[styles.sectionCard, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Other Information</Text>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="location" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Location</Text>
              </View>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? 'white' : '#333',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter your location"
                placeholderTextColor={isDark ? '#888' : '#666'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Save Button */}
      <View style={[styles.buttonContainer, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <LinearGradient
            colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
            style={styles.saveButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color={isDark ? 'black' : 'white'} />
            <Text style={[styles.saveButtonText, { color: isDark ? 'black' : 'white' }]}>Save Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet for Image Options */}
      <Modal
        visible={showImageSheet}
        transparent
        animationType="fade"
        onRequestClose={closeImageSheet}
      >
        <Pressable style={styles.modalOverlay} onPress={closeImageSheet}>
          <Animated.View 
            style={[
              styles.bottomSheet,
              { backgroundColor: isDark ? '#2a2a2a' : 'white', transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: isDark ? 'white' : '#333' }]}>Profile Picture</Text>
            
            <TouchableOpacity style={styles.sheetOption} onPress={pickFromGallery}>
              <Ionicons name="images" size={24} color={isDark ? '#f7c14d' : '#127d96'} />
              <Text style={[styles.sheetOptionText, { color: isDark ? 'white' : '#333' }]}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={isDark ? '#f7c14d' : '#127d96'} />
              <Text style={[styles.sheetOptionText, { color: isDark ? 'white' : '#333' }]}>Take Photo</Text>
            </TouchableOpacity>
            
            {profileImage && (
              <TouchableOpacity style={styles.sheetOption} onPress={removePhoto}>
                <Ionicons name="trash" size={24} color="#f44336" />
                <Text style={[styles.sheetOptionText, { color: '#f44336' }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={[styles.sheetCancel, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={closeImageSheet}>
              <Text style={[styles.sheetCancelText, { color: isDark ? 'white' : '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Bottom Sheet for Gender Selection */}
      <Modal
        visible={showGenderSheet}
        transparent
        animationType="fade"
        onRequestClose={closeGenderSheet}
      >
        <Pressable style={styles.modalOverlay} onPress={closeGenderSheet}>
          <Animated.View 
            style={[
              styles.bottomSheet,
              { backgroundColor: isDark ? '#2a2a2a' : 'white', transform: [{ translateY: genderSlideAnim }] }
            ]}
          >
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: isDark ? 'white' : '#333' }]}>Select Gender</Text>
            
            <TouchableOpacity style={styles.sheetOption} onPress={() => selectGender('Male')}>
              <Ionicons name="male" size={24} color={isDark ? '#f7c14d' : '#127d96'} />
              <Text style={[styles.sheetOptionText, { color: isDark ? 'white' : '#333' }]}>Male</Text>
              {gender === 'Male' && <Ionicons name="checkmark" size={24} color="#4CAF50" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={() => selectGender('Female')}>
              <Ionicons name="female" size={24} color={isDark ? '#f7c14d' : '#127d96'} />
              <Text style={[styles.sheetOptionText, { color: isDark ? 'white' : '#333' }]}>Female</Text>
              {gender === 'Female' && <Ionicons name="checkmark" size={24} color="#4CAF50" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sheetOption} onPress={() => selectGender('Other')}>
              <Ionicons name="transgender" size={24} color={isDark ? '#f7c14d' : '#127d96'} />
              <Text style={[styles.sheetOptionText, { color: isDark ? 'white' : '#333' }]}>Other</Text>
              {gender === 'Other' && <Ionicons name="checkmark" size={24} color="#4CAF50" style={{ marginLeft: 'auto' }} />}
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.sheetCancel, { backgroundColor: isDark ? '#333' : '#f0f0f0' }]} onPress={closeGenderSheet}>
              <Text style={[styles.sheetCancelText, { color: isDark ? 'white' : '#333' }]}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 25,
    height: 120,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  placeholder: {
    width: 24,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#127d96',
    borderWidth: 4,
    borderColor: '#127d96',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#127d96',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  coverImageSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coverImageContainer: {
    position: 'relative',
    marginBottom: 10,
    width: '90%',
  },
  coverImage: {
    width: '100%',
    height: 150,
    borderRadius: 15,
  },
  editCoverButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#127d96',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#127d96',
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingBottom: 30,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 15,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  sheetCancel: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  usernameStatus: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  checkingText: {
    fontSize: 13,
    color: '#ff9800',
  },
  availableText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  takenText: {
    fontSize: 13,
    color: '#f44336',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: '#f44336',
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
});
