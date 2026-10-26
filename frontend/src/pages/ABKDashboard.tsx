import React, { useState, useEffect } from 'react';
import {
  Wifi, Phone, Sun, Tv, Repeat, ArrowUpRight, ListOrdered, User,
  Bell, LogOut, Fingerprint, MessageCircle, ChevronRight, CheckCircle2,
  AlertCircle, X, Shield, Megaphone, Zap, Printer, Mail, Lock, KeyRound,
  TrendingUp, CreditCard, Sparkles, Copy, Check, ExternalLink, Building,
  FileText, Gift, Eye, EyeOff, RefreshCw, Award, Code, HelpCircle, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { TransactionReceiptModal, ReceiptData } from '../components/TransactionReceiptModal';
import { TransactionProcessingModal, ProcessingStatus } from '../components/TransactionProcessingModal';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role?: string;
  tier: number;
  wallet_balance: number;
  commission_balance: number;
  total_funded: number;
  vtu_purchases: number;
  biometric_enabled: boolean;
  twoFactorEnabled?: boolean;
  referral_code?: string;
  whatsapp_number?: string;
}

export const ABKDashboard: React.FC<{
  user: UserProfile;
  settings?: any;
  onRefreshUser: () => void;
  onLogout: () => void;
  onNavigateTo: (page: string) => void;
}> = ({ user, settings = {}, onRefreshUser, onLogout, onNavigateTo }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundTab, setFundTab] = useState<'transfer' | 'card'>('transfer');
  const [fundAmount, setFundAmount] = useState('2000');
  const [loading, setLoading] = useState(false);
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'telecom' | 'utilities' | 'entertainment' | 'business'>('all');

  // Dedicated Virtual Account state
  const [virtualAccount, setVirtualAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    isAutomated?: boolean;
    instruction?: string;
  } | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [activeBroadcast, setActiveBroadcast] = useState<any | null>(null);

  // Reusable Enterprise Processing Feedback Modal states
  const [procStatus, setProcStatus] = useState<ProcessingStatus>('IDLE');
  const [procTitle, setProcTitle] = useState('');
  const [procDesc, setProcDesc] = useState('');
  const [procRef, setProcRef] = useState('');
  const [procError, setProcError] = useState('');

  const appName = settings.app_name || 'Bukar Data Sub';
  const announcementText = settings.announcement_text;
  const isAnnouncementActive = settings.announcement_active;
  const announcementType = settings.announcement_type || 'info';

  const userRole = (user.role || 'customer').toLowerCase();
  const userTier = user.tier || 1;
  const isAgent = userRole === 'agent' || userTier === 2;
  const isReseller = userRole === 'reseller' || userTier >= 3;
  const isApiClient = userRole === 'api_client';

  useEffect(() => {
    loadActivities();
    loadUnreadAlerts();
    loadVirtualAccount();
    loadActiveAnnouncements();
  }, []);

  const showAnnouncementModal = (ann: any) => {
    if (!ann) return;
    const iconType = ann.type === 'warning' ? 'warning'
      : ann.type === 'urgent' ? 'error'
      : ann.type === 'success' ? 'success'
      : 'info';

    const daysLeftText = ann.days_remaining > 0
      ? `${ann.days_remaining} day${ann.days_remaining === 1 ? '' : 's'} remaining`
      : `${ann.hours_remaining || 24} hours remaining`;

    Swal.fire({
      icon: iconType,
      title: `<div style="font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 4px;">${ann.title}</div>`,
      html: `
        <div style="text-align: left; font-size: 13.5px; line-height: 1.6; color: #334155; padding: 4px;">
          <div style="display: inline-block; background-color: #EFF6FF; color: #1E40AF; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; margin-bottom: 10px; border: 1px solid #BFDBFE;">
            ${ann.badge_text || 'IMPORTANT NOTICE'}
          </div>
          <p style="white-space: pre-wrap; font-weight: 500; margin: 0 0 14px 0; color: #1e293b;">${ann.message}</p>
          <div style="border-top: 1px solid #E2E8F0; padding-top: 10px; font-size: 11.5px; color: #64748B; display: flex; justify-content: space-between; align-items: center;">
            <span>⏳ Active for: <strong style="color: #2563EB;">${daysLeftText}</strong></span>
            <span>Issued: ${new Date(ann.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `,
      confirmButtonText: 'Acknowledge & Continue',
      confirmButtonColor: '#2563EB',
      customClass: {
        popup: 'rounded-3xl shadow-2xl border border-slate-200'
      }
    });
  };

  const loadActiveAnnouncements = async () => {
    try {
      const res = await api.getActiveAnnouncements();
      if (res.success && res.announcements && res.announcements.length > 0) {
        const latest = res.announcements[0];
        setActiveBroadcast(latest);
        const dismissedKey = `swal_dismissed_ann_${latest.id}`;
        if (!sessionStorage.getItem(dismissedKey)) {
          sessionStorage.setItem(dismissedKey, 'true');
          showAnnouncementModal(latest);
        }
      }
    } catch {
      // Fallback
    }
  };

  const loadActivities = async () => {
    try {
      const res = await api.getRecentActivity(10);
      if (res.success) setActivities(res.activities);
    } catch {
      // Fallback
    }
  };

  const loadUnreadAlerts = async () => {
    try {
      const res = await api.getNotifications(5);
      if (res.success) setUnreadAlerts(res.unreadCount);
    } catch {
      // Fallback
    }
  };

  const loadVirtualAccount = async () => {
    try {
      setLoadingAccount(true);
      const res = await api.getVirtualAccount();
      if (res.success && res.account) {
        setVirtualAccount(res.account);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        onRefreshUser(),
        loadActivities(),
        loadVirtualAccount(),
        loadUnreadAlerts()
      ]);
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleToggleBiometrics = async () => {
    try {
      const newStatus = !user.biometric_enabled;
      await api.toggleBiometrics(newStatus);
      onRefreshUser();
      Swal.fire({
        icon: 'success',
        title: newStatus ? 'Biometrics Enabled' : 'Biometrics Disabled',
        text: newStatus
          ? 'Fingerprint & Face ID login is now activated for faster, safer access.'
          : 'Biometrics disabled. Use your password to sign in.',
        confirmButtonColor: '#1E5BF9'
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    if (label === 'account') {
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
    Swal.fire({
      icon: 'success',
      title: `${label === 'account' ? 'Account Number' : 'Referral Link'} Copied!`,
      text,
      timer: 1400,
      showConfirmButton: false
    });
  };

  const handleTransferCommission = async () => {
    const commission = user.commission_balance || 0;
    if (commission < 100) {
      Swal.fire({
        icon: 'info',
        title: 'Commission Minimum',
        text: `You currently have ₦${commission.toFixed(2)} in commissions. Minimum transfer to main wallet is ₦100.00.`,
        confirmButtonColor: '#1E5BF9'
      });
      return;
    }

    const { value: amount } = await Swal.fire({
      title: 'Transfer Referral Commissions',
      text: `Available Commissions: ₦${commission.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      input: 'number',
      inputLabel: 'Amount to move to Main Wallet (₦)',
      inputValue: commission.toString(),
      showCancelButton: true,
      confirmButtonText: 'Transfer Now',
      confirmButtonColor: '#1E5BF9',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || Number(value) < 100) return 'Minimum transfer is ₦100.00';
        if (Number(value) > commission) return 'Amount exceeds commission balance';
        return null;
      }
    });

    if (amount) {
      try {
        const res = await api.transferCommission(Number(amount));
        Swal.fire({
          icon: 'success',
          title: 'Transferred Successfully!',
          text: `₦${Number(amount).toLocaleString()} has been credited to your Main Wallet.`,
          confirmButtonColor: '#1E5BF9'
        });
        onRefreshUser();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Transfer Failed', text: err.message });
      }
    }
  };

  const handleOnlineCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundAmount || Number(fundAmount) < 100) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Minimum funding amount is ₦100.00' });
      return;
    }

    setShowFundModal(false);
    setProcStatus('PROCESSING');
    setProcTitle('Initiating Gateway Session');
    setProcDesc('Securing transaction token and preparing payment gateway...');
    setProcRef('');
    setProcError('');

    try {
      setLoading(true);
      const res = await api.initiateFunding(Number(fundAmount), 'paystack');
      if (res.checkoutUrl) {
        setProcRef(res.reference || '');
        setProcStatus('CONFIRMING');
        setProcTitle('Redirecting to Payment Gateway');
        setProcDesc('Opening encrypted 256-bit checkout session...');
        setTimeout(() => {
          window.location.href = res.checkoutUrl;
        }, 1200);
      } else {
        setProcStatus('IDLE');
        Swal.fire({
          icon: 'info',
          title: 'Direct Bank Transfer',
          html: `
            <div style="text-align: left; font-size: 14px; line-height: 1.6;" class="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <p><strong>Bank:</strong> ${res.virtualBankName}</p>
              <p><strong>Account Number:</strong> <span style="font-size: 20px; color: #1E5BF9; font-weight: 800; letter-spacing: 1px;">${res.virtualAccountNumber}</span></p>
              <p><strong>Account Name:</strong> ${res.virtualAccountName}</p>
              <p><strong>Amount:</strong> ₦${Number(fundAmount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
              <p style="color: #64748b; font-size: 12px; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                Reference: <code style="font-weight: bold; color: #0f172a;">${res.reference}</code><br/>
                Transfer to this verified account. Your wallet will credit immediately upon webhook receipt.
              </p>
            </div>
          `,
          confirmButtonColor: '#1E5BF9',
          confirmButtonText: 'I Have Completed Transfer'
        });
      }
    } catch (err: any) {
      setProcStatus('FAILED');
      setProcTitle('Payment Initialization Failed');
      setProcDesc('The payment gateway was unable to initiate a checkout session.');
      setProcError(err.message || 'Network connection issue');
    } finally {
      setLoading(false);
    }
  };

  // Symmetrical Service Catalogue List
  const serviceList = [
    {
      id: 'data',
      title: 'Data Bundles',
      desc: 'MTN, Airtel, Glo, 9mobile',
      category: 'telecom',
      badge: 'SME & Direct',
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200/70',
      icon: Wifi,
      iconBg: 'bg-blue-50/80 text-blue-600 border border-blue-200/80',
      action: () => onNavigateTo('data')
    },
    {
      id: 'airtime',
      title: 'Airtime Top-Up',
      desc: 'Instant 1-sec GSM recharge',
      category: 'telecom',
      badge: 'Up to 3% Off',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
      icon: Phone,
      iconBg: 'bg-emerald-50/80 text-emerald-600 border border-emerald-200/80',
      action: () => onNavigateTo('airtime')
    },
    {
      id: 'electricity',
      title: 'Electricity Bills',
      desc: 'Prepaid tokens & postpaid',
      category: 'utilities',
      badge: 'Zero Convenience Fee',
      badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200/70',
      icon: Zap,
      iconBg: 'bg-amber-50/80 text-amber-600 border border-amber-200/80',
      action: () => onNavigateTo('electricity')
    },
    {
      id: 'cable',
      title: 'Cable TV Renewal',
      desc: 'DStv, GOtv, Startimes',
      category: 'entertainment',
      badge: 'Instant Activation',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200/70',
      icon: Tv,
      iconBg: 'bg-indigo-50/80 text-indigo-600 border border-indigo-200/80',
      action: () => onNavigateTo('cable')
    },
    {
      id: 'solar_pin',
      title: 'SunKing Solar PIN',
      desc: 'Generate token PINs',
      category: 'utilities',
      badge: '16-Digit Token',
      badgeColor: 'bg-orange-50 text-orange-700 border border-orange-200/70',
      icon: Sun,
      iconBg: 'bg-orange-50/80 text-orange-600 border border-orange-200/80',
      action: () => onNavigateTo('solar_pin')
    },
    {
      id: 'exam_pins',
      title: 'Exam PINs Portal',
      desc: 'WAEC, NECO, NABTEB',
      category: 'entertainment',
      badge: 'Official Scratch Pins',
      badgeColor: 'bg-violet-50 text-violet-700 border border-violet-200/70',
      icon: Award,
      iconBg: 'bg-violet-50/80 text-violet-600 border border-violet-200/80',
      action: () => onNavigateTo('exam_pins')
    },
    {
      id: 'airtime_cash',
      title: 'Airtime to Cash',
      desc: 'Convert excess SIM airtime',
      category: 'telecom',
      badge: 'Fast Bank Payout',
      badgeColor: 'bg-teal-50 text-teal-700 border border-teal-200/70',
      icon: Repeat,
      iconBg: 'bg-teal-50/80 text-teal-600 border border-teal-200/80',
      action: () => onNavigateTo('airtime_cash')
    },
    {
      id: 'recharge_print',
      title: 'Print Recharge Cards',
      desc: 'Generate e-PIN vouchers',
      category: 'telecom',
      badge: 'Wholesale Retail',
      badgeColor: 'bg-sky-50 text-sky-700 border border-sky-200/70',
      icon: Printer,
      iconBg: 'bg-sky-50/80 text-sky-600 border border-sky-200/80',
      action: () => onNavigateTo('recharge_print')
    },
    {
      id: 'bulk_sms',
      title: 'Bulk SMS Portal',
      desc: 'Custom Sender ID messaging',
      category: 'business',
      badge: '₦3.50 / SMS',
      badgeColor: 'bg-cyan-50 text-cyan-700 border border-cyan-200/70',
      icon: Mail,
      iconBg: 'bg-cyan-50/80 text-cyan-600 border border-cyan-200/80',
      action: () => onNavigateTo('bulk_sms')
    },
    {
      id: 'wallet',
      title: 'Bank Accounts & Funds',
      desc: 'Dedicated NUBAN funding',
      category: 'business',
      badge: '24/7 Auto-Credit',
      badgeColor: 'bg-rose-50 text-rose-700 border border-rose-200/70',
      icon: ArrowUpRight,
      iconBg: 'bg-rose-50/80 text-rose-600 border border-rose-200/80',
      action: () => onNavigateTo('wallet')
    }
  ];

  const filteredServices = activeCategory === 'all'
    ? serviceList
    : serviceList.filter(s => s.category === activeCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Dynamic Announcement Banner (Clean 2-Color Design with SweetAlert Modal Trigger) */}
      {(activeBroadcast || (isAnnouncementActive && announcementText)) && (
        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm font-semibold shadow-xs border transition-all ${
          (activeBroadcast?.type || announcementType) === 'urgent'
            ? 'bg-red-50 text-red-900 border-red-200'
            : (activeBroadcast?.type || announcementType) === 'warning'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-blue-50 text-blue-900 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <Megaphone className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <div className="truncate">
              {activeBroadcast ? (
                <span>
                  <strong className="font-extrabold mr-1.5">{activeBroadcast.title}:</strong>
                  {activeBroadcast.message}
                </span>
              ) : (
                <span className="leading-snug">{announcementText}</span>
              )}
            </div>
          </div>
          {activeBroadcast && (
            <button
              onClick={() => showAnnouncementModal(activeBroadcast)}
              className="self-start sm:self-auto shrink-0 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center space-x-1"
            >
              <span>View Notice</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Top Header Card with User Greeting & Role Badges */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {appName} Portal
            </span>
            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
              isReseller
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : isAgent
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {isReseller ? 'VIP Reseller (Tier 3)' : isAgent ? 'Certified Agent (Tier 2)' : `Standard Customer (Tier ${userTier})`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            {getTimeGreeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-600 text-sm font-medium mt-0.5">
            Welcome back to Bukar Data Sub
          </p>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-slate-200 transition"
            title="Refresh Wallet Balance & Transactions"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => {
              Swal.fire({
                title: 'Notification Center',
                html: unreadAlerts > 0
                  ? `You have <strong>${unreadAlerts}</strong> unread notification(s) in your ledger.`
                  : 'You have no unread notifications.',
                confirmButtonColor: '#1E5BF9'
              });
            }}
            className="relative p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border border-slate-200 transition"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlerts > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <button
            onClick={() => onNavigateTo('support')}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 rounded-2xl border border-slate-200 transition flex items-center space-x-1.5"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Support</span>
          </button>
        </div>
      </div>

      {/* Hero Financial Grid (2 Symmetrical Balanced Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Master Sapphire Wallet Card */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-blue-200 text-xs font-extrabold uppercase tracking-wider flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-300" />
              <span>Wallet Balance</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setHideBalance(!hideBalance)}
                className="text-blue-300 hover:text-white p-1 rounded-lg transition"
                title={hideBalance ? 'Show Balance' : 'Hide Balance'}
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 24/7</span>
              </span>
            </div>
          </div>

          <div className="my-5">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-mono">
              {hideBalance
                ? '₦••••••••'
                : `₦${user.wallet_balance ? user.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
              }
            </h2>
            <div className="flex items-center justify-between text-blue-200 text-xs font-semibold mt-2">
              <span>Commission Balance:</span>
              <button
                onClick={handleTransferCommission}
                className="font-mono font-black text-white hover:text-blue-100 underline flex items-center space-x-1"
                title="Click to transfer commission to main balance"
              >
                <span>₦{user.commission_balance ? user.commission_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded ml-1 font-sans">Transfer →</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setShowFundModal(true)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-black py-3 px-4 rounded-full shadow-sm text-sm transition active:scale-[0.98] text-center flex items-center justify-center space-x-1.5"
            >
              <span>+ Fund Wallet</span>
            </button>
            <button
              onClick={() => onNavigateTo('transactions')}
              className="bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold py-3 px-4 rounded-full text-sm transition active:scale-[0.98] text-center flex items-center justify-center space-x-1.5"
            >
              <ListOrdered className="w-4 h-4" />
              <span>History</span>
            </button>
          </div>
        </div>

        {/* Card 2: Dedicated Virtual Funding Account (Clean Crisp White Card) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Dedicated Automated Bank Account</span>
              </span>
              <span className="bg-emerald-50 text-emerald-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                Auto-Credit &lt; 5s
              </span>
            </div>

            {virtualAccount ? (
              <div className="mt-4 p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Bank Name:</span>
                  <span className="text-sm font-black text-slate-900">{virtualAccount.bankName}</span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                  <span className="text-xs font-bold text-slate-600">Account Number:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl sm:text-2xl font-black font-mono text-blue-700 tracking-wider">
                      {virtualAccount.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(virtualAccount.accountNumber, 'account')}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition"
                      title="Copy Account Number"
                    >
                      {copiedAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-blue-200/50">
                  <span className="text-xs font-bold text-slate-600">Account Name:</span>
                  <span className="text-xs font-bold text-slate-900">{virtualAccount.accountName}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                {loadingAccount ? 'Assigning dedicated NUBAN account...' : 'Account number available upon verification.'}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-500 space-y-1">
            <p className="font-semibold text-slate-700">How to Fund Instantly:</p>
            <p>Transfer from any bank app (OPay, PalmPay, Kuda, GTBank, Zenith, FirstBank, etc.) to the account above. Your wallet credits automatically in under 5 seconds.</p>
          </div>
        </div>
      </div>

      {/* Join Our WhatsApp Community Card (Matching Screenshot 2/3) */}
      <a
        href={`https://wa.me/${settings.whatsapp_number || '2349131797675'}?text=Hello%20Bukar%20Data%20Sub%20Community`}
        target="_blank"
        rel="noreferrer"
        className="bg-white hover:bg-emerald-50/40 rounded-3xl p-5 border border-slate-200 hover:border-emerald-300 shadow-xs transition group flex items-center justify-between"
      >
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
            <MessageCircle className="w-6 h-6 fill-white text-emerald-500" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-800 transition">
              Join Our WhatsApp Community
            </h3>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              Get instant updates, exclusive offers &amp; priority support
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
      </a>

      {/* QUICK ACTIONS 2-Column Squircle Grid (Matching Screenshot 4) */}
      <div>
        <div className="text-xs font-black tracking-wider text-slate-500 uppercase mb-3 px-1">
          QUICK ACTIONS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            {
              id: 'solar',
              title: 'Solar Bills',
              icon: Sun,
              color: 'bg-orange-50 text-orange-600 border border-orange-200/70',
              action: () => onNavigateTo('solar_pin')
            },
            {
              id: 'data',
              title: 'Buy Data',
              icon: Wifi,
              color: 'bg-blue-50 text-blue-600 border border-blue-200/70',
              action: () => onNavigateTo('data')
            },
            {
              id: 'airtime',
              title: 'Buy Airtime',
              icon: Phone,
              color: 'bg-emerald-50 text-emerald-600 border border-emerald-200/70',
              action: () => onNavigateTo('airtime')
            },
            {
              id: 'fund',
              title: 'Fund Wallet',
              icon: CreditCard,
              color: 'bg-indigo-50 text-indigo-600 border border-indigo-200/70',
              action: () => setShowFundModal(true)
            },
            {
              id: 'airtime_cash',
              title: 'Airtime to Cash',
              icon: Repeat,
              color: 'bg-teal-50 text-teal-600 border border-teal-200/70',
              action: () => onNavigateTo('airtime_cash')
            },
            {
              id: 'cable',
              title: 'Cable',
              icon: Tv,
              color: 'bg-purple-50 text-purple-600 border border-purple-200/70',
              action: () => onNavigateTo('cable')
            },
            {
              id: 'withdrawal',
              title: 'Withdrawal',
              icon: ArrowUpRight,
              color: 'bg-rose-50 text-rose-600 border border-rose-200/70',
              action: () => onNavigateTo('wallet')
            },
            {
              id: 'transactions',
              title: 'Transactions',
              icon: ListOrdered,
              color: 'bg-sky-50 text-sky-600 border border-sky-200/70',
              action: () => onNavigateTo('transactions')
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="bg-white hover:bg-slate-50/80 p-4 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col items-center justify-center text-center group active:scale-95"
              >
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center group-hover:scale-105 transition shadow-2xs`}>
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                <span className="text-slate-900 font-extrabold text-xs sm:text-sm mt-3 tracking-tight">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role-Specific Tier & Growth Banner */}
      {!isReseller && !isAgent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            onClick={() => onNavigateTo('reseller_portal')}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-blue-300 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Wholesale Rates
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Upgrade to Agent (Tier 2)</h3>
                <p className="text-xs text-slate-500 font-medium">Unlock up to 5% extra discount on all data bundles & recharge card printing.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
          </div>

          <div
            onClick={() => onNavigateTo('referrals')}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-purple-300 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                  Earn Cash Daily
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Refer &amp; Earn Commissions</h3>
                <p className="text-xs text-slate-500 font-medium">Earn lifetime cash on every transaction made by your referred users.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 shrink-0 ml-2" />
          </div>
        </div>
      ) : isAgent && !isReseller ? (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 rounded-3xl p-5 sm:p-6 border border-blue-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Certified Merchant Agent</span>
                <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">Wholesale Active</span>
              </div>
              <h3 className="text-slate-900 font-black text-base mt-0.5">Agent Wholesale Pricing Active</h3>
              <p className="text-slate-600 text-xs">You enjoy 1.5% to 2.5% discounted rates across all telecom networks.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTo('reseller_portal')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs shrink-0 self-start sm:self-auto"
          >
            Upgrade to VIP Reseller (Tier 3) →
          </button>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 rounded-3xl p-5 sm:p-6 border border-purple-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-800">VIP Reseller Partner</span>
                <span className="text-[10px] font-black bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full">Wholesale REST API</span>
              </div>
              <h3 className="text-slate-900 font-black text-base mt-0.5">VIP Wholesale &amp; Developer APIs Active</h3>
              <p className="text-slate-600 text-xs">Maximum discounted margins, automated webhooks, and branded recharge card generator.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigateTo('developer_api')}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition shadow-xs"
            >
              API Keys &amp; Webhooks
            </button>
            <button
              onClick={() => onNavigateTo('reseller_portal')}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Wholesale Portal
            </button>
          </div>
        </div>
      )}

      {/* 4 Financial & Usage Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Total Funded</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            ₦{user.total_funded ? user.total_funded.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Lifetime Deposits</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Total Spent</span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
            ₦{user.vtu_purchases ? user.vtu_purchases.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <span className="text-[11px] text-blue-600 font-bold mt-1 block">Telecom &amp; Utility Orders</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Commission Earned</span>
          <div className="text-xl sm:text-2xl font-black text-purple-700 mt-2 font-mono">
            ₦{user.commission_balance ? user.commission_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <button
            onClick={handleTransferCommission}
            className="text-[11px] text-purple-600 hover:text-purple-800 font-black mt-1 block hover:underline"
          >
            Transfer to Wallet →
          </button>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">Account Security</span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-2 flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>PIN &amp; 2FA Ready</span>
          </div>
          <button
            onClick={() => onNavigateTo('security')}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-black mt-1 block hover:underline"
          >
            Manage Security Settings →
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITY (Matching Screenshot 5) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">
            RECENT ACTIVITY
          </h3>
          <button
            onClick={() => onNavigateTo('transactions')}
            className="text-xs font-extrabold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3 pt-1">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs sm:text-sm font-medium bg-slate-50 rounded-2xl border border-slate-200">
              No recent transactions recorded on this account yet.
            </div>
          ) : (
            activities.map((act) => {
              const isSuccess = act.status === 'COMPLETED' || act.status === 'SUCCESSFUL';
              const isPending = act.status === 'PENDING';
              const statusPillClass = isSuccess
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : isPending
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-red-50 text-red-700 border border-red-200';
              const statusText = isSuccess ? 'Success' : isPending ? 'Pending' : 'Failed';

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedReceipt({
                    reference: act.reference || act.id,
                    category: act.service_category || 'VTU',
                    serviceName: `${act.biller_or_network || ''} ${(act.service_category || 'Service').toUpperCase()}`.trim(),
                    billerOrNetwork: act.biller_or_network,
                    recipient: act.recipient,
                    amount: act.charged_amount || act.amount,
                    status: act.status?.toUpperCase() || 'SUCCESSFUL',
                    date: act.created_at,
                    balanceBefore: act.balance_before,
                    balanceAfter: act.balance_after,
                    token: act.token_or_pin,
                    customerName: user.name || user.email
                  })}
                  className="p-3.5 rounded-2xl border border-slate-200/90 hover:border-blue-200 hover:bg-slate-50/60 transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                      {act.service_category === 'airtime' ? <Phone className="w-5 h-5" /> :
                       act.service_category === 'solar_pin' ? <Sun className="w-5 h-5" /> :
                       act.service_category === 'electricity' ? <Zap className="w-5 h-5" /> :
                       act.service_category === 'cable' ? <Tv className="w-5 h-5" /> :
                       <Wifi className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-slate-900 text-sm truncate">
                        {(act.service_category || 'VTU').toUpperCase()} - {act.biller_or_network || 'Direct'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        {act.recipient} • {act.created_at ? new Date(act.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-slate-900 font-mono">
                      ₦{(act.charged_amount || act.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${statusPillClass}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Need Help? Chat with our support team anytime */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-slate-900 font-black text-base">Need Help?</h4>
          <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
            Chat with our support team anytime for instant assistance.
          </p>
        </div>
        <a
          href={`https://wa.me/${settings.whatsapp_number || '2349131797675'}`}
          target="_blank"
          rel="noreferrer"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition flex items-center justify-center space-x-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>WhatsApp Support</span>
        </a>
      </div>

      {/* Floating WhatsApp Action Button (Pinned in bottom-right corner) */}
      <a
        href={`https://wa.me/${settings.whatsapp_number || '2349131797675'}?text=Hello%20Bukar%20Data%20Sub%20Support`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-20 md:bottom-6 right-5 z-40 w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center transition active:scale-95 group"
        title="Chat with WhatsApp Support"
      >
        <MessageCircle className="w-7 h-7 fill-white text-emerald-600" />
      </a>

      {/* Real Automated Fund Wallet Modal (Clean 2-Color UI) */}
      {showFundModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-5 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowFundModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Fund Your Wallet</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Real-time automated credit via dedicated NUBAN or online payment gateway
              </p>
            </div>

            {/* Tabs: Dedicated Bank Transfer vs Online Card/USSD */}
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setFundTab('transfer')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 ${
                  fundTab === 'transfer' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Dedicated Bank Transfer</span>
              </button>
              <button
                type="button"
                onClick={() => setFundTab('card')}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-2 ${
                  fundTab === 'card' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay via Card / USSD</span>
              </button>
            </div>

            {fundTab === 'transfer' ? (
              <div className="space-y-4">
                {virtualAccount ? (
                  <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-3xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bank Name</span>
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                        Instant 24/7 Automated
                      </span>
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      {virtualAccount.bankName}
                    </div>

                    <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-500 block">Account Number</span>
                        <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono tracking-wider">
                          {virtualAccount.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(virtualAccount.accountNumber, 'account')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs flex items-center space-x-1.5"
                      >
                        {copiedAcc ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedAcc ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-blue-200/60">
                      <span className="text-xs font-semibold text-slate-500 block">Account Name</span>
                      <span className="text-sm font-bold text-slate-900">{virtualAccount.accountName}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400">Loading dedicated virtual account...</div>
                )}

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">How Automated Transfer Works:</div>
                  <p>1. Open your banking app (OPay, PalmPay, GTBank, Kuda, Zenith, FirstBank, etc.).</p>
                  <p>2. Transfer any amount to the dedicated account number shown above.</p>
                  <p>3. Your wallet credits automatically in under 5 seconds with zero admin approval required.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleOnlineCheckout} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Amount to Fund (₦)</label>
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    min="100"
                    required
                    className="w-full text-2xl font-black font-mono border border-slate-200 rounded-2xl p-3.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['1000', '2000', '5000', '10000', '20000', '50000'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFundAmount(val)}
                      className="py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition"
                    >
                      +₦{Number(val).toLocaleString()}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition shadow-md text-base disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{loading ? 'Initializing Gateway Session...' : `Pay ₦${Number(fundAmount).toLocaleString()} via Card / USSD`}</span>
                </button>

                <p className="text-[11px] text-center text-slate-400 font-medium">
                  Protected by 256-bit SSL encryption. Accepts Mastercard, Visa, Verve &amp; Bank USSD.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Official Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
        appName={appName}
        supportPhone={settings.support_phone}
        supportEmail={settings.support_email}
      />

      {/* Reusable Enterprise Processing Feedback Modal */}
      <TransactionProcessingModal
        isOpen={procStatus !== 'IDLE'}
        status={procStatus}
        title={procTitle}
        description={procDesc}
        reference={procRef}
        amount={Number(fundAmount) || undefined}
        errorMessage={procError}
        onClose={() => setProcStatus('IDLE')}
      />
    </div>
  );
};
