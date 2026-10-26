import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, RefreshControl, Clipboard
} from 'react-native';
import { MobileAPI } from '../services/api';
import { theme } from '../theme';

export const WalletScreen: React.FC = () => {
  const [wallet, setWallet] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('Access Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transactionPin, setTransactionPin] = useState('');

  // Selected ledger receipt modal
  const [selectedTxn, setSelectedTxn] = useState<any>(null);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setRefreshing(true);
      const [walletRes, ledgerRes] = await Promise.all([
        MobileAPI.getWallet(),
        MobileAPI.getLedger(30, 0),
      ]);
      if (walletRes.success) {
        setWallet(walletRes);
      }
      if (ledgerRes.success && ledgerRes.entries) {
        setLedger(ledgerRes.entries);
      }
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  const handleWithdraw = async () => {
    const amt = Number(withdrawAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }
    if (!accountNumber || accountNumber.length !== 10) {
      Alert.alert('Invalid Account', 'Please enter a 10-digit NUBAN account number.');
      return;
    }
    if (!accountName) {
      Alert.alert('Missing Name', 'Please enter the exact bank account holder name.');
      return;
    }
    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('PIN Required', 'Please enter your 4-digit transaction PIN.');
      return;
    }

    try {
      setLoadingWithdraw(true);
      const res = await MobileAPI.requestWithdrawal({
        amount: amt,
        bankName,
        bankCode: '044',
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        transactionPin: transactionPin.trim(),
      });

      if (res.success) {
        Alert.alert('Withdrawal Submitted', res.message || 'Your payout request has been queued for processing.');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountNumber('');
        setAccountName('');
        setTransactionPin('');
        loadWalletData();
      }
    } catch (err: any) {
      Alert.alert('Withdrawal Failed', err.message || 'Unable to submit cashout request.');
    } finally {
      setLoadingWithdraw(false);
    }
  };

  const filteredLedger = ledger.filter(item => {
    if (filterType === 'ALL') return true;
    return item.entry_type === filterType;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadWalletData} />}
    >
      {/* Wallet Balance Hero Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletTop}>
          <Text style={styles.walletLabel}>Central Available Balance</Text>
          <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
            <Text style={styles.eyeIcon}>{showBalance ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.balanceText}>
          {showBalance
            ? `₦${(wallet?.balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '••••••••'}
        </Text>

        <View style={styles.commissionPill}>
          <Text style={styles.commissionText}>
            Affiliate Commission: ₦{(wallet?.commission_balance ?? 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.cardBtnWhite}
            onPress={() => Alert.alert('Automated Funding', 'Transfer to your dedicated virtual account below for instant automated crediting.')}
          >
            <Text style={styles.cardBtnWhiteText}>+ Add Funds</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cardBtnOutline}
            onPress={() => setShowWithdrawModal(true)}
          >
            <Text style={styles.cardBtnOutlineText}>Cashout to Bank</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dedicated Virtual Bank Accounts */}
      <View style={styles.bankCard}>
        <View style={styles.bankHeader}>
          <Text style={styles.bankTitle}>Automated Bank Transfer Deposit</Text>
          <View style={styles.autoPill}><Text style={styles.autoText}>Instant Credit</Text></View>
        </View>
        <Text style={styles.bankDesc}>
          Any funds transferred to this dedicated virtual account will instantly reflect in your wallet balance.
        </Text>

        <View style={styles.accountBox}>
          <View>
            <Text style={styles.accountBank}>WEMA BANK / MONNIFY</Text>
            <Text style={styles.accountNumber}>
              {wallet?.virtual_account_number || '8012345678'}
            </Text>
            <Text style={styles.accountHolder}>
              {wallet?.virtual_account_name || 'BUKAR DATA SUB / MOHAMMED ADAMU'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopy(wallet?.virtual_account_number || '8012345678', 'Account Number')}
          >
            <Text style={styles.copyText}>Copy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ledger & Transactions */}
      <View style={styles.ledgerSection}>
        <View style={styles.ledgerHeader}>
          <Text style={styles.ledgerTitle}>Transaction Ledger</Text>
          <View style={styles.filterTabs}>
            {(['ALL', 'CREDIT', 'DEBIT'] as const).map(f => (
              <TouchableOpacity
                key={f}
                style={[styles.filterTab, filterType === f && styles.filterTabActive]}
                onPress={() => setFilterType(f)}
              >
                <Text style={[styles.filterTabText, filterType === f && styles.filterTabTextActive]}>
                  {f === 'ALL' ? 'All' : f === 'CREDIT' ? 'Inflows' : 'Outflows'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {filteredLedger.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
            <Text style={styles.emptyDesc}>Your purchases and funding events will appear here in real-time.</Text>
          </View>
        ) : (
          filteredLedger.map((item, idx) => {
            const isCredit = item.entry_type === 'CREDIT';
            return (
              <TouchableOpacity
                key={item.id || idx}
                style={styles.txnItem}
                onPress={() => setSelectedTxn(item)}
              >
                <View style={[styles.txnIconBox, { backgroundColor: isCredit ? theme.colors.successLight : theme.colors.dangerLight }]}>
                  <Text style={{ fontSize: 16, color: isCredit ? theme.colors.success : theme.colors.danger, fontWeight: 'bold' }}>
                    {isCredit ? '↓' : '↑'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txnCategory}>{item.category?.replace(/_/g, ' ') || 'VTU PURCHASE'}</Text>
                  <Text style={styles.txnDate}>{item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txnAmount, { color: isCredit ? theme.colors.success : theme.colors.text }]}>
                    {isCredit ? '+' : '-'}₦{item.amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.txnBalance}>Bal: ₦{item.balance_after?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Cashout Modal */}
      <Modal visible={showWithdrawModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Withdraw to Bank Account</Text>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Select Destination Bank</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Access Bank, Zenith, Kuda"
              value={bankName}
              onChangeText={setBankName}
            />

            <Text style={styles.fieldLabel}>10-Digit Account Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0123456789"
              keyboardType="numeric"
              maxLength={10}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            <Text style={styles.fieldLabel}>Verified Account Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Must match your verified profile name"
              value={accountName}
              onChangeText={setAccountName}
            />

            <Text style={styles.fieldLabel}>Withdrawal Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5000"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            <Text style={styles.fieldLabel}>4-Digit Transaction PIN</Text>
            <TextInput
              style={[styles.input, { letterSpacing: 8, textAlign: 'center', fontWeight: 'bold' }]}
              placeholder="••••"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={transactionPin}
              onChangeText={setTransactionPin}
            />

            <TouchableOpacity
              style={[styles.primaryBtn, loadingWithdraw && styles.btnDisabled]}
              onPress={handleWithdraw}
              disabled={loadingWithdraw}
            >
              {loadingWithdraw ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm Cashout Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ledger Item Detail Modal */}
      <Modal visible={Boolean(selectedTxn)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ledger Audit Details</Text>
              <TouchableOpacity onPress={() => setSelectedTxn(null)}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.detailRow}><Text style={styles.detailLabel}>Reference:</Text><Text style={styles.detailVal}>{selectedTxn?.reference || '-'}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Entry Type:</Text><Text style={styles.detailVal}>{selectedTxn?.entry_type}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Category:</Text><Text style={styles.detailVal}>{selectedTxn?.category}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Amount:</Text><Text style={[styles.detailVal, { fontWeight: 'black', color: theme.colors.primary }]}>₦{selectedTxn?.amount?.toLocaleString()}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Balance Before:</Text><Text style={styles.detailVal}>₦{selectedTxn?.balance_before?.toLocaleString()}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Balance After:</Text><Text style={styles.detailVal}>₦{selectedTxn?.balance_after?.toLocaleString()}</Text></View>
            <View style={styles.detailRow}><Text style={styles.detailLabel}>Timestamp:</Text><Text style={styles.detailVal}>{selectedTxn?.created_at}</Text></View>

            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: 20 }]}
              onPress={() => setSelectedTxn(null)}
            >
              <Text style={styles.primaryBtnText}>Close Receipt</Text>
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
  walletCard: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.xxl, padding: theme.spacing.xl, marginBottom: theme.spacing.lg, ...theme.shadows.md },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletLabel: { color: '#BFDBFE', fontSize: 13, fontWeight: '600' },
  eyeIcon: { fontSize: 18 },
  balanceText: { fontSize: 32, fontWeight: '900', color: theme.colors.white, marginTop: 8 },
  commissionPill: { backgroundColor: 'rgba(255, 255, 255, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  commissionText: { color: '#EFF6FF', fontSize: 11, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cardBtnWhite: { flex: 1, backgroundColor: theme.colors.white, paddingVertical: 12, borderRadius: theme.borderRadius.lg, alignItems: 'center' },
  cardBtnWhiteText: { color: theme.colors.primary, fontWeight: '900', fontSize: 13 },
  cardBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#93C5FD', paddingVertical: 12, borderRadius: theme.borderRadius.lg, alignItems: 'center' },
  cardBtnOutlineText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 13 },
  bankCard: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, marginBottom: theme.spacing.lg, ...theme.shadows.sm },
  bankHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bankTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.text },
  autoPill: { backgroundColor: theme.colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  autoText: { color: theme.colors.success, fontSize: 10, fontWeight: 'bold' },
  bankDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, marginBottom: 12 },
  accountBox: { backgroundColor: theme.colors.background, padding: 12, borderRadius: theme.borderRadius.md, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountBank: { fontSize: 10, fontWeight: '800', color: theme.colors.textSecondary },
  accountNumber: { fontSize: 18, fontWeight: '900', color: theme.colors.primary, letterSpacing: 1, marginVertical: 2 },
  accountHolder: { fontSize: 10, fontWeight: 'bold', color: theme.colors.text },
  copyButton: { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  copyText: { color: theme.colors.white, fontSize: 11, fontWeight: 'bold' },
  ledgerSection: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.sm },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ledgerTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.text },
  filterTabs: { flexDirection: 'row', gap: 4, backgroundColor: theme.colors.background, padding: 2, borderRadius: 8 },
  filterTab: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  filterTabActive: { backgroundColor: theme.colors.primary },
  filterTabText: { fontSize: 10, fontWeight: 'bold', color: theme.colors.textSecondary },
  filterTabTextActive: { color: theme.colors.white },
  txnItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: theme.colors.borderLight },
  txnIconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  txnCategory: { fontSize: 12, fontWeight: 'bold', color: theme.colors.text },
  txnDate: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 13, fontWeight: '900' },
  txnBalance: { fontSize: 9, color: theme.colors.textSecondary, marginTop: 2 },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 14, fontWeight: 'bold', color: theme.colors.text },
  emptyDesc: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.card, borderTopLeftRadius: theme.borderRadius.xxl, borderTopRightRadius: theme.borderRadius.xxl, padding: theme.spacing.xl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: theme.colors.text },
  closeText: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textSecondary },
  fieldLabel: { fontSize: 11, fontWeight: 'bold', color: theme.colors.text, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.lg, alignItems: 'center', marginTop: 20, ...theme.shadows.md },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: theme.colors.white, fontWeight: 'bold', fontSize: 13 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: theme.colors.borderLight },
  detailLabel: { fontSize: 11, color: theme.colors.textSecondary, fontWeight: '500' },
  detailVal: { fontSize: 11, color: theme.colors.text, fontWeight: 'bold' }
});
