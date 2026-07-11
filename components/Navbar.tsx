import { useAuth } from "@/src/hooks/useAuth";
import { usePathname, useRouter } from "expo-router";
import {
    Brain,
    LayoutDashboard,
    Shield,
    Upload
} from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null; // Hide Navbar if not logged in

  const isSystemAdmin =
    user?.role === "admin" || user?.email === "admin@glowcare.ai";
  const isActive = (path: string) => pathname === path;

  return (
    <View style={styles.container}>
      {/* Dashboard Nav Item Example */}
      <TouchableOpacity
        onPress={() => router.push("/student/dashboard" as any)}
        style={[
          styles.navItem,
          isActive("/student/dashboard") && styles.activeItem,
        ]}
      >
        <LayoutDashboard
          size={24}
          color={isActive("/student/dashboard") ? "#FACC15" : "#A1A1AA"}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/upload" as any)}
        style={[styles.navItem, isActive("/upload") && styles.activeItem]}
      >
        <Upload size={24} color={isActive("/upload") ? "#FACC15" : "#A1A1AA"} />
      </TouchableOpacity>

      {user.role === "student" && (
        <TouchableOpacity
          onPress={() => router.push("/student/Aistudymode" as any)}
          style={[
            styles.navItem,
            isActive("/student/Aistudymode") && styles.activeItem,
          ]}
        >
          <Brain
            size={24}
            color={isActive("/student/Aistudymode") ? "#FBBF24" : "#A1A1AA"}
          />
        </TouchableOpacity>
      )}

      {isSystemAdmin && (
        <TouchableOpacity
          onPress={() => router.push("/admin/AdminDashboard" as any)}
          style={[
            styles.navItem,
            isActive("/admin/AdminDashboard") && styles.activeItem,
          ]}
        >
          <Shield
            size={24}
            color={isActive("/admin/AdminDashboard") ? "#EF4444" : "#A1A1AA"}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 20,
    backgroundColor: "#000",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navItem: {
    padding: 10,
    borderRadius: 12,
  },
  activeItem: {
    backgroundColor: "rgba(250, 204, 21, 0.1)",
  },
});
