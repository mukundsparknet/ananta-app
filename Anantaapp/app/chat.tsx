import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
import { ENV } from '@/config/env';

type ChatMessageItem = {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  content: string;
  status: string;
  createdAt: string;
  isLocal?: boolean;
};

export default function ChatScreen() {
  const { isDark } = useTheme();
  const params = useLocalSearchParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string>('');
  const [otherUserId, setOtherUserId] = useState<string>('');
  const [otherName, setOtherName] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let userId: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      userId = window.localStorage.getItem('userId');
    }
    setCurrentUserId(userId);
  }, []);

  useEffect(() => {
    const t = typeof params.threadId === 'string' ? params.threadId : '';
    const o = typeof params.otherUserId === 'string' ? params.otherUserId : '';
    const n = typeof params.otherName === 'string' ? params.otherName : 'Chat';
    setThreadId(t);
    setOtherUserId(o);
    setOtherName(n);
  }, [params]);

  useEffect(() => {
    if (!currentUserId || !otherUserId) {
      return;
    }
    const ensureThread = async () => {
      try {
        const res = await fetch(
          `${ENV.API_BASE_URL}/api/app/messages/thread-by-users?userA=${encodeURIComponent(
            currentUserId
          )}&userB=${encodeURIComponent(otherUserId)}`
        );
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data && data.threadId) {
          const canonicalId = String(data.threadId);
          if (canonicalId !== threadId) {
            setThreadId(canonicalId);
          }
          fetchMessages(canonicalId, currentUserId);
        }
      } catch {
      }
    };
    ensureThread();
  }, [currentUserId, otherUserId]);

  const fetchMessages = async (thread: string, userId: string) => {
    if (!thread) {
      return;
    }
    try {
      const res = await fetch(
        `${ENV.API_BASE_URL}/api/app/messages/thread/${thread}?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        return;
      }
      const mapped: ChatMessageItem[] = data
        .filter((m: any) => !m.deleted)
        .map((m: any) => ({
          id: String(m.id),
          threadId: String(m.threadId),
          senderId: String(m.senderId),
          receiverId: String(m.receiverId),
          content: m.content || '',
          status: m.status || 'SENT',
          createdAt: m.createdAt || new Date().toISOString(),
        }));
      setMessages(prev => (mapped.length > 0 ? mapped : prev));
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({ animated: false });
        }
      }, 100);
    } catch {
    }
  };

  useEffect(() => {
    if (!currentUserId || !threadId) {
      return;
    }
    fetchMessages(threadId, currentUserId);
    const interval = setInterval(() => {
      fetchMessages(threadId, currentUserId);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUserId, threadId]);

  const handleSend = async () => {
    if (!currentUserId || !otherUserId) {
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      return;
    }

    const localId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const localMessage: ChatMessageItem = {
      id: localId,
      threadId: threadId,
      senderId: currentUserId,
      receiverId: otherUserId,
      content: trimmed,
      status: 'PENDING',
      createdAt: nowIso,
      isLocal: true,
    };
    setMessages(prev => [...prev, localMessage]);
    setInput('');
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);

    try {
      const body: any = {
        senderId: currentUserId,
        receiverId: otherUserId,
        content: trimmed,
      };
      if (threadId) {
        body.threadId = threadId;
      }
      const res = await fetch(`${ENV.API_BASE_URL}/api/app/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setMessages(prev =>
          prev.map(m =>
            m.id === localId ? { ...m, status: 'FAILED' } : m
          )
        );
        return;
      }
      const data = await res.json();
      const newThreadId = data.threadId ? String(data.threadId) : threadId;
      if (newThreadId && newThreadId !== threadId) {
        setThreadId(newThreadId);
      }
      const serverMessage: ChatMessageItem = {
        id: String(data.messageId || localId),
        threadId: newThreadId || threadId,
        senderId: String(data.senderId || currentUserId),
        receiverId: String(data.receiverId || otherUserId),
        content: data.content || trimmed,
        status: data.status || 'SENT',
        createdAt: data.createdAt || nowIso,
      };
      setMessages(prev =>
        prev.map(m => (m.id === localId ? serverMessage : m))
      );
      if (newThreadId && currentUserId) {
        fetchMessages(newThreadId, currentUserId);
      } else if (threadId && currentUserId) {
        fetchMessages(threadId, currentUserId);
      } else {
        setTimeout(() => {
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      }
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === localId ? { ...m, status: 'FAILED' } : m
        )
      );
    }
  };

  const renderTickIcon = (message: ChatMessageItem) => {
    if (!currentUserId || message.senderId !== currentUserId) {
      return null;
    }
    if (message.status === 'PENDING') {
      return (
        <Ionicons
          name="checkmark"
          size={14}
          color={isDark ? '#ccc' : '#999'}
          style={styles.tickIcon}
        />
      );
    }
    if (message.status === 'FAILED') {
      return (
        <Ionicons
          name="alert-circle"
          size={14}
          color="#ff4d4f"
          style={styles.tickIcon}
        />
      );
    }
    if (message.status === 'READ') {
      return (
        <Ionicons
          name="checkmark-done"
          size={14}
          color="#0d99ff"
          style={styles.tickIcon}
        />
      );
    }
    return (
      <Ionicons
        name="checkmark-done"
        size={14}
        color={isDark ? '#ccc' : '#999'}
        style={styles.tickIcon}
      />
    );
  };

  const renderMessage = (message: ChatMessageItem) => {
    const myId = currentUserId ? String(currentUserId).trim() : '';
    const senderId = String(message.senderId || '').trim();
    const isMine = myId.length > 0 && myId === senderId;
    return (
      <View
        key={message.id}
        style={[
          styles.messageRow,
          {
            justifyContent: isMine ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMine
                ? isDark
                  ? '#f7c14d'
                  : '#127d96'
                : isDark
                ? '#2a2a2a'
                : '#e9ecef',
              alignSelf: isMine ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              {
                color: isMine
                  ? isDark
                    ? 'black'
                    : 'white'
                  : isDark
                  ? 'white'
                  : '#333',
              },
            ]}
          >
            {message.content}
          </ThemedText>
          {renderTickIcon(message)}
        </View>
      </View>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000' : '#f8f9fa' },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: isDark ? '#111' : 'white',
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerBack}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? 'white' : '#333'}
            />
          </TouchableOpacity>
          <ThemedText
            style={[
              styles.headerTitle,
              { color: isDark ? 'white' : '#333' },
            ]}
          >
            {otherName || 'Chat'}
          </ThemedText>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          ref={ref => {
            scrollViewRef.current = ref;
          }}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText
                style={[
                  styles.emptyText,
                  { color: isDark ? '#777' : '#999' },
                ]}
              >
                No messages yet. Say hi to {otherName || 'this user'}.
              </ThemedText>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? '#111' : 'white',
              borderTopColor: isDark ? '#333' : '#ddd',
            },
          ]}
        >
          <TouchableOpacity style={styles.emojiButton}>
            <Ionicons
              name="happy-outline"
              size={24}
              color={isDark ? '#f7c14d' : '#127d96'}
            />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? 'white' : '#333',
                backgroundColor: isDark ? '#222' : '#f1f3f5',
              },
            ]}
            placeholder="Type a message"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Ionicons
              name="send"
              size={22}
              color={isDark ? 'black' : 'white'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerBack: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 24,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: height * 0.6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageText: {
    fontSize: 15,
  },
  tickIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  emojiButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#127d96',
  },
});
