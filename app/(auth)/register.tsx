import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Link, useRouter } from "expo-router";
import { Award, BookOpen, GraduationCap } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

type UserRoleChoice = "student" | "expert";
const AMBER = "#facc15";

export default function Register() {
  const [role, setRole] = useState<UserRoleChoice>("student");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
    semester: 1,
    expertise: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const isAdminEmail = formData.email.toLowerCase() === "admin@notevault.com";

  const setField = (key: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleAuthSuccess = (user: any, token: string) => {
    login(user, token);
    Toast.show({ type: "success", text1: "Account setup complete!" });

    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "expert") router.replace("/expert-dashboard");
    else router.replace("/dashboard");
  };

  const handleSubmit = async () => {
    setLoading(true);
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      department: formData.department,
      role: isAdminEmail ? "admin" : role,
      ...(!isAdminEmail &&
        role === "student" && { semester: formData.semester }),
      ...(!isAdminEmail &&
        role === "expert" && { expertise: formData.expertise }),
    };

    try {
      const res = await API.post("/auth/register", payload);
      handleAuthSuccess(res.data.user, res.data.token);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Registration failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      // Same version-shape mismatch as login.tsx — handle both possible shapes.
      const idToken =
        (response as any)?.data?.idToken ?? (response as any)?.idToken;
      if (!idToken) throw new Error("No ID token returned from Google");

      const res = await API.post("/auth/google-login", {
        idToken,
        role: isAdminEmail ? "admin" : role,
        department: formData.department || "General",
        semester: role === "student" ? formData.semester : undefined,
        expertise: role === "expert" ? formData.expertise : undefined,
      });
      handleAuthSuccess(res.data.user, res.data.token);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: error.response?.data?.message || "Google sign-up failed.",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <BookOpen size={28} color="#000" />
        </View>
        <Text style={styles.title}>
          Create <Text style={styles.titleAccent}>Account</Text>
        </Text>
        <Text style={styles.subtitle}>Join NoteVault Portal Ecosystem</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.roleTabs}>
          <TouchableOpacity
            onPress={() => setRole("student")}
            style={[
              styles.roleTab,
              role === "student" && !isAdminEmail && styles.roleTabActive,
            ]}
          >
            <GraduationCap
              size={16}
              color={role === "student" && !isAdminEmail ? "#000" : "#a1a1aa"}
            />
            <Text
              style={[
                styles.roleTabText,
                role === "student" && !isAdminEmail && { color: "#000" },
              ]}
            >
              Student
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setRole("expert")}
            style={[
              styles.roleTab,
              role === "expert" && !isAdminEmail && styles.roleTabActive,
            ]}
          >
            <Award
              size={16}
              color={role === "expert" && !isAdminEmail ? "#000" : "#a1a1aa"}
            />
            <Text
              style={[
                styles.roleTabText,
                role === "expert" && !isAdminEmail && { color: "#000" },
              ]}
            >
              Expert
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(v) => setField("name", v)}
            placeholder="Enter your full name"
            placeholderTextColor="#52525b"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Email Address</Text>
          <TextInput
            value={formData.email}
            onChangeText={(v) => setField("email", v)}
            placeholder="Enter your email"
            placeholderTextColor="#52525b"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {isAdminEmail && (
            <Text style={styles.adminNotice}>
              ✨ System Admin Signature Identified
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            value={formData.password}
            onChangeText={(v) => setField("password", v)}
            placeholder="Create a password"
            placeholderTextColor="#52525b"
            secureTextEntry
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Department</Text>
          <TextInput
            value={formData.department}
            onChangeText={(v) => setField("department", v)}
            placeholder="e.g. Software Engineering"
            placeholderTextColor="#52525b"
            style={styles.input}
          />
        </View>

        {!isAdminEmail && role === "student" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Current Semester</Text>
            <View style={styles.semesterRow}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setField("semester", s)}
                  style={[
                    styles.semesterChip,
                    formData.semester === s && styles.semesterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.semesterChipText,
                      formData.semester === s && { color: "#000" },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {!isAdminEmail && role === "expert" && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Area of Expertise</Text>
            <TextInput
              value={formData.expertise}
              onChangeText={(v) => setField("expertise", v)}
              placeholder="e.g. Data Structures, Web Architecture"
              placeholderTextColor="#52525b"
              style={styles.input}
            />
          </View>
        )}

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || googleLoading}
          style={[
            styles.submitButton,
            (loading || googleLoading) && styles.buttonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signinRow}>
          <Text style={styles.signinText}>Already have an account? </Text>
          <Link href="/login" style={styles.signinLink}>
            Sign in
          </Link>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          onPress={handleGoogleSignup}
          disabled={loading || googleLoading}
          style={[
            styles.googleButton,
            (loading || googleLoading) && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.googleButtonText}>
            {googleLoading
              ? "Signing up with Google..."
              : "Sign up with Google"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  header: { alignItems: "center", marginBottom: 28 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: AMBER,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: { color: "#fff", fontSize: 30, fontWeight: "900" },
  titleAccent: { color: AMBER },
  subtitle: { color: "#a1a1aa", fontSize: 13, marginTop: 8 },
  card: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 24,
  },
  roleTabs: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#000",
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#27272a",
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roleTabActive: { backgroundColor: AMBER },
  roleTabText: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  field: { marginBottom: 18 },
  fieldLabel: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#fff",
    fontSize: 14,
  },
  adminNotice: { color: AMBER, fontSize: 11, fontWeight: "700", marginTop: 8 },
  semesterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  semesterChip: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    alignItems: "center",
    justifyContent: "center",
  },
  semesterChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  semesterChipText: { color: "#a1a1aa", fontWeight: "700" },
  submitButton: {
    backgroundColor: AMBER,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#000", fontWeight: "800", fontSize: 15 },
  signinRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  signinText: { color: "#a1a1aa", fontSize: 13 },
  signinLink: { color: AMBER, fontWeight: "600", fontSize: 13 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#27272a" },
  dividerText: {
    marginHorizontal: 14,
    fontSize: 11,
    fontWeight: "700",
    color: "#71717a",
  },
  googleButton: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  googleButtonText: { color: "#e4e4e7", fontWeight: "600", fontSize: 13 },
});
