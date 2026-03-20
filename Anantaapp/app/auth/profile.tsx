import { StyleSheet, TextInput, TouchableOpacity, View, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Modal, FlatList, Text, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from '../../contexts/ProfileContext';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const userId = typeof params.userId === 'string' ? params.userId : '';
  const prefilledEmail = typeof params.email === 'string' ? params.email : '';
  const { updateProfile } = useProfile();
  const { isDark } = useTheme();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState(prefilledEmail);
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [birthday, setBirthday] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const leaveRegistration = async () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('userId');
      window.localStorage.removeItem('userEmail');
    } else {
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('userEmail');
    }
    router.replace('/auth/login');
  };

  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Cancel Registration?',
        'Your profile is not complete. You will need to sign in again.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', onPress: leaveRegistration }
        ]
      );
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const genderOptions = ['Male', 'Female', 'Other'];

  const isFormValid =
    userName.trim().length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(userName.trim()) &&
    email.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) &&
    !!gender &&
    !!birthday &&
    acceptedTerms;

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') setShowDatePicker(false);
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
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
        if (!result.canceled) setProfileImage(result.assets[0].uri);
        return;
      }
      Alert.alert('Select Photo', 'Choose an option', [
        { text: 'Camera', onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Camera permission is required'); return; }
          const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) setProfileImage(result.assets[0].uri);
        }},
        { text: 'Gallery', onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed', 'Gallery permission is required'); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (!result.canceled) setProfileImage(result.assets[0].uri);
        }},
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch { Alert.alert('Error', 'Something went wrong'); }
  };

  const toBase64 = async (uri: string | null) => {
    if (!uri) return null;
    try {
      if (Platform.OS === 'web') {
        if (uri.startsWith('data:')) return uri;
        const res = await fetch(uri);
        const blob = await res.blob();
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:image/jpeg;base64,${base64}`;
    } catch { return null; }
  };

  const handleSubmit = async () => {
    if (!userId) { Alert.alert('Error', 'User information missing, please go back and verify OTP again'); return; }
    if (!isFormValid) { Alert.alert('Error', 'Please fill all required fields and accept the User Agreement'); return; }
    try {
      const profileImageBase64 = await toBase64(profileImage);
      const payload = {
        userId,
        username: userName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        fullName: userName.trim(),
        gender,
        birthday,
        bio,
        location,
        addressLine1: '', city: '', state: '', country: '', pinCode: '',
        profileImage: profileImageBase64,
      };
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => null);
        Alert.alert('Error', err?.message || 'Failed to save profile');
        return;
      }
      updateProfile({ name: userName, title: userName, bio, location, email });
      // Apply referral code if entered
      if (referralCode.trim()) {
        try {
          await fetch(`${ENV.API_BASE_URL}/api/app/referral/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, inviteCode: referralCode.trim().toUpperCase() }),
          });
        } catch { /* silent — referral is optional */ }
      }
      router.replace('/(tabs)');
    } catch { Alert.alert('Error', 'Something went wrong while saving your profile'); }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: isDark ? '#1a1a1a' : 'white', borderBottomColor: isDark ? '#333' : '#126996' }]}>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Cancel Registration?',
            'Your profile is not complete. You will need to sign in again.',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'Leave', onPress: leaveRegistration }
            ]
          );
        }}>
          <Ionicons name="chevron-back" size={24} color={isDark ? 'white' : '#333'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'white' : '#333' }]}>Set Up Profile</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Avatar */}
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
                <Ionicons name="person-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Username (min 3 chars, letters/numbers only) *"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={userName}
                  onChangeText={(text) => setUserName(text.replace(/[^a-zA-Z0-9_]/g, ''))}
                  maxLength={20}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
                <Ionicons name="mail-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Email *"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!prefilledEmail}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
                <Ionicons name="call-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
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
                <Ionicons name="people-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <ThemedText style={[styles.dropdownText, { color: gender ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
                  {gender || 'Select Gender *'}
                </ThemedText>
                <Ionicons name="chevron-down" size={20} color={isDark ? '#888' : '#666'} />
              </TouchableOpacity>

              {Platform.OS === 'web' ? (
                <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
                  <Ionicons name="calendar-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                  <TextInput
                    style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                    placeholder="Birthday (DD/MM/YYYY) *"
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
                    <Ionicons name="calendar-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                    <ThemedText style={[styles.dropdownText, { color: birthday ? (isDark ? 'white' : '#333') : (isDark ? '#888' : '#666') }]}>
                      {birthday || 'Birthday (DD/MM/YYYY) *'}
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
                <Ionicons name="chatbubble-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Bio / Hashtags"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={bio}
                  onChangeText={setBio}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
                <Ionicons name="location-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Location"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={location}
                  onChangeText={setLocation}
                />
              </View>

              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#e9ecef' }]}>
                <Ionicons name="gift-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Reference Code (Optional)"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={referralCode}
                  onChangeText={(t) => setReferralCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={12}
                />
              </View>
            </View>

            {/* Terms */}
            <View style={styles.sectionContainer}>
              <TouchableOpacity style={styles.termsRow} onPress={() => setShowTermsModal(true)}>
                <View style={[styles.checkbox, { borderColor: isDark ? '#888' : '#666', backgroundColor: acceptedTerms ? '#127d96' : 'transparent' }]}>
                  {acceptedTerms && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <ThemedText style={[styles.termsText, { color: isDark ? 'white' : '#333' }]}>I agree to the User Agreement</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.nextButtonContainer, { opacity: isFormValid ? 1 : 0.5 }]} onPress={handleSubmit} disabled={!isFormValid}>
            <LinearGradient colors={[Colors.light.primary, Colors.light.primaryDark]} style={styles.nextButton}>
              <ThemedText style={styles.buttonText}>Get Started</ThemedText>
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
              {[
                'By creating an account you agree that:',
                '• You are at least 18 years old or have permission from a guardian.',
                '• You will provide correct information and keep it up to date.',
                '• You will not use the app for illegal, abusive or harmful activity.',
                '• Virtual coins have no real-world cash value and can be changed or removed at any time.',
              ].map((t, i) => (
                <ThemedText key={i} style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>{t}</ThemedText>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#127d96', marginTop: 12 }]} onPress={() => { setAcceptedTerms(true); setShowTermsModal(false); }}>
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>I Agree</Text>
            </TouchableOpacity>
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
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { backgroundColor: gender === item ? (isDark ? '#127d96' : '#e6f3f7') : 'transparent' }]}
                  onPress={() => { setGender(item); setShowGenderDropdown(false); }}
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15, borderBottomWidth: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  placeholder: { width: 24 },
  keyboardContainer: { flex: 1 },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 30, paddingBottom: 150 },
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profileImage: { width: '100%', height: '100%', borderRadius: 50 },
  plusIcon: { fontSize: 30, fontWeight: 'bold' },
  galleryText: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  formContainer: { marginBottom: 20 },
  sectionContainer: { marginBottom: 25 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 25, paddingHorizontal: 20, height: 55, marginBottom: 15, borderWidth: 1 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  dropdownText: { flex: 1, fontSize: 16, fontWeight: '500' },
  nextButtonContainer: { marginTop: 10, marginBottom: 40, marginHorizontal: 20 },
  nextButton: { height: 55, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  termsText: { flex: 1, fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dropdownModal: { height: '50%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  termsModal: { maxHeight: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  termsBody: { marginTop: 10, marginBottom: 10 },
  termsParagraph: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  modalButton: { borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  dropdownItem: { paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 2 },
  dropdownItemText: { fontSize: 16 },
});
