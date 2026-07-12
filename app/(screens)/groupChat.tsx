import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import {
    Camera as CameraIcon,
    Check,
    Copy,
    Download,
    FileUp,
    MonitorSmartphone,
    Pencil,
    Send,
    ShieldAlert,
    Smile,
    Trash2,
    Users,
    X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";
import API from "../lib/api";
import { GroupMessage } from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

const REACTION_STAMPS = ["👍", "❤️", "😂", "😮", "🔥", "✅", "🙏"];
const AMBER = "#fbbf24";

export default function GroupChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [liveCamera, setLiveCamera] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const socketRef = useRef<Socket | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const flatListRef = useRef<FlatList>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await API.get("/chat/history");
        setMessages(res.data || []);
      } catch {
        console.error("Could not sync message history logs down.");
      }

      const token = await AsyncStorage.getItem("token");
      socketRef.current = io(`${API_URL}`, {
        transports: ["websocket"],
        auth: { token },
      });

      socketRef.current.on("receive_group_message", (msg: GroupMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      socketRef.current.on(
        "group_message_updated",
        (updatedMsg: GroupMessage) => {
          setMessages((prev) =>
            prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m)),
          );
        },
      );

      socketRef.current.on(
        "group_message_deleted",
        (payload: { messageId: string }) => {
          setMessages((prev) =>
            prev.filter((m) => m._id !== payload.messageId),
          );
        },
      );
    };

    init();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    return () => clearTimeout(t);
  }, [messages]);

  const handleMessageDispatch = () => {
    if (!inputVal.trim() || !user) return;

    const currentUser = user as any;
    const userId = currentUser.id || currentUser._id || "unknown_node";

    const payload: GroupMessage = {
      text: inputVal,
      sender: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    socketRef.current?.emit("send_group_message", payload);
    setInputVal("");
  };

  const submitMessageUpdate = (messageId: string) => {
    if (!editText.trim() || !user?.email) return;
    socketRef.current?.emit("edit_group_message", {
      messageId,
      text: editText,
      userEmail: user.email,
    });
    setEditingId(null);
    setEditText("");
    Toast.show({ type: "success", text1: "Message updated successfully." });
  };

  const processMessageDeletion = (messageId: string, isSelfDrop: boolean) => {
    if (!user?.email) return;
    socketRef.current?.emit("delete_group_message", {
      messageId,
      userEmail: user.email,
    });
    Toast.show({
      type: "success",
      text1: isSelfDrop
        ? "Your message was deleted."
        : "Message dropped by Admin override.",
    });
    setActiveMenuId(null);
  };

  const handleTextCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({ type: "success", text1: "Copied to clipboard." });
    setActiveMenuId(null);
  };

  const handleStampInjection = (emoji: string) => {
    if (!user) return;
    const currentUser = user as any;
    const userId = currentUser.id || currentUser._id || "unknown_node";

    const payload: GroupMessage = {
      emoji,
      sender: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
    socketRef.current?.emit("send_group_message", payload);
    setShowEmojis(false);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Toast.show({ type: "error", text1: "Camera permission is required." });
        return;
      }
    }
    setLiveCamera(true);
  };

  const handleSnapshotCapture = async () => {
    if (!cameraRef.current || !user) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      setLiveCamera(false);

      const currentUser = user as any;
      const userId = currentUser.id || currentUser._id || "unknown_node";

      const payload: GroupMessage = {
        cameraSnapshot: `data:image/jpeg;base64,${photo.base64}`,
        fileName: "Camera_Snapshot.jpg",
        sender: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
      socketRef.current?.emit("send_group_message", payload);
      Toast.show({
        type: "success",
        text1: "Snapshot transmitted successfully.",
      });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to capture snapshot." });
    }
  };

  const processExternalFileAttachment = async () => {
    if (!user) return;
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    Toast.show({
      type: "info",
      text1: `Uploading asset file: ${asset.name}...`,
    });

    try {
      const formData = new FormData();
      // @ts-ignore React Native FormData file shape
      formData.append("file", {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "application/octet-stream",
      });

      // FIXED from original: was a plain string '${API_URL}/api/chat/upload'
      // (regular quotes, not backticks), which would have literally posted
      // to that broken literal path instead of interpolating the base URL.
      const res = await API.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const currentUser = user as any;
      const userId = currentUser.id || currentUser._id || "unknown_node";

      const payload: GroupMessage = {
        fileUrl: res.data.fileUrl,
        fileName: asset.name,
        sender: {
          id: userId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };

      socketRef.current?.emit("send_group_message", payload);
      Toast.show({ type: "success", text1: "File shared in group room." });
    } catch {
      Toast.show({ type: "error", text1: "Asset transmission error." });
    }
  };

  const currentSessionIsAdmin =
    user?.email?.trim().toLowerCase() === "admin@glowcare.ai" ||
    user?.email?.trim().toLowerCase() === "admin@notevault.com" ||
    user?.role === "admin";

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.rowGap}>
          <View style={styles.headerIconBox}>
            <Users size={18} color={AMBER} />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              Public Sync Communication Channel
            </Text>
            <Text style={styles.headerSubtitle}>
              NoteVault low-latency grid connection
            </Text>
          </View>
        </View>
        <View style={styles.nodeIdChip}>
          <MonitorSmartphone size={12} color={AMBER} />
          <Text style={styles.nodeIdText}>
            {user?.name || "anonymous_peer"}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, idx) => item._id || String(idx)}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item: m }) => {
          const isSelf =
            m.sender?.email?.trim().toLowerCase() ===
            user?.email?.trim().toLowerCase();
          const isAdminNode =
            m.sender?.email?.trim().toLowerCase() === "admin@glowcare.ai" ||
            m.sender?.email?.trim().toLowerCase() === "admin@notevault.com" ||
            m.sender?.role === "admin";
          const messageId = m._id || "";
          const senderRole = m.sender?.role || "user";
          const isMenuOpen = activeMenuId === messageId;

          return (
            <View
              style={[
                styles.messageBlock,
                isSelf ? styles.messageBlockSelf : styles.messageBlockOther,
              ]}
            >
              <View style={styles.senderMetaRow}>
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>{senderRole}</Text>
                </View>
                <Text
                  style={
                    isSelf ? styles.senderNameSelf : styles.senderNameOther
                  }
                >
                  {m.sender?.name}
                </Text>
                {isAdminNode && (
                  <View style={styles.adminBadge}>
                    <ShieldAlert size={8} color="#f87171" />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setActiveMenuId(isMenuOpen ? null : messageId)}
                style={[
                  styles.bubble,
                  isSelf ? styles.bubbleSelf : styles.bubbleOther,
                ]}
              >
                {editingId === messageId ? (
                  <View style={styles.editRow}>
                    <TextInput
                      value={editText}
                      onChangeText={setEditText}
                      style={styles.editInput}
                      autoFocus
                    />
                    <TouchableOpacity
                      onPress={() => submitMessageUpdate(messageId)}
                    >
                      <Check size={16} color="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingId(null)}>
                      <X size={16} color="#000" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    {!!m.text && (
                      <Text
                        style={
                          isSelf
                            ? styles.bubbleTextSelf
                            : styles.bubbleTextOther
                        }
                      >
                        {m.text}
                      </Text>
                    )}
                    {!!m.emoji && (
                      <Text style={styles.emojiMessage}>{m.emoji}</Text>
                    )}
                    {!!m.cameraSnapshot && (
                      <Image
                        source={{ uri: m.cameraSnapshot }}
                        style={styles.snapshotImage}
                      />
                    )}
                    {!!m.fileUrl && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(m.fileUrl!)}
                        style={styles.fileChip}
                      >
                        <Download size={12} color={isSelf ? AMBER : "#fff"} />
                        <Text style={styles.fileChipText} numberOfLines={1}>
                          {m.fileName || "Download Shared Asset"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </TouchableOpacity>

              {isMenuOpen && editingId !== messageId && (
                <View
                  style={[
                    styles.actionRow,
                    isSelf && { alignSelf: "flex-end" },
                  ]}
                >
                  {!!m.text && (
                    <TouchableOpacity
                      onPress={() => handleTextCopy(m.text || "")}
                      style={styles.actionButton}
                    >
                      <Copy size={13} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}
                  {isSelf && !!m.text && (
                    <TouchableOpacity
                      onPress={() => {
                        setEditingId(messageId);
                        setEditText(m.text || "");
                        setActiveMenuId(null);
                      }}
                      style={styles.actionButton}
                    >
                      <Pencil size={13} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}
                  {(isSelf || currentSessionIsAdmin) && !!messageId && (
                    <TouchableOpacity
                      onPress={() => processMessageDeletion(messageId, isSelf)}
                      style={styles.actionButton}
                    >
                      <Trash2 size={13} color="#f87171" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Camera Modal */}
      <Modal
        visible={liveCamera}
        animationType="slide"
        onRequestClose={() => setLiveCamera(false)}
      >
        <View style={styles.cameraScreen}>
          <TouchableOpacity
            onPress={() => setLiveCamera(false)}
            style={styles.cameraCloseButton}
          >
            <X size={20} color="#fff" />
          </TouchableOpacity>
          {permission?.granted && (
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing="front"
            />
          )}
          <TouchableOpacity
            onPress={handleSnapshotCapture}
            style={styles.captureButton}
          >
            <Text style={styles.captureButtonText}>Capture Frame</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Emoji tray */}
      {showEmojis && (
        <View style={styles.emojiTray}>
          {REACTION_STAMPS.map((stamp) => (
            <TouchableOpacity
              key={stamp}
              onPress={() => handleStampInjection(stamp)}
              style={styles.emojiStampButton}
            >
              <Text style={styles.emojiStampText}>{stamp}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputBar}>
          <TouchableOpacity
            onPress={processExternalFileAttachment}
            style={styles.iconBarButton}
          >
            <FileUp size={16} color="#a1a1aa" />
          </TouchableOpacity>
          <TouchableOpacity onPress={openCamera} style={styles.iconBarButton}>
            <CameraIcon size={16} color="#a1a1aa" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowEmojis(!showEmojis)}
            style={[
              styles.iconBarButton,
              showEmojis && styles.iconBarButtonActive,
            ]}
          >
            <Smile size={16} color={showEmojis ? AMBER : "#a1a1aa"} />
          </TouchableOpacity>

          <TextInput
            value={inputVal}
            onChangeText={setInputVal}
            placeholder="Type message..."
            placeholderTextColor="#52525b"
            style={styles.textInput}
          />

          <TouchableOpacity
            onPress={handleMessageDispatch}
            disabled={!inputVal.trim()}
            style={[
              styles.sendButton,
              !inputVal.trim() && styles.sendButtonDisabled,
            ]}
          >
            <Send size={16} color={!inputVal.trim() ? "#52525b" : "#000"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 10 },

  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111114",
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerIconBox: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(251,191,36,0.1)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
  },
  headerTitle: { color: "#fff", fontSize: 12.5, fontWeight: "700" },
  headerSubtitle: {
    color: "#71717a",
    fontSize: 9,
    marginTop: 2,
    textTransform: "uppercase",
  },
  nodeIdChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(24,24,27,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    display: "none",
  },
  nodeIdText: { color: "#a1a1aa", fontSize: 10 },

  messagesList: { padding: 16, gap: 14 },
  messageBlock: { maxWidth: "82%" },
  messageBlockSelf: { alignSelf: "flex-end", alignItems: "flex-end" },
  messageBlockOther: { alignSelf: "flex-start", alignItems: "flex-start" },

  senderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  roleTag: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    color: "#71717a",
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  senderNameSelf: { color: AMBER, fontSize: 10, fontWeight: "700" },
  senderNameOther: { color: "#a1a1aa", fontSize: 10 },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(153,27,27,0.3)",
    borderWidth: 1,
    borderColor: "rgba(153,27,27,0.5)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadgeText: { color: "#f87171", fontSize: 7.5, fontWeight: "700" },

  bubble: { padding: 14, borderRadius: 16 },
  bubbleSelf: { backgroundColor: AMBER, borderTopRightRadius: 4 },
  bubbleOther: {
    backgroundColor: "#121216",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderTopLeftRadius: 4,
  },
  bubbleTextSelf: {
    color: "#000",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  bubbleTextOther: { color: "#f4f4f5", fontSize: 13, lineHeight: 18 },
  emojiMessage: { fontSize: 28 },
  snapshotImage: { width: 180, height: 140, borderRadius: 10, marginTop: 4 },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "#27272a",
    padding: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  fileChipText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 180,
  },
  editInput: {
    flex: 1,
    color: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.4)",
    fontSize: 13,
    paddingVertical: 2,
  },

  actionRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 10,
    padding: 4,
  },
  actionButton: { padding: 8, borderRadius: 8 },

  cameraScreen: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  cameraCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  cameraView: { width: 280, height: 380, borderRadius: 18, overflow: "hidden" },
  captureButton: {
    backgroundColor: AMBER,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  captureButtonText: {
    color: "#000",
    fontWeight: "800",
    fontSize: 12,
    textTransform: "uppercase",
  },

  emojiTray: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(17,17,20,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  emojiStampButton: { padding: 8 },
  emojiStampText: { fontSize: 22 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 12,
    backgroundColor: "#111114",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  iconBarButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(24,24,27,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  iconBarButtonActive: {
    backgroundColor: "rgba(251,191,36,0.1)",
    borderColor: "rgba(251,191,36,0.3)",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#070708",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#f4f4f5",
    fontSize: 13,
  },
  sendButton: { backgroundColor: AMBER, padding: 11, borderRadius: 12 },
  sendButtonDisabled: { backgroundColor: "rgba(24,24,27,0.6)" },
});
