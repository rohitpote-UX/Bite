/**
 * Admin Payments Screen — Track paid/pending users with screenshot upload
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { listenToOfficePayments, updatePayment } from '../../src/services/firebase/firestore.service';
import { Badge } from '../../src/components/ui/Badge';
import { Avatar } from '../../src/components/ui/Avatar';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { formatAmount } from '../../src/utils/calculations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Payment, PaymentStatus } from '../../src/types';
import { webSafeAlert } from '../../src/utils/alert';

type TabFilter = 'all' | PaymentStatus;
const TABS: Array<{ key: TabFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'overdue', label: 'Overdue' },
];

export default function PaymentsScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.officeId) return;
    const unsub = listenToOfficePayments(userProfile.officeId, (p) => {
      setPayments(p);
      setIsLoading(false);
    });
    return unsub;
  }, [userProfile]);

  const filtered = payments.filter((p) => activeTab === 'all' || p.paymentStatus === activeTab);

  const totalPending = payments.filter((p) => p.paymentStatus === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter((p) => p.paymentStatus === 'paid').reduce((s, p) => s + p.amount, 0);

  const markPaid = async (payment: Payment) => {
    webSafeAlert(
      'Mark as Paid',
      `Mark ${payment.userName}'s payment of ${formatAmount(payment.amount)} as paid?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Paid',
          onPress: async () => {
            await updatePayment(payment.id, {
              paymentStatus: 'paid',
              markedPaidByAdmin: true,
              paymentDate: new Date(),
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Payments</Text>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <SummaryBox label="Pending" amount={totalPending} color={Colors.warning} colors={colors} />
        <SummaryBox label="Collected" amount={totalPaid} color={Colors.veg} colors={colors} />
      </View>

      {/* Tab Filter */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? Colors.primary : colors.surface,
                borderColor: activeTab === tab.key ? Colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab.key ? '#FFF' : colors.textSecondary },
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PaymentCard payment={item} colors={colors} onMarkPaid={() => markPaid(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState emoji="💰" title="No payments" subtitle="Payment records will appear here" />
        }
      />
    </SafeAreaView>
  );
}

const SummaryBox: React.FC<{ label: string; amount: number; color: string; colors: any }> = ({
  label, amount, color, colors,
}) => (
  <View style={[styles.summaryBox, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Text style={[styles.summaryAmount, { color }]}>{formatAmount(amount)}</Text>
    <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

const PaymentCard: React.FC<{ payment: Payment; colors: any; onMarkPaid: () => void }> = ({
  payment, colors, onMarkPaid,
}) => (
  <View style={[styles.paymentCard, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Avatar name={payment.userName} size="md" />
    <View style={styles.paymentInfo}>
      <Text style={[styles.paymentName, { color: colors.textPrimary }]}>{payment.userName}</Text>
      <Text style={[styles.paymentAmount, { color: Colors.primary }]}>
        {formatAmount(payment.amount)}
      </Text>
      {payment.weekStart && (
        <Text style={[styles.paymentPeriod, { color: colors.textTertiary }]}>
          Week of {payment.weekStart}
        </Text>
      )}
    </View>
    <View style={styles.paymentRight}>
      <Badge type={payment.paymentStatus} size="sm" />
      {payment.paymentStatus === 'pending' && (
        <TouchableOpacity style={styles.markPaidBtn} onPress={onMarkPaid}>
          <Text style={styles.markPaidText}>Mark Paid</Text>
        </TouchableOpacity>
      )}
      {payment.screenshotURL && (
        <TouchableOpacity>
          <MaterialCommunityIcons name="image-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: Spacing.screenHorizontal, paddingBottom: Spacing.sm },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.sm,
  },
  summaryBox: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  summaryAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.h2 },
  summaryLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.caption },
  tabRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
  },
  tabText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.caption },
  list: { paddingHorizontal: Spacing.screenHorizontal, gap: Spacing.sm, paddingBottom: 32 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  paymentInfo: { flex: 1, gap: 2 },
  paymentName: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  paymentAmount: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  paymentPeriod: { fontFamily: FontFamily.regular, fontSize: FontSize.caption },
  paymentRight: { alignItems: 'flex-end', gap: Spacing.xs },
  markPaidBtn: {
    backgroundColor: Colors.veg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  markPaidText: { fontFamily: FontFamily.bold, fontSize: FontSize.label, color: '#FFF' },
});
