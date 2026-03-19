import { useEffect, useState, useRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, ActivityIndicator, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '@/config/env';

type Task = {
  id: number;
  title: string;
  description: string;
  triggerEvent: string;
  targetValue: number;
  rewardCoins: number;
  minLevel: number;
  maxLevel: number;
  difficulty: string;
};

const DIFFICULTY_ICON: Record<string, string> = {
  Easy: 'leaf',
  Medium: 'flame',
  Hard: 'trophy',
};

export default function DailyTasksScreen() {
  const { isDark } = useTheme();
  const [allTasks, setAllTasks] = useState<(Task & { type: 'host' | 'viewer' })[]>([]);
  const [hostLevel, setHostLevel] = useState(0);
  const [viewerLevel, setViewerLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calcTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    timerRef.current = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        if (!userId) return;
        const res = await fetch(`${ENV.API_BASE_URL}/api/app/daily-tasks/${userId}`);
        const data = await res.json();
        const host = (data.hostTasks || []).map((t: Task) => ({ ...t, type: 'host' as const }));
        const viewer = (data.viewerTasks || []).map((t: Task) => ({ ...t, type: 'viewer' as const }));
        setAllTasks([...host, ...viewer]);
        setHostLevel(data.hostLevel ?? 0);
        setViewerLevel(data.viewerLevel ?? 0);
      } catch (e) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accent = isDark ? '#F7C14D' : '#127d96';

  return (
    <ThemedView style={[styles.container, { backgroundColor: isDark ? '#1a1a1a' : '#f8f9fa' }]}>
      <LinearGradient
        colors={isDark ? ['#F7C14D', '#F7C14D'] : ['#127d96', '#15a3c7']}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? 'black' : 'white'} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: isDark ? 'black' : 'white' }]}>Daily Tasks</ThemedText>
        <View style={styles.placeholder} />
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Level summary */}
          <View style={styles.levelRow}>
            <View style={styles.levelLeft}>
              <View style={[styles.levelBadge, { backgroundColor: isDark ? '#2a2a2a' : '#e8f4f8' }]}>
                <Ionicons name="mic" size={14} color={accent} />
                <ThemedText style={[styles.levelText, { color: accent }]}>Host Lv.{hostLevel}</ThemedText>
              </View>
              <View style={[styles.levelBadge, { backgroundColor: isDark ? '#2a2a2a' : '#e8f4f8' }]}>
                <Ionicons name="eye" size={14} color={accent} />
                <ThemedText style={[styles.levelText, { color: accent }]}>Viewer Lv.{viewerLevel}</ThemedText>
              </View>
            </View>
            <View style={[styles.timerBadge, { backgroundColor: isDark ? '#2a2a2a' : '#fff3e0' }]}>
              <Ionicons name="timer-outline" size={14} color="#e67e22" />
              <ThemedText style={styles.timerText}>{timeLeft}</ThemedText>
            </View>
          </View>

          {allTasks.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="checkmark-done-circle" size={60} color={isDark ? '#555' : '#ccc'} />
              <ThemedText style={[styles.emptyText, { color: isDark ? '#aaa' : '#999' }]}>
                No tasks available for your level
              </ThemedText>
            </View>
          ) : (
            allTasks.map(task => (
              <View key={`${task.type}-${task.id}`} style={[styles.taskCard, { backgroundColor: isDark ? '#2a2a2a' : 'white' }]}>
                <View style={styles.taskHeader}>
                  <View style={[styles.taskIcon, { backgroundColor: accent }]}>
                    <Ionicons
                      name={(DIFFICULTY_ICON[task.difficulty] || 'star') as any}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View style={styles.taskInfo}>
                    <ThemedText style={[styles.taskTitle, { color: isDark ? 'white' : '#333' }]}>
                      {task.title}
                    </ThemedText>
                    <ThemedText style={[styles.taskDesc, { color: isDark ? '#ccc' : '#666' }]}>
                      {task.description}
                    </ThemedText>
                  </View>
                  <View style={styles.topRight}>
                    <View style={[styles.diffBadge, {
                      backgroundColor:
                        task.difficulty === 'Easy' ? 'rgba(56,161,105,0.12)' :
                        task.difficulty === 'Medium' ? 'rgba(237,137,54,0.12)' :
                        'rgba(229,62,62,0.12)',
                    }]}>
                      <ThemedText style={[styles.diffText, {
                        color:
                          task.difficulty === 'Easy' ? '#38a169' :
                          task.difficulty === 'Medium' ? '#dd6b20' :
                          '#e53e3e',
                      }]}>
                        {task.difficulty}
                      </ThemedText>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Ionicons name="diamond" size={13} color="#FFD700" />
                      <ThemedText style={styles.rewardText}>{task.rewardCoins}</ThemedText>
                    </View>
                  </View>
                </View>
                <View style={[styles.targetRow, { borderTopColor: isDark ? '#333' : '#f0f0f0' }]}>
                  <ThemedText style={[styles.targetText, { color: isDark ? '#aaa' : '#888' }]}>
                    Target: {task.targetValue}  ·  Levels {task.minLevel}–{task.maxLevel}
                  </ThemedText>
                </View>
              </View>
            ))
          )}

          <View style={styles.footer}>
            <Ionicons name="time" size={14} color={isDark ? '#aaa' : '#999'} />
            <ThemedText style={[styles.footerText, { color: isDark ? '#aaa' : '#999' }]}>
              Tasks reset daily at midnight
            </ThemedText>
          </View>
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 25, height: 120,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { width: 24 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  levelLeft: { flexDirection: 'row', gap: 10 },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  levelText: { fontSize: 13, fontWeight: '700' },
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20,
  },
  timerText: { fontSize: 13, fontWeight: '700', color: '#e67e22', fontVariant: ['tabular-nums'] },
  emptyText: { fontSize: 15, marginTop: 12, textAlign: 'center' },
  taskCard: {
    borderRadius: 14, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
  },
  taskHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, alignItems: 'flex-start' },
  taskIcon: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  taskDesc: { fontSize: 13, lineHeight: 18 },
  topRight: { alignItems: 'flex-end', gap: 4 },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  diffText: { fontSize: 11, fontWeight: '700' },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(184,134,11,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  rewardText: { fontSize: 12, fontWeight: 'bold', color: '#B8860B' },
  targetRow: { borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  targetText: { fontSize: 12 },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 28, gap: 6,
  },
  footerText: { fontSize: 12, fontStyle: 'italic' },
});
