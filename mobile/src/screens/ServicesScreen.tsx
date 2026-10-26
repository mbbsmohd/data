import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal
} from 'react-native';
import { MobileAPI } from '../services/api';
import { theme } from '../theme';

export const ServicesScreen: React.FC<{ onNavigateToWallet?: () => void }> = () => {
  const [activeModal, setActiveModal] = useState<
    'none' | 'data' | 'airtime' | 'cable' | 'electricity' | 'exam' | 'solar'
  >('none');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedCustomerName, setVerifiedCustomerName] = useState<string | null>(null);

  // Common VTU form state
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Success Receipt State
  const [receipt, setReceipt] = useState<any>(null);

  // Load plans whenever data modal opens or network changes
  useEffect(() => {
    if (activeModal === 'data') {
      loadDataPlans(selectedNetwork);
    }
  }, [activeModal, selectedNetwork]);

  const loadDataPlans = async (net: string) => {
    try {
      setLoading(true);
      const res = await MobileAPI.getPlans(net);
      if (res.success && res.plans) {
        setPlans(res.plans);
        setSelectedPlan(res.plans[0] || null);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCustomer = async (category: string, biller: string, customerId: string) => {
    if (!customerId) return;
    try {
      setVerifying(true);
      const res = await MobileAPI.verifyCustomer(category, biller, customerId);
      if (res.success && res.customerName) {
        setVerifiedCustomerName(res.customerName);
      } else {
        setVerifiedCustomerName(null);
      }
    } catch {
      setVerifiedCustomerName(null);
    } finally {
      setVerifying(false);
    }
  };

  const handlePurchase = async (category: string, billerOrNetwork: string, planCode?: string) => {
    if (!recipient) {
      Alert.alert('Missing Field', 'Please enter recipient phone / meter / smartcard number.');
      return;
    }
    const finalAmount = category === 'data' ? (selectedPlan?.amount || 0) : Number(amount);
    if (!finalAmount || finalAmount <= 0) {
      Alert.alert('Missing Amount', 'Please select a valid plan or enter an amount.');
      return;
    }
    if (!transactionPin || transactionPin.length !== 4) {
      Alert.alert('PIN Required', 'Please enter your 4-digit transaction PIN.');
      return;
    }

    try {
      setLoading(true);
      const res = await MobileAPI.purchaseVTU({
        category,
        billerOrNetwork,
        planCode: category === 'data' ? selectedPlan?.plan_code : planCode,
        recipient: recipient.trim(),
        amount: finalAmount,
        transactionPin: transactionPin.trim()
      });

      if (res.success) {
        setReceipt({
          category,
          billerOrNetwork,
          recipient: recipient.trim(),
          amount: finalAmount,
          reference: res.reference,
          token: res.token || res.pin,
          date: new Date().toLocaleString()
        });
        setActiveModal('none');
        setTransactionPin('');
        setRecipient('');
        setAmount('');
        setVerifiedCustomerName(null);
      }
    } catch (err: any) {
      Alert.alert('Transaction Failed', err.message || 'Could not complete VTU service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Digital & Telecom Services</Text>
        <Text style={styles.headerSubtitle}>Instant delivery with automated failover and transaction receipts</Text>
      </View>

      {/* Services Grid */}
      <View style={styles.grid}>
        {[
          { id: 'data', title: 'Data Bundles', desc: 'MTN, Airtel, Glo, 9mobile SME & CG', icon: '📶', color: '#EFF6FF', textColor: '#1E5BF9' },
          { id: 'airtime', title: 'Airtime Top-Up', desc: 'Instant recharge with up to 3% discount', icon: '📱', color: '#FAF5FF', textColor: '#7E22CE' },
          { id: 'electricity', title: 'Electricity Bills', desc: 'Prepaid & Postpaid token generation', icon: '⚡', color: '#FFFBEB', textColor: '#D97706' },
          { id: 'cable', title: 'Cable TV Renewal', desc: 'DSTV, GOTV & Startimes packages', icon: '📺', color: '#F0FDF4', textColor: '#16A34A' },
          { id: 'exam', title: 'Exam PINs', desc: 'WAEC & NECO registration scratch cards', icon: '🎓', color: '#ECFEFF', textColor: '#0891B2' },
          { id: 'solar', title: 'SunKing Solar', desc: 'Pay-As-You-Go solar energy recharge', icon: '☀️', color: '#FEF2F2', textColor: '#DC2626' },
        ].map((s) => (
          <TouchableOpacity
            key={s.id}
            style={styles.serviceCard}
            onPress={() => setActiveModal(s.id as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: s.color }]}>
              <Text style={{ fontSize: 24 }}>{s.icon}</Text>
            </View>
            <Text style={styles.serviceTitle}>{s.title}</Text>
            <Text style={styles.serviceDesc}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal: Data Purchase */}
      <Modal visible={activeModal === 'data'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buy Data Bundles</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            {/* Network Selector */}
            <View style={styles.networkRow}>
              {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map((net) => (
                <TouchableOpacity
                  key={net}
                  style={[styles.networkPill, selectedNetwork === net && styles.networkPillActive]}
                  onPress={() => setSelectedNetwork(net)}
                >
                  <Text style={[styles.networkPillText, selectedNetwork === net && styles.networkPillTextActive]}>
                    {net}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Plan Selector */}
            <Text style={styles.fieldLabel}>Select Data Bundle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScrollView}>
              {plans.map((pln) => (
                <TouchableOpacity
                  key={pln.id}
                  style={[styles.planCard, selectedPlan?.id === pln.id && styles.planCardActive]}
                  onPress={() => setSelectedPlan(pln)}
                >
                  <Text style={styles.planName}>{pln.plan_name}</Text>
                  <Text style={styles.planPrice}>₦{pln.amount}</Text>
                  <Text style={styles.planValidity}>{pln.validity || '30 Days'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Recipient Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              keyboardType="phone-pad"
              value={recipient}
              onChangeText={setRecipient}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('data', selectedNetwork)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>
                  Pay ₦{selectedPlan?.amount || 0} & Dispense Data
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Airtime Purchase */}
      <Modal visible={activeModal === 'airtime'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Airtime Top-Up</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.networkRow}>
              {['MTN', 'AIRTEL', 'GLO', '9MOBILE'].map((net) => (
                <TouchableOpacity
                  key={net}
                  style={[styles.networkPill, selectedNetwork === net && styles.networkPillActive]}
                  onPress={() => setSelectedNetwork(net)}
                >
                  <Text style={[styles.networkPillText, selectedNetwork === net && styles.networkPillTextActive]}>
                    {net}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Airtime Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 500"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.fieldLabel}>Recipient Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="08012345678"
              keyboardType="phone-pad"
              value={recipient}
              onChangeText={setRecipient}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('airtime', selectedNetwork)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Recharge Airtime</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Electricity Bills */}
      <Modal visible={activeModal === 'electricity'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Electricity Bill & Token</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Meter Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 11-digit Meter Number"
              keyboardType="numeric"
              value={recipient}
              onChangeText={(val) => {
                setRecipient(val);
                if (val.length >= 10) handleVerifyCustomer('electricity', selectedNetwork, val);
              }}
            />
            {verifying && <Text style={styles.verifyingText}>Verifying meter with DisCo...</Text>}
            {verifiedCustomerName && (
              <View style={styles.verifiedBox}>
                <Text style={styles.verifiedText}>Account Name: {verifiedCustomerName}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>Recharge Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2000"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('electricity', 'IKEDC')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Purchase Electricity Token</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Cable TV */}
      <Modal visible={activeModal === 'cable'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cable TV Subscription</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.networkRow}>
              {['DSTV', 'GOTV', 'STARTIMES'].map((biller) => (
                <TouchableOpacity
                  key={biller}
                  style={[styles.networkPill, selectedNetwork === biller && styles.networkPillActive]}
                  onPress={() => setSelectedNetwork(biller)}
                >
                  <Text style={[styles.networkPillText, selectedNetwork === biller && styles.networkPillTextActive]}>
                    {biller}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Smartcard / IUC Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Smartcard Number"
              keyboardType="numeric"
              value={recipient}
              onChangeText={setRecipient}
            />

            <Text style={styles.fieldLabel}>Package Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 3500"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('cable', selectedNetwork)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Renew Cable TV</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Exam PINs */}
      <Modal visible={activeModal === 'exam'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Exam Checker Scratch Card</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <View style={styles.networkRow}>
              {['WAEC', 'NECO'].map((exam) => (
                <TouchableOpacity
                  key={exam}
                  style={[styles.networkPill, selectedNetwork === exam && styles.networkPillActive]}
                  onPress={() => {
                    setSelectedNetwork(exam);
                    setAmount(exam === 'WAEC' ? '3500' : '1200');
                  }}
                >
                  <Text style={[styles.networkPillText, selectedNetwork === exam && styles.networkPillTextActive]}>
                    {exam} (₦{exam === 'WAEC' ? '3,500' : '1,200'})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Recipient Phone / Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone to receive token"
              keyboardType="phone-pad"
              value={recipient}
              onChangeText={setRecipient}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('exam', selectedNetwork, `${selectedNetwork}-PIN`)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Generate {selectedNetwork} PIN</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: SunKing Solar */}
      <Modal visible={activeModal === 'solar'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SunKing Solar Recharge</Text>
              <TouchableOpacity onPress={() => setActiveModal('none')}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>SunKing Device / Account ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. SK-10948301"
              value={recipient}
              onChangeText={setRecipient}
            />

            <Text style={styles.fieldLabel}>Amount (₦)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 1500"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
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
              style={[styles.actionButton, loading && styles.buttonDisabled]}
              onPress={() => handlePurchase('solar', 'SUNKING')}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.actionButtonText}>Recharge Solar Unit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Transaction Receipt */}
      <Modal visible={Boolean(receipt)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { alignItems: 'center' }]}>
            <View style={styles.successIconBox}>
              <Text style={{ fontSize: 32 }}>✓</Text>
            </View>
            <Text style={styles.receiptTitle}>Transaction Successful</Text>
            <Text style={styles.receiptAmount}>₦{receipt?.amount?.toLocaleString()}</Text>

            <View style={styles.receiptDivider} />

            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Service:</Text>
              <Text style={styles.receiptValue}>{receipt?.billerOrNetwork} {receipt?.category?.toUpperCase()}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Recipient:</Text>
              <Text style={styles.receiptValue}>{receipt?.recipient}</Text>
            </View>
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Reference:</Text>
              <Text style={styles.receiptValue}>{receipt?.reference}</Text>
            </View>
            {receipt?.token && (
              <View style={styles.receiptTokenBox}>
                <Text style={styles.tokenLabel}>TOKEN / PIN:</Text>
                <Text style={styles.tokenValue}>{receipt.token}</Text>
              </View>
            )}
            <View style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>Timestamp:</Text>
              <Text style={styles.receiptValue}>{receipt?.date}</Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 20, width: '100%' }]}
              onPress={() => setReceipt(null)}
            >
              <Text style={styles.actionButtonText}>Done</Text>
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
  header: { marginBottom: theme.spacing.xl },
  headerTitle: { fontSize: theme.typography.sizes.xl, fontWeight: theme.typography.weights.black, color: theme.colors.text },
  headerSubtitle: { fontSize: theme.typography.sizes.xs, color: theme.colors.textSecondary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceCard: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  iconBox: { width: 48, height: 48, borderRadius: theme.borderRadius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  serviceTitle: { fontSize: theme.typography.sizes.sm, fontWeight: theme.typography.weights.black, color: theme.colors.text },
  serviceDesc: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg },
  modalTitle: { fontSize: theme.typography.sizes.lg, fontWeight: theme.typography.weights.black, color: theme.colors.text },
  closeText: { fontSize: 18, color: theme.colors.textSecondary, fontWeight: 'bold' },
  networkRow: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.md },
  networkPill: { flex: 1, paddingVertical: 10, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.background, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  networkPillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  networkPillText: { fontSize: 11, fontWeight: 'bold', color: theme.colors.textSecondary },
  networkPillTextActive: { color: theme.colors.white },
  fieldLabel: { fontSize: theme.typography.sizes.xs, fontWeight: 'bold', color: theme.colors.text, textTransform: 'uppercase', marginBottom: 6, marginTop: 10 },
  planScrollView: { marginBottom: 10 },
  planCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginRight: 8,
    minWidth: 110,
  },
  planCardActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  planName: { fontSize: 11, fontWeight: 'bold', color: theme.colors.text },
  planPrice: { fontSize: 14, fontWeight: '900', color: theme.colors.primary, marginTop: 4 },
  planValidity: { fontSize: 9, color: theme.colors.textSecondary, marginTop: 2 },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...theme.shadows.md,
  },
  buttonDisabled: { opacity: 0.7 },
  actionButtonText: { color: theme.colors.white, fontWeight: 'bold', fontSize: theme.typography.sizes.sm },
  verifyingText: { fontSize: 10, color: theme.colors.primary, marginTop: 4 },
  verifiedBox: { backgroundColor: theme.colors.successLight, padding: 8, borderRadius: 8, marginTop: 6 },
  verifiedText: { color: theme.colors.success, fontSize: 11, fontWeight: 'bold' },
  successIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.colors.successLight, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  receiptTitle: { fontSize: theme.typography.sizes.lg, fontWeight: '900', color: theme.colors.text },
  receiptAmount: { fontSize: 28, fontWeight: '900', color: theme.colors.primary, marginTop: 4 },
  receiptDivider: { width: '100%', height: 1, backgroundColor: theme.colors.border, marginVertical: 16 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 8 },
  receiptLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '500' },
  receiptValue: { fontSize: 12, color: theme.colors.text, fontWeight: 'bold' },
  receiptTokenBox: { backgroundColor: theme.colors.warningLight, padding: 12, borderRadius: 10, width: '100%', marginVertical: 8, alignItems: 'center' },
  tokenLabel: { fontSize: 10, color: theme.colors.warning, fontWeight: 'bold' },
  tokenValue: { fontSize: 18, color: theme.colors.text, fontWeight: 'black', letterSpacing: 2, marginTop: 2 }
});
