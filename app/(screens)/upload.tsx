import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import API from '../../src/lib/api';
import Toast from 'react-native-toast-message';
import { Upload as UploadIcon, NotebookText, FileText } from 'lucide-react-native';

const SEMESTER_SUBJECTS: Record<number, { code: string; name: string }[]> = {
  1: [{ code: 'PRF', name: 'Programming Fundamentals' }, { code: 'DBMS', name: 'Database Management Systems' }, { code: 'OOP', name: 'Object Oriented Programming' }, { code: 'SE', name: 'Software Engineering' }],
  2: [{ code: 'ORM', name: 'Object Relational Mapping' }, { code: 'NP', name: 'Network Programming' }, { code: 'IT', name: 'Internet Technology' }, { code: 'CNS', name: 'Cryptography & Network Security' }, { code: 'AAD', name: 'Algorithm Analysis & Design' }],
  3: [{ code: 'AD2', name: 'Application Development II' }, { code: 'PY', name: 'Python' }, { code: 'RAD', name: 'Rapid Application Development' }, { code: 'AMD', name: 'Advanced Mobile Development' }],
  4: [{ code: 'PM', name: 'Project Management' }, { code: 'ML', name: 'Machine Learning' }],
};

const AMBER = '#f59e0b';
const CYAN = '#22d3ee';

