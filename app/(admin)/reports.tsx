/**
 * Admin Reports Screen — Weekly and Monthly reports with export
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Colors } from '../../src/constants/colors';
import { FontFamily, FontSize } from '../../src/constants/typography';
import { Spacing, BorderRadius, Shadow } from '../../src/constants/spacing';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useOffice } from '../../src/context/OfficeContext';
import {
  getUsersByOffice, getUserMeals,
  getOfficeWeeklyReports,
} from '../../src/services/firebase/firestore.service';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import {
  calculateWeeklySummary, calculateMonthlySummary,
  formatAmount, formatWeekRange, formatMonth,
  toDateString, getWeekStart, getWeekEnd,
} from '../../src/utils/calculations';
import { MONTH_NAMES } from '../../src/constants/app';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { webSafeAlert } from '../../src/utils/alert';
import type { User, WeeklyReport, UserWeeklyReport } from '../../src/types';

type ReportTab = 'weekly' | 'monthly';

export default function ReportsScreen() {
  const { userProfile } = useAuth();
  const { colors } = useTheme();
  const { vegPrice, nonVegPrice } = useOffice();

  const [activeTab, setActiveTab] = useState<ReportTab>('weekly');
  const [users, setUsers] = useState<User[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadReport = useCallback(async () => {
    if (!userProfile?.officeId) return;
    setIsLoading(true);
    try {
      const officeUsers = await getUsersByOffice(userProfile.officeId);
      setUsers(officeUsers);

      // Build weekly report from meals
      const now = new Date();
      const weekStart = toDateString(getWeekStart(now));
      const weekEnd = toDateString(getWeekEnd(now));

      const userReports: UserWeeklyReport[] = await Promise.all(
        officeUsers.map(async (u) => {
          const meals = await getUserMeals(u.id, weekStart, weekEnd);
          const summary = calculateWeeklySummary(meals, vegPrice, nonVegPrice);
          return {
            userId: u.id,
            userName: u.name,
            vegDays: summary.vegDays,
            nonVegDays: summary.nonVegDays,
            skippedDays: summary.skippedDays,
            totalAmount: summary.totalAmount,
            paymentStatus: 'pending' as const,
          };
        })
      );

      const report: WeeklyReport = {
        id: `${userProfile.officeId}_${weekStart}`,
        officeId: userProfile.officeId,
        weekStart,
        weekEnd,
        generatedAt: new Date(),
        totalUsers: officeUsers.length,
        totalVeg: userReports.reduce((s, u) => s + u.vegDays, 0),
        totalNonVeg: userReports.reduce((s, u) => s + u.nonVegDays, 0),
        totalSkipped: userReports.reduce((s, u) => s + u.skippedDays, 0),
        totalPending: 0,
        totalRevenue: userReports.reduce((s, u) => s + u.totalAmount, 0),
        userReports,
      };
      setWeeklyReport(report);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, vegPrice, nonVegPrice]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const exportPDF = async () => {
    if (!weeklyReport) return;
    setIsExporting(true);
    try {
      const html = generateReportHTML(weeklyReport);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Share Weekly Report',
      });
    } catch (e) {
      webSafeAlert('Export Failed', 'Could not generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen label="Generating report..." />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Reports</Text>
          <View style={styles.exportRow}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: Colors.primary }]}
              onPress={exportPDF}
              disabled={isExporting}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFF" />
              <Text style={styles.exportBtnText}>
                {isExporting ? 'Generating...' : 'Export PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
          {(['weekly', 'monthly'] as ReportTab[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && { backgroundColor: Colors.primary }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                { color: activeTab === tab ? '#FFF' : colors.textSecondary },
              ]}>
                {tab === 'weekly' ? 'Weekly' : 'Monthly'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        {weeklyReport && (
          <View style={styles.summaryRow}>
            <SummaryCard label="Total Veg" value={weeklyReport.totalVeg} emoji="🥦" color={Colors.veg} colors={colors} />
            <SummaryCard label="Total Non-Veg" value={weeklyReport.totalNonVeg} emoji="🍗" color={Colors.nonVeg} colors={colors} />
            <SummaryCard label="Revenue" value={weeklyReport.totalRevenue} emoji="💰" color={Colors.primary} colors={colors} isAmount />
          </View>
        )}

        {/* Report Table */}
        {weeklyReport && (
          <View style={styles.tableContainer}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {formatWeekRange(weeklyReport.weekStart, weeklyReport.weekEnd)}
              </Text>
            </View>

            {/* Table Header */}
            <View style={[styles.tableHeader, { backgroundColor: Colors.primary }]}>
              <Text style={styles.thName}>Name</Text>
              <Text style={styles.th}>Veg</Text>
              <Text style={styles.th}>N-V</Text>
              <Text style={styles.th}>Skip</Text>
              <Text style={styles.thAmount}>Amount</Text>
            </View>

            {/* Table Rows */}
            {weeklyReport.userReports.map((ur, i) => (
              <View
                key={ur.userId}
                style={[
                  styles.tableRow,
                  { backgroundColor: i % 2 === 0 ? colors.surface : colors.surfaceWarm },
                ]}
              >
                <Text style={[styles.tdName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {ur.userName}
                </Text>
                <Text style={[styles.td, { color: Colors.veg }]}>{ur.vegDays}</Text>
                <Text style={[styles.td, { color: Colors.nonVeg }]}>{ur.nonVegDays}</Text>
                <Text style={[styles.td, { color: Colors.skip }]}>{ur.skippedDays}</Text>
                <Text style={[styles.tdAmount, { color: Colors.primary }]}>
                  {formatAmount(ur.totalAmount)}
                </Text>
              </View>
            ))}

            {/* Total Row */}
            <View style={[styles.tableRow, styles.totalRow, { backgroundColor: Colors.primary + '15' }]}>
              <Text style={[styles.tdName, styles.totalText, { color: Colors.primary }]}>TOTAL</Text>
              <Text style={[styles.td, styles.totalText, { color: Colors.veg }]}>{weeklyReport.totalVeg}</Text>
              <Text style={[styles.td, styles.totalText, { color: Colors.nonVeg }]}>{weeklyReport.totalNonVeg}</Text>
              <Text style={[styles.td, styles.totalText, { color: Colors.skip }]}>{weeklyReport.totalSkipped}</Text>
              <Text style={[styles.tdAmount, styles.totalText, { color: Colors.primary }]}>
                {formatAmount(weeklyReport.totalRevenue)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryCard: React.FC<{
  label: string; value: number; emoji: string; color: string; colors: any; isAmount?: boolean;
}> = ({ label, value, emoji, color, colors, isAmount }) => (
  <View style={[styles.summaryCard, { backgroundColor: colors.surface }, Shadow.sm]}>
    <Text>{emoji}</Text>
    <Text style={[styles.summaryValue, { color }]}>
      {isAmount ? formatAmount(value) : value}
    </Text>
    <Text style={[styles.summaryLabel, { color: colors.textTertiary }]}>{label}</Text>
  </View>
);

function generateReportHTML(report: WeeklyReport): string {
  const rows = report.userReports.map((u) =>
    `<tr>
      <td>${u.userName}</td>
      <td style="color:#4CAF50">${u.vegDays}</td>
      <td style="color:#8B1A1A">${u.nonVegDays}</td>
      <td>${u.skippedDays}</td>
      <td style="font-weight:bold">₹${u.totalAmount}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #1F1F1F; }
      h1 { color: #FF6B35; } h2 { color: #555; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th { background: #FF6B35; color: #FFF; padding: 10px; text-align: left; }
      td { padding: 8px 10px; border-bottom: 1px solid #f0e8df; }
      tr:nth-child(even) { background: #fff8f2; }
      .total { font-weight: bold; background: #fff3e8 !important; }
    </style></head><body>
    <h1>🍱 TiffinFlow Weekly Report</h1>
    <h2>Week: ${formatWeekRange(report.weekStart, report.weekEnd)}</h2>
    <p>Total Users: ${report.totalUsers} | Total Revenue: ₹${report.totalRevenue}</p>
    <table>
      <thead><tr><th>Name</th><th>Veg Days</th><th>Non-Veg Days</th><th>Skipped</th><th>Amount</th></tr></thead>
      <tbody>${rows}
        <tr class="total">
          <td>TOTAL</td><td>${report.totalVeg}</td><td>${report.totalNonVeg}</td>
          <td>${report.totalSkipped}</td><td>₹${report.totalRevenue}</td>
        </tr>
      </tbody>
    </table>
    <p style="color:#888; margin-top:30px; font-size:12px">Generated by TiffinFlow on ${new Date().toLocaleDateString('en-IN')}</p>
    </body></html>`;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.screenHorizontal,
    paddingBottom: Spacing.sm,
  },
  title: { fontFamily: FontFamily.bold, fontSize: FontSize.h1 },
  exportRow: { flexDirection: 'row', gap: Spacing.sm },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  exportBtnText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.bodySm, color: '#FFF' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: BorderRadius.sm,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: BorderRadius.xs, alignItems: 'center' },
  tabText: { fontFamily: FontFamily.semiBold, fontSize: FontSize.body },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 4,
    gap: 4,
  },
  summaryValue: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  summaryLabel: { fontFamily: FontFamily.medium, fontSize: FontSize.label, textAlign: 'center' },
  tableContainer: { marginHorizontal: Spacing.screenHorizontal },
  section: { marginBottom: Spacing.sm },
  sectionTitle: { fontFamily: FontFamily.bold, fontSize: FontSize.h3 },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
  },
  thName: { flex: 2, fontFamily: FontFamily.bold, fontSize: FontSize.caption, color: '#FFF' },
  th: { flex: 0.7, fontFamily: FontFamily.bold, fontSize: FontSize.caption, color: '#FFF', textAlign: 'center' },
  thAmount: { flex: 1.2, fontFamily: FontFamily.bold, fontSize: FontSize.caption, color: '#FFF', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  tdName: { flex: 2, fontFamily: FontFamily.medium, fontSize: FontSize.bodySm },
  td: { flex: 0.7, fontFamily: FontFamily.bold, fontSize: FontSize.body, textAlign: 'center' },
  tdAmount: { flex: 1.2, fontFamily: FontFamily.bold, fontSize: FontSize.bodySm, textAlign: 'right' },
  totalRow: { borderTopWidth: 2, borderTopColor: Colors.primary + '33' },
  totalText: { fontFamily: FontFamily.bold },
});
