import {
    Award,
    BookOpen,
    Edit3,
    RefreshCw,
    ShieldCheck,
    Trash2,
    UserCheck,
    X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../hooks/useAuth";
import API from "../lib/api";
import { User } from "../types";

const AMBER = "#fbbf24";

export default function ExpertsList() {
  const [experts, setExperts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    department: "",
    expertise: "",
  });

  useEffect(() => {
    fetchExperts();
  }, []);

  const fetchExperts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/experts");
      setExperts(res.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load expert profiles" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete this expert profile?", "This action is permanent.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await API.delete(`/experts/${id}`);
            Toast.show({
              type: "success",
              text1: "Expert removed successfully",
            });
            fetchExperts();
          } catch (error) {
            Toast.show({ type: "error", text1: "Failed to delete expert" });
          }
        },
      },
    ]);
  };

  const openEditModal = (expert: User) => {
    setSelectedExpert(expert);
    setEditForm({
      name: expert.name,
      department: expert.department,
      expertise: expert.expertise || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedExpert) return;
    try {
      await API.put(`/experts/${selectedExpert.id}`, editForm);
      Toast.show({ type: "success", text1: "Expert profile updated" });
      setIsEditModalOpen(false);
      fetchExperts();
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to apply changes" });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={AMBER} />
        <Text style={styles.loadingText}>Synchronizing Specialists...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <Award size={24} color={AMBER} />
            </View>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EXPERT REGISTRY</Text>
              </View>
              <Text style={styles.title}>Verified Specialists</Text>
              <Text style={styles.subtitle}>
                Elite Academic Knowledge Architects
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchExperts} style={styles.refreshButton}>
            <RefreshCw size={15} color="#d4d4d8" />
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {experts.map((expert) => (
          <View key={expert.id} style={styles.card}>
            <View style={styles.cardAccent} />
            <View style={styles.cardBody}>
              <View style={styles.cardTopRow}>
                <View style={styles.avatarWrap}>
                  <UserCheck size={20} color={AMBER} />
                  <View style={styles.verifiedSeal}>
                    <ShieldCheck size={10} color="#000" />
                  </View>
                </View>
                <View style={styles.flex1}>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>VERIFIED</Text>
                  </View>
                  <Text style={styles.expertName}>{expert.name}</Text>
                  <View style={styles.deptRow}>
                    <BookOpen size={13} color="#71717a" />
                    <Text style={styles.deptText}>{expert.department}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.expertiseBox}>
                <Text style={styles.expertiseLabel}>Domain Expertise</Text>
                <Text style={styles.expertiseText}>
                  {expert.expertise || "Multidisciplinary Academic Consultant"}
                </Text>
              </View>
            </View>

            {user?.role === "admin" ? (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => openEditModal(expert)}
                  style={styles.editButton}
                >
                  <Edit3 size={14} color="#e4e4e7" />
                  <Text style={styles.editButtonText}>Modify</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(expert.id)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={15} color="#71717a" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.contributorRow}>
                <UserCheck size={14} color={AMBER} />
                <Text style={styles.contributorText}>Active Contributor</Text>
              </View>
            )}
          </View>
        ))}

        {experts.length === 0 && (
          <View style={styles.emptyState}>
            <Award size={28} color="#3f3f46" />
            <Text style={styles.emptyTitle}>No Specialists Found</Text>
            <Text style={styles.emptySubtitle}>
              The expert network is currently empty.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={isEditModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Specialist</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <X size={20} color="#71717a" />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              value={editForm.name}
              onChangeText={(v) => setEditForm({ ...editForm, name: v })}
              style={styles.input}
              placeholderTextColor="#52525b"
            />

            <Text style={styles.fieldLabel}>Department</Text>
            <TextInput
              value={editForm.department}
              onChangeText={(v) => setEditForm({ ...editForm, department: v })}
              style={styles.input}
              placeholderTextColor="#52525b"
            />

            <Text style={styles.fieldLabel}>Expertise Domain</Text>
            <TextInput
              value={editForm.expertise}
              onChangeText={(v) => setEditForm({ ...editForm, expertise: v })}
              style={styles.input}
              placeholderTextColor="#52525b"
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleUpdateSubmit}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#050505",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#71717a",
    marginTop: 12,
    fontSize: 11,
    textTransform: "uppercase",
  },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  flex1: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerLeft: { flexDirection: "row", gap: 14, flex: 1 },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,158,11,0.06)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
  },
  badgeText: { color: AMBER, fontSize: 9, fontWeight: "700" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },
  subtitle: { color: "#71717a", fontSize: 11, marginTop: 2 },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  refreshText: { color: "#d4d4d8", fontSize: 11, fontWeight: "600" },

  card: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
  },
  cardAccent: { height: 3, backgroundColor: AMBER },
  cardBody: { padding: 18 },
  cardTopRow: { flexDirection: "row", gap: 12 },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedSeal: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0a0a0c",
  },
  verifiedTag: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 5,
  },
  verifiedTagText: { color: AMBER, fontSize: 9, fontWeight: "700" },
  expertName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  deptRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  deptText: { color: "#a1a1aa", fontSize: 12 },

  expertiseBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  expertiseLabel: {
    color: "#52525b",
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  expertiseText: { color: "#e4e4e7", fontSize: 13, fontWeight: "500" },

  cardActions: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  editButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 11,
    borderRadius: 12,
  },
  editButtonText: { color: "#e4e4e7", fontSize: 11.5, fontWeight: "600" },
  deleteButton: {
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },

  contributorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    padding: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  contributorText: { color: "#a1a1aa", fontSize: 11.5, fontWeight: "500" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: {
    color: "#a1a1aa",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 14,
  },
  emptySubtitle: { color: "#52525b", fontSize: 12, marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  fieldLabel: {
    color: "#71717a",
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 14,
  },
  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 13,
  },
  modalButtonRow: { flexDirection: "row", gap: 10, marginTop: 22 },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  cancelButtonText: { color: "#a1a1aa", fontSize: 11.5, fontWeight: "600" },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: AMBER,
    alignItems: "center",
  },
  saveButtonText: { color: "#000", fontSize: 11.5, fontWeight: "700" },
});
