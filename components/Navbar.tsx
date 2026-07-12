import { usePathname, useRouter } from "expo-router";
import {
    BookOpen,
    Brain,
    LayoutGrid,
    LogOut,
    MessageSquare,
    Shield,
    Upload,
    User as UserIcon,
    Users,
} from "lucide-react-native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../app/hooks/useAuth";

const AMBER = "#facc15";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;
  const isSystemAdmin =
    user?.role === "admin" || user?.email === "admin@notevault.com";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <TouchableOpacity
        onPress={() => router.push("/dashboard")}
        style={styles.logoRow}
      >
        <View style={styles.logoBox}>
          <BookOpen size={18} color="#000" />
        </View>
        <Text style={styles.logoText}>NoteVault</Text>
      </TouchableOpacity>

      {/* Nav icons */}
      <View style={styles.navIcons}>
        <TouchableOpacity
          onPress={() => router.push("/dashboard")}
          style={[
            styles.navItem,
            isActive("/dashboard") && styles.navItemActive,
          ]}
        >
          <LayoutGrid
            size={20}
            color={isActive("/dashboard") ? AMBER : "#a1a1aa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/requests")}
          style={[
            styles.navItem,
            isActive("/requests") && styles.navItemActive,
          ]}
        >
          <MessageSquare
            size={20}
            color={isActive("/requests") ? AMBER : "#a1a1aa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/studentExperts")}
          style={[
            styles.navItem,
            isActive("/studentExperts") && styles.navItemActive,
          ]}
        >
          <Users
            size={20}
            color={isActive("/studentExperts") ? AMBER : "#a1a1aa"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/upload")}
          style={[styles.navItem, isActive("/upload") && styles.navItemActive]}
        >
          <Upload size={20} color={isActive("/upload") ? AMBER : "#a1a1aa"} />
        </TouchableOpacity>

        {user?.role === "student" && (
          <TouchableOpacity
            onPress={() => router.push("/aiStudymode")}
            style={[
              styles.navItem,
              isActive("/aiStudymode") && styles.navItemActive,
            ]}
          >
            <Brain
              size={20}
              color={isActive("/aiStudymode") ? AMBER : "#a1a1aa"}
            />
          </TouchableOpacity>
        )}

        {isSystemAdmin && (
          <TouchableOpacity
            onPress={() => router.push("/admin")}
            style={[styles.navItem, isActive("/admin") && styles.navItemActive]}
          >
            <Shield
              size={20}
              color={isActive("/admin") ? "#ef4444" : "#a1a1aa"}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* User info + logout */}
      <View style={styles.userSection}>
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          style={styles.avatarButton}
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <UserIcon size={16} color={AMBER} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <LogOut size={18} color="#a1a1aa" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#27272a",
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingBottom: 12,
    gap: 8,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  navIcons: { flexDirection: "row", gap: 2 },
  navItem: { padding: 7, borderRadius: 10 },
  navItemActive: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: AMBER,
  },

  userSection: { flexDirection: "row", alignItems: "center", gap: 6 },
  avatarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  logoutButton: { padding: 8 },
});
