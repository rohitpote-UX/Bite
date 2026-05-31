/**
 * Signup Screen — Tabbed User/Admin Signup with dynamic fields
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
import { useAuth } from '../../src/context/AuthContext';
import { signUpWithEmailAndPassword } from '../../src/services/firebase/auth.service';
import type { UserRole, DefaultMealPreference } from '../../src/types';

const MEAL_PREFS: Array<{ value: DefaultMealPreference; emoji: string; label: string }> = [
  { value: 'always-veg', emoji: '🥦', label: 'Veg' },
  { value: 'always-non-veg', emoji: '🍗', label: 'Non-Veg' },
  { value: 'flexible', emoji: '🤔', label: 'Flexible' },
];

export default function SignupScreen() {
  const [role, setRole] = useState<UserRole>('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [officeCodeOrName, setOfficeCodeOrName] = useState(''); // Invite code for user, Office Name for Admin
  const [mealPref, setMealPref] = useState<DefaultMealPreference>('flexible');

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { colors } = useTheme();
  const { refreshProfile } = useAuth();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim() || !email.includes('@')) errs.email = 'Please enter a valid email';
    if (!phone.trim() || phone.length < 10) errs.phone = 'Please enter a valid 10-digit number';
    if (!password.trim() || password.length < 6) errs.password = 'Password must be at least 6 characters';
    
    if (role === 'admin') {
      if (!officeCodeOrName.trim()) errs.officeCodeOrName = 'Office Name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});

    try {
      // Execute the unified signup service
      await signUpWithEmailAndPassword(
        email.trim(),
        password,
        name.trim(),
        `+91${phone.trim().replace(/[^0-9]/g, '')}`,
        role,
        role === 'user' ? 'default' : officeCodeOrName,
        mealPref
      );

      // Refresh Auth Profile
      await refreshProfile();

      // Successful redirect based on signup role
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(user)/home');
      }
    } catch (e: any) {
      console.error(e);
      let errMsg = 'Failed to register account. Please try again.';
      if (e.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already in use.';
      } else if (e.message) {
        errMsg = e.message;
      }
      setErrors({ form: errMsg });
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
        showsVerticalScrollIndicator={false}
      >
        {/* Header Gradient */}
        <LinearGradient
          colors={[Colors.primary, Colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerCircle}>
            <Text style={styles.headerEmoji}>🍱</Text>
          </View>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSub}>Join TiffinFlow for premium office meals</Text>
        </LinearGradient>

        {/* Signup Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.lg]}>
          
          {/* Segmented Toggle */}
          <View style={[styles.tabsBg, { backgroundColor: colors.surfaceWarm }]}>
            <TouchableOpacity
              style={[
                styles.tabBtn,
                role === 'user' && { backgroundColor: Colors.primary },
              ]}
              onPress={() => { setRole('user'); setErrors({}); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  role === 'user' ? { color: '#FFFFFF', fontFamily: FontFamily.bold } : { color: colors.textSecondary },
                ]}
              >
                👤 User Signup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                role === 'admin' && { backgroundColor: Colors.primary },
              ]}
              onPress={() => { setRole('admin'); setErrors({}); }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabText,
                  role === 'admin' ? { color: '#FFFFFF', fontFamily: FontFamily.bold } : { color: colors.textSecondary },
                ]}
              >
                👑 Admin Signup
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <Input
            label="Full Name"
            placeholder="e.g. Rohit Sharma"
            value={name}
            onChangeText={(t) => { setName(t); setErrors({}); }}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Email Address"
            placeholder="e.g. rohit@tiffinflow.com"
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors({}); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number"
            placeholder="10-digit number"
            value={phone}
            onChangeText={(t) => { setPhone(t.replace(/[^0-9]/g, '').slice(0, 10)); setErrors({}); }}
            error={errors.phone}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <Input
            label="Password"
            placeholder="Minimum 6 characters"
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors({}); }}
            error={errors.password}
            secureTextEntry
            autoCapitalize="none"
          />

          {/* Role specific fields */}
          {role === 'admin' && (
            <Input
              label="Office / Organization Name"
              placeholder="e.g. TechCorp Bangalore"
              value={officeCodeOrName}
              onChangeText={(t) => { setOfficeCodeOrName(t); setErrors({}); }}
              error={errors.officeCodeOrName}
              autoCapitalize="words"
            />
          )}

          {/* User Specific Default Meal Preference */}
          {role === 'user' && (
            <View style={styles.prefSection}>
              <Text style={[styles.prefLabel, { color: colors.textSecondary }]}>
                Default Meal Preference
              </Text>
              <View style={styles.prefRow}>
                {MEAL_PREFS.map((pref) => {
                  const isActive = mealPref === pref.value;
                  return (
                    <TouchableOpacity
                      key={pref.value}
                      style={[
                        styles.prefChip,
                        {
                          backgroundColor: isActive ? Colors.primary : colors.surface,
                          borderColor: isActive ? Colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setMealPref(pref.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.prefChipEmoji}>{pref.emoji}</Text>
                      <Text style={[
                        styles.prefChipText,
                        { color: isActive ? '#FFF' : colors.textPrimary },
                      ]}>
                        {pref.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {errors.form ? <Text style={styles.errorText}>{errors.form}</Text> : null}

          <Button
            label={role === 'admin' ? 'Create Office & Admin 🎉' : 'Register Account 🍱'}
            onPress={handleSignup}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            style={styles.signupBtn}
          />

          {/* Back to Login Link */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
    color: Colors.error,
    textAlign: 'center',
  },
  signupBtn: {
    marginTop: Spacing.xs,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  loginText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySm,
  },
  loginLink: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.bodySm,
    color: Colors.primary,
  },
  prefSection: {
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  prefLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.bodySm,
    marginBottom: Spacing.xs,
    lineHeight: LineHeight.bodySm,
  },
  prefRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prefChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: 4,
  },
  prefChipEmoji: {
    fontSize: 16,
  },
  prefChipText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.label,
  },
});
