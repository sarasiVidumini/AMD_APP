import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import {
  Brain, Sparkles, Zap,
  Calendar, ChevronRight, RotateCcw, Copy,
  CheckCheck,
  FileText, Lightbulb, ClipboardList, CreditCard,
  Clock, ArrowLeft, Send,
} from 'lucide-react-native';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type ToolId = 'summarizer' | 'explainer' | 'quiz' | 'flashcards' | 'planner';

interface QuizQuestion { q: string; options: string[]; correct: number; }
interface Flashcard { front: string; back: string; }
interface PlanBlock { time: string; task: string; tip: string; }

interface ToolResult {
  summarizer?: { headline: string; keyPoints: string[]; gaps: string[] };
  explainer?: { simple: string; deep: string[] };
  quiz?: QuizQuestion[];
  flashcards?: Flashcard[];
  planner?: { topic: string; totalTime: string; blocks: PlanBlock[] };
}

const AMBER = '#f59e0b';
const VIOLET = '#8b5cf6';
const CYAN = '#22d3ee';
const EMERALD = '#34d399';
const ROSE = '#f43f5e';

// ─── Waveform ambient animation (react-native-svg version) ─────────────────
function Waveform({ active }: { active: boolean }) {
  const bars = 20;
  return (
    <Svg width={90} height={24} viewBox={`0 0 ${bars * 5} 24`}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = active ? 4 + Math.abs(Math.sin(i * 0.7)) * 16 : 2 + Math.abs(Math.sin(i * 0.4)) * 4;
        const y = (24 - h) / 2;
        return (
          <Rect key={i} x={i * 5} y={y} width={3} height={h} rx={1.5} fill={active ? AMBER : '#3f3f46'} />
        );
      })}
    </Svg>
  );
}

