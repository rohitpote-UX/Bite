/**
 * Profile Setup Screen — Name, meal preference, office code
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize, LineHeight } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { createUserProfile } from '../../src/services/firebase/auth.service';
import type { DefaultMealPreference } from '../../src/types';

const MEAL_PREFS: Array<{ value: DefaultMealPreference; emoji: string; label: string; sub: string }> = [
  { value: 'always-veg', emoji: '🥦', label: 'Always Veg', sub: 'I always eat vegetarian' },
  { value: 'always-non-veg', emoji: '🍗', label: 'Always Non-Veg', sub: 'I prefer non-vegetarian' },
  { value: 'flexible', emoji: '🤔', label: 'Flexible', sub: "I'll decide daily" },
];

export default function ProfileSetupScreen() {
  const { colors } = useTheme();
  const { firebaseUser, refreshProfile } = useAuth();

  const [name, setName] = useState('');
  const [officeCode, setOfficeCode] = useState('');
  const [mealPref, setMealPref] = useState<DefaultMealPreference>('flexible');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; officeCode?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = 'Please enter your name';
    if (!officeCode.trim()) e.officeCode = 'Please enter your office code';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSetup = async () => {
    if (!validate() || !firebaseUser) return;
    setIsLoading(true);
    try {
      await createUserProfile(firebaseUser, {
        name: name.trim(),
        officeId: officeCode.trim().toLowerCase(),
        defaultMealPreference: mealPref,
        role: 'user',
      });
      await refreshProfile();
      router.replace('/(user)/home');
    } catch (e: any) {
      setErrors({ officeCode: 'Invalid office code. Please check with your admin.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>👤</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Set up your profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Just a few details to get you started
          </Text>
        </View>

        {/* Form */}
        <View style={[styles.card, { backgroundColor: colors.surface }, Shadow.md]}>
          <Input
            label="Your Name"
            placeholder="e.g. Rohit Sharma"
            value={name}
            onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: undefined })); }}
            error={errors.name}
            autoCapitalize="words"
          />

          <Input
            label="Office Code"
            placeholder="Enter code from your admin"
            value={officeCode}
            onChangeText={(t) => { setOfficeCode(t); setErrors((e) => ({ ...e, officeCode: undefined })); }}
            error={errors.officeCode}
            autoCapitalize="none"
            hint="Ask your office admin for this code"
          />
        </View>

        {/* Meal Preference */}
        <View style={styles.prefSection}>
          <Text style={[styles.prefTitle, { color: colors.textPrimary }]}>
            Default meal preference
          </Text>
          <Text style={[styles.prefSub, { color: colors.textSecondary }]}>
            Used when you don't respond in time
          </Text>

          <View style={styles.prefCards}>
            {MEAL_PREFS.map((pref) => (
              <TouchableOpacity
                key={pref.value}
                style={[
                  styles.prefCard,
                  {
                    backgroundColor: mealPref === pref.value ? Colors.primary + '15' : colors.surface,
                    borderColor: mealPref === pref.value ? Colors.primary : colors.border,
                  },
                ]}
                onPress={() => setMealPref(pref.value)}
              >
                <Text style={styles.prefEmoji}>{pref.emoji}</Text>
                <Text style={[styles.prefLabel, { color: mealPref === pref.value ? Colors.primary : colors.textPrimary }]}>
                  {pref.label}
                </Text>
                <Text style={[styles.prefSublabel, { color: colors.textTertiary }]}>
                  {pref.sub}
                </Text>
                {mealPref === pref.value && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          label="Complete Setup 🎉"
          onPress={handleSetup}
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 64,
    paddingBottom: 48,
    gap: Spacing.lg,
  },
  header: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  headerEmoji: { fontSize: 52 },
  title: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.h1,
    lineHeight: LineHeight.h1,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    textAlign: 'center',
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  prefSection: { gap: Spacing.sm },
  prefTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  prefSub: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  prefCards: { gap: Spacing.sm, marginTop: Spacing.sm },
  prefCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.md,
    gap: 4,
    position: 'relative',
  },
  prefEmoji: { fontSize: 28 },
  prefLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  prefSublabel: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  checkmark: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { color: '#FFF', fontSize: 14, fontFamily: FontFamily.bold },
});
