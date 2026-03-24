import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Dimensions, StatusBar, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function HelpFeedbackScreen() {
  const { isDark } = useTheme();
  const helpItems = [
    { id: 1, title: 'Frequently Asked Questions', description: 'Find answers to common questions', icon: 'help-circle' },
    { id: 2, title: 'Contact Support', description: 'Get help from our support team', icon: 'headset' },
    { id: 3, title: 'Report a Problem', description: 'Let us know about any issues', icon: 'bug' },
    { id: 4, title: 'Feature Request', description: 'Suggest new features', icon: 'bulb' },
    { id: 5, title: 'User Guide', description: 'Learn how to use the app', icon: 'book' },
    { id: 6, title: 'Privacy Policy', description: 'Read our privacy policy', icon: 'shield-checkmark' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
          
          <View style={styles.logoSection}>
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>Help & Support</Text>
          </View>
          
          <View style={styles.headerActions}>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Info */}
        <View style={[styles.contactCard, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="mail" size={32} color={isDark ? '#F7C14D' : '#127d96'} />
            <Text style={[styles.contactTitle, { color: isDark ? 'white' : '#333' }]}>Contact Information</Text>
          </View>
          
          <Text style={[styles.contactDescription, { color: isDark ? '#ccc' : '#666' }]}>
            Need help? Get in touch with our support team.
          </Text>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="mail" size={20} color={isDark ? '#F7C14D' : '#127d96'} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: isDark ? '#888' : '#999' }]}>Email</Text>
              <Text style={[styles.contactText, { color: isDark ? 'white' : '#333' }]}>support@anantalive.com</Text>
            </View>
          </View>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="call" size={20} color={isDark ? '#F7C14D' : '#127d96'} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: isDark ? '#888' : '#999' }]}>Phone</Text>
              <Text style={[styles.contactText, { color: isDark ? 'white' : '#333' }]}>9288201327 / 9288164450</Text>
            </View>
          </View>
          
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Ionicons name="time" size={20} color={isDark ? '#F7C14D' : '#127d96'} />
            </View>
            <View style={styles.contactTextContainer}>
              <Text style={[styles.contactLabel, { color: isDark ? '#888' : '#999' }]}>Availability</Text>
              <Text style={[styles.contactText, { color: isDark ? 'white' : '#333' }]}>24/7 Support Available</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
  },
  headerActions: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: height * 0.1,
  },
  contactCard: {
    padding: 32,
    borderRadius: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  contactDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  contactIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(247,193,77,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 16,
    fontWeight: '600',
  },
});