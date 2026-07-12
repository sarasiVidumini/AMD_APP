import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link } from "expo-router";
import {
    ArrowRight,
    Award,
    BookOpen,
    Brain,
    Calendar,
    CheckCircle2,
    ChevronLeft,
    ClipboardList,
    Clock,
    Download,
    ExternalLink,
    FileText,
    HelpCircle,
    Layers3,
    MessageSquare,
    NotebookText,
    Search,
    Timer,
    User,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import PrivateChatModal from "../../components/privateChatModal";
import API from "../lib/api";
import type { Note, NoteDocType } from "../types";

interface QuizQuestion {
  q: string;
  a: string[];
  correct: number;
}

interface StudentRequest {
  _id: string;
  title: string;
  subject: string;
  semester: number;
  description: string;
  status: "open" | "fulfilled";
  fulfilledBy?: { _id: string; name: string };
  fulfilledNote?: { _id: string; title: string; files: string[] };
}

// Subject map: each semester lists its subject codes + full names.
// Edit this list if your curriculum changes — nothing else needs touching.
const SEMESTER_SUBJECTS: Record<number, { code: string; name: string }[]> = {
  1: [
    { code: "PRF", name: "Programming Fundamentals" },
    { code: "DBMS", name: "Database Management Systems" },
    { code: "OOP", name: "Object Oriented Programming" },
    { code: "SE", name: "Software Engineering" },
  ],
  2: [
    { code: "ORM", name: "Object Relational Mapping" },
    { code: "NP", name: "Network Programming" },
    { code: "IT", name: "Internet Technology" },
    { code: "CNS", name: "Cryptography & Network Security" },
    { code: "AAD", name: "Algorithm Analysis & Design" },
  ],
  3: [
    { code: "AD2", name: "Application Development II" },
    { code: "PY", name: "Python" },
    { code: "RAD", name: "Rapid Application Development" },
    { code: "AMD", name: "Advanced Mobile Development" },
  ],
  4: [
    { code: "PM", name: "Project Management" },
    { code: "ML", name: "Machine Learning" },
  ],
};

const SEMESTERS = [1, 2, 3, 4];

type UploaderSource = "student" | "expert";

type ViewState =
  | { level: "source" }
  | { level: "semesters"; source: UploaderSource }
  | { level: "subjects"; source: UploaderSource; semester: number }
  | {
      level: "subject-detail";
      source: UploaderSource;
      semester: number;
      code: string;
      name: string;
    };

const isExpertUploader = (note: Note) =>
  note.uploadedBy?.role === "expert" || note.uploadedBy?.role === "admin";

const DEPTH_LABELS = ["Source", "Semester", "Subject", "Archive"];

const AMBER = "#f59e0b";
const CYAN = "#22d3ee";
const EMERALD = "#34d399";
const ROSE = "#f43f5e";

export default function Dashboard() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [view, setView] = useState<ViewState>({ level: "source" });
  const [activeTab, setActiveTab] = useState<NoteDocType>("note");

  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [studyMode, setStudyMode] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const [activeChatUser, setActiveChatUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, number>
  >({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    fetchNotes();
    fetchStudentRequests();
    AsyncStorage.getItem("userId").then((id) => setCurrentUserId(id || ""));
    return () => stopTimer();
  }, []);

  useEffect(() => {
    if (
      studyMode &&
      quizScore === null &&
      timeLeft === 0 &&
      quizQuestions.length > 0
    ) {
      evaluateQuiz(true);
    }
  }, [timeLeft, studyMode, quizScore]);

  const startTimer = (seconds: number) => {
    stopTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await API.get("/notes");
      setNotes(res.data || []);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to load repository notes data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await API.get("/requests");
      setRequests(res.data || []);
    } catch (error) {
      console.error("Failed to fetch student requests ecosystem map.");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleSearchSubmit = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/notes?search=${search}`);
      setNotes(res.data || []);
    } catch (error) {
      Toast.show({ type: "error", text1: "Search tracking request failed." });
    } finally {
      setLoading(false);
    }
  };

  const launchAiStudyMode = async (note: Note) => {
    setGeneratingQuiz(true);
    setStudyMode(false);
    Toast.show({
      type: "info",
      text1: "Analyzing notes & prompting Gemini AI...",
    });

    try {
      const res = await API.post(
        "/notes/generate-quiz",
        {
          title: note.title,
          subject: note.subject,
          description: note.description,
        },
        { timeout: 30000 },
      );

      if (res.data?.quiz && Array.isArray(res.data.quiz)) {
        setQuizQuestions(res.data.quiz);
        setSelectedAnswers({});
        setQuizScore(null);
        setStudyMode(true);
        startTimer(60);
        Toast.show({
          type: "success",
          text1: "AI Assessment generated successfully!",
        });
      } else {
        throw new Error("Malformed payload signature returned from generator.");
      }
    } catch (error: any) {
      const systemErrorMessage =
        error.response?.data?.message ||
        "AI Engine busy. Please try spinning it up again.";
      Toast.show({ type: "error", text1: systemErrorMessage });
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const evaluateQuiz = (isTimeout = false) => {
    stopTimer();
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) score++;
    });

    setQuizScore(score);

    if (isTimeout) {
      Toast.show({
        type: "error",
        text1: "Time Expired!",
        text2: `Your answers were auto-submitted. You scored ${score}/${quizQuestions.length}.`,
      });
    } else {
      const percentage = (score / quizQuestions.length) * 100;
      Toast.show({
        type: "success",
        text1: "Quiz Evaluated!",
        text2: `You scored ${score} / ${quizQuestions.length} (${percentage.toFixed(0)}%).`,
      });
    }
  };

  const formatDateTimeStamp = (isoString?: string) => {
    if (!isoString) return { date: "N/A", time: "N/A" };
    const dateObj = new Date(isoString);
    return {
      date: dateObj.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      time: dateObj.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const semesterCounts = (source: UploaderSource) => {
    const counts: Record<number, number> = {};
    SEMESTERS.forEach((sem) => {
      counts[sem] = notes.filter(
        (n) =>
          n.semester === sem &&
          (source === "expert" ? isExpertUploader(n) : !isExpertUploader(n)),
      ).length;
    });
    return counts;
  };

  const subjectCounts = (semester: number, source: UploaderSource) => {
    const counts: Record<string, { notes: number; papers: number }> = {};
    notes
      .filter(
        (n) =>
          n.semester === semester &&
          (source === "expert" ? isExpertUploader(n) : !isExpertUploader(n)),
      )
      .forEach((n) => {
        const code = (n.subjectCode || "").toUpperCase();
        if (!counts[code]) counts[code] = { notes: 0, papers: 0 };
        if (n.docType === "paper") counts[code].papers++;
        else counts[code].notes++;
      });
    return counts;
  };

  const getFilteredDocs = (
    semester: number,
    code: string,
    docType: NoteDocType,
    source: UploaderSource,
  ) => {
    return notes.filter(
      (n) =>
        n.semester === semester &&
        (n.subjectCode || "").toUpperCase() === code.toUpperCase() &&
        n.docType === docType &&
        (source === "expert" ? isExpertUploader(n) : !isExpertUploader(n)),
    );
  };

  const depthIndex =
    view.level === "source"
      ? 0
      : view.level === "semesters"
        ? 1
        : view.level === "subjects"
          ? 2
          : 3;

  const jumpToDepth = (i: number) => {
    if (view.level === "source") return;
    if (i === 0) setView({ level: "source" });
    else if (i === 1) setView({ level: "semesters", source: view.source });
    else if (
      i === 2 &&
      (view.level === "subjects" || view.level === "subject-detail")
    ) {
      setView({
        level: "subjects",
        source: view.source,
        semester: view.semester,
      });
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <View style={styles.bannerDot} />
            <Text style={styles.bannerBadgeText}>ACADEMIC VAULT</Text>
          </View>
          <Text style={styles.bannerTitle}>Knowledge Vault</Text>
          <Text style={styles.bannerSubtitle}>
            Descend through semesters and subjects to surface notes, papers, and
            AI-generated revision quizzes.
          </Text>

          <Link href="/studentExperts" asChild>
            <TouchableOpacity style={styles.expertsLinkCard}>
              <View style={styles.expertsIconBox}>
                <Award size={20} color={AMBER} />
              </View>
              <View style={styles.flex1}>
                <View style={styles.rowGap}>
                  <Text style={styles.expertsLinkTitle}>Consult Experts</Text>
                  <ArrowRight size={13} color={AMBER} />
                </View>
                <Text style={styles.expertsLinkSubtitle}>
                  Open real-world secure chats
                </Text>
              </View>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Search bar */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputWrap}>
            <View style={styles.searchIcon}>
              <Search size={16} color="#71717a" />
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              placeholder="Search subjects, topics, or notes..."
              placeholderTextColor="#52525b"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          {view.level !== "source" && (
            <TouchableOpacity
              onPress={() => {
                if (view.level === "subject-detail")
                  setView({
                    level: "subjects",
                    source: view.source,
                    semester: view.semester,
                  });
                else if (view.level === "subjects")
                  setView({ level: "semesters", source: view.source });
                else setView({ level: "source" });
              }}
              style={styles.backButton}
            >
              <ChevronLeft size={16} color="#d4d4d8" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Depth gauge */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.depthGauge}
        >
          {DEPTH_LABELS.map((label, i) => {
            const isActive = i === depthIndex;
            const isPassed = i < depthIndex;
            const isClickable = i <= depthIndex && view.level !== "source";
            const accent =
              view.level !== "source" && view.source === "expert"
                ? CYAN
                : AMBER;

            let liveLabel = label;
            if (i === 1 && view.level !== "source")
              liveLabel = view.source === "expert" ? "Expert" : "Student";
            if (
              i === 2 &&
              (view.level === "subjects" || view.level === "subject-detail")
            )
              liveLabel = `Sem ${view.semester}`;
            if (i === 3 && view.level === "subject-detail")
              liveLabel = view.code;

            return (
              <React.Fragment key={label}>
                <TouchableOpacity
                  disabled={!isClickable}
                  onPress={() => jumpToDepth(i)}
                  style={[
                    styles.depthPill,
                    isActive && {
                      backgroundColor: `${accent}22`,
                      borderColor: `${accent}66`,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.depthDot,
                      {
                        backgroundColor: isActive
                          ? accent
                          : isPassed
                            ? "#71717a"
                            : "#3f3f46",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.depthPillText,
                      isActive && { color: accent },
                      isPassed && !isActive && { color: "#d4d4d8" },
                    ]}
                  >
                    {liveLabel}
                  </Text>
                </TouchableOpacity>
                {i < DEPTH_LABELS.length - 1 && (
                  <View
                    style={[
                      styles.depthLine,
                      i < depthIndex && { backgroundColor: accent },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* LEVEL 0: Source selection */}
        {view.level === "source" && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Layers3 color="#71717a" size={18} />
              <Text style={styles.sectionTitle}>Select Upload Source</Text>
            </View>

            <TouchableOpacity
              onPress={() => setView({ level: "semesters", source: "student" })}
              style={[
                styles.sourceCard,
                { borderColor: "rgba(245,158,11,0.15)" },
              ]}
            >
              <View
                style={[
                  styles.sourceIconBox,
                  { backgroundColor: "rgba(245,158,11,0.1)" },
                ]}
              >
                <User size={20} color={AMBER} />
              </View>
              <Text style={styles.sourceTitle}>Student Uploads</Text>
              <Text style={styles.sourceSubtitle}>
                Notes and papers shared by fellow students.
              </Text>
              <View style={styles.sourceFooterRow}>
                <View
                  style={[
                    styles.docCountPill,
                    {
                      backgroundColor: "rgba(245,158,11,0.1)",
                      borderColor: "rgba(245,158,11,0.2)",
                    },
                  ]}
                >
                  <Text
                    style={{ color: AMBER, fontSize: 10, fontWeight: "700" }}
                  >
                    {loading
                      ? "..."
                      : `${notes.filter((n) => !isExpertUploader(n)).length} DOCS`}
                  </Text>
                </View>
                <ArrowRight size={16} color={AMBER} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setView({ level: "semesters", source: "expert" })}
              style={[
                styles.sourceCard,
                { borderColor: "rgba(34,211,238,0.15)" },
              ]}
            >
              <View
                style={[
                  styles.sourceIconBox,
                  { backgroundColor: "rgba(34,211,238,0.1)" },
                ]}
              >
                <Award size={20} color={CYAN} />
              </View>
              <Text style={styles.sourceTitle}>Expert Uploads</Text>
              <Text style={styles.sourceSubtitle}>
                Authoritative notes and papers from experts and admins.
              </Text>
              <View style={styles.sourceFooterRow}>
                <View
                  style={[
                    styles.docCountPill,
                    {
                      backgroundColor: "rgba(34,211,238,0.1)",
                      borderColor: "rgba(34,211,238,0.2)",
                    },
                  ]}
                >
                  <Text
                    style={{ color: CYAN, fontSize: 10, fontWeight: "700" }}
                  >
                    {loading
                      ? "..."
                      : `${notes.filter((n) => isExpertUploader(n)).length} DOCS`}
                  </Text>
                </View>
                <ArrowRight size={16} color={CYAN} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* LEVEL 1: Semesters */}
        {view.level === "semesters" && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Layers3
                color={view.source === "expert" ? CYAN : AMBER}
                size={18}
              />
              <Text style={styles.sectionTitle}>
                {view.source === "expert"
                  ? "Expert Uploads"
                  : "Student Uploads"}
              </Text>
            </View>
            <Text style={styles.sectionSubtitle}>Select a semester</Text>

            {SEMESTERS.map((sem) => {
              const accent = view.source === "expert" ? CYAN : AMBER;
              return (
                <TouchableOpacity
                  key={sem}
                  onPress={() =>
                    setView({
                      level: "subjects",
                      source: view.source,
                      semester: sem,
                    })
                  }
                  style={[styles.semesterCard, { borderColor: `${accent}22` }]}
                >
                  <View
                    style={[
                      styles.sourceIconBox,
                      { backgroundColor: `${accent}1A` },
                    ]}
                  >
                    <Layers3 size={20} color={accent} />
                  </View>
                  <Text style={styles.sourceTitle}>Semester {sem}</Text>
                  <Text style={styles.sourceSubtitle}>
                    {SEMESTER_SUBJECTS[sem].length} subjects
                  </Text>
                  <View style={styles.sourceFooterRow}>
                    <View
                      style={[
                        styles.docCountPill,
                        {
                          backgroundColor: `${accent}1A`,
                          borderColor: `${accent}33`,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: accent,
                          fontSize: 10,
                          fontWeight: "700",
                        }}
                      >
                        {loading
                          ? "..."
                          : `${semesterCounts(view.source)[sem] || 0} DOCS`}
                      </Text>
                    </View>
                    <ArrowRight size={16} color={accent} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* LEVEL 2: Subjects */}
        {view.level === "subjects" && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <BookOpen
                color={view.source === "expert" ? CYAN : AMBER}
                size={18}
              />
              <Text style={styles.sectionTitle}>
                Semester {view.semester} Subjects
              </Text>
            </View>

            {SEMESTER_SUBJECTS[view.semester].map((subj) => {
              const counts = subjectCounts(view.semester, view.source)[
                subj.code
              ] || { notes: 0, papers: 0 };
              const total = counts.notes + counts.papers;
              const accent = view.source === "expert" ? CYAN : AMBER;
              return (
                <TouchableOpacity
                  key={subj.code}
                  onPress={() =>
                    setView({
                      level: "subject-detail",
                      source: view.source,
                      semester: view.semester,
                      code: subj.code,
                      name: subj.name,
                    })
                  }
                  style={[styles.subjectCard, { borderColor: `${accent}22` }]}
                >
                  <View
                    style={[
                      styles.subjectCodeBadge,
                      { borderColor: `${accent}44` },
                    ]}
                  >
                    <Text
                      style={{ color: accent, fontSize: 11, fontWeight: "800" }}
                    >
                      {subj.code}
                    </Text>
                  </View>
                  <Text style={styles.subjectName}>{subj.name}</Text>
                  <View style={styles.rowGap}>
                    {loading ? (
                      <Text style={styles.mutedText}>...</Text>
                    ) : (
                      <>
                        <View style={styles.rowGapSmall}>
                          <NotebookText size={12} color={AMBER} />
                          <Text style={styles.mutedText}>{counts.notes}</Text>
                        </View>
                        <View style={styles.rowGapSmall}>
                          <FileText size={12} color={CYAN} />
                          <Text style={styles.mutedText}>{counts.papers}</Text>
                        </View>
                        {total === 0 && (
                          <Text style={styles.emptyItalic}>empty</Text>
                        )}
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* LEVEL 3: Subject detail */}
        {view.level === "subject-detail" && (
          <View style={styles.section}>
            <View
              style={[
                styles.subjectCodeBadge,
                {
                  alignSelf: "flex-start",
                  borderColor:
                    view.source === "expert" ? `${CYAN}44` : `${AMBER}44`,
                },
              ]}
            >
              <Text
                style={{
                  color: view.source === "expert" ? CYAN : AMBER,
                  fontSize: 11,
                  fontWeight: "800",
                }}
              >
                {view.code} · SEM {view.semester}
              </Text>
            </View>
            <Text style={styles.sectionTitle}>{view.name}</Text>

            <View style={styles.tabsRow}>
              <TouchableOpacity
                onPress={() => setActiveTab("note")}
                style={[
                  styles.tabChip,
                  activeTab === "note" && { backgroundColor: AMBER },
                ]}
              >
                <NotebookText
                  size={13}
                  color={activeTab === "note" ? "#000" : "#71717a"}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === "note" && { color: "#000" },
                  ]}
                >
                  Notes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab("paper")}
                style={[
                  styles.tabChip,
                  activeTab === "paper" && { backgroundColor: CYAN },
                ]}
              >
                <FileText
                  size={13}
                  color={activeTab === "paper" ? "#000" : "#71717a"}
                />
                <Text
                  style={[
                    styles.tabChipText,
                    activeTab === "paper" && { color: "#000" },
                  ]}
                >
                  Papers
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={AMBER} style={{ marginTop: 20 }} />
            ) : getFilteredDocs(
                view.semester,
                view.code,
                activeTab,
                view.source,
              ).length === 0 ? (
              <View style={styles.emptyDocsBox}>
                {activeTab === "note" ? (
                  <NotebookText size={26} color="#3f3f46" />
                ) : (
                  <FileText size={26} color="#3f3f46" />
                )}
                <Text style={styles.emptyDocsTitle}>
                  No {activeTab === "note" ? "notes" : "papers"} yet
                </Text>
                <Text style={styles.emptyDocsSubtitle}>
                  {activeTab === "paper"
                    ? "Papers are posted by experts and admins."
                    : "Be the first to upload notes for this subject."}
                </Text>
              </View>
            ) : (
              getFilteredDocs(
                view.semester,
                view.code,
                activeTab,
                view.source,
              ).map((note) => {
                const meta = formatDateTimeStamp(note.createdAt);
                const isExpertUpload =
                  note.uploadedBy?.role === "expert" ||
                  note.uploadedBy?.role === "admin";
                const isSelected = activeNote?._id === note._id;
                return (
                  <TouchableOpacity
                    key={note._id}
                    onPress={() => {
                      if (!generatingQuiz) {
                        setActiveNote(note);
                        setStudyMode(false);
                      }
                    }}
                    style={[
                      styles.docCard,
                      isSelected && {
                        borderColor:
                          activeTab === "paper" ? `${CYAN}80` : `${AMBER}80`,
                        backgroundColor:
                          activeTab === "paper"
                            ? "rgba(34,211,238,0.04)"
                            : "rgba(245,158,11,0.04)",
                      },
                    ]}
                  >
                    <View style={styles.docCardTop}>
                      <View style={styles.flex1}>
                        <Text style={styles.docTitle} numberOfLines={1}>
                          {note.title}
                        </Text>
                        {!!note.description && (
                          <Text style={styles.docDescription} numberOfLines={1}>
                            {note.description}
                          </Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.docTypeBadge,
                          {
                            backgroundColor:
                              activeTab === "paper"
                                ? "rgba(34,211,238,0.1)"
                                : "rgba(245,158,11,0.1)",
                            borderColor:
                              activeTab === "paper"
                                ? "rgba(34,211,238,0.2)"
                                : "rgba(245,158,11,0.2)",
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: activeTab === "paper" ? CYAN : AMBER,
                            fontSize: 9,
                            fontWeight: "800",
                            textTransform: "uppercase",
                          }}
                        >
                          {activeTab}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.docMetaRow}>
                      <View style={styles.rowGapSmall}>
                        <User size={11} color={isExpertUpload ? CYAN : AMBER} />
                        <Text style={styles.docMetaText}>
                          {note.uploadedBy?.name ||
                            (isExpertUpload ? "Specialist" : "Peer Student")}
                        </Text>
                      </View>
                      <View style={styles.rowGapSmall}>
                        <Calendar size={11} color="#71717a" />
                        <Text style={styles.docMetaText}>{meta.date}</Text>
                      </View>
                      <View style={styles.rowGapSmall}>
                        <Clock size={11} color="#71717a" />
                        <Text style={styles.docMetaText}>{meta.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Requests tracking */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <ClipboardList color="#71717a" size={18} />
            <Text style={styles.sectionTitle}>Your Requests Tracking</Text>
          </View>

          {requestsLoading ? (
            <ActivityIndicator color={AMBER} />
          ) : requests.length === 0 ? (
            <Text style={styles.emptyInline}>
              No active requests logged in your tracking history.
            </Text>
          ) : (
            requests.map((req) => {
              const isFulfilled = req.status === "fulfilled";
              return (
                <View
                  key={req._id}
                  style={[
                    styles.requestCard,
                    isFulfilled && {
                      borderColor: "rgba(52,211,153,0.25)",
                      backgroundColor: "rgba(52,211,153,0.03)",
                    },
                  ]}
                >
                  <View style={styles.requestTopRow}>
                    <View style={styles.semBadge}>
                      <Text style={styles.semBadgeText}>
                        SEM {req.semester}
                      </Text>
                    </View>
                    {isFulfilled ? (
                      <View style={styles.fulfilledBadge}>
                        <CheckCircle2 size={11} color={EMERALD} />
                        <Text
                          style={{
                            color: EMERALD,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          Fulfilled
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text
                          style={{
                            color: AMBER,
                            fontSize: 10,
                            fontWeight: "700",
                          }}
                        >
                          Pending Help
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.requestTitle}>{req.title}</Text>
                  <Text style={styles.requestSubject}>{req.subject}</Text>
                  <Text style={styles.requestDescription} numberOfLines={2}>
                    {req.description}
                  </Text>

                  {isFulfilled && req.fulfilledNote && (
                    <TouchableOpacity
                      style={styles.fulfilledNoteRow}
                      onPress={() => {
                        const link = req.fulfilledNote?.files?.[0];
                        if (link) Linking.openURL(link);
                      }}
                    >
                      <View style={styles.rowGapSmall}>
                        <BookOpen size={16} color={EMERALD} />
                        <View>
                          <Text
                            style={styles.fulfilledNoteTitle}
                            numberOfLines={1}
                          >
                            {req.fulfilledNote.title}
                          </Text>
                          <Text style={styles.fulfilledNoteSubtitle}>
                            Uploaded by Specialist
                          </Text>
                        </View>
                      </View>
                      <ExternalLink size={13} color={EMERALD} />
                    </TouchableOpacity>
                  )}

                  {isFulfilled && req.fulfilledBy && (
                    <TouchableOpacity
                      onPress={() =>
                        setActiveChatUser({
                          id: req.fulfilledBy!._id,
                          name: req.fulfilledBy!.name,
                        })
                      }
                      style={styles.chatWithSpecialistButton}
                    >
                      <MessageSquare size={13} color="#000" />
                      <Text style={styles.chatWithSpecialistText}>
                        Chat with Specialist
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Active note panel */}
        <View style={styles.notePanel}>
          {activeNote ? (
            <>
              <View
                style={[
                  styles.subjectCodeBadge,
                  {
                    alignSelf: "flex-start",
                    borderColor:
                      activeNote.docType === "paper"
                        ? `${CYAN}44`
                        : `${AMBER}44`,
                  },
                ]}
              >
                <Text
                  style={{
                    color: activeNote.docType === "paper" ? CYAN : AMBER,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  Sem {activeNote.semester} · {activeNote.subjectCode}
                </Text>
              </View>
              <Text style={styles.activeNoteTitle}>{activeNote.title}</Text>
              <Text style={styles.activeNoteSubject}>{activeNote.subject}</Text>

              {!!activeNote.description && (
                <View style={styles.scopeBox}>
                  <Text style={styles.scopeLabel}>SCOPE DETAILS</Text>
                  <Text style={styles.scopeText}>{activeNote.description}</Text>
                </View>
              )}

              {activeNote.files?.map((link, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.downloadButton}
                  onPress={() => Linking.openURL(link)}
                >
                  <Download size={14} color="#e4e4e7" />
                  <Text style={styles.downloadButtonText}>
                    Download Document Attachment
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => launchAiStudyMode(activeNote)}
                disabled={generatingQuiz}
                style={[
                  styles.quizButton,
                  generatingQuiz && styles.buttonDisabled,
                ]}
              >
                <Brain size={14} color="#000" />
                <Text style={styles.quizButtonText}>
                  {generatingQuiz
                    ? "Generating Smart Exam..."
                    : "Launch Gemini Revision Quiz"}
                </Text>
              </TouchableOpacity>

              {studyMode && quizQuestions.length > 0 && (
                <View style={styles.quizPanel}>
                  <View style={styles.timerRow}>
                    <View style={styles.rowGapSmall}>
                      <Timer size={13} color={AMBER} />
                      <Text style={styles.timerLabel}>REVISION TIMER</Text>
                    </View>
                    <Text
                      style={[
                        styles.timerValue,
                        timeLeft <= 15 && {
                          color: ROSE,
                          backgroundColor: "rgba(244,63,94,0.15)",
                        },
                      ]}
                    >
                      {formatTime(timeLeft)}
                    </Text>
                  </View>

                  {quizQuestions.map((question, qIdx) => (
                    <View key={qIdx} style={styles.questionBlock}>
                      <View style={styles.questionHeaderRow}>
                        <HelpCircle size={13} color={AMBER} />
                        <Text style={styles.questionText}>
                          {qIdx + 1}. {question.q}
                        </Text>
                      </View>
                      {question.a.map((answer, aIdx) => {
                        const isSelected = selectedAnswers[qIdx] === aIdx;
                        const isCorrect = question.correct === aIdx;
                        const displayEvaluated = quizScore !== null;

                        let choiceStyle = styles.choiceDefault;
                        if (isSelected) choiceStyle = styles.choiceSelected;
                        if (displayEvaluated) {
                          if (isCorrect) choiceStyle = styles.choiceCorrect;
                          else if (isSelected) choiceStyle = styles.choiceWrong;
                        }

                        return (
                          <TouchableOpacity
                            key={aIdx}
                            disabled={displayEvaluated}
                            onPress={() =>
                              setSelectedAnswers((prev) => ({
                                ...prev,
                                [qIdx]: aIdx,
                              }))
                            }
                            style={[styles.choiceRow, choiceStyle]}
                          >
                            <View
                              style={[
                                styles.radioOuter,
                                isSelected && { borderColor: AMBER },
                              ]}
                            >
                              {isSelected && <View style={styles.radioInner} />}
                            </View>
                            <Text style={styles.choiceText}>{answer}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}

                  {quizScore === null ? (
                    <TouchableOpacity
                      onPress={() => evaluateQuiz(false)}
                      style={styles.submitButton}
                    >
                      <Text style={styles.submitButtonText}>
                        Submit Responses
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.scoreBox}>
                      <Text style={styles.scoreLabel}>
                        Your Assessment Target Score
                      </Text>
                      <Text style={styles.scoreValue}>
                        {quizScore}{" "}
                        <Text style={styles.scoreValueMax}>
                          / {quizQuestions.length}
                        </Text>
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setStudyMode(false);
                          setQuizQuestions([]);
                          setQuizScore(null);
                        }}
                        style={styles.resetButton}
                      >
                        <Text style={styles.resetButtonText}>
                          Reset Workspace
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View style={styles.noModuleBox}>
              <BookOpen size={24} color="#3f3f46" />
              <Text style={styles.noModuleTitle}>No Module Active</Text>
              <Text style={styles.noModuleSubtitle}>
                Select a note or paper from a subject to start.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {activeChatUser && (
        <PrivateChatModal
          userId={activeChatUser.id}
          recipientName={activeChatUser.name}
          onClose={() => setActiveChatUser(null)}
          currentUser={{ id: currentUserId }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  scrollContent: { paddingBottom: 60 },
  flex1: { flex: 1 },
  rowGap: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowGapSmall: { flexDirection: "row", alignItems: "center", gap: 4 },
  mutedText: { color: "#71717a", fontSize: 11 },
  emptyItalic: { color: "#3f3f46", fontSize: 11, fontStyle: "italic" },
  emptyInline: { color: "#3f3f46", fontSize: 12, paddingVertical: 16 },

  banner: {
    padding: 24,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    backgroundColor: "rgba(245,158,11,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  bannerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AMBER },
  bannerBadgeText: {
    color: AMBER,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  bannerTitle: {
    color: "#fafafa",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 12,
  },
  bannerSubtitle: {
    color: "#71717a",
    fontSize: 13,
    marginTop: 10,
    lineHeight: 19,
  },

  expertsLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },
  expertsIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(245,158,11,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  expertsLinkTitle: { color: "#f4f4f5", fontWeight: "700", fontSize: 14 },
  expertsLinkSubtitle: { color: "#71717a", fontSize: 11, marginTop: 2 },

  searchBarRow: { flexDirection: "row", gap: 10, padding: 16 },
  searchInputWrap: { flex: 1, justifyContent: "center" },
  searchIcon: { position: "absolute", left: 14, zIndex: 1 },
  searchInput: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingLeft: 40,
    paddingRight: 14,
    paddingVertical: 12,
    color: "#f4f4f5",
    fontSize: 13,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backButtonText: { color: "#d4d4d8", fontSize: 12, fontWeight: "700" },

  depthGauge: { paddingHorizontal: 16, marginBottom: 20 },
  depthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  depthDot: { width: 6, height: 6, borderRadius: 3 },
  depthPillText: {
    color: "#3f3f46",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  depthLine: {
    height: 1,
    width: 32,
    backgroundColor: "#27272a",
    marginHorizontal: 4,
    alignSelf: "center",
  },

  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: { color: "#f4f4f5", fontSize: 18, fontWeight: "800" },
  sectionSubtitle: { color: "#52525b", fontSize: 12, marginBottom: 16 },

  sourceCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginTop: 14,
  },
  sourceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  sourceTitle: { color: "#f4f4f5", fontSize: 16, fontWeight: "700" },
  sourceSubtitle: {
    color: "#71717a",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 17,
  },
  sourceFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  docCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  semesterCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },

  subjectCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  subjectCodeBadge: {
    backgroundColor: "#000",
    borderWidth: 1,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  subjectName: {
    color: "#f4f4f5",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },

  tabsRow: { flexDirection: "row", gap: 8, marginVertical: 16 },
  tabChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  tabChipText: { color: "#71717a", fontSize: 12, fontWeight: "700" },

  emptyDocsBox: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "#0a0a0c",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyDocsTitle: {
    color: "#a1a1aa",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  emptyDocsSubtitle: {
    color: "#3f3f46",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 30,
  },

  docCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
  },
  docCardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  docTitle: { color: "#e4e4e7", fontSize: 13, fontWeight: "700" },
  docDescription: { color: "#71717a", fontSize: 11, marginTop: 2 },
  docTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  docMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  docMetaText: { color: "#71717a", fontSize: 10.5 },

  requestCard: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
  },
  requestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  semBadge: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  semBadgeText: { color: "#71717a", fontSize: 9, fontWeight: "700" },
  fulfilledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(52,211,153,0.1)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadge: {
    backgroundColor: "rgba(245,158,11,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requestTitle: { color: "#f4f4f5", fontSize: 14, fontWeight: "700" },
  requestSubject: {
    color: CYAN,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    marginBottom: 6,
  },
  requestDescription: {
    color: "#71717a",
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
  },
  fulfilledNoteRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.15)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  fulfilledNoteTitle: { color: "#e4e4e7", fontSize: 11, fontWeight: "700" },
  fulfilledNoteSubtitle: { color: "#52525b", fontSize: 9 },
  chatWithSpecialistButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 12,
  },
  chatWithSpecialistText: { color: "#000", fontSize: 11, fontWeight: "700" },

  notePanel: {
    backgroundColor: "#0a0a0c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 22,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 8,
  },
  activeNoteTitle: {
    color: "#f4f4f5",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 8,
  },
  activeNoteSubject: {
    color: "#71717a",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  scopeBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  scopeLabel: {
    color: "#3f3f46",
    fontSize: 9.5,
    fontWeight: "800",
    marginBottom: 4,
  },
  scopeText: { color: "#a1a1aa", fontSize: 12, lineHeight: 18 },
  downloadButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  downloadButtonText: { color: "#e4e4e7", fontSize: 12, fontWeight: "700" },
  quizButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AMBER,
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 10,
  },
  quizButtonText: { color: "#000", fontSize: 12, fontWeight: "700" },
  buttonDisabled: { opacity: 0.4 },

  quizPanel: {
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 12,
  },
  timerLabel: { color: "#71717a", fontSize: 11, fontWeight: "700" },
  timerValue: {
    color: AMBER,
    fontSize: 14,
    fontWeight: "900",
    backgroundColor: "rgba(245,158,11,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },

  questionBlock: { marginTop: 18 },
  questionHeaderRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  questionText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
    lineHeight: 17,
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  choiceDefault: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  choiceSelected: {
    borderColor: "rgba(245,158,11,0.5)",
    backgroundColor: "rgba(245,158,11,0.06)",
  },
  choiceCorrect: {
    borderColor: "rgba(52,211,153,0.6)",
    backgroundColor: "rgba(52,211,153,0.1)",
  },
  choiceWrong: {
    borderColor: "rgba(244,63,94,0.6)",
    backgroundColor: "rgba(244,63,94,0.1)",
  },
  choiceText: { color: "#d4d4d8", fontSize: 11.5, flex: 1 },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#52525b",
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER },

  submitButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 14,
  },
  submitButtonText: { color: "#000", fontWeight: "700", fontSize: 12 },
  scoreBox: {
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 14,
  },
  scoreLabel: { color: "#71717a", fontSize: 11, fontWeight: "600" },
  scoreValue: { color: AMBER, fontSize: 26, fontWeight: "900", marginTop: 4 },
  scoreValueMax: { color: "#3f3f46", fontSize: 13, fontWeight: "400" },
  resetButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "#0a0a0c",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  resetButtonText: { color: "#d4d4d8", fontSize: 11, fontWeight: "700" },

  noModuleBox: { alignItems: "center", paddingVertical: 40 },
  noModuleTitle: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 10,
  },
  noModuleSubtitle: {
    color: "#3f3f46",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 30,
  },
});
