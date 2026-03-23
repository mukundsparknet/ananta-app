import { StyleSheet, TextInput, TouchableOpacity, View, Image, ScrollView, KeyboardAvoidingView, Platform, Alert, StatusBar, Modal, FlatList, Text, BackHandler } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useProfile } from '../../contexts/ProfileContext';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { ENV } from '@/config/env';

const TERMS_TEXT = `ANANTA
Terms of Service
Please read these terms carefully before using Ananta.
Effective Date: 23 February 2026
Operated by Sparknet Studios
support@anantalive.com  |  anantalive.com

1. Acceptance of Terms
These Terms of Service ("Terms") constitute a legally binding agreement between you and Sparknet Studios ("we", "us", "our") governing your access to and use of the Ananta live streaming platform, including our mobile application and website (collectively, the "Platform"). By creating an account or using the Platform, you confirm that you have read, understood, and agreed to these Terms and our Privacy Policy.
If you do not agree to these Terms, you must not use the Platform.

2. Eligibility
You must be at least 18 years of age to register and use Ananta. By using the Platform, you represent and warrant that you are 18 years or older and have the legal capacity to enter into a binding agreement. If we discover that a user is under 18, we reserve the right to immediately suspend or terminate their account without prior notice.

3. Account Registration
• You must provide accurate, current, and complete information during registration
• You are responsible for maintaining the confidentiality of your login credentials
• You are responsible for all activities that occur under your account
• You must notify us immediately at support@anantalive.com if you suspect any unauthorised access to your account
• You may not create multiple accounts, transfer your account to another person, or impersonate any individual or entity
• We reserve the right to refuse registration or suspend accounts at our discretion

4. Platform Features

4.1 Live Streaming and Audio Streaming
Ananta allows eligible users to broadcast live video and audio streams to other users on the Platform. By broadcasting, you grant Ananta a non-exclusive, royalty-free, worldwide licence to display and distribute your content on the Platform for the purpose of delivering the service. You retain ownership of your original content.

4.2 Coin System and Recharges
Ananta operates a virtual coin economy. Users may purchase coins using real money via supported payment methods including UPI and cards processed by Razorpay. Coins have no monetary value outside the Platform, cannot be exchanged for cash by non-creators, and are non-refundable except where required by applicable law. Sparknet Studios reserves the right to modify coin rates, pricing, and packages at any time.

4.3 Gifting
Users may send virtual gifts to streamers using coins. Gifts represent a voluntary expression of appreciation and do not constitute a payment for services. Sparknet Studios retains a platform fee on all gifts before crediting the remaining value to the streamer's account. The platform fee percentage will be communicated within the app and may change with prior notice.

4.4 Creator Withdrawals
Creators who accumulate eligible earnings may withdraw funds to their registered bank account or UPI ID subject to the following conditions:
• Minimum withdrawal threshold as specified in the app
• Completion of KYC (Know Your Customer) verification as required by applicable Indian regulations
• Compliance with all applicable tax obligations — TDS may be deducted as required by Indian income tax laws
• Withdrawal requests are processed within 3-7 business days
• Sparknet Studios reserves the right to withhold withdrawals pending fraud investigation

5. Community Guidelines and Prohibited Conduct
You agree not to use Ananta to:
• Broadcast, post, or share any content that is obscene, pornographic, sexually explicit, or harmful to minors
• Harass, bully, threaten, defame, or abuse any other user
• Promote or incite violence, hatred, discrimination, or illegal activity
• Violate any applicable Indian law including the Information Technology Act, 2000 and Indian Penal Code
• Infringe the intellectual property rights of any third party including copyright, trademark, or trade secrets
• Engage in fraudulent recharges, self-gifting abuse, or any manipulation of the coin or gift economy
• Use bots, scripts, or automated tools to interact with the Platform
• Attempt to reverse-engineer, hack, or disrupt the Platform or its infrastructure
• Collect or harvest personal data of other users without their consent
We reserve the right to remove any content and suspend or terminate any account that violates these guidelines without prior notice.

6. Content Moderation
Ananta employs both automated tools and human review to monitor content on the Platform. We reserve the right to remove, restrict, or report any content that we determine, in our sole discretion, violates these Terms, our Community Guidelines, or applicable law. Users may report violating content using the in-app report feature. Reported content will be reviewed within a reasonable timeframe.

7. Intellectual Property
All Platform content created by Sparknet Studios, including but not limited to the Ananta name, logo, design, software, and features, is owned by or licenced to Sparknet Studios and protected under applicable intellectual property laws. You may not reproduce, modify, distribute, or create derivative works from our content without prior written consent.
You retain ownership of original content you create on Ananta. By posting content on the Platform, you grant Sparknet Studios a non-exclusive, royalty-free licence to use, display, and distribute such content solely for the purpose of operating the Platform.

8. Payments, Refunds, and Disputes
All transactions on Ananta are processed by Razorpay and are subject to their terms of service. Coin purchases are generally non-refundable. Refunds may be considered in the following limited circumstances:
• Duplicate charges due to a technical error
• Recharge successful but coins not credited within 24 hours
To raise a payment dispute, contact support@anantalive.com with your transaction ID and details within 7 days of the transaction. We will investigate and respond within 10 business days.

9. Disclaimers and Limitation of Liability
The Platform is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. To the maximum extent permitted by applicable law, Sparknet Studios disclaims all warranties including merchantability, fitness for a particular purpose, and non-infringement.
Sparknet Studios shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Platform, including but not limited to loss of coins, data, or revenue. Our total liability to you for any claim shall not exceed the amount you paid to Ananta in the 3 months preceding the claim.

10. Indemnification
You agree to indemnify and hold harmless Sparknet Studios, its officers, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including legal fees) arising out of your use of the Platform, your content, your violation of these Terms, or your violation of any rights of another party.

11. Termination
We may suspend or terminate your account at any time, with or without notice, for violation of these Terms, fraudulent activity, or any reason we deem appropriate in our sole discretion. You may delete your account at any time through the app settings. Upon termination, your right to use the Platform ceases immediately. Any unused coins or pending withdrawals will be handled as per our refund and withdrawal policies.

12. Governing Law and Dispute Resolution
These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from or related to these Terms or the Platform shall be subject to the exclusive jurisdiction of the courts of India. We encourage you to contact us at support@anantalive.com to resolve any disputes informally before initiating legal proceedings.

13. Changes to Terms
Sparknet Studios reserves the right to update or modify these Terms at any time. We will notify users of material changes via in-app notification or email at least 7 days before the changes take effect. Your continued use of the Platform after the effective date of changes constitutes acceptance of the revised Terms.

14. Contact Us
For any questions regarding these Terms of Service, please contact:
• Email: support@anantalive.com
• Website: https://anantalive.com
• Operated by: Sparknet Studios, India`;

