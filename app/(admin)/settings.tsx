/**
 * Admin Settings Screen — Office pricing, cutoff time, notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { updateOfficeSettings } from '../../src/services/firebase/firestore.service';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webSafeAlert } from '../../src/utils/alert';

export default function SettingsScreen() {
  const { userProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { settings } = useOffice();

  const [vegPrice, setVegPrice] = useState('80');
  const [nonVegPrice, setNonVegPrice] = useState('100');
  const [cutoffTime, setCutoffTime] = useState('19:00');
  const [officeName, setOfficeName] = useState('My Office');
  const [autoDefault, setAutoDefault] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setVegPrice(String(settings.vegPrice));
      setNonVegPrice(String(settings.nonVegPrice));
      setCutoffTime(settings.cutoffTime);
      setOfficeName(settings.officeName);
      setAutoDefault(settings.autoDefaultEnabled);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!userProfile?.officeId) return;
    const vp = parseInt(vegPrice);
    const nvp = parseInt(nonVegPrice);
    if (isNaN(vp) || isNaN(nvp) || vp <= 0 || nvp <= 0) {
      webSafeAlert('Invalid Prices', 'Please enter valid prices.');
      return;
    }
    setIsSaving(true);
    try {
      await updateOfficeSettings(userProfile.officeId, {
        vegPrice: vp,
        nonVegPrice: nvp,
        cutoffTime,
        officeName: officeName.trim(),
        autoDefaultEnabled: autoDefault,
      });
      webSafeAlert('Saved! ✅', 'Office settings updated successfully.');
    } catch (e) {
      webSafeAlert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Office Settings</Text>
        </View>

        {/* Office Code Card */}
        {settings?.officeCode && (
          <Card style={styles.codeCard} warm elevated>
            <Text style={styles.codeEmoji}>🏢</Text>
            <View>
              <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>Your Office Code</Text>
              <Text style={[styles.code, { color: Colors.primary }]}>{settings.officeCode.toUpperCase()}</Text>
              <Text style={[styles.codeSub, { color: colors.textTertiary }]}>
                Share this with new users to join your office
              </Text>
            </View>
          </Card>
        )}

        {/* Pricing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>💰 Meal Pricing</Text>
          <Card>
            <Input
              label="Veg Meal Price (₹)"
              value={vegPrice}
              onChangeText={setVegPrice}
              keyboardType="numeric"
              leftIcon={<Text style={styles.rupee}>🥦</Text>}
            />
            <Input
              label="Non-Veg Meal Price (₹)"
              value={nonVegPrice}
              onChangeText={setNonVegPrice}
              keyboardType="numeric"
              leftIcon={<Text style={styles.rupee}>🍗</Text>}
            />
          </Card>
        </View>

        {/* Office Name */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🏢 Office Details</Text>
          <Card>
            <Input
              label="Office Name"
              value={officeName}
              onChangeText={setOfficeName}
              placeholder="e.g. TechCorp Bangalore"
            />
          </Card>
        </View>

        {/* Timing */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>⏰ Timing</Text>
          <Card>
            <Input
              label="Cutoff Time (24h format)"
              value={cutoffTime}
              onChangeText={setCutoffTime}
              placeholder="19:00"
              hint="Users must confirm before this time"
            />
          </Card>
        </View>

        {/* Smart Features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🧠 Smart Features</Text>
          <Card>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Auto Default Meals</Text>
                <Text style={[styles.toggleSub, { color: colors.textTertiary }]}>
                  Automatically apply default preference for non-responders
                </Text>
              </View>
              <Switch
                value={autoDefault}
                onValueChange={setAutoDefault}
                trackColor={{ false: colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
                <Text style={[styles.toggleSub, { color: colors.textTertiary }]}>
                  Switch to warm dark theme
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: Colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </Card>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Button
            label="Save Settings"
            onPress={handleSave}
            variant="primary"
            size="lg"
            fullWidth
            loading={isSaving}
          />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  codeCard: {
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  codeEmoji: { fontSize: 36 },
  codeLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  code: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, letterSpacing: 2 },
  codeSub: { fontFamily: FontFamily.regular, fontSize: FontSize.caption, marginTop: 2 },
  section: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  rupee: { fontSize: 18 },
  toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.sm },
  toggleInfo: { flex: 1, gap: 4 },
  toggleLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  toggleSub: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, lineHeight: 18 },
  divider: { height: 1, marginVertical: Spacing.sm },
  saveSection: { paddingHorizontal: Spacing.screenHorizontal },
});
