import { StyleSheet, TextInput, TouchableOpacity, View, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Modal, FlatList, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { LevelBadge } from '@/components/level-badge';
import { Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from '../../contexts/ProfileContext';
import * as FileSystem from 'expo-file-system';
import { ENV } from '@/config/env';

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const prefilledEmail = typeof params.email === 'string' ? params.email : '';
  const { updateProfile } = useProfile();
  const { isDark } = useTheme();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState(''); // Add phone field
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pinCode, setPinCode] = useState('');
  
  // User level data
  const [userLevel] = useState({
    currentLevel: 7,
    currentXP: 2450,
    nextLevelXP: 3000,
  });
  
  // Dropdown states
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  
  // KYC states
  const [kycProfileImage, setKycProfileImage] = useState<string | null>(null);
  const [idImage, setIdImage] = useState<string | null>(null);
  const [document1, setDocument1] = useState<string | null>(null);
  const [document2, setDocument2] = useState<string | null>(null);

  // Identity Proof states
  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [showDocumentDropdown, setShowDocumentDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const documentTypes = ['Aadhaar Card', 'Passport'];
  const genderOptions = ['Male', 'Female', 'Other'];
  const getPlaceholder = () => {
    switch (documentType) {
      case 'Aadhaar Card': return 'XXXX XXXX XXXX';
      case 'Passport': return 'A1234567';
      case 'Driving License': return 'DL-XXXXXXXXXX';
      default: return 'Enter document number';
    }
  };

  const isBackImageRequired = documentType !== 'Passport';
  const isFormValid =
    userName.trim().length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(userName.trim()) &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    gender &&
    birthday &&
    documentType &&
    documentNumber.trim().length > 0 &&
    frontImage &&
    (isBackImageRequired ? !!backImage : true) &&
    acceptedTerms;

  // Sample data
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
    'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara',
    'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivli', 'Vasai-Virar', 'Varanasi'
  ];
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh', 'Dadra and Nagar Haveli', 'Daman and Diu', 'Lakshadweep'
  ];
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Brazil', 'Canada',
    'China', 'Denmark', 'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand', 'Norway', 'Pakistan',
    'Philippines', 'Poland', 'Portugal', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
    'Sri Lanka', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'UAE', 'United Kingdom', 'United States', 'Vietnam'
  ];

  const filteredCities = cities.filter(item => item.toLowerCase().includes(citySearch.toLowerCase()));
  const filteredStates = states.filter(item => item.toLowerCase().includes(stateSearch.toLowerCase()));
  const filteredCountries = countries.filter(item => item.toLowerCase().includes(countrySearch.toLowerCase()));

  const progressPercentage = ((userLevel.currentXP) / userLevel.nextLevelXP) * 100;
  const remainingXP = userLevel.nextLevelXP - userLevel.currentXP;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setBirthDate(selectedDate);
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const year = selectedDate.getFullYear();
      setBirthday(`${day}/${month}/${year}`);
    }
  };

  const handleImagePicker = async () => {
    try {
      if (Platform.OS === 'web') {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled) {
          setProfileImage(result.assets[0].uri);
        }
        return;
      }
      Alert.alert(
        'Select Photo',
        'Choose an option',
        [
          {
            text: 'Camera',
            onPress: async () => {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
              }
            }
          },
          {
            text: 'Gallery',
            onPress: async () => {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission needed', 'Gallery permission is required');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled) {
                setProfileImage(result.assets[0].uri);
              }
            }
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need gallery permissions to select a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const pickKycImage = async (type: 'profile' | 'id' | 'doc1' | 'doc2' | 'front' | 'back') => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to select an image.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      // Here you would call presigned URL API and upload to cloud storage
      // For now, we'll just store the local URI
      switch (type) {
        case 'profile':
          setProfileImage(uri);
          break;
        case 'id':
          setIdImage(uri);
          break;
        case 'doc1':
          setDocument1(uri);
          break;
        case 'doc2':
          setDocument2(uri);
          break;
        case 'front':
          setFrontImage(uri);
          break;
        case 'back':
          setBackImage(uri);
          break;
      }
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
        
        // Compress image if too large
        if (blob.size > 500000) { // 500KB limit
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          return new Promise<string>((resolve) => {
            img.onload = () => {
              const maxWidth = 800;
              const maxHeight = 600;
              let { width, height } = img;
              
              if (width > height) {
                if (width > maxWidth) {
                  height = (height * maxWidth) / width;
                  width = maxWidth;
                }
              } else {
                if (height > maxHeight) {
                  width = (width * maxHeight) / height;
                  height = maxHeight;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = uri;
          });
        }
        
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

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Error', 'User information missing, please go back and verify OTP again');
      return;
    }
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill all required fields and accept the User Agreement');
      return;
    }

    try {
      const profileImageBase64 = await toBase64(profileImage);
      const frontImageBase64 = await toBase64(frontImage);
      const backImageBase64 = await toBase64(backImage);

      const payload = {
        userId,
        username: userName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        fullName: name.trim().length > 0 ? name.trim() : userName.trim(),
        gender,
        birthday,
        bio,
        addressLine1: '',
        city: '',
        state: '',
        country: '',
        pinCode: '',
        location,
        documentType,
        documentNumber,
        profileImage: profileImageBase64,
        documentFrontImage: frontImageBase64,
        documentBackImage: backImageBase64,
      };

      const response = await fetch(`${ENV.API_BASE_URL}/api/app/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        const message = err?.message || 'Failed to submit KYC';
        Alert.alert('Error', message);
        return;
      }

      updateProfile({
        name,
        title: userName,
        bio,
        location,
        email,
        city,
        state,
        country,
        pinCode,
        addressLine1,
      });

      router.replace({ pathname: '/auth/kyc-review', params: { userId } });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while submitting your details');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : 'white', borderBottomColor: isDark ? '#333' : '#126996' }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : '#333'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'white' : '#333' }]}>Profile</ThemedText>
        <View style={styles.placeholder} />
      </View>

    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
          <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
            <View style={[styles.avatar, { borderColor: isDark ? '#555' : Colors.light.primary }]}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <ThemedText style={[styles.plusIcon, { color: isDark ? '#555' : Colors.light.primary }]}>+</ThemedText>
              )}
            </View>
            <ThemedText style={[styles.galleryText, { color: isDark ? '#555' : Colors.light.primary }]}>Tap to select photo</ThemedText>
          </TouchableOpacity>
      
      <View style={styles.formContainer}>
        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionTitle, { color: isDark ? 'white' : Colors.light.primary }]}>Personal Information</ThemedText>
          
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/561/561127.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder="Username (min 3 chars, letters/numbers only)"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={userName}
              onChangeText={(text) => {
                const filtered = text.replace(/[^a-zA-Z0-9_]/g, '');
                setUserName(filtered);
              }}
              maxLength={20}
            />
          </View>
          
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/561/561127.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder="Email"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!prefilledEmail} // Disable editing if email is pre-filled from Google
            />
          </View>
          
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/724/724664.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder="Phone Number"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}
            onPress={() => setShowGenderDropdown(true)}
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <ThemedText style={[styles.dropdownText, { color: gender ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
              {gender || 'Select Gender'}
            </ThemedText>
            <Ionicons name="chevron-down" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          
          {Platform.OS === 'web' ? (
            <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' }} 
                style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
              />
              <TextInput
                style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                placeholder="Birthday (DD/MM/YYYY)"
                placeholderTextColor={isDark ? '#888' : '#666'}
                value={birthday}
                onChangeText={setBirthday}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Image 
                  source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png' }} 
                  style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
                />
                <ThemedText
                  style={[styles.dropdownText, { color: birthday ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}
                >
                  {birthday || 'Birthday (DD/MM/YYYY)'}
                </ThemedText>
                <Ionicons name="calendar-outline" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={birthDate || new Date(2000, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}
            </>
          )}
          
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3616/3616729.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder="Bio / Hashtags"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={bio}
              onChangeText={setBio}
            />
          </View>
        </View>
        
        {/* Address Information removed as per latest requirement */}
        
        {/* Other Information */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionTitle, { color: isDark ? 'white' : Colors.light.primary }]}>Other Information</ThemedText>
          
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder="Location"
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>
        
        {/* Identity Proof Section */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionTitle, { color: isDark ? 'white' : Colors.light.primary }]}>Identity Proof</ThemedText>
          
          {/* Document Type Dropdown */}
          <TouchableOpacity 
            style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}
            onPress={() => setShowDocumentDropdown(true)}
          >
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <ThemedText style={[styles.dropdownText, { color: documentType ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
              {documentType || 'Select Document Type *'}
            </ThemedText>
            <Ionicons name="chevron-down" size={20} color={isDark ? '#888' : '#666'} />
          </TouchableOpacity>
          
          {/* Document Number */}
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png' }} 
              style={[styles.iconImage, { tintColor: isDark ? '#555' : Colors.light.primary }]} 
            />
            <TextInput
              style={[styles.input, { color: isDark ? 'white' : '#333' }]}
              placeholder={getPlaceholder() + ' *'}
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={documentNumber}
              onChangeText={setDocumentNumber}
            />
          </View>
          
          {/* Document Front Image */}
          <View style={[styles.imageSection, { backgroundColor: isDark ? '#333' : 'white', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <ThemedText style={[styles.imageSectionTitle, { color: isDark ? 'white' : '#333' }]}>Document Front Image *</ThemedText>
            <TouchableOpacity 
              style={[styles.imageUpload, { borderColor: isDark ? '#555' : '#ddd' }]}
              onPress={() => pickKycImage('front')}
            >
              {frontImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: frontImage }} style={styles.uploadedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setFrontImage(null)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={30} color={isDark ? '#666' : '#999'} />
                  <ThemedText style={[styles.uploadText, { color: isDark ? '#666' : '#999' }]}>Tap to upload front image</ThemedText>
                  <ThemedText style={[styles.uploadSubtext, { color: isDark ? '#666' : '#999' }]}>JPG, PNG • Max 5MB</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Document Back Image */}
          <View style={[styles.imageSection, { backgroundColor: isDark ? '#333' : 'white', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <ThemedText style={[styles.imageSectionTitle, { color: isDark ? 'white' : '#333' }]}>
              Document Back Image {isBackImageRequired ? '*' : '(Optional)'}
            </ThemedText>
            <TouchableOpacity 
              style={[styles.imageUpload, { borderColor: isDark ? '#555' : '#ddd', opacity: documentType === 'Passport' ? 0.5 : 1 }]}
              onPress={() => pickKycImage('back')}
              disabled={documentType === 'Passport'}
            >
              {backImage ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: backImage }} style={styles.uploadedImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setBackImage(null)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera" size={30} color={isDark ? '#666' : '#999'} />
                  <ThemedText style={[styles.uploadText, { color: isDark ? '#666' : '#999' }]}>
                    {documentType === 'Passport' ? 'Not required for Passport' : 'Tap to upload back image'}
                  </ThemedText>
                  <ThemedText style={[styles.uploadSubtext, { color: isDark ? '#666' : '#999' }]}>JPG, PNG • Max 5MB</ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity style={styles.termsRow} onPress={() => setShowTermsModal(true)}>
            <View style={[styles.checkbox, { borderColor: isDark ? '#888' : '#666', backgroundColor: acceptedTerms ? (isDark ? '#127d96' : '#127d96') : 'transparent' }]}>
              {acceptedTerms && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <ThemedText style={[styles.termsText, { color: isDark ? 'white' : '#333' }]}>
              I agree to the User Agreement
            </ThemedText>
          </TouchableOpacity>
        </View>

      </View>
      
          <TouchableOpacity 
            style={[styles.nextButtonContainer, { opacity: isFormValid ? 1 : 0.5 }]}
            onPress={handleSubmit}
            disabled={!isFormValid}
          >
            <LinearGradient
              colors={[Colors.light.primary, Colors.light.primaryDark]}
              style={styles.nextButton}
            >
              <ThemedText style={styles.buttonText}>Next</ThemedText>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>

    {/* Terms Modal */}
    <Modal visible={showTermsModal} transparent animationType="slide" onRequestClose={() => setShowTermsModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.termsModal, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>User Agreement</ThemedText>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.termsBody}>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              By creating an account you agree that:
            </ThemedText>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              • You are at least 18 years old or have permission from a guardian.
            </ThemedText>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              • You will provide correct information and keep it up to date.
            </ThemedText>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              • You will not use the app for illegal, abusive or harmful activity.
            </ThemedText>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              • Virtual coins have no real-world cash value and can be changed or removed at any time.
            </ThemedText>
            <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
              • We may review your KYC documents to protect the community and follow the law.
            </ThemedText>
          </ScrollView>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#127d96', marginTop: 12 }]}
            onPress={() => {
              setAcceptedTerms(true);
              setShowTermsModal(false);
            }}
          >
            <Text style={[styles.modalButtonText, { color: 'white' }]}>I Agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

    {/* City Dropdown Modal */}
    <Modal visible={showCityDropdown} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? '#333' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Select City</ThemedText>
            <TouchableOpacity onPress={() => { setShowCityDropdown(false); setCitySearch(''); }}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#444' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Ionicons name="search" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? 'white' : '#333' }]}
              placeholder="Search city..."
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={citySearch}
              onChangeText={setCitySearch}
              autoFocus
            />
            {citySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCitySearch('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { backgroundColor: city === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                onPress={() => {
                  setCity(item);
                  setShowCityDropdown(false);
                  setCitySearch('');
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: city === item ? (isDark ? 'white' : '#127d96') : (isDark ? '#ccc' : '#333') }]}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>No cities found</ThemedText>
              </View>
            }
          />
        </View>
      </View>
    </Modal>

    {/* State Dropdown Modal */}
    <Modal visible={showStateDropdown} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? '#333' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Select State</ThemedText>
            <TouchableOpacity onPress={() => { setShowStateDropdown(false); setStateSearch(''); }}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#444' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Ionicons name="search" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? 'white' : '#333' }]}
              placeholder="Search state..."
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={stateSearch}
              onChangeText={setStateSearch}
              autoFocus
            />
            {stateSearch.length > 0 && (
              <TouchableOpacity onPress={() => setStateSearch('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredStates}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { backgroundColor: state === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                onPress={() => {
                  setState(item);
                  setShowStateDropdown(false);
                  setStateSearch('');
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: state === item ? (isDark ? 'white' : '#127d96') : (isDark ? '#ccc' : '#333') }]}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>No states found</ThemedText>
              </View>
            }
          />
        </View>
      </View>
    </Modal>

    {/* Country Dropdown Modal */}
    <Modal visible={showCountryDropdown} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? '#333' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Select Country</ThemedText>
            <TouchableOpacity onPress={() => { setShowCountryDropdown(false); setCountrySearch(''); }}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#444' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
            <Ionicons name="search" size={20} color={isDark ? '#888' : '#666'} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? 'white' : '#333' }]}
              placeholder="Search country..."
              placeholderTextColor={isDark ? '#888' : '#666'}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />
            {countrySearch.length > 0 && (
              <TouchableOpacity onPress={() => setCountrySearch('')}>
                <Ionicons name="close-circle" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { backgroundColor: country === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                onPress={() => {
                  setCountry(item);
                  setShowCountryDropdown(false);
                  setCountrySearch('');
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: country === item ? (isDark ? 'white' : '#127d96') : (isDark ? '#ccc' : '#333') }]}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ThemedText style={[styles.emptyText, { color: isDark ? '#888' : '#666' }]}>No countries found</ThemedText>
              </View>
            }
          />
        </View>
      </View>
    </Modal>

    {/* Document Type Dropdown Modal */}
    <Modal visible={showDocumentDropdown} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? '#333' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Select Document Type</ThemedText>
            <TouchableOpacity onPress={() => setShowDocumentDropdown(false)}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={documentTypes}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { backgroundColor: documentType === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                onPress={() => {
                  setDocumentType(item);
                  setDocumentNumber('');
                  setBackImage(null);
                  setShowDocumentDropdown(false);
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: documentType === item ? (isDark ? 'white' : '#127d96') : (isDark ? '#ccc' : '#333') }]}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* Gender Dropdown Modal */}
    <Modal visible={showGenderDropdown} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.dropdownModal, { backgroundColor: isDark ? '#333' : 'white' }]}>
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Select Gender</ThemedText>
            <TouchableOpacity onPress={() => setShowGenderDropdown(false)}>
              <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={genderOptions}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { backgroundColor: gender === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                onPress={() => {
                  setGender(item);
                  setShowGenderDropdown(false);
                }}
              >
                <ThemedText style={[styles.dropdownItemText, { color: gender === item ? (isDark ? 'white' : '#127d96') : (isDark ? '#ccc' : '#333') }]}>
                  {item}
                </ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 150,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  plusIcon: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  galleryText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 55,
    marginBottom: 15,
    borderWidth: 1,
  },
  iconImage: {
    width: 22,
    height: 22,
    marginRight: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  nextButtonContainer: {
    marginTop: 30,
    marginBottom: 40,
    marginHorizontal: 20,
  },
  nextButton: {
    height: 55,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  kycSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  kycSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageUpload: {
    height: 100,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 5,
    fontSize: 12,
  },
  fileUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dropdownModal: {
    height: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  dropdownItem: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 2,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  imageSection: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  imageSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imageUpload: {
    height: 120,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  uploadPlaceholder: {
    alignItems: 'center',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  uploadSubtext: {
    marginTop: 4,
    fontSize: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
  },
  termsModal: {
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  termsBody: {
    marginTop: 10,
    marginBottom: 10,
  },
  termsParagraph: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
