import {
    BookOpen,
    Download,
    Edit2,
    FileText,
    NotebookText,
    Star,
    Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import API from "../app/lib/api";
import { Note } from "../app/types";

interface NoteCardProps {
  note: Note;
  onUpdate?: () => void;
  showActions?: boolean;
}

const AMBER = "#f59e0b";
const YELLOW = "#eab308";

export default function NoteCard({
  note,
  onUpdate,
  showActions = false,
}: NoteCardProps) {
  const [deleting, setDeleting] = useState(false);
  const isPaper = note.docType === "paper";

  const handleDownload = (fileUrl: string) => {
    if (fileUrl) {
      Linking.openURL(fileUrl);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete this note?",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await API.delete(`/notes/${note._id}`);
              Toast.show({
                type: "success",
                text1: "Note deleted successfully",
              });
              onUpdate?.();
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: error.response?.data?.message || "Failed to delete note",
              });
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View
          style={[styles.badge, isPaper ? styles.badgePaper : styles.badgeNote]}
        >
          {isPaper ? (
            <FileText size={12} color={AMBER} />
          ) : (
            <NotebookText size={12} color={YELLOW} />
          )}
          <Text style={[styles.badgeText, { color: isPaper ? AMBER : YELLOW }]}>
            {isPaper ? "Research Paper" : "Lecture Note"}
          </Text>
        </View>

        <View style={styles.headerCenter}>
          <View style={styles.iconCircle}>
            <BookOpen size={32} color={AMBER} />
          </View>
          <Text style={styles.headerMeta}>
            SEM 0{note.semester} · {note.subjectCode || "GEN-CORE"}
          </Text>
        </View>

        {showActions && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={() =>
                Toast.show({
                  type: "info",
                  text1: "Edit functionality coming soon!",
                })
              }
              style={styles.actionButton}
            >
              <Edit2 size={15} color="#a1a1aa" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleting}
              style={styles.actionButton}
            >
              <Trash2 size={15} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.subject}>{note.subject}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {note.title}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            By{" "}
            <Text style={styles.metaStrong}>
              {note.uploadedBy?.name || "Academic Vault"}
            </Text>
          </Text>
          <Text style={styles.metaDate}>
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.ratingGroup}>
            <Star size={14} color={AMBER} fill={AMBER} />
            <Text style={styles.ratingText}>
              {note.averageRating?.toFixed(1) || "4.8"}
            </Text>
          </View>
          <Text style={styles.downloadsText}>
            <Text style={styles.downloadsCount}>{note.downloads || 0}</Text>{" "}
            system downloads
          </Text>
        </View>

        <View style={styles.buttonsColumn}>
          {note.files && note.files.length > 0 ? (
            note.files.map((file, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleDownload(file)}
                style={styles.downloadButton}
              >
                <Download size={16} color="#d4d4d8" />
                <Text style={styles.downloadButtonText}>
                  DOWNLOAD TERMINAL {note.files.length > 1 ? `#0${i + 1}` : ""}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity
              disabled
              onPress={() =>
                Toast.show({
                  type: "info",
                  text1: "📭 No files attached to this note",
                })
              }
              style={styles.noFilesButton}
            >
              <Text style={styles.noFilesText}>NO ATTACHMENTS RECOVERED</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#171717",
    borderWidth: 1,
    borderColor: "#262626",
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    height: 190,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgePaper: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.3)",
  },
  badgeNote: {
    backgroundColor: "rgba(234,179,8,0.1)",
    borderColor: "rgba(234,179,8,0.2)",
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  headerCenter: { alignItems: "center" },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderWidth: 1,
    borderColor: "#262626",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerMeta: {
    color: "#737373",
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  actionsRow: {
    position: "absolute",
    top: 14,
    right: 14,
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#262626",
    padding: 10,
    borderRadius: 12,
  },

  body: { padding: 20, backgroundColor: "rgba(23,23,23,0.4)" },
  subject: {
    color: AMBER,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 24 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(38,38,38,0.6)",
  },
  metaText: { color: "#737373", fontSize: 11, flexShrink: 1, maxWidth: "60%" },
  metaStrong: { color: "#d4d4d4", fontWeight: "600" },
  metaDate: { color: "#525252", fontSize: 10.5, fontFamily: "monospace" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(10,10,10,0.4)",
    borderWidth: 1,
    borderColor: "rgba(38,38,38,0.4)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 16,
    marginBottom: 18,
  },
  ratingGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingText: { color: "#e5e5e5", fontWeight: "700", fontSize: 12 },
  downloadsText: { color: "#737373", fontSize: 10.5 },
  downloadsCount: { color: "#d4d4d4", fontWeight: "600" },

  buttonsColumn: { gap: 8 },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#262626",
    paddingVertical: 13,
    borderRadius: 12,
  },
  downloadButtonText: {
    color: "#d4d4d4",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  noFilesButton: {
    paddingVertical: 13,
    backgroundColor: "rgba(10,10,10,0.4)",
    borderWidth: 1,
    borderColor: "rgba(38,38,38,0.4)",
    borderRadius: 12,
    alignItems: "center",
  },
  noFilesText: { color: "#525252", fontSize: 11, fontWeight: "700" },
});
