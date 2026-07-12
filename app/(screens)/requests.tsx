import {
    Award,
    CheckCircle,
    Compass,
    Plus,
    Search,
    X,
    Zap,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import RequestCard from "../../components/RequestCard";
import { useAuth } from "../hooks/useAuth";
import API from "../lib/api";

const AMBER = "#f59e0b";
const EMERALD = "#34d399";
const ROSE = "#fb7185";

export default function Requests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    semester: 1,
    description: "",
    urgency: "medium" as "low" | "medium" | "high" | "critical",
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "open" | "fulfilled"
  >("all");
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    fulfilled: 0,
    urgent: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const open = requests.filter((r) => r.status === "open").length;
    const fulfilled = requests.filter((r) => r.status === "fulfilled").length;
    const urgent = requests.filter(
      (r) => r.urgency === "critical" || r.urgency === "high",
    ).length;
    setStats({ total: requests.length, open, fulfilled, urgent });
  }, [requests]);

  const fetchRequests = async () => {
    try {
      const res = await API.get("/requests");
      setRequests(res.data);
    } catch (error) {
      Toast.show({ type: "error", text1: "Failed to load requests" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await API.post("/requests", formData);
      Toast.show({
        type: "success",
        text1: "Request deployed to the network!",
      });
      setShowForm(false);
      setFormData({
        title: "",
        subject: "",
        semester: 1,
        description: "",
        urgency: "medium",
      });
      fetchRequests();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Failed to post request",
      });
    }
  };

  const handleOpenChat = (_: string, userName: string) => {
    Toast.show({ type: "success", text1: `Opening chat with ${userName}...` });
  };

  const filteredRequests = requests
    .filter((req) => {
      if (filterStatus !== "all" && req.status !== filterStatus) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return (
          req.title.toLowerCase().includes(s) ||
          req.subject.toLowerCase().includes(s) ||
          req.description?.toLowerCase().includes(s)
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              REQUEST NETWORK · {stats.total}
            </Text>
          </View>
          <Text style={styles.heroTitle}>Knowledge Request Hub</Text>
          <Text style={styles.heroSubtitle}>
            Connect with experts and peers. Request the resources you need.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <View
                style={[
                  styles.statIconBox,
                  {
                    backgroundColor: "rgba(245,158,11,0.1)",
                    borderColor: "rgba(245,158,11,0.2)",
                  },
                ]}
              >
                <Award size={16} color={AMBER} />
              </View>
              <View>
                <Text style={styles.statLabel}>OPEN</Text>
                <Text style={styles.statValue}>{stats.open}</Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <View
                style={[
                  styles.statIconBox,
                  {
                    backgroundColor: "rgba(52,211,153,0.1)",
                    borderColor: "rgba(52,211,153,0.2)",
                  },
                ]}
              >
                <CheckCircle size={16} color={EMERALD} />
              </View>
              <View>
                <Text style={styles.statLabel}>FULFILLED</Text>
                <Text style={styles.statValue}>{stats.fulfilled}</Text>
              </View>
            </View>
            <View style={styles.statChip}>
              <View
                style={[
                  styles.statIconBox,
                  {
                    backgroundColor: "rgba(251,113,133,0.1)",
                    borderColor: "rgba(251,113,133,0.2)",
                  },
                ]}
              >
                <Zap size={16} color={ROSE} />
              </View>
              <View>
                <Text style={styles.statLabel}>URGENT</Text>
                <Text style={styles.statValue}>{stats.urgent}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setShowForm(true)}
            style={styles.deployButton}
          >
            <Plus size={20} color="#000" />
            <Text style={styles.deployButtonText}>Deploy Request</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <View style={styles.searchIcon}>
              <Search size={16} color="#52525b" />
            </View>
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search requests..."
              placeholderTextColor="#52525b"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.filterRow}>
          {(["all", "open", "fulfilled"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilterStatus(f)}
              style={[
                styles.filterChip,
                filterStatus === f && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === f && { color: "#000" },
                ]}
              >
                {f === "all"
                  ? "All Status"
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.listArea}>
          {loading ? (
            <ActivityIndicator color={AMBER} style={{ marginTop: 40 }} />
          ) : filteredRequests.length > 0 ? (
            filteredRequests.map((req) => (
              <View key={req._id} style={{ marginBottom: 16 }}>
                <RequestCard
                  req={req}
                  isExpert={user?.role === "expert" || user?.role === "admin"}
                  onOpenChat={handleOpenChat}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Compass size={40} color="rgba(245,158,11,0.5)" />
              <Text style={styles.emptyTitle}>No Requests Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your filters"
                  : "Be the spark that starts the knowledge flow"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowForm(true)}
                style={styles.emptyCta}
              >
                <Text style={styles.emptyCtaText}>
                  {requests.length === 0
                    ? "Initiate First Request"
                    : "Create New Request"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Request</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <X size={22} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              <Text style={styles.fieldLabel}>Request Title</Text>
              <TextInput
                value={formData.title}
                onChangeText={(v) => setFormData({ ...formData, title: v })}
                placeholder="e.g., Advanced Calculus Notes"
                placeholderTextColor="#52525b"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Subject / Course</Text>
              <TextInput
                value={formData.subject}
                onChangeText={(v) => setFormData({ ...formData, subject: v })}
                placeholder="e.g., Mathematics"
                placeholderTextColor="#52525b"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>Semester</Text>
              <View style={styles.semesterRow}>
                {[1, 2, 3, 4].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setFormData({ ...formData, semester: s })}
                    style={[
                      styles.semChip,
                      formData.semester === s && styles.semChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.semChipText,
                        formData.semester === s && { color: "#000" },
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Urgency Level</Text>
              <View style={styles.urgencyRow}>
                {(["low", "medium", "high", "critical"] as const).map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setFormData({ ...formData, urgency: u })}
                    style={[
                      styles.urgencyChip,
                      formData.urgency === u && styles.urgencyChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.urgencyChipText,
                        formData.urgency === u && { color: "#000" },
                      ]}
                    >
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={formData.description}
                onChangeText={(v) =>
                  setFormData({ ...formData, description: v })
                }
                placeholder="Detailed description..."
                placeholderTextColor="#52525b"
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
              />

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={styles.deployModalButton}
                >
                  <Text style={styles.deployModalButtonText}>
                    Deploy Request
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
  screen: { flex: 1, backgroundColor: "#050505" },
  scrollContent: { paddingBottom: 60 },
  hero: {
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245,158,11,0.06)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 16,
  },
  badgeText: {
    color: AMBER,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroTitle: { color: "#fafafa", fontSize: 28, fontWeight: "900" },
  heroSubtitle: {
    color: "#71717a",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
  },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0a0a0c",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { color: "#52525b", fontSize: 9.5 },
  statValue: { color: "#fff", fontSize: 16, fontWeight: "800" },
  deployButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: AMBER,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
  },
  deployButtonText: { color: "#000", fontWeight: "800", fontSize: 14 },

  searchRow: { paddingHorizontal: 20, marginTop: 16 },
  searchInputWrap: { justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, zIndex: 1 },
  searchInput: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingLeft: 40,
    paddingRight: 14,
    paddingVertical: 12,
    color: "#fff",
    fontSize: 13,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  filterChip: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  filterChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  filterChipText: { color: "#a1a1aa", fontSize: 11, fontWeight: "600" },

  listArea: { padding: 20 },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyTitle: {
    color: "#d4d4d8",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  emptyCta: {
    backgroundColor: AMBER,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 20,
  },
  emptyCtaText: { color: "#000", fontWeight: "700", fontSize: 13 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 22,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  fieldLabel: {
    color: "#71717a",
    fontSize: 10.5,
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
  textArea: { height: 90, textAlignVertical: "top" },
  semesterRow: { flexDirection: "row", gap: 8 },
  semChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  semChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  semChipText: { color: "#a1a1aa", fontWeight: "700" },
  urgencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  urgencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  urgencyChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  urgencyChipText: { color: "#a1a1aa", fontSize: 11, fontWeight: "600" },
  modalButtonRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  cancelButtonText: { color: "#d4d4d8", fontWeight: "600", fontSize: 13 },
  deployModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AMBER,
    alignItems: "center",
  },
  deployModalButtonText: { color: "#000", fontWeight: "700", fontSize: 13 },
});
