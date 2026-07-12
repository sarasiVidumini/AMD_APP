import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
    Camera,
    Check,
    Copy,
    Edit2,
    FileText,
    Paperclip,
    Send,
    Smile,
    Trash,
    X,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
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
import API from "../app/lib/api";

interface MessageType {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  attachments: string[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

interface ChatProps {
  userId: string;
  recipientName: string;
  onClose: () => void;
  currentUser: { id: string };
  verifiedUserEmail?: string;
  verifiedUsername?: string;
}

// Lightweight built-in emoji grid — there's no RN equivalent of
// emoji-picker-react without adding a large native dependency, so this is a
// simple curated set instead. Swap in a bigger list or a package like
// 'rn-emoji-keyboard' later if you want full emoji coverage.
const QUICK_EMOJIS = [
  "😀",
  "😂",
  "😍",
  "🥹",
  "😎",
  "🤔",
  "😢",
  "😡",
  "👍",
  "👎",
  "🙏",
  "👏",
  "🔥",
  "🎉",
  "❤️",
  "💯",
  "✅",
  "❌",
  "⭐",
  "📌",
  "📎",
  "📷",
  "😅",
  "🤝",
];

const AMBER = "#f59e0b";
const VIOLET = "#8b5cf6";

export default function PrivateChatModal({
  userId,
  recipientName,
  onClose,
  currentUser,
  verifiedUsername,
}: ChatProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const flatListRef = useRef<FlatList>(null);
  const pollRef = useRef<any>(null);

  const fetchMessages = async () => {
    if (!userId || userId === "undefined") return;
    try {
      const res = await API.get(`/chat/${userId}`);
      setMessages(res.data);
    } catch (err: any) {
      console.error("Error fetching chat stream:", err.message);
    }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [userId]);

  useEffect(() => {
    // Slight delay so layout settles before scrolling
    const t = setTimeout(
      () => flatListRef.current?.scrollToEnd({ animated: true }),
      100,
    );
    return () => clearTimeout(t);
  }, [messages]);

  const handleSendSubmit = async (overrideAttachments?: string[]) => {
    if (!userId || userId === "undefined") {
      Toast.show({
        type: "error",
        text1: "Cannot send message: invalid recipient.",
      });
      return;
    }

    const finalAttachments =
      overrideAttachments !== undefined ? overrideAttachments : attachedUrls;
    if (!messageText.trim() && finalAttachments.length === 0) return;

    try {
      // FIXED from original: was a plain string "${API_URL}/api/chat" (no
      // backticks), which would have literally posted to that broken literal
      // path. Now uses the shared API client with the correct relative route.
      const res = await API.post("/chat", {
        receiverId: userId,
        content: messageText,
        attachments: finalAttachments,
      });
      setMessages((prev) => [...prev, res.data]);
      setMessageText("");
      setAttachedUrls([]);
      setShowEmojiPicker(false);
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Failed to send message" });
    }
  };

  const uploadAsset = async (uri: string, name: string, mimeType?: string) => {
    setUploading(true);
    try {
      const formData = new FormData();
      // @ts-ignore React Native's FormData file shape differs from web's File type
      formData.append("file", {
        uri,
        name,
        type: mimeType || "application/octet-stream",
      });

      const res = await API.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFileUrl = res.data.fileUrl;

      if (!messageText.trim()) {
        await handleSendSubmit([newFileUrl]);
        Toast.show({ type: "success", text1: "File shared instantly!" });
      } else {
        setAttachedUrls((prev) => [...prev, newFileUrl]);
        Toast.show({
          type: "success",
          text1: "File attached to message draft.",
        });
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "File upload failed." });
    } finally {
      setUploading(false);
    }
  };

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
      const asset = result.assets[0];
      await uploadAsset(
        asset.uri,
        asset.fileName || "photo.jpg",
        asset.mimeType,
      );
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      await uploadAsset(asset.uri, asset.name, asset.mimeType);
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachedUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Toast.show({ type: "success", text1: "Copied to clipboard!" });
    setActiveMenuId(null);
  };

