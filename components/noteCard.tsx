// components/NoteCard.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { Note } from '../src/types/index';
import API from '../src/lib/api';

type Props = {
  note: Note;
  onUpdate?: () => void;
  showActions?: boolean;
};

export default function NoteCard({ note, onUpdate, showActions = false }: Props) {
  const [deleting, setDeleting] = useState(false);
  const isPaper = note.docType === 'paper';
  const rating = useMemo(
    () => (typeof note.averageRating === 'number' ? note.averageRating.toFixed(1) : '4.8'),
    [note.averageRating]
  );
  const createdLabel = useMemo(() => {
    try {
      const d = new Date(note.createdAt);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }, [note.createdAt]);

  const handleDownload = async (fileUrl: string) => {
    if (!fileUrl) return;
    const can = await Linking.canOpenURL(fileUrl);
    if (can) {
      Linking.openURL(fileUrl);
    } else {
      Toast.show({ type: 'error', text1: 'Cannot open file URL' });
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await API.delete(`/notes/${note._id}`);
            Toast.show({ type: 'success', text1: 'Note deleted successfully' });
            onUpdate?.();
          } catch (e: any) {
            Toast.show({
              type: 'error',
              text1: e?.response?.data?.message || 'Failed to delete note',
            });
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={[styles.header, isPaper ? styles.headerPaper : styles.headerNote]}>
        <View style={styles.gridOverlay} />
        <View style={styles.headerDivider} />

        {/* Badge */}
        <View style={[styles.badge, isPaper ? styles.badgePaper : styles.badgeNote]}>
          <Feather
            name={isPaper ? 'file-text' : 'book-open'}
            size={12}
            style={{ marginRight: 6 }}
            color={isPaper ? '#fbbf24' : '#facc15'}
          />
          <Text style={[styles.badgeText, { color: isPaper ? '#f59e0b' : '#facc15' }]}>
            {isPaper ? 'Research Paper' : 'Lecture Note'}
          </Text>
        </View>

        {/* Icon + meta */}
        <View style={styles.centerWrap}>
          <View style={styles.centerIconBox}>
            <Ionicons name="book-outline" size={34} color="#f59e0b" />
          </View>
          <Text style={styles.centerMeta}>
            SEM 0{note.semester}{' '}
            <Text style={{ color: '#525252' }}>·</Text> {note.subjectCode || 'GEN-CORE'}
          </Text>
        </View>

        {/* Actions */}
        {showActions && (
          <View style={styles.actions}>
            <Pressable
              onPress={() => Toast.show({ type: 'info', text1: 'Edit coming soon' })}
              style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
            >
              <Feather name="edit-2" size={15} color="#a3a3a3" />
            </Pressable>
            <Pressable
              onPress={handleDelete}
              disabled={deleting}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
                deleting && { opacity: 0.5 },
              ]}
            >
              <Feather name="trash-2" size={15} color="#ef4444" />
            </Pressable>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.subject}>{note.subject}</Text>
          <Text numberOfLines={2} style={styles.title}>
            {note.title}
          </Text>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={styles.byline}>
            By <Text style={styles.bylineStrong}>{note.uploadedBy?.name || 'Academic Vault'}</Text>
          </Text>
          <Text style={styles.date}>{createdLabel}</Text>
        </View>

        {/* Social proof */}
        <View style={styles.proof}>
          <View style={styles.ratingWrap}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.ratingValue}>{rating}</Text>
          </View>
          <Text style={styles.downloads}>
            <Text style={styles.downloadsStrong}>{note.downloads || 0}</Text> system downloads
          </Text>
        </View>

        {/* Downloads */}
        <View style={{ gap: 8 }}>
          {note.files && note.files.length > 0 ? (
            note.files.map((file, i) => (
              <Pressable
                key={`${file}-${i}`}
                onPress={() => handleDownload(file)}
                style={({ pressed }) => [styles.dlBtn, pressed && styles.pressed]}
              >
                <Feather name="download" size={16} color="#111827" />
                <Text style={styles.dlBtnText}>
                  DOWNLOAD TERMINAL {note.files.length > 1 ? `#0${i + 1}` : ''}
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.dlBtnDisabled}>
              <Text style={styles.dlBtnDisabledText}>NO ATTACHMENTS RECOVERED</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0a0a0a',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: 16,
  },
  header: {
    height: 208,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerPaper: {
    backgroundColor: '#0a0a0a',
  },
  headerNote: {
    backgroundColor: '#0a0a0a',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0 as any,
    backgroundColor: 'transparent',
  },
  headerDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: '#262626',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgePaper: { borderColor: 'rgba(245,158,11,0.3)' },
  badgeNote: { borderColor: 'rgba(234,179,8,0.2)' },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  centerWrap: { alignItems: 'center' },
  centerIconBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(10,10,10,0.8)',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  centerMeta: {
    color: '#a3a3a3',
    fontSize: 11,
    fontFamily: 'System',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actions: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  } as any,
  actionBtn: {
    backgroundColor: '#0a0a0a',
    borderColor: '#262626',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  body: {
    padding: 16,
    backgroundColor: '#0f0f0f',
  },
  subject: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopColor: 'rgba(38,38,38,0.6)',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  byline: { color: '#9ca3af', maxWidth: '60%' },
  bylineStrong: { color: '#e5e7eb', fontWeight: '700' },
  date: { color: '#737373', fontFamily: 'System', fontSize: 11 },
  proof: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10,10,10,0.4)',
    borderColor: 'rgba(38,38,38,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
    alignItems: 'center',
  },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 } as any,
  ratingValue: { color: '#e5e7eb', fontWeight: '700', marginLeft: 6 },
  downloads: { color: '#9ca3af', fontFamily: 'System', fontSize: 11 },
  downloadsStrong: { color: '#e5e7eb', fontWeight: '700' },
  dlBtn: {
    width: '100%',
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  } as any,
  dlBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dlBtnDisabled: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.4)',
    borderColor: 'rgba(38,38,38,0.4)',
    borderWidth: 1,
  },
  dlBtnDisabledText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pressed: { opacity: 0.85 },
});
