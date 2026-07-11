import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import API from '../../src/lib/api';
import SecurePdfViewer from '../../components/SecurePdf.web';

interface NoteData {
  _id: string;
  title: string;
  subject: string;
  description?: string;
  files: string[];
}

const NoteDetailsPage: React.FC = () => {
  // Expo Router passes route params via useLocalSearchParams instead of
  // React Navigation's useRoute().params
  const { noteId } = useLocalSearchParams<{ noteId: string }>();
  const router = useRouter();

  const [note, setNote] = useState<NoteData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNoteMetadata = async () => {
      try {
        setLoading(true);

        // Using the shared API client (src/lib/api.ts) instead of a raw axios
        // call — it already attaches the Bearer token from AsyncStorage via
        // its request interceptor, so we don't need to read the token here.
        const response = await API.get('/notes');

        const targetNote = response.data.find((n: NoteData) => n._id === noteId);

        if (!targetNote) {
          throw new Error('The requested document could not be found.');
        }

        setNote(targetNote);
      } catch (err: any) {
        console.error('❌ Note Metadata Fetch Error:', err);
        setError(err.message || 'Failed to load note details.');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) fetchNoteMetadata();
  }, [noteId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Loading document environment...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>{note?.title}</Text>
        <Text style={styles.subject}>Subject: {note?.subject}</Text>
        {!!note?.description && <Text style={styles.description}>{note.description}</Text>}
      </View>

      {/* Only render once we have a confirmed note._id — avoids passing
          undefined into a prop typed as required string */}
      {note?._id && <SecurePdfViewer noteId={note._id} fileIndex={0} />}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#4b5563' },
  errorText: { color: '#ef4444', fontSize: 16 },
  backButton: {
    backgroundColor: '#e5e7eb',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: { fontWeight: '600', color: '#374151' },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  subject: { fontSize: 16, color: '#4b5563', marginVertical: 4, fontWeight: '600' },
  description: { fontSize: 14, color: '#6b7280', marginTop: 4 },
});

export default NoteDetailsPage;