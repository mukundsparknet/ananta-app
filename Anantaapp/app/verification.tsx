import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  TextInput,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { ENV } from '@/config/env';

const { width, height } = Dimensions.get('window');

export default function VerificationScreen() {
  const { isDark } = useTheme();
  const [selectedDocType, setSelectedDocType] = useState('');
  const [documentImage, setDocumentImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    documentNumber: '',
    dateOfBirth: '',
    address: '',
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const storedUserId = window.localStorage.getItem('userId');
      if (storedUserId) {
        loadVerification(storedUserId);
      }
    }
  }, []);

  const loadVerification = async (userId: string) => {
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${userId}`);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const kyc = data.kyc;
      const user = data.user;
      if (kyc) {
        setSelectedDocType((kyc.documentType || '').toLowerCase());
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || '',
          documentNumber: kyc.documentNumber || '',
          address: user.addressLine1 || '',
        }));
      } else if (user) {
        setFormData(prev => ({
          ...prev,
          fullName: user.fullName || '',
          address: user.addressLine1 || '',
        }));
      }
    } catch {
    }
  };

  const documentTypes = [
    { id: 'aadhar', name: 'Aadhar Card', icon: 'card-outline' },
    { id: 'license', name: 'Driving License', icon: 'car-outline' },
  ];

  const pickDocument = async () => {
    if (!selectedDocType) {
      Alert.alert('Error', 'Please select document type first');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setDocumentImage(result.assets[0].uri);
    }
  };

  const submitVerification = () => {
    if (!selectedDocType || !documentImage || !formData.fullName || !formData.documentNumber) {
      Alert.alert('Error', 'Please fill all required fields and upload document');
      return;
    }
    Alert.alert('Success', 'Document submitted for verification!', [
      { text: 'OK', onPress: () => router.replace('/(tabs)/profile') }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>KYC Verification</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Document Type Selection */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={isDark ? '#f7c14d' : '#127d96'} />
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Select Document Type</Text>
          </View>
          <View style={styles.documentTypes}>
            {documentTypes.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.docTypeButton,
                  selectedDocType === doc.id && styles.selectedDocType,
                  { 
                    backgroundColor: selectedDocType === doc.id ? (isDark ? '#f7c14d' : '#127d96') : (isDark ? '#333' : '#f8f9fa'),
                    borderColor: selectedDocType === doc.id ? (isDark ? '#f7c14d' : '#127d96') : (isDark ? '#555' : '#dee2e6')
                  }
                ]}
                onPress={() => setSelectedDocType(doc.id)}
              >
                <Ionicons 
                  name={doc.icon} 
                  size={20} 
                  color={selectedDocType === doc.id ? (isDark ? 'black' : '#fff') : (isDark ? 'white' : '#127d96')} 
                />
                <Text style={[
                  styles.docTypeText,
                  { color: selectedDocType === doc.id ? (isDark ? 'black' : '#fff') : (isDark ? 'white' : '#127d96') }
                ]}>
                  {doc.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Document */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cloud-upload" size={20} color={isDark ? '#f7c14d' : '#127d96'} />
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Upload Document</Text>
          </View>
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument}>
            {documentImage ? (
              <View style={styles.uploadedContainer}>
                <Image source={{ uri: documentImage }} style={styles.uploadedImage} />
                <View style={styles.changeImageOverlay}>
                  <Ionicons name="camera" size={20} color="white" />
                  <Text style={styles.changeImageText}>Tap to change</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.uploadPlaceholder, { 
                borderColor: isDark ? '#555' : '#dee2e6',
                backgroundColor: isDark ? '#333' : '#f8f9fa'
              }]}>
                <View style={styles.uploadIcon}>
                  <Ionicons name="cloud-upload-outline" size={40} color={isDark ? '#f7c14d' : '#127d96'} />
                </View>
                <Text style={[styles.uploadText, { color: isDark ? '#ccc' : '#666' }]}>Tap to upload document</Text>
                <Text style={[styles.uploadSubtext, { color: isDark ? '#888' : '#999' }]}>JPG, PNG or PDF (Max 5MB)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Document Details */}
        <View style={[styles.section, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle" size={20} color={isDark ? '#f7c14d' : '#127d96'} />
            <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#333' }]}>Document Details</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person" size={16} color={isDark ? '#f7c14d' : '#127d96'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  borderColor: isDark ? '#555' : '#dee2e6',
                  color: isDark ? 'white' : '#333'
                }]}
                placeholder="Full Name *"
                placeholderTextColor={isDark ? '#888' : '#666'}
                value={formData.fullName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="card" size={16} color={isDark ? '#f7c14d' : '#127d96'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  borderColor: isDark ? '#555' : '#dee2e6',
                  color: isDark ? 'white' : '#333'
                }]}
                placeholder={`${selectedDocType === 'aadhar' ? 'Aadhar' : selectedDocType === 'pan' ? 'PAN' : 'License'} Number *`}
                placeholderTextColor={isDark ? '#888' : '#666'}
                value={formData.documentNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, documentNumber: text }))}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="calendar" size={16} color={isDark ? '#f7c14d' : '#127d96'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  borderColor: isDark ? '#555' : '#dee2e6',
                  color: isDark ? 'white' : '#333'
                }]}
                placeholder="Date of Birth (DD/MM/YYYY)"
                placeholderTextColor={isDark ? '#888' : '#666'}
                value={formData.dateOfBirth}
                onChangeText={(text) => setFormData(prev => ({ ...prev, dateOfBirth: text }))}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={16} color={isDark ? '#f7c14d' : '#127d96'} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: isDark ? '#333' : '#f8f9fa',
                  borderColor: isDark ? '#555' : '#dee2e6',
                  color: isDark ? 'white' : '#333'
                }]}
                placeholder="Address"
                placeholderTextColor={isDark ? '#888' : '#666'}
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={submitVerification}>
          <LinearGradient
            colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
            style={styles.submitButtonGradient}
          >
            <Ionicons name="checkmark-circle" size={20} color={isDark ? 'black' : 'white'} />
            <Text style={[styles.submitButtonText, { color: isDark ? 'black' : 'white' }]}>Submit for Verification</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  content: {
    flex: 1,
    paddingTop: 20,
  },
  section: {
    marginHorizontal: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  documentTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  docTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedDocType: {
    backgroundColor: '#127d96',
    borderColor: '#127d96',
  },
  docTypeText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  uploadArea: {
    borderRadius: 15,
  },
  uploadedContainer: {
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
  },
  changeImageOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changeImageText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 15,
  },
  uploadIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(18, 125, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  uploadSubtext: {
    fontSize: 12,
  },
  form: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 45,
    paddingVertical: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  submitButton: {
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 30,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
