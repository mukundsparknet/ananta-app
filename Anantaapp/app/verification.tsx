import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Alert, Image, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../contexts/ThemeContext';
import { ENV } from '@/config/env';

export default function VerificationScreen() {
  const { isDark } = useTheme();
  const [selectedDocType, setSelectedDocType] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<'NONE' | 'PENDING' | 'APPROVED'>('NONE');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', gender: '', birthday: '', bio: '', documentNumber: '', dateOfBirth: '', address: '' });

  const accentColor = isDark ? '#f7c14d' : '#127d96';
  const accentText = isDark ? 'black' : 'white';

  useEffect(() => {
    const loadUser = async () => {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      } else {
        userId = await SecureStore.getItemAsync('userId');
      }
      if (!userId) return;
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        const kyc = data.kyc;
        const user = data.user;
        if (kyc?.status === 'PENDING') setKycStatus('PENDING');
        if (kyc?.status === 'APPROVED') setKycStatus('APPROVED');
        const base = {
          fullName: user?.fullName || '',
          email: user?.email || '',
          phone: user?.phone || '',
          gender: user?.gender || '',
          birthday: user?.birthday || '',
          bio: user?.bio || '',
          dateOfBirth: user?.birthday || '',
          address: [user?.addressLine1, user?.city, user?.state].filter(Boolean).join(', ') || '',
        };
        if (kyc) {
          setSelectedDocType((kyc.documentType || '').toLowerCase().includes('aadhar') ? 'aadhar' : 'license');
          setFormData(prev => ({ ...prev, ...base, documentNumber: kyc.documentNumber || '' }));
        } else if (user) {
          setFormData(prev => ({ ...prev, ...base }));
        }
      } catch {}
    };
    loadUser();
  }, []);

  const documentTypes = [
    { id: 'aadhar', name: 'Aadhar Card', icon: 'card-outline' as const },
    { id: 'license', name: 'Driving License', icon: 'car-outline' as const },
  ];

  const pickDocument = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled) {
      if (side === 'front') setFrontImage(result.assets[0].uri);
      else setBackImage(result.assets[0].uri);
    }
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera permission is needed to take a selfie.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
      cameraType: ImagePicker.CameraType.front,
    });
    if (!result.canceled) setSelfieImage(result.assets[0].uri);
  };

  const toBase64 = async (uri: string | null): Promise<string | null> => {
    if (!uri) return null;
    try {
      if (Platform.OS === 'web') {
        const res = await fetch(uri);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      }
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      return `data:image/jpeg;base64,${base64}`;
    } catch { return null; }
  };

  const submitVerification = async () => {
    if (!selectedDocType || !frontImage || !selfieImage || !formData.fullName || !formData.email || !formData.documentNumber) {
      Alert.alert('Error', 'Please fill all required fields, upload the front document image, and take a selfie');
      return;
    }
    setSubmitting(true);
    try {
      let userId: string | null = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        userId = window.localStorage.getItem('userId');
      } else {
        userId = await SecureStore.getItemAsync('userId');
      }
      if (!userId) { Alert.alert('Error', 'Session expired. Please login again.'); return; }

      const docTypeMap: Record<string, string> = { aadhar: 'Aadhaar Card', license: 'Driving License' };

      const form = new FormData();
      form.append('userId', userId);
      form.append('username', formData.fullName);
      form.append('fullName', formData.fullName);
      form.append('email', formData.email);
      form.append('phone', formData.phone || '');
      form.append('gender', formData.gender || '');
      form.append('birthday', formData.birthday || '');
      form.append('bio', formData.bio || '');
      form.append('documentType', docTypeMap[selectedDocType] || selectedDocType);
      form.append('documentNumber', formData.documentNumber);

      if (frontImage) {
        const filename = frontImage.split('/').pop() || 'front.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('documentFrontImage', { uri: frontImage, name: filename, type } as any);
      }
      if (backImage) {
        const filename = backImage.split('/').pop() || 'back.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('documentBackImage', { uri: backImage, name: filename, type } as any);
      }
      if (selfieImage) {
        const filename = selfieImage.split('/').pop() || 'selfie.jpg';
        const match = /\.([a-zA-Z]+)$/.exec(filename);
        const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
        form.append('selfieImage', { uri: selfieImage, name: filename, type } as any);
      }

      const res = await fetch(`${ENV.API_BASE_URL}/api/app/register-multipart`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let msg = 'Submission failed. Try again.';
        try { msg = JSON.parse(text)?.message || text || msg; } catch { msg = text || msg; }
        Alert.alert('Error', msg);
        return;
      }
      setKycStatus('PENDING');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const UploadBox = ({ side, image, onRemove }: { side: 'front' | 'back'; image: string | null; onRemove: () => void }) => (
    <>
      <Text style={[styles.uploadLabel, { color: isDark ? '#ccc' : '#555' }]}>
        {side === 'front' ? 'Front Side *' : 'Back Side'}
      </Text>
      <TouchableOpacity style={styles.uploadArea} onPress={() => pickDocument(side)}>
        {image ? (
          <View style={styles.uploadedContainer}>
            <Image source={{ uri: image }} style={styles.uploadedImage} />
            <TouchableOpacity style={styles.removeOverlay} onPress={onRemove}>
              <Ionicons name="close" size={16} color="white" />
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.uploadPlaceholder, { borderColor: isDark ? '#555' : '#dee2e6', backgroundColor: isDark ? '#333' : '#f8f9fa' }]}>
            <View style={styles.uploadIconCircle}>
              <Ionicons name="cloud-upload-outline" size={36} color={accentColor} />
            </View>
            <Text style={[styles.uploadText, { color: isDark ? '#ccc' : '#666' }]}>Tap to upload {side}</Text>
            <Text style={[styles.uploadSubtext, { color: isDark ? '#888' : '#999' }]}>JPG, PNG (Max 5MB)</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      {/* Header */}
      <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={accentText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: accentText }]}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      {kycStatus === 'APPROVED' ? (
        /* ── Approved Screen ── */
        <View style={styles.successContainer}>
          <LinearGradient colors={['#38a169', '#48bb78']} style={styles.successIconCircle}>
            <Ionicons name="shield-checkmark" size={64} color="white" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: isDark ? 'white' : '#1a202c' }]}>KYC Approved!</Text>
          <Text style={[styles.successSubtitle, { color: isDark ? '#aaa' : '#718096' }]}>
            Your identity has been successfully verified.{'\n'}Your account is now fully verified.
          </Text>
          <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#1a2e1a' : '#f0fff4', borderColor: '#38a169' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#38a169" />
            <Text style={[styles.pendingBadgeText, { color: '#38a169' }]}>Verified Account</Text>
          </View>
        </View>
      ) : kycStatus === 'PENDING' ? (
        /* ── Pending Screen ── */
        <View style={styles.successContainer}>
          <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={64} color="white" />
          </LinearGradient>
          <Text style={[styles.successTitle, { color: isDark ? 'white' : '#1a202c' }]}>KYC Submitted!</Text>
          <Text style={[styles.successSubtitle, { color: isDark ? '#aaa' : '#718096' }]}>
            Your documents have been submitted successfully.{'\n'}Please wait for admin approval.{'\n'}You will be notified once reviewed.
          </Text>
          <View style={[styles.pendingBadge, { backgroundColor: isDark ? '#333' : '#fef5e7', borderColor: '#ed8936' }]}>
            <Ionicons name="time-outline" size={18} color="#ed8936" />
            <Text style={styles.pendingBadgeText}>Pending Approval</Text>
          </View>
        </View>
      ) : (
        /* ── Form ── */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Document Type */}
          <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={accentColor} />
              <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Select Document Type</Text>
            </View>
            <View style={styles.documentTypes}>
              {documentTypes.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={[styles.docTypeButton, {
                    backgroundColor: selectedDocType === doc.id ? accentColor : (isDark ? '#333' : '#f8f9fa'),
                    borderColor: selectedDocType === doc.id ? accentColor : (isDark ? '#555' : '#dee2e6'),
                  }]}
                  onPress={() => { setSelectedDocType(doc.id); setFrontImage(null); setBackImage(null); }}
                >
                  <Ionicons name={doc.icon} size={20} color={selectedDocType === doc.id ? accentText : accentColor} />
                  <Text style={[styles.docTypeText, { color: selectedDocType === doc.id ? accentText : accentColor }]}>
                    {doc.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {selectedDocType !== '' && (
            <>
              {/* Upload Document */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="cloud-upload" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Upload Document</Text>
                </View>
                <UploadBox side="front" image={frontImage} onRemove={() => setFrontImage(null)} />
                <View style={{ height: 20 }} />
                <UploadBox side="back" image={backImage} onRemove={() => setBackImage(null)} />
              </View>

              {/* Selfie */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="camera" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Selfie Verification *</Text>
                </View>
                <Text style={[{ fontSize: 13, color: isDark ? '#aaa' : '#666', marginBottom: 12 }]}>
                  Take a selfie using your front camera for identity verification.
                </Text>
                {selfieImage ? (
                  <View style={styles.uploadedContainer}>
                    <Image source={{ uri: selfieImage }} style={[styles.uploadedImage, { height: 220, borderRadius: 110, width: 220, alignSelf: 'center' }]} />
                    <TouchableOpacity style={[styles.removeOverlay, { alignSelf: 'center', marginTop: 10, position: 'relative', bottom: 0, right: 0 }]} onPress={() => setSelfieImage(null)}>
                      <Ionicons name="close" size={16} color="white" />
                      <Text style={styles.removeText}>Retake</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity onPress={takeSelfie} style={[styles.uploadPlaceholder, { borderColor: isDark ? '#555' : '#dee2e6', backgroundColor: isDark ? '#333' : '#f8f9fa' }]}>
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera" size={36} color={accentColor} />
                    </View>
                    <Text style={[styles.uploadText, { color: isDark ? '#ccc' : '#666' }]}>Tap to take selfie</Text>
                    <Text style={[styles.uploadSubtext, { color: isDark ? '#888' : '#999' }]}>Front camera • Required</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Document Details */}
              <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle" size={20} color={accentColor} />
                  <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Document Details</Text>
                </View>
                <View style={styles.form}>
                  {[
                    { icon: 'person' as const, placeholder: 'Full Name *', key: 'fullName' },
                    { icon: 'mail' as const, placeholder: 'Email *', key: 'email' },
                    { icon: 'card' as const, placeholder: `${selectedDocType === 'aadhar' ? 'Aadhar' : 'License'} Number *`, key: 'documentNumber' },
                    { icon: 'calendar' as const, placeholder: 'Date of Birth (DD/MM/YYYY)', key: 'dateOfBirth' },
                    { icon: 'location' as const, placeholder: 'Address', key: 'address' },
                  ].map(({ icon, placeholder, key }) => (
                    <View key={key} style={styles.inputContainer}>
                      <Ionicons name={icon} size={16} color={accentColor} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { backgroundColor: isDark ? '#333' : '#f8f9fa', borderColor: isDark ? '#555' : '#dee2e6', color: isDark ? 'white' : '#333' }]}
                        placeholder={placeholder}
                        placeholderTextColor={isDark ? '#888' : '#666'}
                        value={(formData as any)[key]}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, [key]: text }))}
                        multiline={key === 'address'}
                      />
                    </View>
                  ))}
                </View>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitButton, { opacity: submitting ? 0.7 : 1 }]}
                onPress={submitVerification}
                disabled={submitting}
              >
                <LinearGradient colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']} style={styles.submitGradient}>
                  <Ionicons name="checkmark-circle" size={20} color={accentText} />
                  <Text style={[styles.submitText, { color: accentText }]}>
                    {submitting ? 'Submitting...' : 'Submit for Verification'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, height: 120 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { width: 24 },
  content: { flex: 1, paddingTop: 20 },

  // Success
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  successIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 28, elevation: 8 },
  successTitle: { fontSize: 28, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  successSubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 24, marginBottom: 28 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, borderWidth: 1.5, marginBottom: 36 },
  pendingBadgeText: { color: '#ed8936', fontWeight: '700', fontSize: 15 },
  backProfileButton: { width: '100%', borderRadius: 25, overflow: 'hidden' },
  backProfileGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  backProfileText: { fontSize: 16, fontWeight: '700' },

  // Form
  section: { marginHorizontal: 20, borderRadius: 20, padding: 25, marginBottom: 20, elevation: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  documentTypes: { flexDirection: 'row', gap: 10 },
  docTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1, elevation: 2 },
  docTypeText: { fontSize: 12, marginLeft: 6, fontWeight: '600' },

  // Upload
  uploadLabel: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  uploadArea: { borderRadius: 15 },
  uploadedContainer: { position: 'relative' },
  uploadedImage: { width: '100%', height: 180, borderRadius: 15 },
  removeOverlay: { position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 6 },
  removeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  uploadPlaceholder: { alignItems: 'center', paddingVertical: 40, borderWidth: 2, borderStyle: 'dashed', borderRadius: 15 },
  uploadIconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(18,125,150,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  uploadText: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  uploadSubtext: { fontSize: 12 },

  // Form fields
  form: { gap: 15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  inputIcon: { position: 'absolute', left: 15, zIndex: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 15, paddingHorizontal: 45, paddingVertical: 15, fontSize: 16 },

  // Submit
  submitButton: { marginHorizontal: 20, borderRadius: 25, overflow: 'hidden', marginBottom: 10 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
  submitText: { fontSize: 16, fontWeight: 'bold' },
});