  const startEditing = (msg: MessageType) => {
    setEditingMessageId(msg._id);
    setEditText(msg.content);
    setActiveMenuId(null);
  };

  const handleUpdateMessage = async (msgId: string) => {
    if (!editText.trim()) return;
    try {
      // FIXED from original: had a stray extra `}` in the template literal
      // (`${API_URL}}/api/chat/${msgId}`) which would have broken the URL.
      const res = await API.put(`/chat/${msgId}`, { content: editText });
      setMessages(messages.map((m) => (m._id === msgId ? res.data : m)));
      setEditingMessageId(null);
      Toast.show({ type: "success", text1: "Message updated successfully!" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to update message" });
    }
  };

  const confirmDeleteToast = (msgId: string) => {
    setActiveMenuId(null);
    Alert.alert("Delete message?", "This operation cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => executeDelete(msgId),
      },
    ]);
  };

  const executeDelete = async (msgId: string) => {
    try {
      const res = await API.delete(`/chat/${msgId}`);
      setMessages(messages.map((m) => (m._id === msgId ? res.data : m)));
      Toast.show({ type: "success", text1: "Message removed." });
    } catch (err) {
      Toast.show({ type: "error", text1: "Failed to delete message" });
    }
  };

  const onEmojiPress = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.card}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{recipientName}</Text>
              {!!verifiedUsername && (
                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedText}>
                    Verified • {verifiedUsername}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* MESSAGES */}
          <FlatList
            ref={flatListRef}
            data={messages.filter(
              (msg) =>
                msg.sender === currentUser.id ||
                msg.receiver === userId ||
                msg.sender === userId,
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
            renderItem={({ item: msg }) => {
              const isMe = msg.sender === currentUser.id;
              const isMenuOpen = activeMenuId === msg._id;

              return (
                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={msg.isDeleted || !isMe}
                    onPress={() => setActiveMenuId(isMenuOpen ? null : msg._id)}
                    style={[
                      styles.bubble,
                      msg.isDeleted
                        ? styles.bubbleDeleted
                        : isMe
                          ? styles.bubbleMe
                          : styles.bubbleThem,
                    ]}
                  >
                    {editingMessageId === msg._id ? (
                      <View style={styles.editRow}>
                        <TextInput
                          value={editText}
                          onChangeText={setEditText}
                          style={styles.editInput}
                          autoFocus
                        />
                        <TouchableOpacity
                          onPress={() => handleUpdateMessage(msg._id)}
                        >
                          <Check size={18} color="#34d399" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setEditingMessageId(null)}
                        >
                          <X size={18} color="#a1a1aa" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View>
                        {!!msg.content && (
                          <Text
                            style={
                              msg.isDeleted
                                ? styles.bubbleTextDeleted
                                : styles.bubbleText
                            }
                          >
                            {msg.content}
                          </Text>
                        )}

                        {!msg.isDeleted &&
                          msg.attachments?.map((url: string, i: number) => {
                            const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(
                              url,
                            );
                            return isImage ? (
                              <TouchableOpacity
                                key={i}
                                onPress={() => Linking.openURL(url)}
                              >
                                <Image
                                  source={{ uri: url }}
                                  style={styles.attachmentImage}
                                />
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                key={i}
                                onPress={() => Linking.openURL(url)}
                                style={styles.attachmentFileRow}
                              >
                                <FileText size={18} color="#e4e4e7" />
                                <Text
                                  style={styles.attachmentFileText}
                                  numberOfLines={1}
                                >
                                  Attachment •{" "}
                                  {url.split(".").pop()?.toUpperCase()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                        {msg.isEdited && !msg.isDeleted && (
                          <Text style={styles.editedLabel}>(edited)</Text>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>

                  {!msg.isDeleted &&
                    isMe &&
                    isMenuOpen &&
                    editingMessageId !== msg._id && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          onPress={() => copyToClipboard(msg.content)}
                          style={styles.actionButton}
                        >
                          <Copy size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => startEditing(msg)}
                          style={styles.actionButton}
                        >
                          <Edit2 size={16} color="#a1a1aa" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => confirmDeleteToast(msg._id)}
                          style={styles.actionButton}
                        >
                          <Trash size={16} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              );
            }}
          />

          {/* EMOJI GRID */}
          {showEmojiPicker && (
            <View style={styles.emojiGrid}>
              {QUICK_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => onEmojiPress(emoji)}
                  style={styles.emojiButton}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ATTACHMENT PREVIEWS */}
          {attachedUrls.length > 0 && (
            <View style={styles.attachmentPreviewRow}>
              {attachedUrls.map((url, index) => {
                const isImg = /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
                return (
                  <View key={index} style={styles.attachmentPreviewChip}>
                    {isImg ? (
                      <Image
                        source={{ uri: url }}
                        style={styles.attachmentPreviewImage}
                      />
                    ) : (
                      <FileText size={16} color="#e4e4e7" />
                    )}
                    <Text style={styles.attachmentPreviewText}>Attachment</Text>
                    <TouchableOpacity onPress={() => removeAttachment(index)}>
                      <X size={14} color="#a1a1aa" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* INPUT AREA */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              style={styles.iconBarButton}
            >
              <Smile size={22} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickImage}
              style={styles.iconBarButton}
            >
              <Camera size={22} color="#a1a1aa" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePickDocument}
              style={styles.iconBarButton}
            >
              <Paperclip size={22} color="#a1a1aa" />
            </TouchableOpacity>

            <TextInput
              placeholder={
                uploading ? "Uploading file..." : "Type a message..."
              }
              placeholderTextColor="#71717a"
              value={messageText}
              onChangeText={setMessageText}
              editable={!uploading}
              style={styles.textInput}
            />

            <TouchableOpacity
              onPress={() => handleSendSubmit()}
              disabled={
                uploading || (!messageText.trim() && attachedUrls.length === 0)
              }
              style={[
                styles.sendButton,
                (uploading ||
                  (!messageText.trim() && attachedUrls.length === 0)) &&
                  styles.sendButtonDisabled,
              ]}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    height: "82%",
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#18181b",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34d399",
  },
  verifiedText: { color: "#34d399", fontSize: 11 },
  closeButton: { padding: 8, borderRadius: 12 },

  messagesList: { padding: 20, gap: 16 },
  messageRow: { maxWidth: "100%" },
  messageRowRight: { alignItems: "flex-end" },
  messageRowLeft: { alignItems: "flex-start" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
  },
  bubbleMe: { backgroundColor: VIOLET, borderTopRightRadius: 4 },
  bubbleThem: {
    backgroundColor: "#27272a",
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bubbleDeleted: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
  },
  bubbleText: { color: "#fff", fontSize: 15, lineHeight: 21 },
  bubbleTextDeleted: { color: "#71717a", fontStyle: "italic", fontSize: 14 },
  editedLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    marginTop: 4,
    textAlign: "right",
  },

  editRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  editInput: {
    flex: 1,
    color: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    paddingVertical: 2,
  },

  attachmentImage: { width: 220, height: 160, borderRadius: 16, marginTop: 10 },
  attachmentFileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 12,
    borderRadius: 16,
    marginTop: 10,
  },
  attachmentFileText: { color: "#e4e4e7", fontSize: 13, flexShrink: 1 },

  actionRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 4,
  },
  actionButton: { padding: 10, borderRadius: 12 },

  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    padding: 12,
    backgroundColor: "#18181b",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  emojiButton: { padding: 8, borderRadius: 10 },
  emojiText: { fontSize: 22 },

  attachmentPreviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  attachmentPreviewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#27272a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attachmentPreviewImage: { width: 24, height: 24, borderRadius: 6 },
  attachmentPreviewText: { color: "#d4d4d8", fontSize: 11 },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#18181b",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    padding: 12,
  },
  iconBarButton: { padding: 10, borderRadius: 12 },
  textInput: {
    flex: 1,
    color: "#f4f4f5",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: { backgroundColor: VIOLET, padding: 12, borderRadius: 14 },
  sendButtonDisabled: { backgroundColor: "#3f3f46" },
});
