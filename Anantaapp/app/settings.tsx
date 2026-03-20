import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View, Switch, StatusBar } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  const settingsItems = [
    { id: 1, title: 'Theme', icon: 'moon', isToggle: true },
    { id: 2, title: 'Help & Feedback', icon: 'help-circle' },
    { id: 3, title: 'Level', icon: 'bar-chart' },
    { id: 4, title: 'Daily tasks', icon: 'checkmark-circle' },
    { id: 5, title: 'Room admin', icon: 'person' },
    { id: 6, title: 'Inventory & Back Pack', icon: 'bag', comingSoon: true },
    { id: 7, title: 'Invitation Rewards', icon: 'gift' },
    { id: 8, title: 'Block', icon: 'ban' },
    { id: 9, title: 'Band', icon: 'musical-notes' },
    { id: 10, title: 'Logout', icon: 'log-out' },
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
            <Text style={[styles.appTitle, { color: isDark ? 'black' : 'white' }]}>Settings</Text>
          </View>
          
          <View style={styles.headerActions}>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.settingsList}>
          {settingsItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.settingItem, { backgroundColor: isDark ? '#1a1a1a' : 'white' }]}
              onPress={() => {
                if (item.title === 'Theme') {
                  toggleTheme();
                } else if (item.title === 'Help & Feedback') {
                  router.push('/help-feedback');
                } else if (item.title === 'Level') {
                  router.push('/level-management');
                } else if (item.title === 'Daily tasks') {
                  router.push('/daily-tasks');
                } else if (item.title === 'Room admin') {
                  router.push('/room-admin');
                } else if (item.title === 'Inventory & Back Pack') {
                  // coming soon — do nothing
                } else if (item.title === 'Logout') {
                  router.replace('/auth/login');
                } else if (item.title === 'Invitation Rewards') {
                  router.push('/invitation-rewards');
                } else if (item.title === 'Block') {
                  router.push('/block');
                } else if (item.title === 'Band') {
                  router.push('/band');
                }
              }}
            >
              <View style={styles.leftSection}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon as any} size={24} color={isDark ? '#F7C14D' : '#127d96'} />
                </View>
                <Text style={[styles.settingText, { color: isDark ? 'white' : '#333' }]}>{item.title}</Text>
              </View>
              
              <View style={styles.rightSection}>
                {item.isToggle ? (
                  <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: '#767577', true: isDark ? '#F7C14D' : '#127d96' }}
                    thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
                  />
                ) : (item as any).comingSoon ? (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={isDark ? '#ccc' : '#666'} />
                )}
              </View>
            </TouchableOpacity>
          ))}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    paddingBottom: height * 0.1,
  },
  settingsList: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(247,193,77,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  rightSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  comingSoonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});