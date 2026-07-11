import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ArrowRight } from 'lucide-react-native';

const AMBER = '#f59e0b';

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <BookOpen size={40} color="#000" />
        </View>

        <Text style={styles.title}>
          Welcome to <Text style={styles.titleAccent}>NoteVault</Text>
        </Text>

        <Text style={styles.subtitle}>
          Discover, share, and master high-quality academic notes — built for
          students, powered by experts.
        </Text>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.ctaText}>Get Started</Text>
          <ArrowRight size={18} color="#000" />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  content: { alignItems: 'center', maxWidth: 340 },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: AMBER,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  titleAccent: { color: AMBER },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: AMBER,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 36,
  },
  ctaText: { color: '#000', fontWeight: '800', fontSize: 15 },
  loginLink: { color: '#71717a', fontSize: 13, marginTop: 24 },
  loginLinkAccent: { color: AMBER, fontWeight: '600' },
});