/**
 * Login Screen — Email/Password with User/Admin tabs
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize, LineHeight } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/context/ThemeContext';
import { signInWithEmailAndPassword, getUserProfile } from '../../src/services/firebase/auth.service';
import { useAuth } from '../../src/context/AuthContext';
import type { UserRole } from '../../src/types';

export default function LoginScreen() {
  const [role, setRole] = useState<UserRole>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // 1. Sign in via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(email.trim(), password);
      
      // 2. Fetch User Profile to verify role
      const profile = await getUserProfile(userCredential.user.uid);
      if (!profile) {
        throw new Error('User profile not found. Please register first.');
      }

      if (profile.role !== role) {
        throw new Error(`Account found, but it is not registered as an ${role === 'admin' ? 'Admin' : 'Office User'}.`);
      }

      // 3. Refresh Profile in Context
      await refreshProfile();

      // 4. Redirect based on verified role
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(user)/home');
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = 'Failed to sign in. Please check your credentials.';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password.';
      } else if (e.message) {
        errMsg = e.message;
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Illustration */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerCircle}>
            <Text style={styles.headerEmoji}>🍱</Text>
          </View>
          <Text style={styles.headerTitle}>Welcome to{'\n'}TiffinFlow</Text>
          <Text style={styles.headerSub}>Manage your daily office tiffin seamlessly</Text>
        </LinearGradient>

        {/* Login Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.lg]}>
          
          {/* Segmented Role Tabs */}
          <View style={[styles.tabsBg, { backgroundColor: colors.surfaceWarm }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                role === 'user' && { backgroundColor: Colors.primary },
              ]}
              onPress={() => { setRole('user'); setError(''); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  role === 'user' ? { color: '#FFFFFF', fontFamily: FontFamily.bold } : { color: colors.textSecondary },
                ]}
              >
                👤 User Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                role === 'admin' && { backgroundColor: Colors.primary },
              ]}
              onPress={() => { setRole('admin'); setError(''); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  role === 'admin' ? { color: '#FFFFFF', fontFamily: FontFamily.bold } : { color: colors.textSecondary },
                ]}
              >
                👑 Admin Login
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            Sign In
          </Text>
          <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
            Enter your credentials to access your {role === 'admin' ? 'admin panel' : 'dashboard'}
          </Text>

          {/* Email Input */}
          <Input
            label="Email Address"
            placeholder="e.g. rohit@tiffinflow.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password Input */}
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            label="Sign In"
            onPress={handleLogin}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.signInBtn}
          />

          {/* Create Account Link */}
          <View style={styles.signupRow}>
            <Text style={[styles.signupText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.terms, { color: colors.textTertiary }]}>
            By continuing, you agree to our{' '}
            <Text style={{ color: Colors.primary }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: Colors.primary }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: 64,
    paddingBottom: 60,
    paddingHorizontal: Spacing.screenHorizontal,
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerCircle: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerEmoji: { fontSize: 40 },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: LineHeight.display,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: Spacing.screenHorizontal,
    marginTop: -32,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tabsBg: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  tabText: {
    fontSize: FontSize.bodySm,
    fontFamily: FontFamily.medium,
  },
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h2,
    lineHeight: LineHeight.h2,
  },
  cardSub: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.error,
    textAlign: 'center',
  },
  signInBtn: {
    marginTop: Spacing.xs,
  },
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  signupText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
  },
  signupLink: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.primary,
  },
  terms: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    textAlign: 'center',
    lineHeight: 18,
  },
});
