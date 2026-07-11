import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator,
} from 'react-native';
import API from '../../src/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrivateChatModal from '../../components/privateChatModal';
import Toast from 'react-native-toast-message';
import { Award, MessageSquare, Search, ShieldCheck, Lock, X } from 'lucide-react-native';

const AMBER = '#fbbf24';

export default function StudentExperts() {
  const [experts, setExperts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeChatUser, setActiveChatUser] = useState<{ id: string; name: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [pendingExpert, setPendingExpert] = useState<{ id: string; name: string } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedUsername, setVerifiedUsername] = useState('');

  useEffect(() => {
    API.get('/experts')
      .then((res) => setExperts(res.data))
      .catch((err) => console.error('Error fetching experts:', err));

    AsyncStorage.getItem('userId').then(async (savedUserId) => {
      if (savedUserId) {
        setCurrentUserId(savedUserId);
        return;
      }
      const savedUserRaw = await AsyncStorage.getItem('user');
      if (savedUserRaw) {
        try {
          const parsed = JSON.parse(savedUserRaw);
          if (parsed.id || parsed._id) setCurrentUserId(parsed.id || parsed._id);
        } catch (e) {
          console.error('Failed to parse stored user');
        }
      }
    });
  }, []);

  const handleSecureJoinClick = (expertId: string, expertName: string) => {
    setPendingExpert({ id: expertId, name: expertName });
    setEmailInput('');
    setShowSecurityModal(true);
  };

  const handleVerifyConfirm = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      Toast.show({ type: 'error', text1: 'Invalid email address format.' });
      return;
    }

    setVerifying(true);
    try {
      const response = await API.post('/chat/verify-email', { email: emailInput.trim() });

      if (response.data.success && pendingExpert) {
        Toast.show({ type: 'success', text1: `Welcome ${response.data.name}!` });
        setVerifiedEmail(emailInput.trim().toLowerCase());
        setVerifiedUsername(response.data.name);
        setActiveChatUser({ id: pendingExpert.id, name: pendingExpert.name });
        setShowSecurityModal(false);
        setPendingExpert(null);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error.response?.data?.message || 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const filtered = experts.filter(
    (exp) =>
      exp.name.toLowerCase().includes(search.toLowerCase()) ||
      (exp.expertise || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Award size={26} color={AMBER} />
          </View>
          <View style={styles.flex1}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>VERIFIED NETWORK</Text>
            </View>
            <Text style={styles.title}>Expert Network</Text>
            <Text style={styles.subtitle}>Connect with Verified Academic Specialists</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Search size={18} color="#52525b" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search experts by name or expertise..."
            placeholderTextColor="#52525b"
            style={styles.searchInput}
          />
        </View>

        {filtered.map((exp) => (
          <View key={exp._id} style={styles.expertCard}>
            <View style={styles.expertAccent} />
            <View style={styles.expertBody}>
              <View style={styles.expertTopRow}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{exp.name.charAt(0)}</Text>
                  <View style={styles.verifiedSeal}>
                    <ShieldCheck size={11} color="#000" />
                  </View>
                </View>
                <View style={styles.flex1}>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                  <Text style={styles.expertName}>{exp.name}</Text>
                  <Text style={styles.expertExpertise}>{exp.expertise || 'Computer Science'}</Text>
                  <Text style={styles.expertDept} numberOfLines={2}>{exp.department}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleSecureJoinClick(exp._id, exp.name)}
              style={styles.consultButton}
            >
              <MessageSquare size={16} color="#000" />
              <Text style={styles.consultButtonText}>Open Secure Consultation</Text>
            </TouchableOpacity>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Award size={36} color="#3f3f46" />
            <Text style={styles.emptyText}>No matching specialists found</Text>
          </View>
        )}
      </ScrollView>

      <Modal visible={showSecurityModal} animationType="fade" transparent onRequestClose={() => setShowSecurityModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                disabled={verifying}
                onPress={() => { setShowSecurityModal(false); setPendingExpert(null); }}
                style={styles.modalCloseButton}
              >
                <X size={22} color="#71717a" />
              </TouchableOpacity>
              <View style={styles.rowGap}>
                <View style={styles.lockIconBox}>
                  <Lock size={22} color={AMBER} />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Security Gate</Text>
                  <Text style={styles.modalSubtitle}>Identity Verification Required</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                You are about to open a private channel with{' '}
                <Text style={styles.modalDescriptionStrong}>{pendingExpert?.name}</Text>.
              </Text>

              <Text style={styles.fieldLabel}>Your Registered Email</Text>
              <TextInput
                value={emailInput}
                onChangeText={setEmailInput}
                placeholder="your@email.com"
                placeholderTextColor="#52525b"
                editable={!verifying}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
                autoFocus
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  disabled={verifying}
                  onPress={() => { setShowSecurityModal(false); setPendingExpert(null); }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={verifying}
                  onPress={handleVerifyConfirm}
                  style={styles.confirmButton}
                >
                  {verifying ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <>
                      <ShieldCheck size={16} color="#000" />
                      <Text style={styles.confirmButtonText}>Confirm Access</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {activeChatUser && (
        <PrivateChatModal
          userId={activeChatUser.id}
          recipientName={activeChatUser.name}
          onClose={() => {
            setActiveChatUser(null);
            setVerifiedEmail('');
            setVerifiedUsername('');
          }}
          currentUser={{ id: currentUserId }}
          verifiedUserEmail={verifiedEmail}
          verifiedUsername={verifiedUsername}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050505' },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  flex1: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  header: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  logoBox: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginBottom: 8 },
  badgeText: { color: AMBER, fontSize: 9, fontWeight: '700' },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  subtitle: { color: '#71717a', fontSize: 12, marginTop: 2 },

  searchWrap: { position: 'relative', justifyContent: 'center', marginBottom: 24 },
  searchIcon: { position: 'absolute', left: 16, zIndex: 1 },
  searchInput: { backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingLeft: 46, paddingRight: 16, paddingVertical: 14, color: '#fff', fontSize: 14 },

  expertCard: { backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  expertAccent: { height: 3, backgroundColor: AMBER },
  expertBody: { padding: 20 },
  expertTopRow: { flexDirection: 'row', gap: 14 },
  avatarWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fcd34d', fontSize: 20, fontWeight: '700' },
  verifiedSeal: { position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: AMBER, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#0a0a0c' },
  verifiedTag: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 999, marginBottom: 6 },
  verifiedTagText: { color: AMBER, fontSize: 9.5, fontWeight: '700' },
  expertName: { color: '#fff', fontSize: 17, fontWeight: '700' },
  expertExpertise: { color: 'rgba(251,191,36,0.8)', fontSize: 12, marginTop: 2 },
  expertDept: { color: '#71717a', fontSize: 12, marginTop: 6 },

  consultButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: AMBER, paddingVertical: 14, marginHorizontal: 20, marginBottom: 20, borderRadius: 16 },
  consultButtonText: { color: '#000', fontWeight: '700', fontSize: 13 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#a1a1aa', fontSize: 15, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#0a0a0c', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden' },
  modalHeader: { backgroundColor: 'rgba(0,0,0,0.4)', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  modalCloseButton: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  lockIconBox: { padding: 10, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#71717a', fontSize: 12, marginTop: 2 },
  modalBody: { padding: 20 },
  modalDescription: { color: '#a1a1aa', fontSize: 13, lineHeight: 19, marginBottom: 18 },
  modalDescriptionStrong: { color: '#fff', fontWeight: '700' },
  fieldLabel: { color: '#71717a', fontSize: 10.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  input: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, color: '#fff', fontSize: 14 },
  modalButtonRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' },
  cancelButtonText: { color: '#d4d4d8', fontWeight: '700', fontSize: 13 },
  confirmButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 14, backgroundColor: AMBER },
  confirmButtonText: { color: '#000', fontWeight: '700', fontSize: 13 },
});