// ─── Flip Card ───────────────────────────────────────────────────────────────
function FlipCard({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const toggleFlip = () => {
    Animated.timing(anim, {
      toValue: flipped ? 0 : 180,
      duration: 400,
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  const frontInterpolate = anim.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backInterpolate = anim.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={toggleFlip} style={styles.flipCardContainer}>
      <Animated.View
        style={[styles.flipCardFace, styles.flipCardFront, { transform: [{ rotateY: frontInterpolate }] }]}
      >
        <Text style={styles.flipCardLabel}>Card {index + 1} · Front</Text>
        <Text style={styles.flipCardFrontText}>{card.front}</Text>
        <Text style={styles.flipCardHint}>tap to reveal →</Text>
      </Animated.View>
      <Animated.View
        style={[styles.flipCardFace, styles.flipCardBack, { transform: [{ rotateY: backInterpolate }] }]}
      >
        <Text style={styles.flipCardLabelAmber}>Answer</Text>
        <Text style={styles.flipCardBackText}>{card.back}</Text>
        <Text style={styles.flipCardHintAmber}>tap to flip back</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Quiz Player ─────────────────────────────────────────────────────────────
function QuizPlayer({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = submitted ? questions.filter((q, i) => answers[i] === q.correct).length : null;

  return (
    <View style={{ gap: 16 }}>
      {questions.map((q, qi) => (
        <View key={qi} style={styles.quizQuestionCard}>
          <Text style={styles.quizQuestionText}>
            <Text style={styles.quizQuestionNumber}>{qi + 1}. </Text>
            {q.q}
          </Text>
          <View style={{ gap: 6 }}>
            {q.options.map((opt, oi) => {
              const chosen = answers[qi] === oi;
              const correct = q.correct === oi;
              let optStyle = styles.quizOptionDefault;
              if (submitted) {
                if (correct) optStyle = styles.quizOptionCorrect;
                else if (chosen) optStyle = styles.quizOptionWrong;
              } else if (chosen) {
                optStyle = styles.quizOptionChosen;
              }
              return (
                <TouchableOpacity
                  key={oi}
                  disabled={submitted}
                  onPress={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                  style={[styles.quizOption, optStyle]}
                >
                  <Text style={styles.quizOptionLetter}>{String.fromCharCode(65 + oi)}.</Text>
                  <Text style={styles.quizOptionText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {!submitted ? (
        <TouchableOpacity
          onPress={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          style={[
            styles.submitQuizButton,
            Object.keys(answers).length < questions.length && styles.buttonDisabled,
          ]}
        >
          <Text style={styles.submitQuizButtonText}>Submit Quiz</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Final Score</Text>
          <Text style={styles.scoreValue}>
            {score}
            <Text style={styles.scoreValueMax}> / {questions.length}</Text>
          </Text>
          <Text style={styles.scorePercent}>{Math.round((score! / questions.length) * 100)}% correct</Text>
          <TouchableOpacity
            onPress={() => {
              setAnswers({});
              setSubmitted(false);
            }}
            style={styles.retryButton}
          >
            <RotateCcw size={11} color="#a1a1aa" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AiStudyMode() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState<ToolId>('summarizer');
  const [input, setInput] = useState('');
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'simple' | 'deep'>('simple');
  const [planHours, setPlanHours] = useState('2');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult>({});
  const [copied, setCopied] = useState(false);
  const [activeWave, setActiveWave] = useState(false);

  useEffect(() => {
    if (loading) {
      setActiveWave(true);
    } else {
      const t = setTimeout(() => setActiveWave(false), 800);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const callAI = async (tool: ToolId, payload: any) => {
    const res = await fetch(`${API_URL}/api/ai/study`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool, ...payload }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No details');
      throw new Error(`API Error: ${res.status} - ${errorText}`);
    }

    return await res.json();
  };

  const handleRun = async () => {
    if (loading) return;
    setLoading(true);
    setResult({});

    try {
      if (activeTool === 'summarizer') {
        const data = await callAI('summarizer', { text: input });
        setResult({ summarizer: data });
      } else if (activeTool === 'explainer') {
        const data = await callAI('explainer', { topic, depth });
        setResult({ explainer: data });
      } else if (activeTool === 'quiz') {
        const data = await callAI('quiz', { topic });
        setResult({ quiz: data });
      } else if (activeTool === 'flashcards') {
        const data = await callAI('flashcards', { text: input });
        setResult({ flashcards: data });
      } else if (activeTool === 'planner') {
        const data = await callAI('planner', { topic, hours: planHours });
        setResult({ planner: data });
      }
    } catch (e) {
      console.error('AI Request Failed:', e);
      Alert.alert('Request Failed', 'Failed to get response from AI. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    const text = JSON.stringify(result, null, 2);
    await Clipboard.setStringAsync(text);
    setCopied(true);
    Toast.show({ type: 'success', text1: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setInput('');
    setTopic('');
    setResult({});
  };

  const tools: { id: ToolId; label: string; Icon: any; desc: string; color: string }[] = [
    { id: 'summarizer', label: 'Summarizer', Icon: FileText, desc: 'Distil any text into key insights', color: 'amber' },
    { id: 'explainer', label: 'Explainer', Icon: Lightbulb, desc: 'Understand any concept, any depth', color: 'violet' },
    { id: 'quiz', label: 'Quiz Gen', Icon: ClipboardList, desc: 'Auto-build a 5-question MCQ test', color: 'cyan' },
    { id: 'flashcards', label: 'Flashcards', Icon: CreditCard, desc: 'Turn your notes into flip cards', color: 'emerald' },
    { id: 'planner', label: 'Planner', Icon: Calendar, desc: 'Build a time-boxed study schedule', color: 'rose' },
  ];

  const colorMap: Record<string, string> = {
    amber: AMBER,
    violet: VIOLET,
    cyan: CYAN,
    emerald: EMERALD,
    rose: ROSE,
  };

  const currentTool = tools.find((t) => t.id === activeTool)!;
  const c = colorMap[currentTool.color];

  const hasResult = Object.keys(result).length > 0;

  const canRun =
    !loading &&
    (activeTool === 'summarizer' || activeTool === 'flashcards' ? !!input.trim() : !!topic.trim());

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={15} color="#a1a1aa" />
          </TouchableOpacity>
          <View style={styles.headerBadge}>
            <Brain size={14} color={AMBER} />
          </View>
          <Text style={styles.headerTitle}>AI Study Mode</Text>
          <View style={styles.betaBadge}>
            <Text style={styles.betaBadgeText}>BETA</Text>
          </View>
        </View>
        <View style={styles.waveRow}>
          <Text style={[styles.waveLabel, activeWave && { color: AMBER }]}>
            {loading ? 'thinking...' : 'ready'}
          </Text>
          <Waveform active={activeWave} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero blurb */}
        <View style={styles.heroCard}>
          <Sparkles size={18} color={AMBER} />
          <Text style={styles.heroTitle}>Five AI tools. One study session.</Text>
          <Text style={styles.heroSubtitle}>
            Pick a mode, feed it your material, and let the model do the heavy lifting.
          </Text>
        </View>

        {/* Tool selector */}
        <View style={styles.toolList}>
          {tools.map((tool) => {
            const isActive = activeTool === tool.id;
            const tc = colorMap[tool.color];
            const Icon = tool.Icon;
            return (
              <TouchableOpacity
                key={tool.id}
                onPress={() => {
                  setActiveTool(tool.id);
                  setResult({});
                }}
                style={[
                  styles.toolButton,
                  isActive && { borderColor: `${tc}66`, backgroundColor: `${tc}1A` },
                ]}
              >
                <Icon size={16} color={isActive ? tc : '#52525b'} />
                <View style={styles.flex1}>
                  <Text style={[styles.toolLabel, isActive && { color: '#fff' }]}>{tool.label}</Text>
                  <Text style={styles.toolDesc} numberOfLines={1}>
                    {tool.desc}
                  </Text>
                </View>
                {isActive && <ChevronRight size={13} color={tc} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tool header */}
        <View style={[styles.toolHeader, { borderColor: `${c}44` }]}>
          <View style={styles.toolHeaderLeft}>
            <View style={[styles.toolHeaderIcon, { backgroundColor: `${c}1A`, borderColor: `${c}44` }]}>
              <currentTool.Icon size={18} color={c} />
            </View>
            <View>
              <Text style={styles.toolHeaderTitle}>{currentTool.label}</Text>
              <Text style={styles.toolHeaderDesc}>{currentTool.desc}</Text>
            </View>
          </View>
          {hasResult && (
            <View style={styles.toolHeaderActions}>
              <TouchableOpacity onPress={copyResult} style={styles.smallActionButton}>
                {copied ? <CheckCheck size={12} color={EMERALD} /> : <Copy size={12} color="#a1a1aa" />}
                <Text style={styles.smallActionText}>{copied ? 'Copied' : 'Copy'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={reset} style={styles.smallActionButton}>
                <RotateCcw size={12} color="#a1a1aa" />
                <Text style={styles.smallActionText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Input area */}
        <View style={styles.inputCard}>
          {activeTool === 'summarizer' && (
            <>
              <Text style={styles.fieldLabel}>Paste your text or notes</Text>
              <TextInput
                multiline
                numberOfLines={6}
                value={input}
                onChangeText={setInput}
                placeholder="Paste lecture notes, textbook passages, or any study material here..."
                placeholderTextColor="#3f3f46"
                style={[styles.textArea, { height: 130 }]}
              />
            </>
          )}

          {activeTool === 'explainer' && (
            <>
              <Text style={styles.fieldLabel}>Topic or concept</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Dijkstra's algorithm, photosynthesis..."
                placeholderTextColor="#3f3f46"
                style={styles.textInput}
              />
              <Text style={styles.fieldLabel}>Explanation depth</Text>
              <View style={styles.pillRow}>
                {(['simple', 'deep'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    onPress={() => setDepth(d)}
                    style={[styles.pillButton, depth === d && styles.pillButtonActiveViolet]}
                  >
                    <Text style={[styles.pillButtonText, depth === d && { color: VIOLET }]}>
                      {d === 'simple' ? '⚡ Simple' : '🔬 Deep Dive'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {activeTool === 'quiz' && (
            <>
              <Text style={styles.fieldLabel}>Topic for quiz</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Database normalisation, Newton's laws..."
                placeholderTextColor="#3f3f46"
                style={styles.textInput}
              />
            </>
          )}

          {activeTool === 'flashcards' && (
            <>
              <Text style={styles.fieldLabel}>Notes to convert</Text>
              <TextInput
                multiline
                numberOfLines={5}
                value={input}
                onChangeText={setInput}
                placeholder="Paste bullet points, definitions, or dense notes..."
                placeholderTextColor="#3f3f46"
                style={[styles.textArea, { height: 110 }]}
              />
            </>
          )}

          {activeTool === 'planner' && (
            <>
              <Text style={styles.fieldLabel}>What are you studying?</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Cryptography & Network Security for midterm..."
                placeholderTextColor="#3f3f46"
                style={styles.textInput}
              />
              <Text style={styles.fieldLabel}>Available hours</Text>
              <View style={styles.pillRow}>
                {['1', '2', '3', '4', '6'].map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setPlanHours(h)}
                    style={[styles.hourPill, planHours === h && styles.hourPillActive]}
                  >
                    <Text style={[styles.hourPillText, planHours === h && { color: ROSE }]}>{h}h</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <TouchableOpacity
            onPress={handleRun}
            disabled={!canRun}
            style={[styles.runButton, { backgroundColor: c }, !canRun && styles.buttonDisabled]}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.runButtonText}>Thinking...</Text>
              </>
            ) : (
              <>
                <Send size={14} color="#000" />
                <Text style={styles.runButtonText}>Run {currentTool.label}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Loading skeleton */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={AMBER} />
            <Text style={styles.loadingLabel}>Processing...</Text>
          </View>
        )}

        {/* Results */}
        {!loading && hasResult && (
          <View style={{ gap: 16 }}>
            {result.summarizer && (
              <View style={{ gap: 16 }}>
                <View style={[styles.resultCard, { borderColor: 'rgba(245,158,11,0.2)' }]}>
                  <Text style={styles.resultLabelAmber}>Main Idea</Text>
                  <Text style={styles.resultHeadline}>{result.summarizer.headline}</Text>
                </View>
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Key Points</Text>
                  {result.summarizer.keyPoints.map((pt, i) => (
                    <View key={i} style={styles.listRow}>
                      <Text style={styles.listNumber}>{String(i + 1).padStart(2, '0')}</Text>
                      <Text style={styles.listText}>{pt}</Text>
                    </View>
                  ))}
                </View>
                {result.summarizer.gaps.length > 0 && (
                  <View style={[styles.resultCard, { borderColor: 'rgba(139,92,246,0.15)' }]}>
                    <Text style={styles.resultLabelViolet}>Knowledge Gaps to Explore</Text>
                    {result.summarizer.gaps.map((g, i) => (
                      <View key={i} style={styles.listRowSmall}>
                        <Zap size={11} color={VIOLET} />
                        <Text style={styles.listTextSmall}>{g}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {result.explainer && (
              <View style={{ gap: 16 }}>
                <View style={[styles.resultCard, { borderColor: 'rgba(139,92,246,0.2)' }]}>
                  <Text style={styles.resultLabelViolet}>Plain Language</Text>
                  <Text style={styles.resultBodyText}>{result.explainer.simple}</Text>
                </View>
                {depth === 'deep' && (
                  <View style={styles.resultCard}>
                    <Text style={styles.resultLabel}>Deep Dive</Text>
                    {result.explainer.deep.map((pt, i) => (
                      <View key={i} style={styles.listRow}>
                        <Text style={styles.listLetter}>{String.fromCharCode(65 + i)}</Text>
                        <Text style={styles.listText}>{pt}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {result.quiz && <QuizPlayer questions={result.quiz} />}

            {result.flashcards && (
              <View>
                <View style={styles.flashcardsHeaderRow}>
                  <Text style={styles.fieldLabel}>{result.flashcards.length} Cards — tap to flip</Text>
                  <View style={styles.spacedRepBadge}>
                    <Text style={styles.spacedRepText}>Spaced Repetition Ready</Text>
                  </View>
                </View>
                <View style={styles.flashcardsGrid}>
                  {result.flashcards.map((card, i) => (
                    <FlipCard key={i} card={card} index={i} />
                  ))}
                </View>
              </View>
            )}

            {result.planner && (
              <View style={{ gap: 10 }}>
                <View style={[styles.resultCard, { borderColor: 'rgba(244,63,94,0.2)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View>
                    <Text style={styles.resultLabelRose}>Study Plan</Text>
                    <Text style={styles.plannerTopicText}>{result.planner.topic}</Text>
                  </View>
                  <View style={styles.plannerTimeBadge}>
                    <Clock size={13} color={ROSE} />
                    <Text style={styles.plannerTimeText}>{result.planner.totalTime}</Text>
                  </View>
                </View>
                {result.planner.blocks.map((block, i) => (
                  <View key={i} style={styles.plannerBlockCard}>
                    <View style={styles.plannerTimeChip}>
                      <Text style={styles.plannerTimeChipText}>{block.time}</Text>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.plannerTaskText}>{block.task}</Text>
                      <View style={styles.plannerTipRow}>
                        <Lightbulb size={10} color={ROSE} />
                        <Text style={styles.plannerTipText}>{block.tip}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Empty state */}
        {!loading && !hasResult && (
          <View style={styles.emptyState}>
            <Brain size={22} color="#3f3f46" />
            <Text style={styles.emptyTitle}>Ready when you are</Text>
            <Text style={styles.emptySubtitle}>
              Fill in the input above and hit Run to generate your study material.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050507' },
  scrollContent: { padding: 16, paddingBottom: 60, gap: 16 },
  flex1: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backButton: { padding: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  headerBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#f4f4f5', fontWeight: '900', fontSize: 13 },
  betaBadge: { backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  betaBadgeText: { color: VIOLET, fontSize: 8.5, fontWeight: '800' },
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waveLabel: { color: '#3f3f46', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },

  heroCard: { backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 20 },
  heroTitle: { color: '#f4f4f5', fontSize: 16, fontWeight: '900', marginTop: 10, lineHeight: 22 },
  heroSubtitle: { color: '#71717a', fontSize: 11, marginTop: 6, lineHeight: 16 },

  toolList: { gap: 8 },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: '#0a0a10',
  },
  toolLabel: { color: '#a1a1aa', fontSize: 12, fontWeight: '700' },
  toolDesc: { color: '#52525b', fontSize: 10, marginTop: 1 },

  toolHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a0a10', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14 },
  toolHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  toolHeaderIcon: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  toolHeaderTitle: { color: '#f4f4f5', fontSize: 13, fontWeight: '900' },
  toolHeaderDesc: { color: '#71717a', fontSize: 10.5, marginTop: 1 },
  toolHeaderActions: { flexDirection: 'row', gap: 8 },
  smallActionButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  smallActionText: { color: '#a1a1aa', fontSize: 10.5, fontWeight: '700' },

  inputCard: { backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, gap: 10 },
  fieldLabel: { color: '#71717a', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  textInput: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#e4e4e7', fontSize: 13 },
  textArea: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#e4e4e7', fontSize: 13, textAlignVertical: 'top' },

  pillRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pillButton: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#000', alignItems: 'center' },
  pillButtonActiveViolet: { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)' },
  pillButtonText: { color: '#71717a', fontSize: 11, fontWeight: '700' },

  hourPill: { flex: 1, paddingVertical: 9, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)', backgroundColor: '#000', alignItems: 'center' },
  hourPillActive: { backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.4)' },
  hourPillText: { color: '#71717a', fontSize: 11, fontWeight: '700' },

  runButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 6 },
  buttonDisabled: { opacity: 0.3 },
  runButtonText: { color: '#000', fontWeight: '800', fontSize: 13 },

  loadingCard: { backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 24, alignItems: 'center', gap: 10 },
  loadingLabel: { color: '#52525b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  resultCard: { backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18 },
  resultLabel: { color: '#71717a', fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  resultLabelAmber: { color: AMBER, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  resultLabelViolet: { color: VIOLET, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  resultLabelRose: { color: ROSE, fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  resultHeadline: { color: '#f4f4f5', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  resultBodyText: { color: '#d4d4d8', fontSize: 13, lineHeight: 20 },

  listRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  listNumber: { color: AMBER, fontSize: 11, fontWeight: '900' },
  listLetter: { color: VIOLET, fontSize: 10.5, fontWeight: '900' },
  listText: { color: '#d4d4d8', fontSize: 13, flex: 1, lineHeight: 19 },
  listRowSmall: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'flex-start' },
  listTextSmall: { color: '#a1a1aa', fontSize: 11, flex: 1, lineHeight: 16 },

  quizQuestionCard: { backgroundColor: '#0e0e12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, gap: 10 },
  quizQuestionText: { color: '#e4e4e7', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  quizQuestionNumber: { color: AMBER },
  quizOption: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  quizOptionDefault: { borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(0,0,0,0.4)' },
  quizOptionChosen: { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: 'rgba(245,158,11,0.07)' },
  quizOptionCorrect: { borderColor: 'rgba(52,211,153,0.5)', backgroundColor: 'rgba(52,211,153,0.1)' },
  quizOptionWrong: { borderColor: 'rgba(244,63,94,0.4)', backgroundColor: 'rgba(244,63,94,0.1)' },
  quizOptionLetter: { color: '#71717a', fontSize: 10 },
  quizOptionText: { color: '#d4d4d8', fontSize: 12, flex: 1 },

  submitQuizButton: { backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitQuizButtonText: { color: '#000', fontWeight: '800', fontSize: 12 },
  scoreBox: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 18, padding: 20, alignItems: 'center' },
  scoreLabel: { color: '#52525b', fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  scoreValue: { color: AMBER, fontSize: 30, fontWeight: '900' },
  scoreValueMax: { color: '#52525b', fontSize: 15, fontWeight: '400' },
  scorePercent: { color: '#71717a', fontSize: 11, marginTop: 4 },
  retryButton: { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  retryButtonText: { color: '#a1a1aa', fontSize: 11, fontWeight: '700' },

  flipCardContainer: { height: 140, width: '47%' },
  flipCardFace: { position: 'absolute', width: '100%', height: '100%', borderRadius: 16, padding: 14, justifyContent: 'space-between', backfaceVisibility: 'hidden' },
  flipCardFront: { backgroundColor: '#0e0e12', borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  flipCardBack: { backgroundColor: 'rgba(245,158,11,0.05)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  flipCardLabel: { color: '#52525b', fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase' },
  flipCardLabelAmber: { color: '#b45309', fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase' },
  flipCardFrontText: { color: '#e4e4e7', fontSize: 13, fontWeight: '700', lineHeight: 18 },
  flipCardBackText: { color: '#d4d4d8', fontSize: 11, lineHeight: 16 },
  flipCardHint: { color: '#3f3f46', fontSize: 9 },
  flipCardHintAmber: { color: '#b45309', fontSize: 9 },

  flashcardsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  spacedRepBadge: { backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  spacedRepText: { color: EMERALD, fontSize: 9.5 },
  flashcardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  plannerTopicText: { color: '#f4f4f5', fontSize: 13, fontWeight: '900' },
  plannerTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(244,63,94,0.1)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  plannerTimeText: { color: ROSE, fontSize: 13, fontWeight: '900' },
  plannerBlockCard: { flexDirection: 'row', gap: 12, backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14 },
  plannerTimeChip: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  plannerTimeChipText: { color: '#52525b', fontSize: 10, fontWeight: '900' },
  plannerTaskText: { color: '#e4e4e7', fontSize: 13, fontWeight: '700' },
  plannerTipRow: { flexDirection: 'row', gap: 6, marginTop: 4, alignItems: 'flex-start' },
  plannerTipText: { color: 'rgba(244,63,94,0.8)', fontSize: 10.5, flex: 1 },

  emptyState: { backgroundColor: '#0a0a10', borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', borderRadius: 18, padding: 50, alignItems: 'center' },
  emptyTitle: { color: '#71717a', fontSize: 13, fontWeight: '700', marginTop: 12 },
  emptySubtitle: { color: '#3f3f46', fontSize: 11, marginTop: 6, textAlign: 'center', maxWidth: 220 },
});