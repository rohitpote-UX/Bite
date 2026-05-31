/**
 * Admin Orders Screen — Real-time today's orders with filter tabs
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { listenToTodayOrders } from '../../src/services/firebase/firestore.service';
import { UserOrderCard } from '../../src/components/features/FeatureComponents';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatAmount, toDateString } from '../../src/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Meal, MealType } from '../../src/types';

type FilterType = 'all' | MealType | 'pending';
const FILTERS: Array<{ key: FilterType; label: string; emoji: string }> = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'veg', label: 'Veg', emoji: '🥦' },
  { key: 'non-veg', label: 'Non-Veg', emoji: '🍗' },
  { key: 'skip', label: 'Skip', emoji: '⏭️' },
];

export default function OrdersScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Meal[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.officeId) return;
    const unsub = listenToTodayOrders(userProfile.officeId, (meals) => {
      setOrders(meals);
      setIsLoading(false);
    });
    return unsub;
  }, [userProfile]);

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === 'all' || o.mealType === filter;
    const matchesSearch = o.userName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const vegCount = orders.filter((o) => o.mealType === 'veg').length;
  const nonVegCount = orders.filter((o) => o.mealType === 'non-veg').length;
  const todayRevenue = orders.reduce((sum, o) => sum + (o.price ?? 0), 0);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Today's Orders</Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{today}</Text>
        </View>
        <View style={[styles.revenuePill, { backgroundColor: Colors.primary + '15' }]}>
          <Text style={[styles.revenueText, { color: Colors.primary }]}>
            {formatAmount(todayRevenue)}
          </Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <QuickStat emoji="🥦" value={vegCount} label="Veg" color={Colors.veg} colors={colors} />
        <QuickStat emoji="🍗" value={nonVegCount} label="Non-Veg" color={Colors.nonVeg} colors={colors} />
        <QuickStat emoji="📦" value={orders.length} label="Total" color={Colors.primary} colors={colors} />
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search by name..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterTab,
              { backgroundColor: filter === f.key ? Colors.primary : colors.surface },
            ]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={styles.filterEmoji}>{f.emoji}</Text>
            <Text style={[
              styles.filterLabel,
              { color: filter === f.key ? '#FFF' : colors.textSecondary },
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <UserOrderCard meal={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            emoji="📭"
            title="No orders yet"
            subtitle="Orders will appear here as users confirm their meals"
          />
        }
      />
    </SafeAreaView>
  );
}

const QuickStat: React.FC<{
  emoji: string; value: number; label: string; color: string; colors: any;
}> = ({ emoji, value, label, color, colors }) => (
  <View style={[styles.quickStat, { backgroundColor: colors.surface }]}>
    <Text style={{ fontSize: 18 }}>{emoji}</Text>
    <Text style={[styles.quickValue, { color }]}>{value}</Text>
    <Text style={[styles.quickLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.sm,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  date: { fontFamily: FontFamily.regular, fontSize: FontSize.body },
  revenuePill: { padding: Spacing.sm, borderRadius: BorderRadius.sm },
  revenueText: { fontFamily: FontFamily.bold, fontSize: FontSize.body },
  quickStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.sm,
  },
  quickStat: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  quickValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  quickLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.label },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: FontFamily.regular, fontSize: FontSize.body },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.chip,
  },
  filterEmoji: { fontSize: 14 },
  filterLabel: { fontFamily: FontFamily.semiBold, fontSize: FontSize.caption },
  list: { paddingHorizontal: Spacing.screenHorizontal, paddingBottom: 32 },
});
