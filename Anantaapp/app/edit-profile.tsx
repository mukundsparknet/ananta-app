import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfile } from '../contexts/ProfileContext';
import { useTheme } from '../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get('window');
const API_BASE = 'https://ecofuelglobal.com';

const resolveProfileUri = (value: string | null | undefined) => {
  if (!value) return null;
  if (value.startsWith('http') || value.startsWith('data:')) return value;
  if (value.startsWith('/uploads/')) return `https://ecofuelglobal.com${value}`;
  return value;
};

export default function EditProfileScreen() {
  const { profileData, updateProfile } = useProfile();
  const { isDark } = useTheme();
  const [profileImage, setProfileImage] = useState(profileData.profilePhoto || profileData.profileImage);
  const [name, setName] = useState(profileData.name);
  const [bio, setBio] = useState(profileData.bio);
  const [location, setLocation] = useState(profileData.location);
  const [gender, setGender] = useState(profileData.gender);
  const [birthday, setBirthday] = useState(profileData.birthday);
  const [addressLine1, setAddressLine1] = useState(profileData.addressLine1);
  const [city, setCity] = useState(profileData.city);
  const [state, setState] = useState(profileData.state);
  const [country, setCountry] = useState(profileData.country);
  const [pinCode, setPinCode] = useState(profileData.pinCode);
  const [userName, setUserName] = useState(profileData.UserName);
  const [userId, setUserId] = useState<string | null>(null);

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
        setUserId(storedUserId);
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
      const user = data.user;
      const profileUri = resolveProfileUri(user.profileImage);
      setProfileImage(profileUri || profileImage);
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
        profileImage: profileUri || profileImage,
        profilePhoto: profileUri || profileImage,
      });
    } catch {
    }
  };

  const toBase64 = async (uri: string | null) => {
    if (!uri) return null;
    try {
      if (Platform.OS === 'web') {
        if (uri.startsWith('data:')) {
          return uri;
        }
        const res = await fetch(uri);
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        return dataUrl;
      }
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch {
      return null;
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const saveProfile = async () => {
    if (!userId) {
      Alert.alert('Error', 'User information not found, please login again');
      return;
    }
    try {
      let imageToSend: string | null = profileImage;
      if (
        profileImage &&
        !profileImage.startsWith('http') &&
        !profileImage.startsWith('data:') &&
        !profileImage.startsWith('/uploads/')
      ) {
        imageToSend = await toBase64(profileImage);
      }
      const fullName = name && name.trim().length > 0 ? name.trim() : userName.trim();
      const payload = {
        userId,
        username: userName.trim(),
        fullName,
        bio,
        location,
        gender,
        birthday,
        addressLine1,
        city,
        state,
        country,
        pinCode,
        profileImage: imageToSend,
      };
      const response = await fetch(`${API_BASE}/api/app/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const message = err?.message || 'Failed to save profile';
        Alert.alert('Error', message);
        return;
      }
      const resolvedUri = resolveProfileUri(imageToSend) || profileImage;
      updateProfile({
        name: fullName,
        UserName: userName,
        bio,
        location,
        gender,
        birthday,
        addressLine1,
        city,
        state,
        country,
        pinCode,
        profileImage: resolvedUri || profileImage,
        profilePhoto: resolvedUri || profileImage,
      });
      router.back();
    } catch {
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
        {/* Profile Image */}
        <View style={[styles.profileImageSection, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.profileImageContainer}>
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
            <TouchableOpacity style={styles.editImageButton} onPress={pickImage}>
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
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? 'white' : '#333',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                value={userName}
                onChangeText={setUserName}
                placeholder="Enter your username"
                placeholderTextColor={isDark ? '#888' : '#666'}
              />
            </View>
            
            {/* Name field hidden as requested; value still used in saveProfile */}
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="male-female" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Gender</Text>
              </View>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? 'white' : '#333',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                value={gender}
                onChangeText={setGender}
                placeholder="Enter your gender"
                placeholderTextColor={isDark ? '#888' : '#666'}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="calendar" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Birthday</Text>
              </View>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? 'white' : '#333',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                value={birthday}
                onChangeText={setBirthday}
                placeholder="Enter your birthday (DD/MM/YYYY)"
                placeholderTextColor={isDark ? '#888' : '#666'}
              />
            </View>
            
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Ionicons name="document-text" size={16} color={isDark ? '#f7c14d' : '#127d96'} />
                <Text style={[styles.fieldLabel, { color: isDark ? '#ccc' : '#333' }]}>Bio</Text>
              </View>
              <TextInput
                style={[styles.textInput, styles.bioInput, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  color: isDark ? 'white' : '#333',
                  borderColor: isDark ? '#f7c14d' : '#127d96'
                }]}
                value={bio}
                onChangeText={setBio}
                placeholder="Enter your bio"
                placeholderTextColor={isDark ? '#888' : '#666'}
                multiline
                numberOfLines={3}
              />
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
});
