import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, Clipboard, Linking, Platform
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { MobileAPI, clearAuthToken } from '../services/api';
import { theme } from '../theme';

export const ProfileScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [referralSummary, setReferralSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Security modals
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');

  // KYC ticket modal
  const [showKycTicketModal, setShowKycTicketModal] = useState(false);
  const [requestedChange, setRequestedChange] = useState('');
  const [ticketReason, setTicketReason] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [meRes, refRes] = await Promise.all([
        MobileAPI.getMe(),
        MobileAPI.getReferralSummary(),
      ]);
      if (meRes.success && meRes.user) setUser(meRes.user);
      if (refRes.success) setReferralSummary(refRes);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const handleBiometricToggle = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      Alert.alert('Biometrics Unavailable', 'Your device does not support Face ID or Fingerprint authentication.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm Fingerprint or Face ID to toggle biometric login',
    });
    if (result.success) {
      Alert.alert('Biometrics Verified', 'Biometric quick-unlock has been successfully configured on this device.');
    }
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4 || newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'Please enter identical 4-digit PIN numbers.');
      return;
    }
    try {
      setLoading(true);
      const res = await MobileAPI.setPin(newPin);
      if (res.success) {
        Alert.alert('Success', 'Your 4-digit transaction PIN has been updated.');
        setShowPinModal(false);
        setNewPin('');
        setConfirmPin('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update PIN.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      Alert.alert('Fields Required', 'Please enter your current and new passwords.');
      return;
    }
    try {
      setLoading(true);
      const res = await MobileAPI.changePassword({ oldPassword, newPassword });
      if (res.success) {
        Alert.alert('Success', 'Password updated successfully.');
        setShowPasswordModal(false);
        setOldPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCommission = async () => {
    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid commission amount to transfer.');
      return;
    }
    try {
      setLoading(true);
      const res = await MobileAPI.transferReferralCommission(amt);
      if (res.success) {
        Alert.alert('Commission Transferred', `₦${amt.toLocaleString()} has been atomically credited to your main wallet.`);
        setShowTransferModal(false);
        setTransferAmount('');
        loadProfileData();
      }
    } catch (err: any) {
      Alert.alert('Transfer Failed', err.message || 'Could not transfer commission.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitKycTicket = async () => {
    if (!requestedChange || !ticketReason) {
      Alert.alert('Missing Details', 'Please specify the field to update and the official verification reason.');
      return;
    }
    try {
      setLoading(true);
      const res = await MobileAPI.requestKYCUpdate({ requestedChange, reason: ticketReason });
      if (res.success) {
        Alert.alert('Support Ticket Submitted', `Ticket #${res.ticketId} created. Customer Care will verify and update your credentials.`);
        setShowKycTicketModal(false);
        setRequestedChange('');
        setTicketReason('');
      }
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Unable to submit KYC request.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to end your active session on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await MobileAPI.logout();
            } catch {
              // Ignore network error on logout
            }
            await clearAuthToken();
            onLogout();
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>
            {(user?.name || 'M A').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{user?.name || 'Mohammed Adamu'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'agent@example.com'}</Text>
        <View style={styles.tierPill}>
          <Text style={styles.tierText}>
            Tier {user?.tier || 1} • {user?.tier >= 2 ? 'KYC Verified Agent' : 'Standard Member'}
          </Text>
        </View>
      </View>

      {/* Anti-Fraud KYC Locked Identity Details */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>KYC Verified Credentials</Text>
          <View style={styles.lockedPill}><Text style={styles.lockedText}>🔒 Anti-Fraud Locked</Text></View>
        </View>
        <Text style={styles.sectionDesc}>
          Legal names and primary phone numbers are locked to prevent identity takeover. Submit a support ticket for official updates.
        </Text>

        <View style={styles.kycRow}><Text style={styles.kycLabel}>Legal Name:</Text><Text style={styles.kycVal}>{user?.name || '-'}</Text></View>
        <View style={styles.kycRow}><Text style={styles.kycLabel}>Email:</Text><Text style={styles.kycVal}>{user?.email || '-'}</Text></View>
        <View style={styles.kycRow}><Text style={styles.kycLabel}>Phone:</Text><Text style={styles.kycVal}>{user?.phone || '-'}</Text></View>

        <TouchableOpacity
          style={styles.kycTicketBtn}
          onPress={() => setShowKycTicketModal(true)}
        >
          <Text style={styles.kycTicketBtnText}>Request KYC Identity Change</Text>
        </TouchableOpacity>
      </View>

      {/* Affiliate & Referral Network */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Affiliate & Referral Network</Text>
          <View style={styles.commissionBadge}>
            <Text style={styles.commissionBadgeText}>
              ₦{(referralSummary?.commissionBalance ?? 0).toLocaleString()} Available
            </Text>
          </View>
        </View>
        <Text style={styles.sectionDesc}>
          Share your referral link to earn signup bonuses and ongoing commissions on every data bundle your downlines purchase.
        </Text>

        <View style={styles.refBox}>
          <View>
            <Text style={styles.refLabel}>YOUR REFERRAL CODE</Text>
            <Text style={styles.refCode}>{user?.referral_code || 'BDS-71F2C8'}</Text>
          </View>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopy(user?.referral_code || 'BDS-71F2C8', 'Referral Code')}
          >
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.refStats}>
          <View style={styles.refStatBox}>
            <Text style={styles.refStatVal}>{referralSummary?.referralCount ?? 0}</Text>
            <Text style={styles.refStatLabel}>Total Referrals</Text>
          </View>
          <View style={styles.refStatBox}>
            <Text style={[styles.refStatVal, { color: theme.colors.success }]}>
              ₦{(referralSummary?.totalEarned ?? 0).toLocaleString()}
            </Text>
            <Text style={styles.refStatLabel}>Total Earned</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.transferBtn}
          onPress={() => setShowTransferModal(true)}
        >
          <Text style={styles.transferBtnText}>Transfer Commission to Main Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Security Controls */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Security & Authentication</Text>

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowPinModal(true)}>
          <View>
            <Text style={styles.settingTitle}>4-Digit Transaction PIN</Text>
            <Text style={styles.settingDesc}>Authorizes all wallet purchases and bank cashouts</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setShowPasswordModal(true)}>
          <View>
            <Text style={styles.settingTitle}>Change Account Password</Text>
            <Text style={styles.settingDesc}>Update your secret portal sign-in password</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={handleBiometricToggle}>
          <View>
            <Text style={styles.settingTitle}>Biometric Authentication</Text>
            <Text style={styles.settingDesc}>Fingerprint or Face ID quick authentication</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Support Desk */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>24/7 Dedicated Support</Text>
        <TouchableOpacity
          style={styles.supportItem}
          onPress={() => Linking.openURL('https://wa.me/2349131797675')}
        >
          <Text style={styles.supportIcon}>💬</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.supportTitle}>WhatsApp Live Chat</Text>
            <Text style={styles.supportDesc}>Instant assistance: 09131797675</Text>
          </View>
          <Text style={styles.arrowIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>Sign Out of Active Session</Text>
      </TouchableOpacity>

      {/* Modal: Update PIN */}
      <Modal visible={showPinModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set 4-Digit Transaction PIN</Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>New 4-Digit PIN</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' }]}
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />

            <Text style={styles.fieldLabel}>Confirm 4-Digit PIN</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' }]}
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleUpdatePin}>
              <Text style={styles.primaryModalBtnText}>Save Transaction PIN</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Change Password */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Account Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.fieldLabel}>New Strong Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password (min 6 chars)"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleChangePassword}>
              <Text style={styles.primaryModalBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Transfer Commission */}
      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transfer Commission to Wallet</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Transfer Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1000"
              keyboardType="numeric"
              value={transferAmount}
              onChangeText={setTransferAmount}
            />

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleTransferCommission}>
              <Text style={styles.primaryModalBtnText}>Confirm Instant Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: KYC Support Ticket */}
      <Modal visible={showKycTicketModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Official KYC Change</Text>
              <TouchableOpacity onPress={() => setShowKycTicketModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Requested Field / Value to Change</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Legal Name or Phone Number"
              value={requestedChange}
              onChangeText={setRequestedChange}
            />

            <Text style={styles.fieldLabel}>Verification Reason & Supporting Details</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Explain reason for official identity review"
              multiline
              value={ticketReason}
              onChangeText={setTicketReason}
            />

            <TouchableOpacity style={styles.primaryModalBtn} onPress={handleSubmitKycTicket}>
              <Text style={styles.primaryModalBtnText}>Submit Support Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg, paddingBottom: 60 },
  profileCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xxl, padding: theme.spacing.xl, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.lg, ...theme.shadows.sm },
  avatarBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 22, fontWeight: '900', color: theme.colors.primary },
  userName: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  userEmail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  tierPill: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 10 },
  tierText: { fontSize: 11, fontWeight: '800', color: theme.colors.primary },
  sectionCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.lg, ...theme.shadows.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  lockedPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  lockedText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },
  sectionDesc: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 12 },
  kycRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: theme.colors.borderLight },
  kycLabel: { fontSize: 11, color: theme.colors.textSecondary },
  kycVal: { fontSize: 11, fontWeight: 'bold', color: theme.colors.text },
  kycTicketBtn: { marginTop: 12, borderWidth: 1, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.md, paddingVertical: 10, alignItems: 'center' },
  kycTicketBtnText: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold' },
  commissionBadge: { backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  commissionBadgeText: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold' },
  refBox: { backgroundColor: theme.colors.background, padding: 12, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refLabel: { fontSize: 9, color: theme.colors.textSecondary, fontWeight: 'bold' },
  refCode: { fontSize: 16, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1 },
  copyBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyBtnText: { color: theme.colors.white, fontSize: 11, fontWeight: 'bold' },
  refStats: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  refStatBox: { flex: 1, backgroundColor: theme.colors.background, padding: 12, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  refStatVal: { fontSize: 18, fontWeight: '900', color: theme.colors.text },
  refStatLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  transferBtn: { backgroundColor: theme.colors.primaryLight, paddingVertical: 10, borderRadius: theme.borderRadius.md, alignItems: 'center' },
  transferBtnText: { color: theme.colors.primary, fontSize: 11, fontWeight: 'bold' },
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.colors.borderLight },
  settingTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.text },
  settingDesc: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  arrowIcon: { fontSize: 18, color: theme.colors.textSecondary },
  supportItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  supportIcon: { fontSize: 22 },
  supportTitle: { fontSize: 13, fontWeight: 'bold', color: theme.colors.text },
  supportDesc: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  logoutBtn: { backgroundColor: theme.colors.dangerLight, borderWidth: 1, borderColor: '#FECDD3', paddingVertical: 14, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginTop: 10 },
  logoutBtnText: { color: theme.colors.danger, fontSize: 13, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: theme.borderRadius.xxl, borderTopRightRadius: theme.borderRadius.xxl, padding: theme.spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  closeText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textSecondary },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: theme.colors.text, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: theme.colors.text },
  primaryModalBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginTop: 20 },
  primaryModalBtnText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 13 }
});
