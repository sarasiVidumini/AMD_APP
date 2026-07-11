import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SecurePdfViewerProps {
  noteId: string;
  fileIndex?: number;
}

const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({ noteId, fileIndex = 0 }) => {
  const [pdfPath, setPdfPath] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    const fetchSecurePdf = async () => {
      try {
        setLoading(true);

        // FIXED: was hardcoded to '' before — now actually reads the saved auth token,
        // same key used by src/lib/api.ts's request interceptor.
        const token = (await AsyncStorage.getItem('token')) || '';

        const targetEndpoint = `${API_URL}/api/notes/${noteId}/view?index=${fileIndex}`;
        const dirs = ReactNativeBlobUtil.fs.dirs;

        const filePath = `${dirs.DocumentDir}/temp_note_${noteId}.pdf`;

        const response = await ReactNativeBlobUtil.config({
          path: filePath,
        }).fetch('GET', targetEndpoint, {
          Authorization: `Bearer ${token}`,
          Accept: 'application/pdf',
        });

        if (response.info().status === 200) {
          setPdfPath(filePath);
        } else {
          throw new Error('Failed to download document: ' + response.info().status);
        }
      } catch (err: any) {
        console.error('❌ RN Secure PDF Loader Error:', err);
        setError('Could not display secure document preview.');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) fetchSecurePdf();

    return () => {
      if (pdfPath) {
        ReactNativeBlobUtil.fs.unlink(pdfPath).catch(() => {});
      }
    };
  }, [noteId, fileIndex]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
        <Text style={styles.loadingText}>Mounting secure encrypted document...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Security Stream Error:</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pdf
        source={{ uri: `file://${pdfPath}` }}
        style={styles.pdf}
        onLoadComplete={(numberOfPages) => console.log(`Loaded ${numberOfPages} pages`)}
        onError={(err) => console.error(err)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: 600 },
  pdf: { flex: 1, width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0a0a0c' },
  loadingText: { color: '#a1a1aa', marginTop: 10, fontSize: 12 },
  errorContainer: { padding: 20, backgroundColor: 'rgba(244,63,94,0.08)', borderRadius: 12, margin: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  errorTitle: { color: '#f43f5e', fontWeight: '700', marginBottom: 4 },
  errorText: { color: '#f43f5e', fontSize: 12 },
});

export default SecurePdfViewer;