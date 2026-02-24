import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ENV } from '@/config/env';

const { width } = Dimensions.get('window');

const resolveAvatarUri = (value: string | null | undefined) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
  if (trimmed.startsWith('/uploads/')) return `${ENV.API_BASE_URL}${trimmed}`;
  if (trimmed.length > 100) return `data:image/jpeg;base64,${trimmed}`;
  return trimmed;
};

type ConversationItem = {
  threadId: string;
  otherUserId: string;
  name: string;
  username: string;
  lastMessage: string;
  time: string;
  unread: number;
  avatar: any;
};

type ContactItem = {
  userId: string;
  name: string;
  username: string;
  avatar: any;
};

const formatTime = (iso: string | null | undefined) => {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHour = ((hours + 11) % 12) + 1;
    return `${displayHour}:${minutes} ${suffix}`;
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) {
    return 'Yesterday';
  }
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export default function MessagesScreen() {
  const { isDark } = useTheme();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);

  const initialAvatars = [
    require('@/assets/images/h1.png.png'),
    require('@/assets/images/h2.png.png'),
    require('@/assets/images/h3.png.png'),
    require('@/assets/images/h4.png.png'),
  ];

  const pickAvatar = (index: number) => {
    if (initialAvatars.length === 0) {
      return null;
    }
    const i = index % initialAvatars.length;
    return initialAvatars[i];
  };

  useEffect(() => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }
    const fetchConversations = async () => {
      try {
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/messages/threads/${currentUserId}`);
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          return;
        }
        const mapped: ConversationItem[] = data.map((item: any, index: number) => {
          const name = item.fullName || item.username || 'User';
          const username = item.username ? `@${item.username}` : '@user';
          const time = item.lastMessageTime ? formatTime(item.lastMessageTime) : '';
          const avatarUri = resolveAvatarUri(item.profileImage);
          const avatar = avatarUri ? { uri: avatarUri } : pickAvatar(index);
          return {
            threadId: String(item.threadId),
            otherUserId: String(item.otherUserId),
            name,
            username,
            lastMessage: item.lastMessage || '',
            time,
            unread: item.unreadCount || 0,
            avatar,
          };
        });
        setConversations(mapped);
      } catch {
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);

  const openChat = (threadId: string | null, otherUserId: string, name: string, avatar: any) => {
    if (!currentUserId) {
      return;
    }
    router.push({
      pathname: '/chat',
      params: {
        threadId: threadId || '',
        otherUserId,
        otherName: name,
        otherAvatar: typeof avatar === 'number' ? String(avatar) : avatar?.uri || '',
      },
    });
  };

  const loadContacts = async () => {
    if (!currentUserId) {
      return;
    }
    try {
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/profile/${currentUserId}`);
      console.log('[Messages] loadContacts profile status:', res.status);
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      const followersJson = Array.isArray(data.followersList) ? data.followersList : [];
      const followingJson = Array.isArray(data.followingList) ? data.followingList : [];
      console.log('[Messages] followersList length:', followersJson.length);
      console.log('[Messages] followingList length:', followingJson.length);
      const mapUser = (item: any, index: number): ContactItem => {
        const name = item.fullName || item.username || 'User';
        const username = item.username ? `@${item.username}` : '@user';
        const avatarUri = resolveAvatarUri(item.profileImage);
        const avatar = avatarUri ? { uri: avatarUri } : pickAvatar(index);
        return {
          userId: String(item.userId),
          name,
          username,
          avatar,
        };
      };
      const combinedRaw = [...followersJson, ...followingJson];
      const seen: Record<string, boolean> = {};
      const combined: ContactItem[] = [];
      combinedRaw.forEach((item: any, index: number) => {
        const userId = String(item.userId);
        if (!seen[userId]) {
          seen[userId] = true;
          combined.push(mapUser(item, index));
        }
      });
      console.log('[Messages] combined contacts length:', combined.length);
      setContacts(combined);
      setShowNewChat(true);
    } catch (err) {
      console.log('[Messages] loadContacts error:', err);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <LinearGradient
        colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Messages</ThemedText>
        <TouchableOpacity style={styles.newChatButton} onPress={loadContacts}>
          <Ionicons name="add" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView style={styles.conversationsContainer} showsVerticalScrollIndicator={false}>
        {conversations.map((conversation, index) => (
          <TouchableOpacity
            key={conversation.threadId}
            style={[
              styles.conversationItem,
              {
                backgroundColor: isDark ? '#2a2a2a' : 'white',
              },
            ]}
            onPress={() => openChat(conversation.threadId, conversation.otherUserId, conversation.name, conversation.avatar)}
          >
            <View style={styles.avatarContainer}>
              {conversation.avatar && (
                <Image
                  source={conversation.avatar}
                  style={[styles.avatar, { borderColor: isDark ? '#f7c14d' : '#127d96' }]}
                />
              )}
            </View>

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <ThemedText style={[styles.userName, { color: isDark ? 'white' : '#333' }]}>
                  {conversation.name}
                </ThemedText>
                <ThemedText style={[styles.messageTime, { color: isDark ? '#ccc' : '#666' }]}>
                  {conversation.time}
                </ThemedText>
              </View>
              <View style={styles.messageRow}>
                <ThemedText
                  style={[styles.lastMessage, { color: isDark ? '#aaa' : '#666' }]}
                  numberOfLines={1}
                >
                  {conversation.lastMessage}
                </ThemedText>
                {conversation.unread > 0 && (
                  <LinearGradient
                    colors={isDark ? ['#f7c14d', '#ffb300'] : ['#127d96', '#15a3c7']}
                    style={styles.unreadBadge}
                  >
                    <ThemedText style={[styles.unreadCount, { color: isDark ? 'black' : 'white' }]}>
                      {conversation.unread}
                    </ThemedText>
                  </LinearGradient>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showNewChat && (
        <View
          style={[
            styles.newChatOverlay,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.4)' },
          ]}
        >
          <View
            style={[
              styles.newChatContainer,
              { backgroundColor: isDark ? '#1a1a1a' : 'white' },
            ]}
          >
            <View style={styles.newChatHeader}>
              <ThemedText style={[styles.newChatTitle, { color: isDark ? 'white' : '#333' }]}>
                New Chat
              </ThemedText>
              <TouchableOpacity onPress={() => setShowNewChat(false)}>
                <Ionicons name="close" size={24} color={isDark ? 'white' : '#333'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {contacts.map((item, index) => (
                <TouchableOpacity
                  key={item.userId}
                  style={[
                    styles.conversationItem,
                    {
                      backgroundColor: isDark ? '#2a2a2a' : 'white',
                      marginHorizontal: 0,
                    },
                  ]}
                  onPress={() => {
                    setShowNewChat(false);
                    openChat(null, item.userId, item.name, item.avatar);
                  }}
                >
                  <View style={styles.avatarContainer}>
                    {item.avatar && (
                      <Image
                        source={item.avatar}
                        style={[styles.avatar, { borderColor: isDark ? '#f7c14d' : '#127d96' }]}
                      />
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <ThemedText
                      style={[styles.userName, { color: isDark ? 'white' : '#333' }]}
                    >
                      {item.name}
                    </ThemedText>
                    <ThemedText
                      style={[styles.lastMessage, { color: isDark ? '#aaa' : '#666' }]}
                      numberOfLines={1}
                    >
                      {item.username}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </ThemedView>
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
  newChatButton: {
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
  conversationsContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginHorizontal: 15,
    marginVertical: 6,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    borderWidth: 2,
    borderColor: '#127d96',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#28a745',
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 15,
    flex: 1,
    marginRight: 10,
    lineHeight: 20,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  newChatOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
  },
  newChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newChatTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
});
