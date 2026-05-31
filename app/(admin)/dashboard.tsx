/**
 * Admin Dashboard — Real-time overview of today's orders, revenue, and response rate
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import { listenToDashboardStats, getUsersByOffice } from '../../src/services/firebase/firestore.service';
import { formatAmount, getGreeting, toDateString } from '../../src/utils/calculations';
import { Card } from '../../src/components/ui/Card';
import { Avatar } from '../../src/components/ui/Avatar';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import type { DashboardStats, User } from '../../src/types';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const { officeName, vegPrice, nonVegPrice } = useOffice();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useSharedValue(0);
  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));

  useEffect(() => {
    if (!userProfile?.officeId) return;

    // Load users first to get total count
    getUsersByOffice(userProfile.officeId).then((u) => {
      setUsers(u);
      setIsLoading(false);

      // Start realtime dashboard stats
      const unsub = listenToDashboardStats(userProfile.officeId, u.length, (s) => {
        setStats(s);
        setRefreshing(false);
      });

      headerOpacity.value = withTiming(1, { duration: 600 });
      return unsub;
    });
  }, [userProfile]);

  if (isLoading) return <LoadingSpinner fullScreen label="Loading dashboard..." />;

  const todayDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <Animated.View style={headerStyle}>
          <LinearGradient
            colors={isDark ? ['#2A1200', '#1F1F1F'] : [Colors.primary, Colors.secondary]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerGreeting}>{getGreeting()}, Admin 👑</Text>
                <Text style={styles.headerOffice}>{officeName}</Text>
                <Text style={styles.headerDate}>{todayDate}</Text>
              </View>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>ADMIN</Text>
              </View>
            </View>

            {/* Revenue Highlight */}
            <View style={styles.revenueBox}>
              <Text style={styles.revenueLabel}>Today's Revenue</Text>
              <Text style={styles.revenueAmount}>
                {formatAmount(stats?.todayRevenue ?? 0)}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatBox
              emoji="📦"
              label="Total Orders"
              value={`${stats?.totalOrders ?? 0}`}
              color={Colors.primary}
              colors={colors}
            />
            <StatBox
              emoji="🥦"
              label="Veg"
              value={`${stats?.vegCount ?? 0}`}
              color={Colors.veg}
              colors={colors}
            />
            <StatBox
              emoji="🍗"
              label="Non-Veg"
              value={`${stats?.nonVegCount ?? 0}`}
              color={Colors.nonVeg}
              colors={colors}
            />
            <StatBox
              emoji="⏳"
              label="Pending"
              value={`${stats?.pendingCount ?? 0}`}
              color={Colors.warning}
              colors={colors}
            />
          </View>

          {/* Response Rate Card */}
          <Card elevated style={styles.responseCard}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              📊 Response Rate
            </Text>
            <View style={styles.responseRow}>
              <View style={styles.responseCircle}>
                <Text style={styles.responsePercent}>{stats?.responseRate ?? 0}%</Text>
                <Text style={styles.responseLabel}>responded</Text>
              </View>
              <View style={styles.responseBar}>
                <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                  {users.length - (stats?.pendingCount ?? 0)} of {users.length} users confirmed
                </Text>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${stats?.responseRate ?? 0}%`,
                        backgroundColor:
                          (stats?.responseRate ?? 0) > 70 ? Colors.veg : Colors.warning,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barSub, { color: colors.textTertiary }]}>
                  {stats?.pendingCount ?? 0} users yet to respond
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <ActionBtn emoji="🔔" label="Send Reminder" onPress={() => {}} colors={colors} />
              <ActionBtn emoji="📤" label="Export Today" onPress={() => {}} colors={colors} />
              <ActionBtn emoji="💰" label="Bills" onPress={() => {}} colors={colors} />
            </View>
          </View>

          {/* Users Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Team ({users.length})</Text>
            <Card noPadding>
              {users.slice(0, 5).map((user, i) => (
                <View
                  key={user.id}
                  style={[
                    styles.userRow,
                    { borderBottomWidth: i < Math.min(users.length, 5) - 1 ? 1 : 0, borderBottomColor: colors.divider },
                  ]}
                >
                  <Avatar name={user.name} uri={user.photoURL} size="sm" />
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{user.name}</Text>
                  <View style={[styles.statusDot, { backgroundColor: user.isActive ? Colors.veg : Colors.skip }]} />
                </View>
              ))}
              {users.length > 5 && (
                <View style={styles.moreUsers}>
                  <Text style={[styles.moreUsersText, { color: colors.textTertiary }]}>
                    +{users.length - 5} more users
                  </Text>
                </View>
              )}
            </Card>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Sub-components
const StatBox: React.FC<{
  emoji: string; label: string; value: string; color: string; colors: any;
}> = ({ emoji, label, value, color, colors }) => (
  <View style={[styles.statBox, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const ActionBtn: React.FC<{
  emoji: string; label: string; onPress: () => void; colors: any;
}> = ({ emoji, label, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.actionBtn, { backgroundColor: colors.surface }, Shadow.sm]}
    onPress={onPress}
  >
    <Text style={styles.actionEmoji}>{emoji}</Text>
    <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerGradient: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.lg,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerGreeting: { fontFamily: FontFamily.medium, fontSize: FontSize.body, color: 'rgba(255,255,255,0.8)' },
  headerOffice: { fontFamily: FontFamily.bold, fontSize: FontSize.h1, color: '#FFF', marginTop: 2 },
  headerDate: { fontFamily: FontFamily.regular, fontSize: FontSize.bodySm, color: 'rgba(255,255,255,0.7)' },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
  },
  headerBadgeText: { fontFamily: FontFamily.bold, fontSize: FontSize.label, color: '#FFF' },
  revenueBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  revenueLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.body, color: 'rgba(255,255,255,0.8)' },
  revenueAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.display, color: '#FFF' },
  content: { padding: Spacing.screenHorizontal, gap: Spacing.lg },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: { flex: 1, minWidth: '45%', borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 24 },
  statValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h2 },
  statLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  responseCard: {},
  cardTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.body, marginBottom: Spacing.md },
  responseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  responseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  responsePercent: { fontFamily: FontFamily.bold, fontSize: FontSize.h3, color: Colors.primary },
  responseLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.label, color: Colors.primary },
  responseBar: { flex: 1, gap: Spacing.xs },
  barLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm },
  barSub: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  section: { gap: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 6,
  },
  actionEmoji: { fontSize: 28 },
  actionLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.caption, textAlign: 'center' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  userName: { flex: 1, fontFamily: FontFamily.medium, fontSize: FontSize.body },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  moreUsers: { padding: Spacing.md, alignItems: 'center' },
  moreUsersText: { fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },
});