const PRIVACY_TEXT = `ANANTA
Privacy Policy
Your privacy matters to us. Please read this carefully.
Effective Date: 23 February 2026
Operated by Sparknet Studios
support@anantalive.com  |  anantalive.com

1. Introduction
Welcome to Ananta, a live streaming and audio streaming platform operated by Sparknet Studios ("we", "us", or "our"). This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use the Ananta mobile application or website (collectively, the "Platform").
By registering or using Ananta, you agree to the practices described in this Privacy Policy. If you do not agree, please discontinue use of the Platform immediately.

2. Who Can Use Ananta
Ananta is strictly intended for users who are 18 years of age or older. We do not knowingly collect personal information from anyone under the age of 18. If we discover that a user under 18 has provided us personal data, we will delete it promptly. If you believe a minor has registered on the Platform, please contact us at support@anantalive.com.

3. Information We Collect

3.1 Information You Provide
• Full name, email address, and phone number during registration
• Profile information such as display name, profile photo, and bio
• Payment information including transaction details processed via Razorpay (we do not store raw card or UPI credentials)
• User-generated content including live video streams, audio streams, messages, comments, and gifts sent or received

3.2 Information Collected Automatically
• Device information such as device model, operating system, and unique device identifiers
• IP address and approximate location data derived from your network connection
• Usage data including pages viewed, features used, session duration, and interaction patterns
• Log data including access times, app crashes, and error reports

3.3 Information from Third Parties
• Agora.io: Streaming session metadata for the purpose of delivering live audio and video
• Razorpay: Payment confirmation and transaction status
• Google Analytics: Aggregated usage statistics and behavioural analytics

4. How We Use Your Information
We use the information we collect for the following purposes:
• To create and manage your Ananta account
• To enable live video and audio streaming features powered by Agora
• To process coin recharges, gift transactions, and creator withdrawals via Razorpay
• To send you transactional notifications such as recharge confirmations, withdrawal updates, and account alerts
• To monitor Platform activity and enforce our community guidelines and Terms of Service
• To analyse usage patterns via Google Analytics and improve Platform features
• To respond to your customer support requests
• To comply with applicable Indian laws, regulations, and legal obligations

5. Sharing of Your Information
We do not sell your personal information to third parties. We share your data only in the following limited circumstances:
• Agora.io: To deliver real-time audio and video streaming functionality
• Razorpay: To process payments, recharges, and payouts securely
• Google Analytics: To understand aggregated Platform usage (data is anonymised)
• Law enforcement or regulatory authorities: When required by applicable Indian law, court order, or government request
• Business transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred to the new entity subject to the same privacy protections

6. Location Data
Ananta collects approximate location data derived from your IP address to personalise content, detect fraudulent activity, and comply with regional regulations. We do not collect precise GPS location without your explicit consent. You may limit location data collection through your device settings, though some features may not function correctly as a result.

7. User Generated Content
Content you create on Ananta, including live streams, audio broadcasts, messages, and gifts, may be visible to other users on the Platform. You are solely responsible for the content you share. Ananta reserves the right to monitor, remove, or restrict any content that violates our Community Guidelines or applicable law. Recorded streams, if any, may be retained for moderation and safety purposes.

8. Data Retention
We retain your personal data for as long as your account is active or as required to provide Platform services. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law or for legitimate business purposes such as fraud prevention and dispute resolution.

9. Data Security
We implement industry-standard technical and organisational measures to protect your personal data from unauthorised access, alteration, disclosure, or destruction. These include encrypted data transmission (HTTPS/TLS), access controls, and secure payment processing via Razorpay's PCI-DSS compliant infrastructure. However, no method of transmission over the internet is 100% secure and we cannot guarantee absolute security.

10. Your Rights
As a user, you have the following rights with respect to your personal data:
• Access: Request a copy of the personal data we hold about you
• Correction: Request correction of inaccurate or incomplete data
• Deletion: Request deletion of your account and associated data
• Withdrawal of Consent: Withdraw consent to data processing at any time (note this may affect Platform functionality)
• Grievance Redressal: Lodge a complaint with our Grievance Officer as required under the Information Technology Act, 2000
To exercise any of these rights, please contact us at support@anantalive.com. We will respond within 30 days.

11. Grievance Officer
In accordance with the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, we have appointed a Grievance Officer:
• Name: Sparknet Studios
• Email: support@anantalive.com
• Response time: Within 30 days of receiving a grievance

12. Cookies and Tracking
The Ananta web platform uses cookies and similar tracking technologies to maintain sessions, remember preferences, and collect analytics data via Google Analytics. You may control cookie preferences through your browser settings. Disabling cookies may affect the functionality of certain Platform features.

13. Third Party Links
Ananta may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties and encourage you to review their privacy policies before sharing any personal information.

14. Changes to This Policy
We may update this Privacy Policy from time to time. We will notify you of significant changes via in-app notification or email. Continued use of the Platform after changes are posted constitutes your acceptance of the updated policy. The effective date at the top of this document will always reflect the most recent revision.

15. Contact Us
For any questions, concerns, or requests related to this Privacy Policy, please contact:
• Email: support@anantalive.com
• Website: https://anantalive.com
• Operated by: Sparknet Studios, India`;

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
  const [termsTab, setTermsTab] = useState(0);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const leaveRegistration = async () => {
    if (Platform.OS === 'web') {
      window.localStorage.removeItem('userId');
      window.localStorage.removeItem('userEmail');
    } else {
      await SecureStore.deleteItemAsync('userId');
      await SecureStore.deleteItemAsync('userEmail');
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

  const handleUsernameChange = (text: string) => {
    const clean = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUserName(clean);
    setUsernameStatus('idle');
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (clean.length < 3) return;
    setUsernameStatus('checking');
    usernameTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/check-username?username=${clean}`);
        const data = await res.json();
        setUsernameStatus(data.available ? 'available' : 'taken');
      } catch { setUsernameStatus('idle'); }
    }, 600);
  };

  const genderOptions = ['Male', 'Female', 'Other'];

  const isFormValid =
    userName.trim().length >= 3 &&
    /^[a-z0-9_]+$/.test(userName.trim()) &&
    usernameStatus === 'available' &&
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

              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: usernameStatus === 'taken' ? '#e53e3e' : usernameStatus === 'available' ? '#38a169' : isDark ? '#555' : '#e9ecef' }]}>
                <Ionicons name="person-outline" size={20} color={isDark ? '#555' : Colors.light.primary} style={styles.icon} />
                <TextInput
                  style={[styles.input, { color: isDark ? 'white' : '#333' }]}
                  placeholder="Username (min 3 chars, a-z 0-9 _) *"
                  placeholderTextColor={isDark ? '#888' : '#666'}
                  value={userName}
                  onChangeText={handleUsernameChange}
                  maxLength={20}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {usernameStatus === 'checking' && <Ionicons name="ellipsis-horizontal" size={18} color="#888" />}
                {usernameStatus === 'available' && <Ionicons name="checkmark-circle" size={20} color="#38a169" />}
                {usernameStatus === 'taken' && <Ionicons name="close-circle" size={20} color="#e53e3e" />}
              </View>
              {usernameStatus === 'taken' && (
                <Text style={{ color: '#e53e3e', fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 20 }}>Username already taken</Text>
              )}
              {usernameStatus === 'available' && (
                <Text style={{ color: '#38a169', fontSize: 12, marginTop: -10, marginBottom: 10, marginLeft: 20 }}>Username available</Text>
              )}

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
              <ThemedText style={[styles.modalTitle, { color: isDark ? 'white' : '#333' }]}>Legal Documents</ThemedText>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
              </TouchableOpacity>
            </View>
            {/* Tabs */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              {['Terms of Service', 'Privacy Policy'].map((tab, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setTermsTab(i)}
                  style={[styles.termsTab, termsTab === i && { borderBottomColor: '#127d96', borderBottomWidth: 2.5 }]}
                >
                  <ThemedText style={{ fontSize: 13, fontWeight: '600', color: termsTab === i ? '#127d96' : (isDark ? '#888' : '#999') }}>{tab}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.termsBody}>
              <ThemedText style={[styles.termsParagraph, { color: isDark ? '#ddd' : '#444' }]}>
                {termsTab === 0 ? TERMS_TEXT : PRIVACY_TEXT}
              </ThemedText>
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#127d96', flex: 1 }]} onPress={() => { setAcceptedTerms(true); setShowTermsModal(false); }}>
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>I Agree</Text>
              </TouchableOpacity>
            </View>
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
  termsModal: { maxHeight: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  termsBody: { marginTop: 10, marginBottom: 10 },
  termsParagraph: { fontSize: 14, marginBottom: 8, lineHeight: 20 },
  termsTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  modalButton: { borderRadius: 20, paddingVertical: 12, alignItems: 'center' },
  dropdownItem: { paddingVertical: 15, paddingHorizontal: 15, borderRadius: 8, marginBottom: 2 },
  dropdownItemText: { fontSize: 16 },
});
