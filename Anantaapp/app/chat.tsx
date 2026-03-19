import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';

const { width } = Dimensions.get('window');

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
  const threadIdRef = useRef<string>('');
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => { threadIdRef.current = threadId; }, [threadId]);
  useEffect(() => { currentUserIdRef.current = currentUserId; }, [currentUserId]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const o = typeof params.otherUserId === 'string' ? params.otherUserId : '';
    const n = typeof params.otherName === 'string' ? params.otherName : 'Chat';
    setOtherUserId(o);
    setOtherName(n);
  }, [params.otherUserId, params.otherName]);

  const fetchMessages = useCallback(async (thread: string, userId: string) => {
    if (!thread || !userId) return;
    try {
      const res = await fetch(
        `${ENV.API_BASE_URL}/api/app/messages/thread/${thread}?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;
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
      setMessages(mapped);
      if (mapped.length > 0) {
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
      }
    } catch {}
  }, []);

  const resolveThread = useCallback(async (uid: string, otherUid: string, tParam: string): Promise<string> => {
    // Always resolve from backend via userA+userB — most reliable source of truth
    if (otherUid) {
      try {
        const res = await fetch(
          `${ENV.API_BASE_URL}/api/app/messages/thread-by-users?userA=${encodeURIComponent(uid)}&userB=${encodeURIComponent(otherUid)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.threadId) return String(data.threadId);
        }
      } catch {}
    }
    // Fallback to param
    return tParam;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let interval: ReturnType<typeof setInterval> | null = null;

      const init = async () => {
        const uid = await AsyncStorage.getItem('userId').catch(() => null);
        if (!uid || !active) return;
        setCurrentUserId(uid);
        currentUserIdRef.current = uid;

        const o = typeof params.otherUserId === 'string' ? params.otherUserId : '';
        const tParam = typeof params.threadId === 'string' ? params.threadId : '';

        const resolved = await resolveThread(uid, o, tParam);
        if (!active) return;

        if (resolved) {
          setThreadId(resolved);
          threadIdRef.current = resolved;
          await fetchMessages(resolved, uid);
        }

        interval = setInterval(() => {
          const tid = threadIdRef.current;
          const uid2 = currentUserIdRef.current;
          if (tid && uid2) fetchMessages(tid, uid2);
        }, 4000);
      };

      init();
      return () => {
        active = false;
        if (interval) clearInterval(interval);
      };
    }, [params.otherUserId, params.threadId, fetchMessages, resolveThread])
  );

  const handleSend = async () => {
    const uid = currentUserId || currentUserIdRef.current;
    const other = otherUserId || (typeof params.otherUserId === 'string' ? params.otherUserId : '');
    if (!uid || !other) return;
    const trimmed = input.trim();
    if (!trimmed) return;

    const localId = `local-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const tid = threadIdRef.current;

    setMessages(prev => [...prev, {
      id: localId,
      threadId: tid,
      senderId: uid,
      receiverId: other,
      content: trimmed,
      status: 'PENDING',
      createdAt: nowIso,
      isLocal: true,
    }]);
    setInput('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const body: any = { senderId: uid, receiverId: other, content: trimmed };
      if (tid) body.threadId = tid;

      const res = await fetch(`${ENV.API_BASE_URL}/api/app/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'FAILED' } : m));
        return;
      }

      const data = await res.json();
      const newThreadId = data.threadId ? String(data.threadId) : tid;
      if (newThreadId && newThreadId !== threadIdRef.current) {
        setThreadId(newThreadId);
        threadIdRef.current = newThreadId;
      }

      setMessages(prev => prev.map(m => m.id === localId ? {
        id: String(data.messageId || localId),
        threadId: newThreadId || tid,
        senderId: String(data.senderId || uid),
        receiverId: String(data.receiverId || other),
        content: data.content || trimmed,
        status: data.status || 'SENT',
        createdAt: data.createdAt || nowIso,
      } : m));

      fetchMessages(newThreadId || tid, uid);
    } catch {
      setMessages(prev => prev.map(m => m.id === localId ? { ...m, status: 'FAILED' } : m));
    }
  };

  const renderTickIcon = (message: ChatMessageItem) => {
    const uid = currentUserId || currentUserIdRef.current;
    if (!uid || message.senderId !== uid) return null;
    if (message.status === 'PENDING') return <Ionicons name="checkmark" size={14} color={isDark ? '#ccc' : '#999'} style={styles.tickIcon} />;
    if (message.status === 'FAILED') return <Ionicons name="alert-circle" size={14} color="#ff4d4f" style={styles.tickIcon} />;
    if (message.status === 'READ') return <Ionicons name="checkmark-done" size={14} color="#0d99ff" style={styles.tickIcon} />;
    return <Ionicons name="checkmark-done" size={14} color={isDark ? '#ccc' : '#999'} style={styles.tickIcon} />;
  };

  const renderMessage = (message: ChatMessageItem) => {
    const uid = currentUserId || currentUserIdRef.current;
    const myId = uid ? String(uid).trim() : '';
    const isMine = myId.length > 0 && myId === String(message.senderId || '').trim();
    return (
      <View key={message.id} style={[styles.messageRow, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
        <View style={[styles.messageBubble, {
          backgroundColor: isMine
            ? (isDark ? '#f7c14d' : '#127d96')
            : (isDark ? '#2a2a2a' : '#e9ecef'),
          alignSelf: isMine ? 'flex-end' : 'flex-start',
        }]}>
          <ThemedText style={[styles.messageText, {
            color: isMine ? (isDark ? 'black' : 'white') : (isDark ? 'white' : '#333'),
          }]}>
            {message.content}
          </ThemedText>
          {renderTickIcon(message)}
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#000' : '#f8f9fa' }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]}>
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUser}
            onPress={() => {
              const o = otherUserId || (typeof params.otherUserId === 'string' ? params.otherUserId : '');
              if (o) router.push({ pathname: '/user-profile', params: { userId: o } });
            }}
          >
            <ThemedText style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>
              {otherName || 'Chat'}
            </ThemedText>
          </TouchableOpacity>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Messages */}
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          ref={ref => { scrollViewRef.current = ref; }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <ThemedText style={[styles.emptyText, { color: isDark ? '#777' : '#999' }]}>
                No messages yet. Say hi!
              </ThemedText>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputContainer, {
          backgroundColor: isDark ? '#111' : 'white',
          borderTopColor: isDark ? '#333' : '#ddd',
        }]}>
          <TextInput
            style={[styles.input, {
              color: isDark ? 'white' : '#333',
              backgroundColor: isDark ? '#222' : '#f1f3f5',
            }]}
            placeholder="Type a message"
            placeholderTextColor={isDark ? '#888' : '#999'}
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: isDark ? '#F7C14D' : '#127d96' }]}
            onPress={handleSend}
          >
            <Ionicons name="send" size={20} color={isDark ? 'black' : 'white'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
  },
  headerBack: { padding: 4 },
  headerUser: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerPlaceholder: { width: 32 },
  messagesContainer: { flex: 1 },
  messagesContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14 },
  messageRow: { flexDirection: 'row', marginVertical: 4 },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageText: { fontSize: 15 },
  tickIcon: { marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
