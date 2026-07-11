import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SecurePdfViewerProps {
  noteId: string;
  fileIndex?: number;
}

// Web build only: react-native-pdf and react-native-blob-util are native-only,
// so this file (picked automatically by Metro for web, via the .web.tsx suffix)
// fetches the same secure PDF endpoint and renders it in a browser <iframe>
// using an in-memory object URL — nothing is written to disk.
const SecurePdfViewer: React.FC<SecurePdfViewerProps> = ({ noteId, fileIndex = 0 }) => {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchSecurePdf = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token') || '';
        const targetEndpoint = `${API_URL}/api/notes/${noteId}/view?index=${fileIndex}`;

        const response = await fetch(targetEndpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/pdf',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to download document: ' + response.status);
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
      } catch (err: any) {
        console.error('❌ Web Secure PDF Loader Error:', err);
        setError('Could not display secure document preview.');
      } finally {
        setLoading(false);
      }
    };

    if (noteId) fetchSecurePdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
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
      {/* Plain DOM tag — safe here because this file only ever bundles for the
          web target (react-dom underneath), never for iOS/Android. */}
      <iframe src={pdfUrl} style={{ flex: 1, width: '100%', height: '100%', border: 'none' }} title="Secure PDF Viewer" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: 600 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#0a0a0c' },
  loadingText: { color: '#a1a1aa', marginTop: 10, fontSize: 12 },
  errorContainer: { padding: 20, backgroundColor: 'rgba(244,63,94,0.08)', borderRadius: 12, margin: 20, borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)' },
  errorTitle: { color: '#f43f5e', fontWeight: '700', marginBottom: 4 },
  errorText: { color: '#f43f5e', fontSize: 12 },
});

export default SecurePdfViewer;