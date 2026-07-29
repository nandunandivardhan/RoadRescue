import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, StatusBar, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import useUserStore from '../../store/useUserStore';
import useRequestStore from '../../store/useRequestStore';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../utils/theme';
import { formatCurrency } from '../../utils/helpers';
import CustomButton from '../../components/CustomButton';

const { width } = Dimensions.get('window');

const TABS = ['This Week', 'This Month', 'All Time'];

const EarningsScreen = ({ navigation }) => {
  const { profile } = useUserStore();
  const { requestHistory, fetchHistory, isLoading } = useRequestStore();
  const [activeTab, setActiveTab] = useState('This Week');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    todaysEarnings: 0,
    pendingPayouts: 0,
    paidOut: 0,
    jobsCompleted: 0,
  });
  const [chartData, setChartData] = useState(null);
  const [barData, setBarData] = useState(null);

  useEffect(() => {
    if (profile?.uid) {
      fetchHistory(profile.uid, 'mechanic');
    }
  }, [profile?.uid]);

  useEffect(() => {
    // Process data when history or tab changes
    processData();
  }, [requestHistory, activeTab]);

  const processData = () => {
    if (!requestHistory) return;

    const completed = requestHistory.filter(r => r.status === 'completed');
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Filter by tab
    let filtered = completed;
    if (activeTab === 'This Week') {
      const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      filtered = completed.filter(r => r.completedAt?.toMillis() >= oneWeekAgo);
    } else if (activeTab === 'This Month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      filtered = completed.filter(r => r.completedAt?.toMillis() >= startOfMonth);
    }
    
    setFilteredHistory(filtered);

    // Calculate stats
    let totalE = 0;
    let todayE = 0;
    let pending = 0;
    let paid = 0;

    // Service types for bar chart
    const serviceCounts = {};
    // Last 7 days for line chart
    const last7Days = Array(7).fill(0);
    const dayLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    filtered.forEach(req => {
      const cost = req.finalCost || req.estimatedCost || 0;
      totalE += cost;
      
      const reqTime = req.completedAt?.toMillis() || 0;
      if (reqTime >= today) todayE += cost;

      if (req.paymentStatus === 'paid') paid += cost;
      else pending += cost;

      // Group by service type
      const type = (req.issueType || 'other').split('_')[0].substring(0, 5); // abbreviate
      serviceCounts[type] = (serviceCounts[type] || 0) + 1;

      // Group by day for line chart (only if 'This Week' or we just show last 7 days regardless)
      if (activeTab === 'This Week') {
        const diffDays = Math.floor((now.getTime() - reqTime) / (24 * 60 * 60 * 1000));
        if (diffDays >= 0 && diffDays < 7) {
          last7Days[6 - diffDays] += cost;
        }
      }
    });

    setStats({
      totalEarnings: totalE,
      todaysEarnings: todayE,
      pendingPayouts: pending,
      paidOut: paid,
      jobsCompleted: filtered.length,
    });

    // Set chart data
    if (activeTab === 'This Week') {
      setChartData({
        labels: dayLabels,
        datasets: [{ data: last7Days.length > 0 && Math.max(...last7Days) > 0 ? last7Days : [0,0,0,0,0,0,0] }],
      });
    } else {
      setChartData(null); // Simplify: only show line chart for 'This Week'
    }

    const barLabels = Object.keys(serviceCounts);
    const barValues = Object.values(serviceCounts);
    if (barLabels.length > 0) {
      setBarData({
        labels: barLabels,
        datasets: [{ data: barValues }],
      });
    } else {
      setBarData(null);
    }
  };

  const handleExportPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Earnings Report (${activeTab})</h1>
          <p>Mechanic: ${profile?.name || 'Unknown'}</p>
          <p>Total Jobs: ${stats.jobsCompleted}</p>
          <div class="total">Total Earnings: ${formatCurrency(stats.totalEarnings)}</div>
          
          <table>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Service</th>
              <th>Amount</th>
            </tr>
            ${filteredHistory.map(req => `
              <tr>
                <td>${req.completedAt ? new Date(req.completedAt.toMillis()).toLocaleDateString() : 'N/A'}</td>
                <td>${req.customerName || 'N/A'}</td>
                <td>${(req.issueType || 'Other').replace('_', ' ')}</td>
                <td>${formatCurrency(req.finalCost || req.estimatedCost || 0)}</td>
              </tr>
            `).join('')}
          </table>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const renderJobItem = ({ item }) => (
    <View style={s.jobCard}>
      <View style={s.jobIcon}>
        <MaterialCommunityIcons name="check-circle" size={24} color={COLORS.success} />
      </View>
      <View style={s.jobInfo}>
        <Text style={s.jobCustomer}>{item.customerName || 'Unknown Customer'}</Text>
        <Text style={s.jobService}>{(item.issueType || 'Service').replace('_', ' ').toUpperCase()}</Text>
        <Text style={s.jobDate}>{item.completedAt ? new Date(item.completedAt.toMillis()).toLocaleDateString() : 'N/A'}</Text>
      </View>
      <View style={s.jobAmountContainer}>
        <Text style={s.jobAmount}>+{formatCurrency(item.finalCost || item.estimatedCost || 0)}</Text>
        <Text style={[s.jobStatus, { color: item.paymentStatus === 'paid' ? COLORS.success : COLORS.warning }]}>
          {item.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.secondary} />
      
      {/* Header */}
      <LinearGradient colors={[COLORS.secondary, COLORS.secondaryDark]} style={s.header}>
        <View style={s.headerTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Earnings</Text>
          <TouchableOpacity onPress={handleExportPDF} style={s.exportBtn}>
            <MaterialCommunityIcons name="file-download-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={s.todayLabel}>Today's Earnings</Text>
        <Text style={s.todayValue}>{formatCurrency(stats.todaysEarnings)}</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[s.tab, activeTab === tab && s.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[s.tabText, activeTab === tab && s.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        
        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Total {activeTab}</Text>
            <Text style={s.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statLabel}>Jobs Done</Text>
            <Text style={s.statValue}>{stats.jobsCompleted}</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: COLORS.successLight }]}>
            <Text style={s.statLabel}>Paid Out</Text>
            <Text style={[s.statValue, { color: COLORS.success }]}>{formatCurrency(stats.paidOut)}</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: COLORS.warningLight }]}>
            <Text style={s.statLabel}>Pending</Text>
            <Text style={[s.statValue, { color: COLORS.warning }]}>{formatCurrency(stats.pendingPayouts)}</Text>
          </View>
        </View>

        {/* Charts */}
        {chartData && (
          <View style={s.chartContainer}>
            <Text style={s.sectionTitle}>Earnings Overview</Text>
            <LineChart
              data={chartData}
              width={width - SIZES.screenPadding * 2}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={s.chart}
            />
          </View>
        )}

        {barData && (
          <View style={s.chartContainer}>
            <Text style={s.sectionTitle}>Services Provided</Text>
            <BarChart
              data={barData}
              width={width - SIZES.screenPadding * 2}
              height={220}
              yAxisLabel=""
              chartConfig={chartConfig}
              style={s.chart}
              showValuesOnTopOfBars
            />
          </View>
        )}

        {/* List */}
        <Text style={[s.sectionTitle, { marginTop: SIZES.lg }]}>Recent Transactions</Text>
        
        {filteredHistory.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="cash-remove" size={60} color={COLORS.border} />
            <Text style={s.emptyTitle}>No Earnings Yet</Text>
            <Text style={s.emptySub}>Complete jobs to see your earnings here.</Text>
          </View>
        ) : (
          filteredHistory.map(req => <View key={req.id}>{renderJobItem({ item: req })}</View>)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const chartConfig = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(105, 240, 174, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: { borderRadius: 16 },
  propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.secondary },
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: SIZES.xxl, paddingHorizontal: SIZES.screenPadding, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  exportBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: SIZES.h3, color: '#FFF', ...FONTS.bold },
  todayLabel: { fontSize: SIZES.body, color: 'rgba(255,255,255,0.8)', ...FONTS.medium, textAlign: 'center', marginTop: SIZES.xl },
  todayValue: { fontSize: 48, color: '#FFF', ...FONTS.black, textAlign: 'center', marginTop: SIZES.xs },
  
  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.surface, marginHorizontal: SIZES.screenPadding, marginTop: -25, borderRadius: SIZES.borderRadius, padding: 4, ...SHADOWS.medium },
  tab: { flex: 1, paddingVertical: SIZES.sm, alignItems: 'center', borderRadius: SIZES.borderRadiusSm },
  activeTab: { backgroundColor: COLORS.secondaryLight },
  tabText: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.medium },
  activeTabText: { color: COLORS.secondary, ...FONTS.bold },
  
  scrollContent: { paddingHorizontal: SIZES.screenPadding, paddingTop: SIZES.xl },
  statsRow: { flexDirection: 'row', gap: SIZES.md, marginBottom: SIZES.md },
  statCard: { flex: 1, backgroundColor: COLORS.surface, padding: SIZES.md, borderRadius: SIZES.borderRadius, ...SHADOWS.small },
  statLabel: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.medium, marginBottom: 4 },
  statValue: { fontSize: SIZES.h3, color: COLORS.textPrimary, ...FONTS.bold },
  
  chartContainer: { marginTop: SIZES.lg },
  sectionTitle: { fontSize: SIZES.h4, color: COLORS.textPrimary, ...FONTS.bold, marginBottom: SIZES.md },
  chart: { borderRadius: 16, ...SHADOWS.small },
  
  jobCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, padding: SIZES.md, borderRadius: SIZES.borderRadius, marginBottom: SIZES.sm, ...SHADOWS.small },
  jobIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.successLight, alignItems: 'center', justifyContent: 'center' },
  jobInfo: { flex: 1, marginLeft: SIZES.md },
  jobCustomer: { fontSize: SIZES.bodySmall, color: COLORS.textPrimary, ...FONTS.semiBold },
  jobService: { fontSize: SIZES.caption, color: COLORS.textSecondary, ...FONTS.medium, marginTop: 2 },
  jobDate: { fontSize: 10, color: COLORS.textTertiary, ...FONTS.regular, marginTop: 2 },
  jobAmountContainer: { alignItems: 'flex-end' },
  jobAmount: { fontSize: SIZES.body, color: COLORS.textPrimary, ...FONTS.bold },
  jobStatus: { fontSize: SIZES.tiny, ...FONTS.medium, marginTop: 2 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: SIZES.h4, color: COLORS.textSecondary, ...FONTS.semiBold, marginTop: SIZES.md },
  emptySub: { fontSize: SIZES.bodySmall, color: COLORS.textTertiary, ...FONTS.regular, marginTop: 4 },
});

export default EarningsScreen;
