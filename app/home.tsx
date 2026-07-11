import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {
  Search,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  UploadCloud,
  Users,
  Award,
} from 'lucide-react-native';

const AMBER = '#f59e0b';

interface KnowledgeItem {
  subject: string;
  progress: number;
}

export default function Home() {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const [knowledgeData, setKnowledgeData] = useState<KnowledgeItem[]>([
    { subject: 'PRF', progress: 82 },
    { subject: 'DBMS', progress: 78 },
    { subject: 'OOP', progress: 91 },
    { subject: 'SE', progress: 85 },
    { subject: 'JDBC', progress: 73 },
    { subject: 'ORM', progress: 69 },
    { subject: 'Network Programming', progress: 76 },
    { subject: 'Internet Technology', progress: 84 },
    { subject: 'CNS', progress: 79 },
    { subject: 'AAD', progress: 87 },
    { subject: 'AD-2', progress: 92 },
    { subject: 'Python', progress: 95 },
    { subject: 'RAD', progress: 71 },
    { subject: 'AMD', progress: 80 },
    { subject: 'Project Management', progress: 77 },
    { subject: 'ML', progress: 83 },
  ]);

  useEffect(() => {
    // Simulate live knowledge growth
    const interval = setInterval(() => {
      setKnowledgeData((prev) =>
        prev.map((item) => ({
          ...item,
          progress: Math.min(98, item.progress + (Math.random() > 0.65 ? 1 : 0)),
        }))
      );
    }, 2800);

    return () => clearInterval(interval);
  }, [search, subjectFilter]);

  const topRow = knowledgeData.slice(0, 8);
  const bottomRow = knowledgeData.slice(8);

  const renderBarColumn = (item: KnowledgeItem, index: number) => (
    <View key={index} style={styles.barColumn}>
      <Text style={styles.barSubjectLabel} numberOfLines={2}>
        {item.subject}
      </Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { height: `${item.progress}%` }]} />
        <View style={styles.barPercentBadge}>
          <Text style={styles.barPercentText}>{item.progress}%</Text>
        </View>
      </View>
      <Text style={styles.barGrowthText}>
        +{Math.floor(Math.random() * 3) + 1}% this hour
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.badge}>
          <Sparkles color={AMBER} size={16} />
          <Text style={styles.badgeText}>STUDENT POWERED • EXPERT REVIEWED</Text>
        </View>

        <Text style={styles.heroTitle}>
          The Ultimate{'\n'}
          <Text style={styles.heroTitleAccent}>Academic Network</Text>
        </Text>

        <Text style={styles.heroSubtitle}>
          Discover, share, and master high-quality notes. Watch knowledge grow live.
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Users color={AMBER} size={20} />
            <View>
              <Text style={styles.statValue}>2.4k+</Text>
              <Text style={styles.statLabel}>Active Students</Text>
            </View>
          </View>
          <View style={styles.statChip}>
            <TrendingUp color={AMBER} size={20} />
            <View>
              <Text style={styles.statValue}>12k+</Text>
              <Text style={styles.statLabel}>Notes Shared</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchCard}>
        <View style={styles.searchInputWrap}>
          <View style={styles.searchIcon}>
            <Search color="#71717a" size={20} />
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes, topics, professors..."
            placeholderTextColor="#71717a"
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            onPress={() => setSubjectFilter('')}
            style={[styles.filterChip, subjectFilter === '' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, subjectFilter === '' && styles.filterChipTextActive]}>
              All Subjects
            </Text>
          </TouchableOpacity>
          {knowledgeData.map((item) => (
            <TouchableOpacity
              key={item.subject}
              onPress={() => setSubjectFilter(item.subject)}
              style={[styles.filterChip, subjectFilter === item.subject && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  subjectFilter === item.subject && styles.filterChipTextActive,
                ]}
              >
                {item.subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* VALUE PROPOSITION */}
      <Text style={styles.sectionHeading}>Why Students Love NoteVault</Text>

      <View style={styles.valueCard}>
        <View style={styles.valueIconBox}>
          <UploadCloud color={AMBER} size={28} />
        </View>
        <Text style={styles.valueTitle}>Easy Upload</Text>
        <Text style={styles.valueText}>
          Share your notes in seconds and help thousands of students.
        </Text>
      </View>

      <View style={styles.valueCard}>
        <View style={styles.valueIconBox}>
          <ShieldCheck color={AMBER} size={28} />
        </View>
        <Text style={styles.valueTitle}>Verified Content</Text>
        <Text style={styles.valueText}>Expert-reviewed materials you can trust.</Text>
      </View>

      <View style={styles.valueCard}>
        <View style={styles.valueIconBox}>
          <TrendingUp color={AMBER} size={28} />
        </View>
        <Text style={styles.valueTitle}>Live Growth</Text>
        <Text style={styles.valueText}>
          See knowledge improving across subjects in real time.
        </Text>
      </View>

      {/* LIVE BAR CHART */}
      <View style={styles.chartHeaderRow}>
        <View style={styles.rowGap}>
          <Award color={AMBER} size={24} />
          <Text style={styles.chartHeading}>Live Knowledge Development</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.chartSubheading}>
        Real-time academic growth across all subjects on NoteVault
      </Text>

      <View style={styles.chartCard}>
        <Text style={styles.chartRowLabel}>TOP PERFORMING SUBJECTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          {topRow.map(renderBarColumn)}
        </ScrollView>

        <Text style={[styles.chartRowLabel, { marginTop: 28 }]}>OTHER SUBJECTS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
          {bottomRow.map(renderBarColumn)}
        </ScrollView>

        <Text style={styles.chartFooterNote}>
          Knowledge scores are updating live as students engage and improve
        </Text>
      </View>

      {/* FOOTER */}
      <Text style={styles.footerText}>
        © {new Date().getFullYear()} NoteVault • Built for students, by sarasi vidumini
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#09090b' },
  scrollContent: { paddingBottom: 60 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  hero: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 30, alignItems: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  badgeText: { color: AMBER, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  heroTitle: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -1,
  },
  heroTitleAccent: { color: AMBER },
  heroSubtitle: {
    color: '#a1a1aa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 28 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statValue: { color: '#fff', fontWeight: '700', fontSize: 14 },
  statLabel: { color: '#71717a', fontSize: 10 },

  searchCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(24,24,27,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 14,
  },
  searchInputWrap: { position: 'relative', justifyContent: 'center' },
  searchIcon: { position: 'absolute', left: 14, zIndex: 1 },
  searchInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingLeft: 44,
    paddingRight: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
  },
  filterScroll: { marginTop: 12 },
  filterChip: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  filterChipActive: { backgroundColor: AMBER, borderColor: AMBER },
  filterChipText: { color: '#d4d4d8', fontSize: 12, fontWeight: '600' },
  filterChipTextActive: { color: '#000' },

  sectionHeading: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  valueCard: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  valueIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(245,158,11,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  valueTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  valueText: { color: '#a1a1aa', fontSize: 13, lineHeight: 19 },

  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  chartHeading: { color: '#fff', fontSize: 20, fontWeight: '800' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: AMBER },
  liveText: { color: AMBER, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  chartSubheading: { color: '#a1a1aa', fontSize: 13, paddingHorizontal: 16, marginTop: 6 },

  chartCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
  },
  chartRowLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  chartScroll: { marginBottom: 4 },
  barColumn: { alignItems: 'center', marginRight: 20, width: 70 },
  barSubjectLabel: { color: '#d4d4d8', fontSize: 11, fontWeight: '600', textAlign: 'center', marginBottom: 10, height: 32 },
  barTrack: {
    width: 56,
    height: 220,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', backgroundColor: AMBER, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  barPercentBadge: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(24,24,27,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  barPercentText: { color: AMBER, fontSize: 10, fontWeight: '700' },
  barGrowthText: { color: AMBER, fontSize: 10, marginTop: 8 },

  chartFooterNote: { color: '#71717a', fontSize: 12, textAlign: 'center', marginTop: 24 },

  footerText: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginTop: 40,
    marginHorizontal: 16,
  },
});