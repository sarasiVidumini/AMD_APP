import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Link } from 'expo-router';
import { CheckCircle2, FileText, ExternalLink, MessageSquare, Clock, User, Calendar, Zap, ArrowRight } from 'lucide-react-native';

interface RequestCardProps {
  req: any;
  isExpert: boolean;
  onOpenChat?: (userId: string, userName: string) => void;
}

const AMBER = '#f59e0b';
const EMERALD = '#34d399';
const ROSE = '#fb7185';
const ORANGE = '#fb923c';
const CYAN = '#22d3ee';

export default function RequestCard({ req, isExpert, onOpenChat }: RequestCardProps) {
  const isFulfilled = req.status === 'fulfilled';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const urgencyStyle =
    req.urgency === 'critical'
      ? { color: ROSE, backgroundColor: 'rgba(251,113,133,0.1)', borderColor: 'rgba(251,113,133,0.25)' }
      : req.urgency === 'high'
      ? { color: ORANGE, backgroundColor: 'rgba(251,146,60,0.1)', borderColor: 'rgba(251,146,60,0.25)' }
      : { color: CYAN, backgroundColor: 'rgba(34,211,238,0.1)', borderColor: 'rgba(34,211,238,0.25)' };

  return (
    <View style={[styles.card, isFulfilled ? styles.cardFulfilled : styles.cardDefault]}>
      <View style={styles.topRow}>
        <View style={styles.rowGap}>
          <View style={styles.semBadge}>
            <Calendar size={12} color={AMBER} />
            <Text style={styles.semBadgeText}>Semester {req.semester}</Text>
          </View>
          {!!req.createdAt && (
            <View style={styles.rowGapSmall}>
              <Clock size={10} color="#52525b" />
              <Text style={styles.dateText}>{formatDate(req.createdAt)}</Text>
            </View>
          )}
        </View>

        {isFulfilled ? (
          <View style={styles.fulfilledBadge}>
            <CheckCircle2 size={14} color={EMERALD} />
            <Text style={styles.fulfilledText}>Fulfilled</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Zap size={12} color={AMBER} />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>

      <Text style={styles.title}>{req.title}</Text>
      <View style={styles.tagsRow}>
        <View style={styles.subjectPill}>
          <Text style={styles.subjectPillText}>{req.subject}</Text>
        </View>
        {!!req.urgency && (
          <View style={[styles.urgencyPill, urgencyStyle]}>
            <Text style={[styles.urgencyPillText, { color: urgencyStyle.color }]}>{req.urgency.toUpperCase()}</Text>
          </View>
        )}
      </View>

      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionText} numberOfLines={3}>
          {req.description || 'No description provided.'}
        </Text>
      </View>

      {!!req.student && (
        <View style={styles.studentRow}>
          <User size={12} color="#52525b" />
          <Text style={styles.studentText}>
            Requested by <Text style={styles.studentName}>{req.student.name}</Text>
          </Text>
        </View>
      )}

      {isFulfilled && req.fulfilledNote && (
        <TouchableOpacity
          style={styles.fulfilledNoteCard}
          onPress={() => {
            const link = req.fulfilledNote?.files?.[0];
            if (link) Linking.openURL(link);
          }}
        >
          <View style={styles.rowGap}>
            <View style={styles.fulfilledIconBox}>
              <FileText size={16} color={EMERALD} />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.fulfilledNoteTitle} numberOfLines={1}>
                {req.fulfilledNote.title}
              </Text>
              <View style={styles.rowGapSmall}>
                <CheckCircle2 size={10} color={EMERALD} />
                <Text style={styles.fulfilledNoteSubtitle}>Verified Resource</Text>
              </View>
            </View>
          </View>
          <ExternalLink size={14} color={EMERALD} />
        </TouchableOpacity>
      )}

      <View style={styles.actionArea}>
        {!isFulfilled && isExpert && (
          <Link
            href={{ pathname: '/upload', params: { request_id: req._id, subject: req.subject } }}
            asChild
          >
            <TouchableOpacity style={styles.fulfillButton}>
              <Text style={styles.fulfillButtonText}>Fulfill Request</Text>
              <ArrowRight size={14} color="#000" />
            </TouchableOpacity>
          </Link>
        )}

        {!isExpert && onOpenChat && req.fulfilledBy && (
          <TouchableOpacity
            onPress={() => onOpenChat(req.fulfilledBy._id, req.fulfilledBy.name)}
            style={styles.chatButton}
          >
            <MessageSquare size={14} color="#000" />
            <Text style={styles.chatButtonText}>Chat with Specialist</Text>
          </TouchableOpacity>
        )}

        {!isFulfilled && !isExpert && (
          <View style={styles.awaitingRow}>
            <Clock size={12} color={AMBER} />
            <Text style={styles.awaitingText}>Awaiting expert response</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0a0a0c', borderWidth: 1, borderRadius: 18, padding: 18 },
  cardDefault: { borderColor: 'rgba(255,255,255,0.06)' },
  cardFulfilled: { borderColor: 'rgba(52,211,153,0.25)' },
  flex1: { flex: 1 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowGapSmall: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  semBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  semBadgeText: { color: '#a1a1aa', fontSize: 10.5, fontWeight: '700' },
  dateText: { color: '#52525b', fontSize: 10 },
  fulfilledBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(52,211,153,0.1)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  fulfilledText: { color: EMERALD, fontSize: 10.5, fontWeight: '700' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  pendingText: { color: AMBER, fontSize: 10.5, fontWeight: '700' },

  title: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  subjectPill: { backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  subjectPillText: { color: AMBER, fontSize: 11, fontWeight: '600' },
  urgencyPill: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  urgencyPillText: { fontSize: 9.5, fontWeight: '800' },

  descriptionBox: { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 12, marginBottom: 12 },
  descriptionText: { color: '#a1a1aa', fontSize: 12, lineHeight: 17 },

  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 10, borderRadius: 10, marginBottom: 12 },
  studentText: { color: '#71717a', fontSize: 11 },
  studentName: { color: '#d4d4d8', fontWeight: '600' },

  fulfilledNoteCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', borderRadius: 12, padding: 12, marginBottom: 10 },
  fulfilledIconBox: { padding: 8, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)' },
  fulfilledNoteTitle: { color: '#fff', fontSize: 12, fontWeight: '700' },
  fulfilledNoteSubtitle: { color: '#52525b', fontSize: 9.5 },

  actionArea: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  fulfillButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: AMBER, paddingVertical: 13, borderRadius: 12 },
  fulfillButtonText: { color: '#000', fontWeight: '700', fontSize: 12 },
  chatButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', paddingVertical: 13, borderRadius: 12 },
  chatButtonText: { color: '#000', fontWeight: '700', fontSize: 12 },
  awaitingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  awaitingText: { color: '#71717a', fontSize: 11 },
});