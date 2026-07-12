import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { Camera, User as UserIcon } from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "../hooks/useAuth";

const AMBER = "#facc15";
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [selectedAsset, setSelectedAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Toast.show({
        type: "error",
        text1: "Photo library permission is required.",
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedAsset(result.assets[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      if (selectedAsset) {
        // @ts-ignore RN FormData file shape
        formData.append("avatar", {
          uri: selectedAsset.uri,
          name: selectedAsset.fileName || "avatar.jpg",
          type: selectedAsset.mimeType || "image/jpeg",
        });
      }

      const token = await AsyncStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "PUT",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) throw new Error("Update failed");
      const updatedUser = await response.json();
      await updateUser(updatedUser);
      Toast.show({ type: "success", text1: "Profile updated successfully!" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.pageTitle}>Profile information</Text>

      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.cardTitle}>Public profile</Text>
            <Text style={styles.cardSubtitle}>
              View and update your profile information
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save changes"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrap}>
            {selectedAsset ? (
              <Image
                source={{ uri: selectedAsset.uri }}
                style={styles.avatarImage}
              />
            ) : user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <UserIcon size={40} color="#52525b" />
            )}
            <View style={styles.avatarOverlay}>
              <Camera size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={styles.flex1}>
            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.uploadButton}
            >
              <Text style={styles.uploadButtonText}>Upload new photo</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>JPG, GIF or PNG. 1MB Max.</Text>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholderTextColor="#71717a"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#71717a"
          />
        </View>

        <View style={[styles.fieldGroup, { marginTop: 10 }]}>
          <Text style={styles.sectionLabel}>Security</Text>
          <TextInput
            placeholder="Current password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#71717a"
          />
          <TextInput
            placeholder="New password"
            secureTextEntry
            style={[styles.input, { marginTop: 10 }]}
            placeholderTextColor="#71717a"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 60 },
  flex1: { flex: 1 },
  pageTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "rgba(24,24,27,0.5)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  cardTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cardSubtitle: { color: "#71717a", fontSize: 12, marginTop: 4 },
  saveButton: {
    backgroundColor: AMBER,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: { color: "#000", fontWeight: "800", fontSize: 12 },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
  },
  avatarWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0,
  },
  uploadButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  uploadButtonText: { color: "#e4e4e7", fontSize: 13, fontWeight: "600" },
  hintText: { color: "#71717a", fontSize: 11, marginTop: 8 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  sectionLabel: { color: "#fff", fontWeight: "600", marginBottom: 12 },
  input: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: "#fff",
    fontSize: 14,
  },
});