export default function Upload() {
  const router = useRouter();
  const params = useLocalSearchParams<{ request_id?: string; subject?: string }>();

  const [role, setRole] = useState<'student' | 'expert' | 'admin'>('student');
  const canUploadPapers = role === 'student' || role === 'expert' || role === 'admin';

  React.useEffect(() => {
    AsyncStorage.getItem('user').then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.role) setRole(parsed.role);
        } catch {}
      }
    });
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    semester: 1,
    subjectCode: SEMESTER_SUBJECTS[1][0].code,
    description: '',
  });
  const [docType, setDocType] = useState<'note' | 'paper'>('note');
  const [files, setFiles] = useState<DocumentPicker.DocumentPickerAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const subjectsForSemester = SEMESTER_SUBJECTS[formData.semester] || [];
  const selectedSubject = subjectsForSemester.find((s) => s.code === formData.subjectCode);

  const setSemester = (sem: number) => {
    const firstSubject = SEMESTER_SUBJECTS[sem]?.[0]?.code || '';
    setFormData((prev) => ({ ...prev, semester: sem, subjectCode: firstSubject }));
  };

  const handlePickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      multiple: true,
    });
    if (!result.canceled) {
      setFiles(result.assets.slice(0, 3));
    }
  };

  const handleSubmit = async () => {
    if (!files.length) return Toast.show({ type: 'error', text1: 'Please select at least one file' });
    if (!formData.subjectCode) return Toast.show({ type: 'error', text1: 'Please choose a subject' });
    if (docType === 'paper' && !canUploadPapers) return Toast.show({ type: 'error', text1: 'Unauthorized.' });

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    for (const file of files) {
      if ((file.size || 0) > MAX_FILE_SIZE) {
        return Toast.show({ type: 'error', text1: `"${file.name}" is too large.` });
      }
    }

    setLoading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('subject', selectedSubject?.name || formData.subjectCode);
    data.append('subjectCode', formData.subjectCode);
    data.append('docType', docType);
    data.append('semester', formData.semester.toString());
    data.append('description', formData.description);

    if (params.request_id) {
      data.append('requestId', params.request_id);
    }

    files.forEach((file) => {
      // @ts-ignore RN FormData file shape
      data.append('files', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      });
    });

    try {
      await API.post('/notes/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      Toast.show({ type: 'success', text1: 'Upload successful!' });
      router.replace('/dashboard');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Upload failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <UploadIcon color={AMBER} size={26} />
          </View>
          <Text style={styles.title}>Upload Material</Text>
          <Text style={styles.subtitle}>Share notes or papers with your classmates</Text>
        </View>

        <Text style={styles.fieldLabel}>Upload Type</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            onPress={() => setDocType('note')}
            style={[styles.typeButton, docType === 'note' && { backgroundColor: AMBER, borderColor: AMBER }]}
          >
            <NotebookText size={16} color={docType === 'note' ? '#000' : '#a1a1aa'} />
            <Text style={[styles.typeButtonText, docType === 'note' && { color: '#000' }]}>Note</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (!canUploadPapers) {
                Toast.show({ type: 'error', text1: 'Only experts or admins can upload papers.' });
                return;
              }
              setDocType('paper');
            }}
            disabled={!canUploadPapers}
            style={[
              styles.typeButton,
              docType === 'paper' && { backgroundColor: CYAN, borderColor: CYAN },
              !canUploadPapers && styles.typeButtonDisabled,
            ]}
          >
            <FileText size={16} color={docType === 'paper' ? '#000' : '#a1a1aa'} />
            <Text style={[styles.typeButtonText, docType === 'paper' && { color: '#000' }]}>Paper</Text>
          </TouchableOpacity>
        </View>
        {!canUploadPapers && <Text style={styles.hintText}>Papers can only be uploaded by experts or admins.</Text>}

        <Text style={styles.fieldLabel}>Title</Text>
        <TextInput
          value={formData.title}
          onChangeText={(v) => setFormData({ ...formData, title: v })}
          placeholder="e.g., OOP Concepts Summary"
          placeholderTextColor="#52525b"
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>Semester</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4].map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSemester(s)}
              style={[styles.chip, formData.semester === s && styles.chipActive]}
            >
              <Text style={[styles.chipText, formData.semester === s && { color: '#000' }]}>Sem {s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Subject</Text>
        <View style={styles.chipRowWrap}>
          {subjectsForSemester.map((s) => (
            <TouchableOpacity
              key={s.code}
              onPress={() => setFormData({ ...formData, subjectCode: s.code })}
              style={[styles.subjectChip, formData.subjectCode === s.code && styles.chipActive]}
            >
              <Text style={[styles.chipText, formData.subjectCode === s.code && { color: '#000' }]}>
                {s.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {!!selectedSubject && <Text style={styles.subjectFullName}>{selectedSubject.name}</Text>}

        <Text style={styles.fieldLabel}>Description (Optional)</Text>
        <TextInput
          value={formData.description}
          onChangeText={(v) => setFormData({ ...formData, description: v })}
          placeholder="Brief description about these notes..."
          placeholderTextColor="#52525b"
          multiline
          numberOfLines={4}
          style={[styles.input, styles.textArea]}
        />

        <Text style={styles.fieldLabel}>Upload Files (PDF / Images)</Text>
        <TouchableOpacity onPress={handlePickFiles} style={styles.filePickerButton}>
          <Text style={styles.filePickerButtonText}>
            {files.length > 0 ? `${files.length} file(s) selected` : 'Choose files'}
          </Text>
        </TouchableOpacity>
        {files.map((f, i) => (
          <Text key={i} style={styles.fileNameText} numberOfLines={1}>
            • {f.name}
          </Text>
        ))}
        <Text style={styles.hintText}>You can upload up to 3 files. Individual file limit: 10MB.</Text>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Upload {docType === 'paper' ? 'Paper' : 'Notes'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050505' },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  card: { backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 24, padding: 24 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { color: '#f4f4f5', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#71717a', fontSize: 12, marginTop: 6 },

  fieldLabel: { color: '#71717a', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#000' },
  typeButtonDisabled: { opacity: 0.4 },
  typeButtonText: { color: '#a1a1aa', fontSize: 13, fontWeight: '700' },
  hintText: { color: '#52525b', fontSize: 11, marginTop: 8 },

  input: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, color: '#f4f4f5', fontSize: 14 },
  textArea: { height: 90, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', gap: 8 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  chipActive: { backgroundColor: AMBER, borderColor: AMBER },
  chipText: { color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  subjectFullName: { color: '#52525b', fontSize: 11, marginTop: 8 },

  filePickerButton: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  filePickerButtonText: { color: AMBER, fontSize: 13, fontWeight: '700' },
  fileNameText: { color: '#a1a1aa', fontSize: 11, marginTop: 6 },

  submitButton: { backgroundColor: AMBER, paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.4 },
  submitButtonText: { color: '#000', fontWeight: '800', fontSize: 15 },
});