import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Alert, RefreshControl, Linking
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MobileAPI } from '../services/api';
import { theme } from '../theme';

export const HomeScreen: React.FC<{
  onNavigateTab: (tab: 'Dashboard' | 'Services' | 'Wallet' | 'Profile') => void;
}> = ({ onNavigateTab }) => {
  const [user, setUser] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalFunded, setTotalFunded] = useState(0);
  const [vtuPurchases, setVtuPurchases] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [userRes, actRes] = await Promise.all([
        MobileAPI.getMe(),
        MobileAPI.getRecentActivity(),
      ]);
      if (userRes.success && userRes.user) {
        setUser(userRes.user);
        setWalletBalance(userRes.user.wallet_balance || 0);
        setTotalFunded(userRes.user.total_funded || 0);
        setVtuPurchases(userRes.user.vtu_purchases || 0);
      }
      if (actRes.success && actRes.activities) {
        setActivities(actRes.activities);
      }
    } catch {
      // Offline fallback
    } finally {
      setRefreshing(false);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleBiometricAuth = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert('Biometrics', 'Fingerprint or Face ID hardware not available on this device');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate with Fingerprint / Face ID'
    });
    if (result.success) {
      Alert.alert('Authenticated', 'Biometric validation succeeded.');
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {/* Top Brand Greeting Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BUKAR DATA SUB</Text>
          </View>
          <Text style={styles.greeting}>
            {getTimeGreeting()}, {user?.name ? user.name.split(' ')[0] : 'Customer'} 👋
          </Text>
          <Text style={styles.subtitle}>Welcome back to Bukar Data Sub</Text>
        </View>

        {/* Royal Blue Gradient Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Text style={{ fontSize: 18, color: '#BFDBFE' }}>{showBalance ? '👁️' : '🙈'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceText}>
            {showBalance
              ? `₦${walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '••••••••'}
          </Text>
          <Text style={styles.walletDesc}>Instant automated airtime, data, TV, and utility payments</Text>

          <View style={styles.walletButtons}>
            <TouchableOpacity
              style={styles.fundButton}
              onPress={() => onNavigateTab('Wallet')}
            >
              <Text style={styles.fundButtonText}>+ Fund Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.historyButton}
              onPress={() => onNavigateTab('Wallet')}
            >
              <Text style={styles.historyButtonText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Join Our WhatsApp Community Banner Card */}
        <TouchableOpacity
          style={styles.whatsappCommunityCard}
          onPress={() => Linking.openURL('https://wa.me/2349131797675?text=Hello%20Bukar%20Data%20Sub%20Community')}
        >
          <View style={styles.whatsappIconCircle}>
            <Text style={{ fontSize: 22 }}>💬</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.whatsappCommunityTitle}>Join Our WhatsApp Community</Text>
            <Text style={styles.whatsappCommunityDesc}>Get instant updates, exclusive offers & priority support</Text>
          </View>
          <Text style={{ fontSize: 20, color: '#10B981', fontWeight: 'bold' }}>›</Text>
        </TouchableOpacity>

        {/* QUICK ACTIONS 2-Column Squircle Grid (Matching Screenshot 4) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.quickActionsTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={styles.quickActionsGrid}>
          {[
            { label: 'Solar Bills', icon: '☀️', color: '#FFF7ED', border: '#FED7AA', action: () => onNavigateTab('Services') },
            { label: 'Buy Data', icon: '📶', color: '#EFF6FF', border: '#BFDBFE', action: () => onNavigateTab('Services') },
            { label: 'Buy Airtime', icon: '📱', color: '#ECFDF5', border: '#A7F3D0', action: () => onNavigateTab('Services') },
            { label: 'Fund Wallet', icon: '💳', color: '#EEF2FF', border: '#C7D2FE', action: () => onNavigateTab('Wallet') },
            { label: 'Airtime to Cash', icon: '🔄', color: '#F0FDFA', border: '#99F6E4', action: () => onNavigateTab('Services') },
            { label: 'Cable', icon: '📺', color: '#FAF5FF', border: '#E9D5FF', action: () => onNavigateTab('Services') },
            { label: 'Withdrawal', icon: '🏦', color: '#FFF1F2', border: '#FECDD3', action: () => onNavigateTab('Wallet') },
            { label: 'Transactions', icon: '📝', color: '#F0F9FF', border: '#BAE6FD', action: () => onNavigateTab('Wallet') },
          ].map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.squircleActionCard, { backgroundColor: '#FFFFFF' }]}
              onPress={item.action}
            >
              <View style={[styles.squircleIconBox, { backgroundColor: item.color, borderColor: item.border }]}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>
              <Text style={styles.squircleActionLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4 Usage & Stats Metric Tiles */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Total Funded</Text>
            <Text style={styles.statVal}>₦{totalFunded.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>VTU Purchases</Text>
            <Text style={styles.statVal}>₦{vtuPurchases.toLocaleString()}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Account Tier</Text>
            <Text style={[styles.statVal, { color: theme.colors.primary }]}>Tier {user?.tier || 1}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Security</Text>
            <Text style={[styles.statVal, { color: theme.colors.success }]}>ACTIVE ✓</Text>
          </View>
        </View>

        {/* Biometric Quick Unlock Banner */}
        <View style={styles.bannerCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Biometric Fast Login</Text>
            <Text style={styles.bannerDesc}>Use Fingerprint or Face ID for fast and secure access.</Text>
          </View>
          <TouchableOpacity style={styles.enableButton} onPress={handleBiometricAuth}>
            <Text style={styles.enableButtonText}>Verify</Text>
          </TouchableOpacity>
        </View>

        {/* RECENT ACTIVITY Section (Matching Screenshot 5) */}
        <View style={styles.sectionHeaderBetween}>
          <Text style={styles.quickActionsTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={() => onNavigateTab('Wallet')}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {activities.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No recent activity found. Your orders will appear here in real-time.</Text>
            </View>
          ) : (
            activities.slice(0, 6).map((act, idx) => {
              const isSuccess = act.status === 'COMPLETED' || act.status === 'SUCCESSFUL';
              const isPending = act.status === 'PENDING';
              const pillColor = isSuccess ? '#ECFDF5' : isPending ? '#FFFBEB' : '#FEF2F2';
              const pillTextColor = isSuccess ? '#059669' : isPending ? '#D97706' : '#DC2626';
              const statusText = isSuccess ? 'Success' : isPending ? 'Pending' : 'Failed';

              return (
                <View key={act.id || idx} style={styles.activityItem}>
                  <View style={styles.activityIconCircle}>
                    <Text style={{ fontSize: 18 }}>
                      {act.service_category === 'airtime' ? '📱' :
                       act.service_category === 'solar_pin' ? '☀️' :
                       act.service_category === 'electricity' ? '⚡' :
                       act.service_category === 'cable' ? '📺' : '📶'}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.activityTitle}>
                      {(act.service_category || 'VTU').toUpperCase()} - {act.biller_or_network || 'Direct'}
                    </Text>
                    <Text style={styles.activityDesc}>
                      {act.recipient} • {act.created_at ? new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.activityAmount}>₦{Number(act.charged_amount || act.amount || 0).toLocaleString()}</Text>
                    <View style={[styles.statusPill, { backgroundColor: pillColor }]}>
                      <Text style={[styles.statusPillText, { color: pillTextColor }]}>{statusText}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Need Help? Chat with our support team anytime */}
        <View style={styles.needHelpCard}>
          <Text style={styles.needHelpTitle}>Need Help?</Text>
          <Text style={styles.needHelpDesc}>Chat with our support team anytime for instant assistance.</Text>
          <TouchableOpacity
            style={styles.needHelpButton}
            onPress={() => Linking.openURL('https://wa.me/2349131797675')}
          >
            <Text style={styles.needHelpButtonText}>WhatsApp Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating WhatsApp Action Button (Pinned in bottom-right corner) */}
      <TouchableOpacity
        style={styles.floatingWhatsAppButton}
        onPress={() => Linking.openURL('https://wa.me/2349131797675?text=Hello%20Bukar%20Data%20Sub%20Support')}
      >
        <Text style={{ fontSize: 28 }}>💬</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: theme.colors.card },
  badge: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  badgeText: { color: theme.colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  greeting: { fontSize: 24, fontWeight: '900', color: theme.colors.text },
  subtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '500' },
  walletCard: { margin: 16, borderRadius: theme.borderRadius.xxl, padding: 22, backgroundColor: '#1D4ED8', ...theme.shadows.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: '#BFDBFE', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceText: { fontSize: 36, fontWeight: '900', color: theme.colors.white, marginTop: 8, letterSpacing: -0.5 },
  walletDesc: { color: '#DBEAFE', fontSize: 12, marginTop: 4, fontWeight: '500' },
  walletButtons: { flexDirection: 'row', marginTop: 18, gap: 10 },
  fundButton: { flex: 1, backgroundColor: theme.colors.white, paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  fundButtonText: { color: '#1D4ED8', fontWeight: '900', fontSize: 14 },
  historyButton: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingVertical: 12, borderRadius: 30, alignItems: 'center' },
  historyButtonText: { color: theme.colors.white, fontWeight: '800', fontSize: 14 },
  whatsappCommunityCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    padding: 16,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.sm
  },
  whatsappIconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  whatsappCommunityTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  whatsappCommunityDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  sectionHeader: { marginHorizontal: 16, marginBottom: 10, marginTop: 6 },
  sectionHeaderBetween: { marginHorizontal: 16, marginBottom: 12, marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quickActionsTitle: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 0.8 },
  viewAllText: { fontSize: 13, fontWeight: '800', color: theme.colors.primary },
  quickActionsGrid: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16
  },
  squircleActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...theme.shadows.xs
  },
  squircleIconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 10 },
  squircleActionLabel: { fontSize: 13, fontWeight: '800', color: theme.colors.text, textAlign: 'center' },
  statsGrid: { marginHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: { width: '48%', backgroundColor: theme.colors.card, padding: 14, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border },
  statLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '700' },
  statVal: { fontSize: 17, fontWeight: '900', color: theme.colors.text, marginTop: 4 },
  bannerCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: theme.colors.card, padding: 16, borderRadius: theme.borderRadius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: theme.colors.border },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text },
  bannerDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
  enableButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: theme.borderRadius.md },
  enableButtonText: { color: theme.colors.white, fontWeight: '800', fontSize: 11 },
  activityList: { marginHorizontal: 16 },
  emptyBox: { backgroundColor: theme.colors.card, padding: 24, borderRadius: theme.borderRadius.xl, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  emptyText: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', fontWeight: '500' },
  activityItem: {
    backgroundColor: theme.colors.card,
    padding: 14,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8
  },
  activityIconCircle: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text },
  activityDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  activityAmount: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginTop: 4 },
  statusPillText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  needHelpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    padding: 18,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  needHelpTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  needHelpDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  needHelpButton: {
    marginTop: 12,
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center'
  },
  needHelpButtonText: { color: theme.colors.white, fontWeight: '800', fontSize: 13 },
  floatingWhatsAppButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  }
});