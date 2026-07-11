import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Link } from 'expo-router';
import API from '../../src/lib/api';
import { Note } from '../../src/types';
import Toast from 'react-native-toast-message';
import {
  Award,
  UploadCloud,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Trash2,
  Edit3,
  X,
  Send,
  User,
  CheckCircle2,
  Star,
} from 'lucide-react-native';

interface NoteRequest {
  _id: string;
  title: string;
  subject: string;
  semester: string;
  description: string;
  status: 'open' | 'fulfilled';
  requestedBy: { name: string };
  fulfilledBy?: { _id: string; name: string };
  fulfilledNote?: { _id: string; title: string };
  createdAt: string;
}

interface Message {
  _id: string;
  senderId: string;
  senderModel: 'Student' | 'Expert';
  text: string;
  createdAt: string;
}

interface ChatThread {
  _id: string;
  student: { _id: string; name: string; email: string };
  messages: Message[];
  updatedAt: string;
}

const AMBER = '#f59e0b';
const RED = '#ef4444';

export default function ExpertDashboard() {
  const [expertNotes, setExpertNotes] = useState<Note[]>([]);
  const [requests, setRequests] = useState<NoteRequest[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loading, setLoading] = useState(true);

  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateSubject, setUpdateSubject] = useState('');
  const [updateSemester, setUpdateSemester] = useState<number>(1);
  const [updateDescription, setUpdateDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadDashboardData = async () => {
    try {
      const [notesRes, requestsRes, chatsRes] = await Promise.all([
        API.get('/notes/my'),
        API.get('/requests'),
        API.get('/chats'),
      ]);
      setExpertNotes(notesRes.data || []);
      setRequests(requestsRes.data?.slice(0, 3) || []);
      setChats(chatsRes.data || []);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to sync dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete publication?',
      'This permanently deletes this resource.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.delete(`/notes/${noteId}`);
              Toast.show({ type: 'success', text1: 'Publication removed' });
              setExpertNotes((prev) => prev.filter((note) => note._id !== noteId));
            } catch (error: any) {
              Toast.show({
                type: 'error',
                text1: error.response?.data?.message || 'Failed to delete note',
              });
            }
          },
        },
      ]
    );
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setUpdateTitle(note.title);
    setUpdateSubject(note.subject);
    setUpdateSemester(note.semester);
    setUpdateDescription(note.description || '');
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;

    setIsUpdating(true);
    try {
      const updatedData = {
        title: updateTitle,
        subject: updateSubject,
        semester: updateSemester,
        description: updateDescription,
      };

      const res = await API.put(`/notes/${editingNote._id}`, updatedData);
      Toast.show({ type: 'success', text1: 'Resource updated successfully' });

      setExpertNotes((prev) =>
        prev.map((note) => (note._id === editingNote._id ? { ...note, ...res.data } : note))
      );
      setEditingNote(null);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Failed to update note',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeChatId || !replyText.trim()) {
      Toast.show({ type: 'error', text1: 'Type a message before sending' });
      return;
    }

    setSendingMessage(true);
    try {
      const res = await API.post(`/chats/${activeChatId}/messages`, { text: replyText });

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === activeChatId ? { ...chat, messages: [...chat.messages, res.data] } : chat
        )
      );
      setReplyText('');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Failed to send message' });
    } finally {
      setSendingMessage(false);
    }
  };

  const currentChat = chats.find((c) => c._id === activeChatId);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={AMBER} />
        <Text style={styles.loadingText}>Syncing Expert Dashboard...</Text>
      </View>
    );
  }

  const stats = [
    { label: 'Publications', value: expertNotes.length, icon: FileText },
    { label: 'Open Requests', value: requests.filter((r) => r.status !== 'fulfilled').length, icon: Clock },
    { label: 'Active Chats', value: chats.length, icon: MessageSquare },
    { label: 'Status', value: 'VERIFIED', icon: Sparkles },
  ];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoBox}>
              <Award size={22} color="#000" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Expert Hub</Text>
              <Text style={styles.headerSubtitle}>Verified Knowledge Architect Console</Text>
            </View>
          </View>
        </View>

        <Link href="/requests" asChild>
          <TouchableOpacity style={styles.publishButton}>
            <UploadCloud size={18} color="#000" />
            <Text style={styles.publishButtonText}>PUBLISH NEW RESOURCE</Text>
          </TouchableOpacity>
        </Link>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statIcon}>
                <stat.icon size={22} color={AMBER} />
              </View>
            </View>
          ))}
        </View>

        {/* Publications */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.rowGap}>
              <BookOpen color={AMBER} size={20} />
              <Text style={styles.sectionTitle}>Your Publications</Text>
            </View>
            <Text style={styles.sectionCount}>{expertNotes.length} resources</Text>
          </View>

          {expertNotes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Award size={40} color="#3f3f46" />
              <Text style={styles.emptyTitle}>No publications yet</Text>
              <Text style={styles.emptySubtitle}>Share your expertise with the community</Text>
            </View>
          ) : (
            expertNotes.map((note) => (
              <View key={note._id} style={styles.noteCard}>
                <View style={styles.noteCardTop}>
                  <View style={styles.flex1}>
                    <Text style={styles.noteTitle} numberOfLines={2}>
                      {note.title}
                    </Text>
                    <View style={styles.tagPill}>
                      <Text style={styles.tagPillText}>
                        {note.subject} • Sem {note.semester}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.noteActions}>
                    <TouchableOpacity onPress={() => openEditModal(note)} style={styles.iconButton}>
                      <Edit3 size={16} color={AMBER} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNote(note._id)} style={styles.iconButton}>
                      <Trash2 size={16} color={RED} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.noteFooter}>
                  <View style={styles.rowGap}>
                    <Star size={13} color={AMBER} fill={AMBER} />
                    <Text style={styles.noteFooterText}>
                      {note.averageRating ? note.averageRating.toFixed(1) : '0.0'}
                    </Text>
                  </View>
                  <Text style={styles.noteFooterText}>{note.downloads} downloads</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.rowGap}>
              <Clock color={AMBER} size={20} />
              <Text style={styles.sectionTitle}>Live Student Requests</Text>
            </View>
            <Link href="/requests" asChild>
              <TouchableOpacity style={styles.rowGap}>
                <Text style={styles.viewAllText}>View All</Text>
                <ArrowRight size={14} color={AMBER} />
              </TouchableOpacity>
            </Link>
          </View>

          {requests.length === 0 ? (
            <Text style={styles.emptyInline}>No active requests at the moment.</Text>
          ) : (
            requests.map((req) => {
              const isFulfilled = req.status === 'fulfilled';
              return (
                <View
                  key={req._id}
                  style={[styles.requestCard, isFulfilled && styles.requestCardFulfilled]}
                >
                  <View style={styles.requestTopRow}>
                    <View style={styles.semPill}>
                      <Text style={styles.semPillText}>SEM {req.semester}</Text>
                    </View>
                    {isFulfilled && (
                      <View style={styles.rowGap}>
                        <CheckCircle2 size={13} color="#71717a" />
                        <Text style={styles.fulfilledText}>Fulfilled</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.requestTitle}>{req.title}</Text>
                  <Text style={styles.requestSubject}>{req.subject}</Text>
                  <Text style={styles.requestDescription} numberOfLines={3}>
                    {req.description}
                  </Text>

                  {!isFulfilled && (
                    <Link
                      href={{
                        pathname: '/upload',
                        params: { request_id: req._id, subject: req.subject },
                      }}
                      asChild
                    >
                      <TouchableOpacity style={styles.fulfillButton}>
                        <Text style={styles.fulfillButtonText}>Fulfill Request</Text>
                      </TouchableOpacity>
                    </Link>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Consultations list */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.rowGap}>
              <MessageSquare color={AMBER} size={20} />
              <Text style={styles.sectionTitle}>Private Consultations</Text>
            </View>
          </View>

          {chats.length === 0 ? (
            <View style={styles.emptyBox}>
              <MessageSquare size={40} color="#3f3f46" />
              <Text style={styles.emptyTitle}>No active conversations</Text>
            </View>
          ) : (
            chats.map((chat) => {
              const lastMsg = chat.messages[chat.messages.length - 1];
              return (
                <TouchableOpacity
                  key={chat._id}
                  onPress={() => setActiveChatId(chat._id)}
                  style={styles.chatRow}
                >
                  <View style={styles.avatarCircle}>
                    <User size={18} color="#a1a1aa" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {chat.student?.name}
                    </Text>
                    <Text style={styles.chatPreview} numberOfLines={1}>
                      {lastMsg ? lastMsg.text : 'New consultation started'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={!!activeChatId} animationType="slide" onRequestClose={() => setActiveChatId(null)}>
        <KeyboardAvoidingView
          style={styles.chatModalScreen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatModalHeader}>
            <View style={styles.rowGap}>
              <View style={styles.avatarCircleSmall}>
                <User size={16} color={AMBER} />
              </View>
              <View>
                <Text style={styles.chatModalName}>{currentChat?.student?.name}</Text>
                <Text style={styles.chatModalEmail}>{currentChat?.student?.email}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => setActiveChatId(null)} style={styles.iconButton}>
              <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={currentChat?.messages || []}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item: msg }) => {
              const isExpert = msg.senderModel === 'Expert';
              return (
                <View style={[styles.messageRow, isExpert ? styles.messageRowRight : styles.messageRowLeft]}>
                  <View style={[styles.bubble, isExpert ? styles.bubbleExpert : styles.bubbleStudent]}>
                    <Text style={isExpert ? styles.bubbleTextExpert : styles.bubbleTextStudent}>
                      {msg.text}
                    </Text>
                    <Text style={isExpert ? styles.bubbleTimeExpert : styles.bubbleTimeStudent}>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.replyRow}>
            <TextInput
              value={replyText}
              onChangeText={setReplyText}
              placeholder="Type professional response..."
              placeholderTextColor="#71717a"
              style={styles.replyInput}
            />
            <TouchableOpacity
              onPress={handleSendReply}
              disabled={sendingMessage || !replyText.trim()}
              style={[styles.sendButton, (sendingMessage || !replyText.trim()) && styles.buttonDisabled]}
            >
              <Send size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Note Modal */}
      <Modal visible={!!editingNote} animationType="fade" transparent onRequestClose={() => setEditingNote(null)}>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <View style={styles.editHeader}>
              <View style={styles.rowGap}>
                <Edit3 size={18} color={AMBER} />
                <Text style={styles.editTitle}>Update Publication</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingNote(null)}>
                <X size={20} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.fieldLabel}>Resource Title</Text>
              <TextInput
                value={updateTitle}
                onChangeText={setUpdateTitle}
                style={styles.fieldInput}
                placeholderTextColor="#71717a"
              />

              <Text style={styles.fieldLabel}>Subject Category</Text>
              <TextInput
                value={updateSubject}
                onChangeText={setUpdateSubject}
                style={styles.fieldInput}
                placeholderTextColor="#71717a"
              />

              <Text style={styles.fieldLabel}>Target Semester</Text>
              <View style={styles.semesterRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setUpdateSemester(n)}
                    style={[styles.semesterChip, updateSemester === n && styles.semesterChipActive]}
                  >
                    <Text
                      style={[
                        styles.semesterChipText,
                        updateSemester === n && styles.semesterChipTextActive,
                      ]}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Resource Description</Text>
              <TextInput
                value={updateDescription}
                onChangeText={setUpdateDescription}
                style={[styles.fieldInput, styles.textArea]}
                multiline
                numberOfLines={4}
                placeholderTextColor="#71717a"
              />

              <View style={styles.editButtonRow}>
                <TouchableOpacity
                  onPress={() => setEditingNote(null)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUpdateNote}
                  disabled={isUpdating}
                  style={[styles.saveButton, isUpdating && styles.buttonDisabled]}
                >
                  <Text style={styles.saveButtonText}>
                    {isUpdating ? 'Saving...' : 'Commit Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  loadingScreen: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#a1a1aa', marginTop: 12, fontSize: 12, letterSpacing: 1 },

  headerRow: { marginBottom: 16 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  headerSubtitle: { color: '#a1a1aa', fontSize: 13, marginTop: 2 },

  publishButton: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: AMBER,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  publishButtonText: { color: '#000', fontWeight: '800', letterSpacing: 0.5 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statCard: {
    flexBasis: '47%',
    backgroundColor: 'rgba(24,24,27,0.6)',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    padding: 18,
  },
  statLabel: { color: '#71717a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 8 },
  statIcon: { position: 'absolute', right: 16, top: 16 },

  section: {
    backgroundColor: 'rgba(24,24,27,0.4)',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionCount: { color: '#71717a', fontSize: 11, backgroundColor: '#18181b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex1: { flex: 1 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { color: '#a1a1aa', fontSize: 15, fontWeight: '600', marginTop: 8 },
  emptySubtitle: { color: '#52525b', fontSize: 12 },
  emptyInline: { color: '#71717a', textAlign: 'center', paddingVertical: 20 },

  noteCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  noteCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  noteTitle: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tagPill: { backgroundColor: '#18181b', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 8 },
  tagPillText: { color: AMBER, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  noteActions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 8, borderRadius: 10 },
  noteFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#27272a' },
  noteFooterText: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },

  viewAllText: { color: AMBER, fontSize: 13, fontWeight: '600' },

  requestCard: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
  },
  requestCardFulfilled: { opacity: 0.7 },
  requestTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  semPill: { backgroundColor: '#18181b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  semPillText: { color: AMBER, fontSize: 10, fontWeight: '700' },
  fulfilledText: { color: '#a1a1aa', fontSize: 11 },
  requestTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  requestSubject: { color: AMBER, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  requestDescription: { color: '#a1a1aa', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  fulfillButton: { backgroundColor: AMBER, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  fulfillButtonText: { color: '#000', fontWeight: '700', fontSize: 13 },

  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#18181b' },
  avatarCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center' },
  chatName: { color: '#e4e4e7', fontWeight: '700', fontSize: 14 },
  chatPreview: { color: '#71717a', fontSize: 12, marginTop: 2 },

  chatModalScreen: { flex: 1, backgroundColor: '#0a0a0a' },
  chatModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    paddingTop: 50,
  },
  avatarCircleSmall: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#18181b', alignItems: 'center', justifyContent: 'center' },
  chatModalName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatModalEmail: { color: '#71717a', fontSize: 11 },

  messagesList: { padding: 16, gap: 12 },
  messageRow: { flexDirection: 'row' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleExpert: { backgroundColor: AMBER, borderTopRightRadius: 4 },
  bubbleStudent: { backgroundColor: '#18181b', borderTopLeftRadius: 4 },
  bubbleTextExpert: { color: '#000', fontSize: 14 },
  bubbleTextStudent: { color: '#e4e4e7', fontSize: 14 },
  bubbleTimeExpert: { color: '#000', fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: 'right' },
  bubbleTimeStudent: { color: '#71717a', fontSize: 9, marginTop: 4, textAlign: 'right' },

  replyRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: '#27272a' },
  replyInput: { flex: 1, backgroundColor: '#18181b', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#fff', borderWidth: 1, borderColor: '#27272a' },
  sendButton: { backgroundColor: AMBER, width: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { opacity: 0.4 },

  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  editCard: { backgroundColor: '#18181b', borderRadius: 24, padding: 22, maxHeight: '85%', borderWidth: 1, borderColor: '#27272a' },
  editHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  editTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  fieldLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 14 },
  fieldInput: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#27272a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 14 },
  textArea: { height: 90, textAlignVertical: 'top' },
  semesterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  semesterChip: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  semesterChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  semesterChipText: { color: '#a1a1aa', fontWeight: '700' },
  semesterChipTextActive: { color: '#000' },
  editButtonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#27272a', alignItems: 'center' },
  cancelButtonText: { color: '#d4d4d8', fontWeight: '600', fontSize: 13 },
  saveButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: AMBER, alignItems: 'center' },
  saveButtonText: { color: '#000', fontWeight: '700', fontSize: 13 },
});