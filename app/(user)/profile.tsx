/**
 * Profile Screen — User settings, preferences, dark mode, payment history
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { signOut } from '../../src/services/firebase/auth.service';
import { updateUser } from '../../src/services/firebase/firestore.service';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import type { DefaultMealPreference } from '../../src/types';
import { webSafeAlert } from '../../src/utils/alert';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MEAL_PREFS: Array<{ value: DefaultMealPreference; emoji: string; label: string }> = [
  { value: 'always-veg', emoji: '🥦', label: 'Always Veg' },
  { value: 'always-non-veg', emoji: '🍗', label: 'Always Non-Veg' },
  { value: 'flexible', emoji: '🤔', label: 'Flexible' },
];

export default function ProfileScreen() {
  const { userProfile, refreshProfile, firebaseUser } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { officeName } = useOffice();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleMealPrefChange = async (pref: DefaultMealPreference) => {
    if (!userProfile) return;
    try {
      await updateUser(userProfile.id, { defaultMealPreference: pref });
      await refreshProfile();
    } catch (e) {
      webSafeAlert('Error', 'Failed to update preference');
    }
  };

  const handleSignOut = () => {
    webSafeAlert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: Colors.primary }]}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={userProfile?.name ?? 'U'}
              uri={userProfile?.photoURL}
              size="xl"
            />
          </View>
          <Text style={styles.profileName}>{userProfile?.name ?? 'User'}</Text>
          <Text style={styles.profilePhone}>{userProfile?.phone ?? ''}</Text>
          <View style={styles.officePill}>
            <Text style={styles.officePillText}>🏢 {officeName}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Meal Preference */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Default Meal Preference
            </Text>
            <Text style={[styles.sectionSub, { color: colors.textSecondary }]}>
              Applied when you miss the daily cutoff
            </Text>
            <View style={styles.prefRow}>
              {MEAL_PREFS.map((pref) => {
                const isActive = userProfile?.defaultMealPreference === pref.value;
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
                    onPress={() => handleMealPrefChange(pref.value)}
                  >
                    <Text>{pref.emoji}</Text>
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

          {/* Settings */}
          <Card style={styles.settingsCard}>
            <SettingsRow
              icon="bell-outline"
              label="Meal Reminders"
              colors={colors}
              right={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingsRow
              icon="moon-waning-crescent"
              label="Dark Mode"
              colors={colors}
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: Colors.primary }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingsRow
              icon="credit-card-outline"
              label="Payment History"
              colors={colors}
              onPress={() => {}}
              showArrow
            />
            <SettingsRow
              icon="help-circle-outline"
              label="Help & Support"
              colors={colors}
              onPress={() => {}}
              showArrow
              isLast
            />
          </Card>

          {/* App Info */}
          <Card style={styles.infoCard}>
            <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
              TiffinFlow v1.0.0
            </Text>
            <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
              Made with 🍱 for office tiffin management
            </Text>
          </Card>

          {/* Sign Out */}
          <TouchableOpacity
            style={[styles.signOutBtn, { backgroundColor: Colors.errorLight }]}
            onPress={handleSignOut}
          >
            <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SettingsRow: React.FC<{
  icon: string; label: string; colors: any;
  right?: React.ReactNode; onPress?: () => void;
  showArrow?: boolean; isLast?: boolean;
}> = ({ icon, label, colors, right, onPress, showArrow, isLast }) => (
  <TouchableOpacity
    style={[styles.settingsRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <MaterialCommunityIcons name={icon as any} size={22} color={Colors.primary} />
    <Text style={[styles.settingsLabel, { color: colors.textPrimary }]}>{label}</Text>
    {right ?? (showArrow && (
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    ))}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  avatarContainer: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 50,
    marginBottom: 8,
  },
  profileName: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, color: '#FFF' },
  profilePhone: { fontFamily: FontFamily.regular, fontSize: FontSize.body, color: 'rgba(255,255,255,0.8)' },
  officePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
    marginTop: 4,
  },
  officePillText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm, color: '#FFF' },
  content: { padding: Spacing.screenHorizontal, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  sectionSub: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm },
  prefRow: { flexDirection: 'row', gap: Spacing.sm },
  prefChip: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: 4,
  },
  prefChipText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.label, textAlign: 'center' },
  settingsCard: { gap: 0, padding: 0 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingsLabel: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body },
  infoCard: { alignItems: 'center', gap: 4 },
  appVersion: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, textAlign: 'center' },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  signOutText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body, color: Colors.error },
});
