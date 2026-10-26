import React, { useState, useEffect } from 'react';
import { ABKDashboard } from './pages/ABKDashboard';
import { DataPage } from './pages/DataPage';
import { AirtimePage } from './pages/AirtimePage';
import { SolarPinPage } from './pages/SolarPinPage';
import { CablePage } from './pages/CablePage';
import { ElectricityPage } from './pages/ElectricityPage';
import { AirtimeToCashPage } from './pages/AirtimeToCashPage';
import { RechargePrintPage } from './pages/RechargePrintPage';
import { BulkSMSPage } from './pages/BulkSMSPage';
import { ExamPinsPage } from './pages/ExamPinsPage';
import { WalletPage } from './pages/WalletPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { ResellerPortalPage } from './pages/ResellerPortalPage';
import { SimHostingPage } from './pages/SimHostingPage';
import { DeveloperAPIPage } from './pages/DeveloperAPIPage';
import { SecuritySettingsPage } from './pages/SecuritySettingsPage';
import { SupportPage } from './pages/SupportPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { LandingPage } from './pages/LandingPage';
import { ProfilePage } from './pages/ProfilePage';
import { ReferralsPage } from './pages/ReferralsPage';
import { ThemeSwitcher } from './components/ThemeSwitcher';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';
import { TopProgressBar } from './components/common/ProgressBar';
import { globalLoading } from './utils/loadingManager';
import { CacheService } from './services/cacheService';
import { api, getStoredToken, setStoredToken, clearStoredToken } from './services/api';
import Swal from 'sweetalert2';
import {
  Shield, LayoutDashboard, LogIn, X, Wifi, Phone, Sun, Tv, Repeat,
  Zap, Printer, Mail, Wallet, ShieldCheck, Code, Menu, Bell,
  LogOut, CheckCircle2, ChevronRight, Award, ListOrdered, Server,
  KeyRound, LifeBuoy, Users, HelpCircle, ArrowLeft, RefreshCw,
  User, Gift, AlertOctagon, Wrench, ArrowUpRight
} from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [settings, setSettings] = useState<any>({
    app_name: 'Bukar Data Sub',
    app_tagline: 'Automated Telecom & Data Platform',
    announcement_text: '',
    announcement_active: 0,
    announcement_type: 'info',
    logo_url: '',
    maintenance_mode: 0,
    maintenance_message: ''
  });

  const [activePage, setActivePage] = useState<
    'dashboard' | 'data' | 'airtime' | 'solar_pin' | 'cable' | 'electricity' |
    'airtime_cash' | 'recharge_print' | 'bulk_sms' | 'exam_pins' | 'wallet' |
    'transactions' | 'reseller_portal' | 'sim_hosting' | 'developer_api' |
    'security' | 'support' | 'admin' | 'admin_login' | 'landing' | 'profile' | 'referrals'
  >('landing');

  const navigateTo = (page: any) => {
    globalLoading.start();
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => globalLoading.stop(), 200);
  };

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Authentication form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Two-Factor Authentication state
  const [pending2FA, setPending2FA] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendingOtp, setResendingOtp] = useState(false);

  // Forgot / Reset Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState<number>(0);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    loadSettings();
    if (token) {
      loadUserProfile();
    } else {
      setActivePage('landing');
    }
  }, [token]);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error('Failed to load system settings:', err);
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await api.getMe();
      if (res.success) {
        setUser(res.user);
        try {
          const notifRes = await api.getNotifications(5);
          if (notifRes.success) setUnreadAlerts(notifRes.unreadCount || 0);
        } catch {
          // ignore
        }
        if (activePage === 'landing' || activePage === 'admin_login') {
          const isTargetAdmin = window.location.hash.toLowerCase().includes('admin') && (res.user.role === 'super_admin' || res.user.role === 'sub_admin');
          setActivePage(isTargetAdmin ? 'admin' : 'dashboard');
        }
      }
    } catch {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setActivePage('landing');
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#/admin' || hash === '#/admin/dashboard') {
        if (user && (user.role === 'super_admin' || user.role === 'sub_admin')) {
          setActivePage('admin');
        } else if (user) {
          // Normal customer logged in: Reject admin access and return to customer dashboard
          Swal.fire({
            icon: 'error',
            title: 'Access Restricted',
            text: 'Administrative privileges required. Redirecting to your customer dashboard.',
            timer: 2000,
            showConfirmButton: false
          });
          window.location.hash = '#/dashboard';
          setActivePage('dashboard');
        } else {
          // Unauthenticated user requesting admin: Show dedicated Admin Login page
          setActivePage('admin_login');
        }
      } else if (hash === '#admin/login' || hash === '#/admin/login') {
        if (user && (user.role === 'super_admin' || user.role === 'sub_admin')) {
          setActivePage('admin');
          window.location.hash = '#/admin';
        } else {
          setActivePage('admin_login');
        }
      } else if (hash === '#dashboard' || hash === '#/dashboard') {
        if (user) {
          setActivePage('dashboard');
        }
      } else if (hash === '#login' || hash === '#/login') {
        if (!user) {
          setShowLoginModal(true);
        } else {
          setActivePage('dashboard');
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      Swal.fire({ icon: 'warning', title: 'Missing Credentials', text: 'Please enter your email/phone and password.' });
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ identifier, password });

      if (res.require2FA) {
        setPending2FA(true);
        if (res.devOtpCode) {
          setOtpCode(res.devOtpCode);
        }
        Swal.fire({
          icon: 'info',
          title: '2FA Verification Required',
          html: `
            <div style="font-size: 13px; line-height: 1.5; text-align: left;">
              <p>${res.message || 'A 6-digit one-time authorization code has been dispatched.'}</p>
              ${res.devOtpCode ? `<div style="margin-top: 10px; padding: 10px; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px; color: #3730A3;"><b>One-Time Code:</b> <span style="font-size: 18px; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${res.devOtpCode}</span></div>` : ''}
            </div>
          `,
          confirmButtonColor: '#2563EB'
        });
        return;
      }

      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setShowLoginModal(false);
      // Customer login ALWAYS directs to customer dashboard
      window.location.hash = '#/dashboard';
      setActivePage('dashboard');
      Swal.fire({
        icon: 'success',
        title: `Welcome back, ${res.user.name}!`,
        text: 'Session authenticated via authoritative JWT.',
        confirmButtonColor: '#2563EB',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err: any) {
      if (err.isAdminAccount || err.message?.includes('Administrative accounts must sign in via the dedicated Staff Portal')) {
        Swal.fire({
          icon: 'info',
          title: 'Staff Account Detected',
          text: 'Administrative accounts must sign in via the dedicated Staff Portal.',
          showCancelButton: true,
          confirmButtonColor: '#0F172A',
          confirmButtonText: 'Go to Staff Portal (/#/admin/login) →',
          cancelButtonText: 'Stay Here'
        }).then((result) => {
          if (result.isConfirmed) {
            setShowLoginModal(false);
            window.location.hash = '#/admin/login';
            setActivePage('admin_login');
          }
        });
        return;
      }
      Swal.fire({ icon: 'error', title: 'Login Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otpCode)) {
      Swal.fire({ icon: 'warning', title: 'Invalid Code', text: 'Enter the 6-digit OTP sent to your registered email.' });
      return;
    }
    try {
      setLoading(true);
      const res = await api.verifyOtp({ identifier, code: otpCode, purpose: 'LOGIN_2FA' });
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setPending2FA(false);
      setOtpCode('');
      setShowLoginModal(false);
      // Customer 2FA verification ALWAYS directs to customer dashboard
      window.location.hash = '#/dashboard';
      setActivePage('dashboard');
      Swal.fire({
        icon: 'success',
        title: `Welcome back, ${res.user.name}!`,
        text: 'Two-Factor Authentication verified successfully.',
        confirmButtonColor: '#2563EB',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: '2FA Verification Failed', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendingOtp(true);
      const res = await api.sendOtp({ identifier, purpose: 'LOGIN_2FA' });
      Swal.fire({
        icon: 'success',
        title: 'New Code Dispatched',
        text: res.message || 'A fresh 6-digit code has been sent to your email.',
        confirmButtonColor: '#2563EB'
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Resend Failed', text: err.message });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required', text: 'Please enter your registered email address or phone number.' });
      return;
    }
    try {
      setForgotLoading(true);
      const res = await api.forgotPassword({ identifier: forgotIdentifier.trim() });
      Swal.fire({
        icon: 'success',
        title: 'Reset Code Dispatched!',
        text: res.message || `A 6-digit verification code has been sent to ${res.email || forgotIdentifier}`,
        confirmButtonColor: '#2563EB'
      });
      setForgotStep(2);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Request Failed', text: err.message });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      Swal.fire({ icon: 'warning', title: 'Invalid OTP', text: 'Enter the 6-digit code sent to your email.' });
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 8) {
      Swal.fire({ icon: 'warning', title: 'Weak Password', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      Swal.fire({ icon: 'warning', title: 'Passwords Mismatch', text: 'New passwords do not match. Please verify.' });
      return;
    }
    try {
      setForgotLoading(true);
      await api.resetPassword({
        identifier: forgotIdentifier.trim(),
        code: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      Swal.fire({
        icon: 'success',
        title: 'Password Successfully Reset!',
        text: 'Your account password has been updated. You can now sign in.',
        confirmButtonColor: '#2563EB'
      });
      setShowForgotPassword(false);
      setIdentifier(forgotIdentifier);
      setPassword('');
      setShowLoginModal(true);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Reset Failed', text: err.message });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLogout = () => {
    CacheService.clearOnLogout();
    clearStoredToken();
    setToken(null);
    setUser(null);
    if (activePage === 'admin' || window.location.hash.toLowerCase().includes('admin')) {
      window.location.hash = '#/admin/login';
      setActivePage('admin_login');
    } else {
      window.location.hash = '#/';
      setActivePage('landing');
    }
    Swal.fire({
      icon: 'info',
      title: 'Signed Out',
      text: 'You have been safely signed out.',
      timer: 1500,
      showConfirmButton: false
    });
  };

  const appName = settings.app_name || 'Bukar Data Sub';
  const appTagline = settings.app_tagline || 'Automated Telecom & Data Platform';

  // Symmetrically Arranged Role-Aware Customer Navigation Sections
  const getNavSections = (currentUser: any) => {
    if (!currentUser) return [];

    const role = currentUser.role || 'customer';
    const tier = currentUser.tier || 1;
    const isResellerOrPartner = role === 'reseller' || role === 'api_client' || tier >= 3;
    const isAgentOrHigher = role === 'agent' || isResellerOrPartner || tier >= 2;

    const sections = [
      {
        title: 'Core Overview',
        items: [
          { key: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard },
        ]
      },
      {
        title: 'Telecom & Data',
        items: [
          { key: 'data', label: 'Buy Data Bundles', icon: Wifi },
          { key: 'airtime', label: 'Airtime Top-Up', icon: Phone },
          { key: 'airtime_cash', label: 'Airtime to Cash', icon: Repeat },
          { key: 'recharge_print', label: 'Print Recharge Cards', icon: Printer },
        ]
      },
      {
        title: 'Bills & Utilities',
        items: [
          { key: 'electricity', label: 'Electricity Bills', icon: Zap },
          { key: 'cable', label: 'Cable TV Renewal', icon: Tv },
          { key: 'solar_pin', label: 'SunKing Solar PIN', icon: Sun },
          { key: 'exam_pins', label: 'Exam PINs (WAEC/NECO)', icon: Award },
          { key: 'bulk_sms', label: 'Bulk SMS Portal', icon: Mail },
        ]
      },
      {
        title: 'Finance & Wallet',
        items: [
          { key: 'wallet', label: 'Wallet & Dedicated Bank', icon: Wallet },
          { key: 'transactions', label: 'Transactions & Receipts', icon: ListOrdered },
          { key: 'referrals', label: 'Refer & Earn (Affiliate)', icon: Gift },
        ]
      }
    ];

    // Business, Reseller & Partner Suite (Strictly Role-Scoped)
    if (isResellerOrPartner) {
      sections.push({
        title: 'Reseller & Developer Suite',
        items: [
          { key: 'reseller_portal', label: 'Reseller Wholesale Hub', icon: Users },
          { key: 'developer_api', label: 'Developer REST APIs', icon: Code },
          { key: 'sim_hosting', label: 'SIM Hosting & USSD', icon: Server },
        ]
      });
    } else if (isAgentOrHigher) {
      sections.push({
        title: 'Agent Merchant Suite',
        items: [
          { key: 'reseller_portal', label: 'Agent Merchant Hub', icon: Users },
          { key: 'developer_api', label: 'Developer API (Preview)', icon: Code },
        ]
      });
    } else {
      // Standard Consumer Tier 1
      sections.push({
        title: 'Grow Your Business',
        items: [
          { key: 'reseller_portal', label: 'Upgrade to Agent / Reseller', icon: Award },
        ]
      });
    }

    // Account & Security
    sections.push({
      title: 'Account & Security',
      items: [
        { key: 'profile', label: 'My KYC Profile', icon: User },
        { key: 'security', label: 'Security & 4-Digit PIN', icon: KeyRound },
        { key: 'support', label: 'Help Desk & 24/7 Support', icon: LifeBuoy },
      ]
    });

    return sections;
  };

  // Dedicated Administrator Login Portal
  if (activePage === 'admin_login') {
    return (
      <>
        <TopProgressBar />
        <AdminLoginPage
          appName={appName}
          onLoginSuccess={(adminUser) => {
            setUser(adminUser);
            setToken(getStoredToken());
            window.location.hash = '#/admin';
            setActivePage('admin');
          }}
          onBackToCustomer={() => {
            window.location.hash = user ? '#/dashboard' : '#/';
            setActivePage(user ? 'dashboard' : 'landing');
          }}
        />
      </>
    );
  }

  // Dedicated Full-Screen Standalone Admin Command Center (Zero duplicate sidebars or navbars)
  if (activePage === 'admin') {
    if (user && (user.role === 'super_admin' || user.role === 'sub_admin')) {
      return (
        <>
          <TopProgressBar />
          <AdminDashboard
            onBack={() => {
              globalLoading.start();
              window.location.hash = '#/dashboard';
              setActivePage('dashboard');
              setTimeout(() => globalLoading.stop(), 250);
            }}
            onLogout={handleLogout}
            onSettingsUpdated={loadSettings}
            currentUser={user}
          />
        </>
      );
    } else {
      // Non-admin attempting to view admin: Render Access Denied guard
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">Restricted Administrative Area</h2>
          <p className="text-slate-400 text-sm max-w-md">
            Administrative credentials are required to view this module. Ordinary customers are restricted to the customer portal.
          </p>
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={() => { window.location.hash = user ? '#/dashboard' : '#/'; setActivePage(user ? 'dashboard' : 'landing'); }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition"
            >
              Go to Customer Dashboard
            </button>
            {!user && (
              <button
                onClick={() => { window.location.hash = '#/admin/login'; setActivePage('admin_login'); }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition"
              >
                Administrator Sign In
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  const customerNavSections = getNavSections(user);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <TopProgressBar />

      {/* Global Server-Enforced Maintenance Notification Banner */}
      {settings.maintenance_mode === 1 && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 text-xs font-semibold flex items-center justify-between shadow-sm z-50">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto">
            <Wrench className="w-4 h-4 animate-spin text-amber-200 shrink-0" />
            <span>
              <strong>System Notice:</strong> {settings.maintenance_message || 'The platform is undergoing scheduled service optimization. Some services may be delayed.'}
            </span>
          </div>
          {(user?.role === 'super_admin' || user?.role === 'sub_admin') && (
            <button
              onClick={() => setActivePage('admin')}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-bold transition ml-3"
            >
              Admin Controls
            </button>
          )}
        </div>
      )}

      {/* Top Universal App Bar (Modern 2-Color UI, Crisp White & Royal Blue) */}
      <header className="bg-white/95 backdrop-blur-md text-slate-900 px-4 md:px-8 py-3.5 flex items-center justify-between sticky top-0 z-40 border-b border-slate-200/90 shadow-xs">
        {/* Left Section: Mobile Hamburger or Desktop Brand */}
        <div className="flex items-center space-x-3">
          {user && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-700 md:hidden transition"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>
          )}

          <div
            onClick={() => setActivePage(user ? 'dashboard' : 'landing')}
            className="flex items-center space-x-2.5 cursor-pointer"
          >
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={appName} className="w-9 h-9 rounded-full object-cover shadow-xs border border-slate-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-black text-white shadow-xs">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
            )}
            <div>
              <span className="font-black text-base md:text-lg tracking-tight text-slate-900 block leading-tight">{appName}</span>
              <span className="hidden md:block text-xs font-bold text-blue-600 uppercase tracking-widest">{appTagline}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Mobile Quick Actions or Desktop User Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3.5">
          <ThemeSwitcher user={user} onThemeChanged={loadSettings} />
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Quick switch to Admin ONLY for authenticated Administrators */}
              {(user.role === 'super_admin' || user.role === 'sub_admin') && (
                <button
                  onClick={() => setActivePage('admin')}
                  className="text-xs md:text-sm font-bold px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl transition flex items-center space-x-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-xs"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="hidden sm:inline">Admin Suite</span>
                </button>
              )}

              {/* Wallet pill (Desktop) */}
              <div
                onClick={() => setActivePage('wallet')}
                className="hidden sm:flex items-center space-x-2 bg-blue-50/80 px-3.5 py-1.5 rounded-xl border border-blue-200/80 cursor-pointer hover:bg-blue-100/70 transition"
                title="Click to view dedicated accounts and fund wallet"
              >
                <span className="text-slate-600 text-xs font-bold">Wallet:</span>
                <span className="font-black text-sm text-blue-700 font-mono">
                  ₦{user.wallet_balance ? user.wallet_balance.toLocaleString('en-NG', { minimumFractionDigits: 2 }) : '0.00'}
                </span>
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => {
                  Swal.fire({
                    title: 'Notification Center',
                    html: unreadAlerts > 0
                      ? `You have <strong>${unreadAlerts}</strong> unread notification(s) in your ledger.`
                      : 'You have no unread notifications.',
                    confirmButtonColor: '#2563EB'
                  });
                }}
                className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[2]" />
                {unreadAlerts > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* User Avatar Circle */}
              <button
                onClick={() => navigateTo('profile')}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center justify-center shadow-xs transition"
                title={`Profile: ${user.name}`}
              >
                {(user.name || 'U').charAt(0).toUpperCase()}
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => { setPending2FA(false); setShowLoginModal(true); }}
                className="text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-blue-600 text-white font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Body Area with Responsive Navigation Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sliding Drawer & Backdrop */}
        {user && sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation menu"
          />
        )}
        {user && (
          <aside className={`bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-50 ${
            sidebarOpen
              ? 'fixed inset-y-0 left-0 w-72 sm:w-80 shadow-2xl animate-scale-in flex md:relative md:w-72 md:shadow-none'
              : 'hidden md:flex md:w-72'
          }`}>
            {/* Drawer Header on Mobile */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-4 h-4 fill-white text-white" />
                </div>
                <span className="font-black text-base text-slate-900 tracking-tight">{appName}</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition md:hidden"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* User Profile Mini Card in Drawer */}
            <div className="p-4 mx-3 my-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-slate-900 truncate">{user.name}</div>
                <div className="text-xs text-slate-500 font-mono truncate">{user.phone || user.email}</div>
                <div className="mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200/80 shadow-2xs">
                    {user.role === 'reseller' || user.tier >= 3 ? 'VIP Reseller' : user.role === 'agent' || user.tier >= 2 ? 'Agent Tier 2' : 'Tier 1 Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Dedicated Drawer Links (Strictly Matching Screenshot 1) */}
            <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)] md:hidden">
              {[
                { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { key: 'solar_pin', label: 'Buy Solar', icon: Sun },
                { key: 'airtime', label: 'Buy Airtime', icon: Phone },
                { key: 'data', label: 'Buy Data', icon: Wifi },
                { key: 'wallet', label: 'Fund Wallet', icon: Wallet },
                { key: 'airtime_cash', label: 'Airtime to Cash', icon: Repeat },
                { key: 'transactions', label: 'History', icon: ListOrdered },
                { key: 'wallet', label: 'Withdraw', icon: ArrowUpRight },
                { key: 'profile', label: 'Profile', icon: User },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isActive = activePage === item.key;
                return (
                  <button
                    key={`${item.key}-${idx}`}
                    onClick={() => { navigateTo(item.key as any); setSidebarOpen(false); }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl font-bold text-sm transition flex items-center space-x-3 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  Swal.fire({
                    title: 'Notifications',
                    html: unreadAlerts > 0 ? `You have ${unreadAlerts} unread notification(s).` : 'No new notifications.',
                    confirmButtonColor: '#2563EB'
                  });
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center space-x-3"
              >
                <Bell className="w-5 h-5 text-slate-500" />
                <div className="flex-1 flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadAlerts > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadAlerts}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Desktop Full Hierarchical Navigation */}
            <div className="hidden md:block p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-140px)]">
              {customerNavSections.map((sec, secIdx) => (
                <div key={secIdx} className="space-y-1">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                    {sec.title}
                  </div>
                  {sec.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activePage === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => { navigateTo(item.key as any); setSidebarOpen(false); }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl font-bold text-sm transition flex items-center space-x-3 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Brand Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-center">
              <div className="text-xs font-black text-slate-600 tracking-tight">
                {appName} • v2.0
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                Enterprise High-Speed VTU &amp; Power
              </div>
            </div>
          </aside>
        )}

        {/* Content View Router with Bottom Spacing for Mobile Bottom Bar */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] pb-24 md:pb-6">
          {Boolean(settings.maintenance_mode) && user?.role !== 'super_admin' && user?.role !== 'sub_admin' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white min-h-[80vh] m-4 md:m-8 rounded-3xl border border-amber-200/60 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-inner">
                <Wrench className="w-8 h-8 animate-pulse" />
              </div>
              <span className="bg-amber-100 text-amber-800 font-extrabold text-xs px-3.5 py-1 rounded-full uppercase tracking-wider">
                Scheduled Platform Maintenance
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 max-w-lg">
                We're Performing Routine Upgrades
              </h2>
              <p className="text-sm text-slate-600 max-w-lg font-medium leading-relaxed">
                {settings.maintenance_message || 'Our telecom servers are currently undergoing scheduled optimization to enhance delivery speeds and high-volume stability. Services will resume shortly.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={loadSettings}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition flex items-center space-x-2 shadow-md shadow-blue-500/20"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Check System Status</span>
                </button>
                {user && (
                  <button
                    onClick={handleLogout}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-xl transition"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          ) : !user || activePage === 'landing' ? (
            <LandingPage
              onOpenLogin={() => { setPending2FA(false); setShowLoginModal(true); }}
              onOpenRegister={() => setShowRegisterModal(true)}
              settings={settings}
            />
          ) : activePage === 'dashboard' ? (
            <ABKDashboard
              user={user}
              settings={settings}
              onRefreshUser={loadUserProfile}
              onLogout={handleLogout}
              onNavigateTo={(page) => setActivePage(page as any)}
            />
          ) : activePage === 'profile' ? (
            <ProfilePage
              user={user}
              onRefreshUser={loadUserProfile}
              onBack={() => setActivePage('dashboard')}
              onOpenSupport={() => setActivePage('support')}
            />
          ) : activePage === 'referrals' ? (
            <ReferralsPage
              onBack={() => setActivePage('dashboard')}
              onRefreshUser={loadUserProfile}
            />
          ) : activePage === 'data' ? (
            <DataPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'airtime' ? (
            <AirtimePage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'solar_pin' ? (
            <SolarPinPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'cable' ? (
            <CablePage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'electricity' ? (
            <ElectricityPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'recharge_print' ? (
            <RechargePrintPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'exam_pins' ? (
            <ExamPinsPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'airtime_cash' ? (
            <AirtimeToCashPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'bulk_sms' ? (
            <BulkSMSPage onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'wallet' ? (
            <WalletPage user={user} onBack={() => setActivePage('dashboard')} onRefreshUser={loadUserProfile} />
          ) : activePage === 'transactions' ? (
            <TransactionsPage onBack={() => setActivePage('dashboard')} settings={settings} />
          ) : activePage === 'reseller_portal' ? (
            <ResellerPortalPage user={user} onRefreshUser={loadUserProfile} onBack={() => setActivePage('dashboard')} onNavigateTo={(page) => setActivePage(page as any)} />
          ) : activePage === 'sim_hosting' ? (
            <SimHostingPage onBack={() => setActivePage('dashboard')} />
          ) : activePage === 'developer_api' ? (
            <DeveloperAPIPage onBack={() => setActivePage('dashboard')} />
          ) : activePage === 'security' ? (
            <SecuritySettingsPage user={user} onRefreshUser={loadUserProfile} onBack={() => setActivePage('dashboard')} />
          ) : activePage === 'support' ? (
            <SupportPage onBack={() => setActivePage('dashboard')} settings={settings} />
          ) : (
            <div className="p-8 text-center text-slate-400">Page not found</div>
          )}
        </main>
      </div>

      {/* Sign In & Two-Factor Authentication (2FA) Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 space-y-5 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => { setShowLoginModal(false); setPending2FA(false); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {!pending2FA ? (
              <>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to {appName}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Access your authoritative wallet and services</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Email or Phone Number</label>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. user@example.com or 08012345678"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your account password"
                      required
                    />
                    <div className="flex items-center justify-between text-xs pt-1.5">
                      <span />
                      <button
                        type="button"
                        onClick={() => { setShowLoginModal(false); setShowForgotPassword(true); setForgotStep(1); setForgotIdentifier(identifier); }}
                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] text-base shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Don't have an account yet?{' '}
                    <button
                      type="button"
                      onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Register here
                    </button>
                  </p>
                  <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Administrative Staff?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginModal(false);
                        window.location.hash = '#/admin/login';
                        setActivePage('admin_login');
                      }}
                      className="font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1 hover:underline"
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-500" />
                      <span>Staff Portal Login →</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Two-Factor Authentication</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    A 6-digit one-time code was sent to <strong className="text-slate-900 font-semibold">{identifier}</strong>. Enter it below to authorize this session.
                  </p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 text-center">6-Digit Email OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-2xl font-black tracking-widest font-mono border-2 border-blue-400 rounded-xl p-3.5 bg-blue-50/30 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] text-base shadow-md disabled:opacity-50"
                    >
                      {loading ? 'Verifying OTP...' : 'Verify & Continue'}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setPending2FA(false)}
                    className="text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to login</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendingOtp}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                    <span>{resendingOtp ? 'Sending...' : 'Resend Code'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Forgot / Reset Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 space-y-5 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {forgotStep === 1 ? (
              <>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reset Password</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">
                    Enter your registered email address or phone number to receive a high-speed 6-digit verification code.
                  </p>
                </div>

                <form onSubmit={handleRequestResetOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">Email or Phone Number</label>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. user@example.com or 08012345678"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] text-base shadow-md disabled:opacity-50"
                    >
                      {forgotLoading ? 'Dispatching OTP Code...' : 'Send 6-Digit Reset Code'}
                    </button>
                  </div>
                </form>

                <div className="pt-3 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setShowLoginModal(true); }}
                    className="font-bold text-slate-600 hover:text-slate-900 text-xs flex items-center justify-center space-x-1 mx-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Enter OTP & New Password</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    A 6-digit verification code was sent to <strong className="text-slate-900">{forgotIdentifier}</strong>.
                  </p>
                </div>

                <form onSubmit={handleExecuteResetPassword} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1 text-center">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      autoFocus
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-2xl font-black tracking-widest font-mono border-2 border-blue-400 rounded-xl p-3 bg-blue-50/30 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="000000"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">New Password (min 8 chars)</label>
                    <input
                      type="password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new strong password"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={forgotLoading || forgotOtp.length !== 6}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition active:scale-[0.98] text-base shadow-md disabled:opacity-50"
                    >
                      {forgotLoading ? 'Updating Password...' : 'Reset Password & Sign In'}
                    </button>
                  </div>
                </form>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="text-slate-500 hover:text-slate-800 font-bold flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRequestResetOtp}
                    disabled={forgotLoading}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <span>Resend OTP</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 space-y-4 shadow-2xl relative animate-in fade-in">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Create Free Account</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Instant wallet creation with double-entry ledger protection</p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as any;
                try {
                  const res = await api.register({
                    name: form.fullName.value,
                    email: form.email.value,
                    phone: form.phone.value,
                    password: form.password.value,
                    transactionPin: form.pin.value
                  });
                  setStoredToken(res.token);
                  setToken(res.token);
                  setUser(res.user);
                  setShowRegisterModal(false);
                  setActivePage('dashboard');
                  Swal.fire({
                    icon: 'success',
                    title: 'Account Activated',
                    text: 'Your wallet has been set up with double-entry ledger protection.',
                    confirmButtonColor: '#2563EB'
                  });
                } catch (err: any) {
                  Swal.fire({ icon: 'error', title: 'Registration Failed', text: err.message });
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input name="fullName" required placeholder="e.g. John Doe" className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Email Address</label>
                <input name="email" type="email" required placeholder="e.g. john@example.com" className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number</label>
                <input name="phone" required placeholder="e.g. 08012345678" className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password (min 8 chars)</label>
                <input name="password" type="password" required placeholder="Create strong password" className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">4-Digit Transaction PIN</label>
                <input name="pin" type="password" maxLength={4} placeholder="Default: 1234" className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition active:scale-[0.98] text-base shadow-md mt-2"
              >
                Register & Open Wallet
              </button>
            </form>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Mobile Bottom Navigation Bar (Matching Native Mobile App) */}
      {user && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 flex items-center justify-around shadow-lg md:hidden"
        >
          {[
            { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { key: 'transactions', label: 'History', icon: ListOrdered },
            { key: 'wallet', label: 'Wallet', icon: Wallet },
            { key: 'profile', label: 'Profile', icon: User },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activePage === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => navigateTo(tab.key as any)}
                className={`flex-1 py-1 flex flex-col items-center justify-center transition active:scale-95 ${
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4] text-blue-600' : 'stroke-[1.8]'}`} />
                </div>
                <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-extrabold text-blue-600' : 'font-semibold text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Persistent Offline & Unreliable Network Toast Indicator */}
      <NetworkStatusIndicator />
    </div>
  );
};

export default App;
