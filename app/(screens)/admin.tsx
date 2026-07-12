import {
    Award,
    Calendar,
    Download,
    FileText,
    GraduationCap,
    Mail,
    RefreshCw,
    Shield,
    ShieldAlert,
    Star,
    Trash2,
    UserCheck,
    Users,
    UserX,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import API from "../lib/api";
import { Note } from "../types";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "student" | "expert" | "admin";
  department?: string;
  createdAt?: string;
}

type Tab = "documents" | "users";

const AMBER = "#f59e0b";
const ROSE = "#f43f5e";
const EMERALD = "#34d399";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("documents");

  const [notes, setNotes] = useState<Note[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalExperts, setTotalExperts] = useState(0);
  const [totalDownloads, setTotalDownloads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);

      const [notesRes, usersCountRes, expertsCountRes, profilesRes] =
        await Promise.all([
          API.get("/notes"),
          API.get("/users/count-students").catch(() => ({
            data: { count: 0 },
          })),
          API.get("/users/count-experts").catch(() => ({ data: { count: 0 } })),
          API.get("/users")
            .catch(() => API.get("/auth/users"))
            .catch(() => ({ data: [] })),
        ]);

      setNotes(notesRes.data || []);
      setTotalUsers(usersCountRes.data?.count || 0);
      setTotalExperts(expertsCountRes.data?.count || 0);
      setProfiles(profilesRes.data || []);

      const total = (notesRes.data || []).reduce(
        (sum: number, note: Note) => sum + note.downloads,
        0,
      );
      setTotalDownloads(total);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load dashboard statistics",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllDashboardData();
  }, []);

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      "Delete this note?",
      "This permanently removes it from the system.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/notes/${noteId}`);
              Toast.show({
                type: "success",
                text1: "Note deleted successfully",
              });
              fetchAllDashboardData();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: error.response?.data?.message || "Delete failed",
              });
            }
          },
        },
      ],
    );
  };

  const handleDeleteUserProfile = (userId: string, userEmail: string) => {
    const targetEmail = userEmail.toLowerCase();

    if (
      targetEmail === "admin@glowcare.ai" ||
      targetEmail === "admin@notevault.com"
    ) {
      Toast.show({
        type: "error",
        text1: "Root admin profile cannot be removed",
      });
      return;
    }

    Alert.alert(
      "Delete this user?",
      `This permanently removes ${userEmail} from the system.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await API.delete(`/users/${userId}`);
              Toast.show({
                type: "success",
                text1: "User deleted successfully",
              });

              setProfiles((prev) => prev.filter((u) => u._id !== userId));

              const [uCount, eCount] = await Promise.all([
                API.get("/users/count-students").catch(() => ({
                  data: { count: totalUsers },
                })),
                API.get("/users/count-experts").catch(() => ({
                  data: { count: totalExperts },
                })),
              ]);
              setTotalUsers(uCount.data?.count || 0);
              setTotalExperts(eCount.data?.count || 0);
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: error.response?.data?.message || "Delete failed",
              });
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={AMBER} />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
      </View>
    );
  }

  const renderNoteCard = ({ item: note }: { item: Note }) => {
    const isAdminOwner =
      note.uploadedBy?.email?.toLowerCase() === "admin@notevault.com" ||
      note.uploadedBy?.role === "admin";

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.flex1}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {note.title}
            </Text>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>
                {note.subject} • Sem {note.semester}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteNote(note._id)}
            style={styles.iconButton}
          >
            <Trash2 size={18} color={ROSE} />
          </TouchableOpacity>
        </View>

        <View style={styles.cardMidRow}>
          <View style={styles.rowGap}>
            <Star color={AMBER} fill={AMBER} size={14} />
            <Text style={styles.ratingText}>
              {note.averageRating ? note.averageRating.toFixed(1) : "0.0"}
            </Text>
          </View>
          <View style={styles.downloadsPill}>
            <Text style={styles.downloadsText}>{note.downloads} downloads</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.rowGap, styles.flex1]}>
            {isAdminOwner || note.uploadedBy?.role === "expert" ? (
              <Award size={15} color={isAdminOwner ? AMBER : EMERALD} />
            ) : (
              <GraduationCap size={15} color="#a1a1aa" />
            )}
            <Text style={styles.ownerText} numberOfLines={1}>
              Owner:{" "}
              <Text style={styles.ownerName}>
                {note.uploadedBy?.name || "System"}
              </Text>
            </Text>
          </View>
          <View
            style={[
              styles.rolePill,
              isAdminOwner
                ? styles.rolePillAdmin
                : note.uploadedBy?.role === "expert"
                  ? styles.rolePillExpert
                  : styles.rolePillStudent,
            ]}
          >
            <Text
              style={[
                styles.rolePillText,
                isAdminOwner
                  ? { color: AMBER }
                  : note.uploadedBy?.role === "expert"
                    ? { color: EMERALD }
                    : { color: "#a1a1aa" },
              ]}
            >
              {isAdminOwner ? "admin" : note.uploadedBy?.role || "student"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderUserCard = ({ item: user }: { item: UserProfile }) => {
    const isRootSystemAdmin =
      user.email?.toLowerCase() === "admin@glowcare.ai" ||
      user.email?.toLowerCase() === "admin@notevault.com" ||
      user.role === "admin";

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={[styles.rowGap, styles.flex1]}>
            <View
              style={[
                styles.avatarBox,
                isRootSystemAdmin
                  ? styles.avatarAdmin
                  : user.role === "expert"
                    ? styles.avatarExpert
                    : styles.avatarStudent,
              ]}
            >
              {isRootSystemAdmin ? (
                <Shield size={18} color={AMBER} />
              ) : user.role === "expert" ? (
                <Award size={18} color={EMERALD} />
              ) : (
                <GraduationCap size={18} color="#d4d4d8" />
              )}
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {user.name}
              </Text>
              <View
                style={[
                  styles.rolePill,
                  isRootSystemAdmin
                    ? styles.rolePillAdmin
                    : user.role === "expert"
                      ? styles.rolePillExpert
                      : styles.rolePillStudent,
                ]}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    isRootSystemAdmin
                      ? { color: AMBER }
                      : user.role === "expert"
                        ? { color: EMERALD }
                        : { color: "#a1a1aa" },
                  ]}
                >
                  {user.role || "student"}
                </Text>
              </View>
            </View>
          </View>

          {!isRootSystemAdmin && (
            <TouchableOpacity
              onPress={() => handleDeleteUserProfile(user._id, user.email)}
              style={styles.iconButton}
            >
              <UserX size={18} color={ROSE} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.userMeta}>
          <View style={styles.rowGap}>
            <Mail size={14} color="#71717a" />
            <Text style={styles.metaText} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
          {user.department && (
            <View style={styles.rowGap}>
              <Text style={styles.metaLabel}>Department:</Text>
              <Text style={styles.metaText}>{user.department}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.rowGap}>
            <Calendar size={12} color="#71717a" />
            <Text style={styles.footerLabel}>Registration Date</Text>
          </View>
          <Text style={styles.footerValue}>
            {user.createdAt
              ? new Date(user.createdAt).toLocaleDateString()
              : "System Account"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ShieldAlert color={AMBER} size={28} />
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Global content moderation & access control
        </Text>

        <TouchableOpacity
          onPress={fetchAllDashboardData}
          style={styles.refreshButton}
        >
          <RefreshCw size={16} color="#e4e4e7" />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setTab("users")}
        >
          <Text style={styles.statLabel}>Students</Text>
          <Text style={styles.statValue}>{totalUsers}</Text>
          <View style={styles.statIcon}>
            <Users color="#3f3f46" size={22} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setTab("users")}
        >
          <Text style={styles.statLabel}>Experts</Text>
          <Text style={styles.statValue}>{totalExperts}</Text>
          <View style={styles.statIcon}>
            <UserCheck color="#3f3f46" size={22} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => setTab("documents")}
        >
          <Text style={styles.statLabel}>Files</Text>
          <Text style={styles.statValue}>{notes.length}</Text>
          <View style={styles.statIcon}>
            <FileText color="#3f3f46" size={22} />
          </View>
        </TouchableOpacity>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Downloads</Text>
          <Text style={styles.statValue}>{totalDownloads}</Text>
          <View style={styles.statIcon}>
            <Download color="#3f3f46" size={22} />
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setTab("documents")}
          style={[
            styles.tabButton,
            tab === "documents" && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              tab === "documents" && styles.tabTextActive,
            ]}
          >
            Documents ({notes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab("users")}
          style={[styles.tabButton, tab === "users" && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabText, tab === "users" && styles.tabTextActive]}
          >
            Users ({profiles.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "documents" ? (
        <FlatList
          data={notes}
          keyExtractor={(item) => item._id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AMBER}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <FileText color="#3f3f46" size={40} />
              <Text style={styles.emptyText}>No documents found.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item._id}
          renderItem={renderUserCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AMBER}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Users color="#3f3f46" size={40} />
              <Text style={styles.emptyText}>No registered users found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#09090b" },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#09090b",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#a1a1aa", marginTop: 12, fontWeight: "500" },

  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { color: "#fff", fontSize: 26, fontWeight: "800" },
  headerSubtitle: { color: "#a1a1aa", fontSize: 13, marginTop: 6 },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#3f3f46",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  refreshText: { color: "#e4e4e7", fontWeight: "600", fontSize: 13 },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statCard: {
    flexBasis: "47%",
    backgroundColor: "rgba(24,24,27,0.6)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 14,
  },
  statLabel: {
    color: "#a1a1aa",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 4 },
  statIcon: { position: "absolute", right: 12, top: 12 },

  tabRow: {
    flexDirection: "row",
    gap: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    marginBottom: 12,
  },
  tabButton: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: { borderBottomColor: AMBER },
  tabText: {
    color: "#a1a1aa",
    fontWeight: "700",
    fontSize: 12,
    textTransform: "uppercase",
  },
  tabTextActive: { color: AMBER },

  listContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },

  card: {
    backgroundColor: "#18181b",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#27272a",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  flex1: { flex: 1 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  tagPill: {
    backgroundColor: "#27272a",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  tagPillText: {
    color: AMBER,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  iconButton: { padding: 8, borderRadius: 12 },

  cardMidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#27272a",
  },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { color: "#e4e4e7", fontWeight: "700", fontSize: 12 },
  downloadsPill: {
    backgroundColor: "rgba(39,39,42,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  downloadsText: { color: "#d4d4d8", fontSize: 11, fontWeight: "500" },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(39,39,42,0.7)",
  },
  ownerText: { color: "#a1a1aa", fontSize: 11 },
  ownerName: { color: "#e4e4e7", fontWeight: "600" },

  rolePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rolePillAdmin: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.2)",
  },
  rolePillExpert: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderColor: "rgba(52,211,153,0.2)",
  },
  rolePillStudent: { backgroundColor: "#27272a", borderColor: "#3f3f46" },
  rolePillText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  avatarBox: { padding: 10, borderRadius: 12, borderWidth: 1 },
  avatarAdmin: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.2)",
  },
  avatarExpert: {
    backgroundColor: "rgba(52,211,153,0.1)",
    borderColor: "rgba(52,211,153,0.2)",
  },
  avatarStudent: { backgroundColor: "#27272a", borderColor: "#3f3f46" },

  userMeta: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(39,39,42,0.6)",
    gap: 8,
  },
  metaText: { color: "#d4d4d8", fontSize: 12, flexShrink: 1 },
  metaLabel: { color: "#71717a", fontWeight: "600", fontSize: 12 },

  footerLabel: { color: "#71717a", fontSize: 11 },
  footerValue: { color: "#a1a1aa", fontSize: 11, fontWeight: "500" },

  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { color: "#71717a", fontSize: 13, fontWeight: "500" },
});
