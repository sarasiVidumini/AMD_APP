import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import API from '../../src/lib/api';
import Toast from 'react-native-toast-message';
import { BookOpen, Eye, EyeOff } from 'lucide-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';


const GOOGLE_WEB_CLIENT_ID =
  '872414388425-o661s1fjl9ot581eof75210i81l7p79e.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  offlineAccess: false,
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleAuthSuccess = (user: any, token: string) => {
    login(user, token);
    Toast.show({ type: 'success', text1: `Welcome back, ${user.name}!` });

    if (user.role === 'admin') {
      router.replace('/admin');
    } else if (user.role === 'expert') {
      router.replace('/expert-dashboard');
    } else {
      router.replace('/dashboard');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      handleAuthSuccess(res.data.user, res.data.token);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      
      // 1. Capture the full response object
      const googleResult = await GoogleSignin.signIn();
      
      // 2. Safely access the data property
      // If using @react-native-google-signin/google-signin, 
      // the result is usually { data: { idToken, ... } }
      const idToken = (googleResult as any).data?.idToken;

      if (!idToken) {
        throw new Error('No ID token returned from Google');
      }

      const res = await API.post('/auth/google-login', { idToken });
      handleAuthSuccess(res.data.user, res.data.token);
      
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || 'Google authentication failed',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <View style={styles.logoBox}>
              <BookOpen size={28} color="#000" />
            </View>
          </View>
          <Text style={styles.title}>
            Welcome to <Text style={styles.titleAccent}>NoteVault</Text>
          </Text>
          <Text style={styles.subtitle}>
            Sign in to report and track local academic requests.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#52525b"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor="#52525b"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#71717a" />
                ) : (
                  <Eye size={20} color="#71717a" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading || googleLoading}
            style={[
              styles.signInButton,
              (loading || googleLoading) && styles.buttonDisabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <Link href="/register" style={styles.signupLink}>
              Sign up
            </Link>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={loading || googleLoading}
            style={[
              styles.googleButton,
              (loading || googleLoading) && styles.buttonDisabled,
            ]}
          >
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>
              {googleLoading ? 'Signing in with Google...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const YELLOW = '#facc15';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#000' },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  logoWrap: { marginBottom: 16 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: YELLOW,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: YELLOW,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  titleAccent: { color: YELLOW },
  subtitle: {
    color: '#a1a1aa',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(24,24,27,0.5)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  field: { marginBottom: 18 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#09090b',
    color: '#fff',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    fontSize: 15,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: '100%',
    justifyContent: 'center',
  },
  signInButton: {
    width: '100%',
    backgroundColor: YELLOW,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.5 },
  signInText: { color: '#000', fontWeight: '700', fontSize: 16 },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  signupText: { color: '#a1a1aa', fontSize: 13 },
  signupLink: { color: YELLOW, fontWeight: '600', fontSize: 13 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#27272a' },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  googleButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
  },
  googleIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: { fontSize: 12, fontWeight: '800', color: '#4285F4' },
  googleButtonText: { color: '#e4e4e7', fontWeight: '600', fontSize: 14 },
});