import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Circle, MapPin } from 'lucide-react-native';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/lib/context/UserContext';

type TaskDetail = {
  assignmentId: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  status: string;
  completedAt: string | null;
};

export default function TaskDetailScreen() {
  // `id` here is the task_assignments.id (see app/(tabs)/tasks.tsx, which
  // links here with assignment_id) — previously this screen ignored the
  // route param entirely and showed a hardcoded task with alert()-only
  // action buttons that wrote nothing to the database.
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { agent } = useUser();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  const loadTask = useCallback(async () => {
    if (!supabase || !id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('task_assignments')
        .select('id, status, completed_at, tasks(title, description, priority, due_date)')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error loading task assignment:', error);
      } else if (data) {
        const t: any = data.tasks;
        setTask({
          assignmentId: data.id,
          title: t?.title || 'অ্যাসাইনকৃত টাস্ক',
          description: t?.description || '',
          priority: t?.priority || 'NORMAL',
          dueDate: t?.due_date || null,
          status: data.status || 'PENDING',
          completedAt: data.completed_at || null,
        });
      }
    } catch (err) {
      console.error('Task detail fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const toggleComplete = async () => {
    if (!supabase || !task) return;
    setUpdating(true);
    const nowCompleted = task.status !== 'COMPLETED';
    const nowIso = new Date().toISOString();
    try {
      const { error } = await supabase
        .from('task_assignments')
        .update({
          status: nowCompleted ? 'COMPLETED' : 'PENDING',
          completed_at: nowCompleted ? nowIso : null,
        })
        .eq('id', task.assignmentId);

      if (error) {
        Alert.alert('আপডেট ব্যর্থ হয়েছে', error.message);
      } else {
        setTask({
          ...task,
          status: nowCompleted ? 'COMPLETED' : 'PENDING',
          completedAt: nowCompleted ? nowIso : null,
        });
      }
    } finally {
      setUpdating(false);
    }
  };

  // Records a real GPS check-in against visit_history for this task, rather
  // than the previous "Capture GPS" button that only showed an alert() and
  // never touched the database.
  const captureCheckIn = async () => {
    if (!supabase || !agent?.id) {
      Alert.alert('সম্ভব নয়', 'এজেন্ট তথ্য এখনও লোড হয়নি।');
      return;
    }
    setCheckingIn(true);
    try {
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('লোকেশন অনুমতি প্রয়োজন', 'GPS চেক-ইন করতে লোকেশন অনুমতি দিন।');
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const { error } = await supabase.from('visit_history').insert([
        {
          agent_id: agent.id,
          location_name: task?.title || 'Task check-in',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          check_in_time: new Date().toISOString(),
        },
      ]);
      if (error) {
        Alert.alert('চেক-ইন ব্যর্থ হয়েছে', error.message);
      } else {
        Alert.alert('চেক-ইন সম্পন্ন', 'আপনার GPS অবস্থান রেকর্ড করা হয়েছে।');
      }
    } catch (err: any) {
      Alert.alert('চেক-ইন ব্যর্থ হয়েছে', err?.message || String(err));
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader title={task ? task.title : 'Task'} showBack onBack={() => router.back()} />

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#166534" />
        </View>
      ) : !task ? (
        <View style={styles.centerBox}>
          <Text style={styles.description}>এই টাস্কটি পাওয়া যায়নি।</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>{task.title}</Text>
            {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

            <View style={styles.infoRow}>
              <Text style={styles.label}>Priority:</Text>
              <Text style={styles.value}>{task.priority}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Due Date:</Text>
              <Text style={styles.value}>
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={styles.value}>
                {task.status === 'COMPLETED'
                  ? `Completed${task.completedAt ? ' · ' + new Date(task.completedAt).toLocaleString() : ''}`
                  : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button
              onPress={captureCheckIn}
              loading={checkingIn}
              variant="secondary"
              icon={<MapPin size={16} color="#166534" />}
            >
              GPS চেক-ইন করুন
            </Button>
            <View style={{ height: 12 }} />
            <Button
              onPress={toggleComplete}
              loading={updating}
              icon={
                task.status === 'COMPLETED' ? (
                  <CheckCircle2 size={16} color="#ffffff" />
                ) : (
                  <Circle size={16} color="#ffffff" />
                )
              }
            >
              {task.status === 'COMPLETED' ? 'পুনরায় চালু করুন' : 'সম্পন্ন হিসেবে চিহ্নিত করুন'}
            </Button>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontWeight: 'bold',
    color: '#374151',
  },
  value: {
    flex: 1,
    color: '#111827',
  },
  actions: {
    marginTop: 8,
  },
});
