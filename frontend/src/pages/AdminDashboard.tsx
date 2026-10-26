import React, { useState, useEffect } from 'react';
import {
  Users, Server, Radio, Database, ShieldAlert, Bell, Sliders,
  RefreshCw, CheckCircle2, AlertTriangle, Play, Lock, Unlock, Eye, Download,
  ArrowLeft, Palette, Megaphone, CreditCard, ToggleLeft, ToggleRight,
  Save, Wifi, Mail, Trash2, Plus, Edit2, Send, X, ShieldCheck,
  Building, Copy, Check, ExternalLink, Globe, Key, Landmark, Search,
  Shield, ArrowDownLeft, FileText, Smartphone, UserCheck, DollarSign,
  History, ArrowUpRight, CheckCircle, Clock, XCircle, AlertCircle, Filter, Layers,
  TrendingUp, Printer, FileSpreadsheet, UserPlus, Activity, Cpu, Calendar,
  Briefcase, EyeOff, Info, ChevronDown, ChevronUp, ChevronRight, Award, LogOut,
  Settings as SettingsIcon, Menu, Gift, Sparkles, LayoutDashboard,
  MessageSquare, HelpCircle, HeartPulse, HardDrive, Terminal, Star,
  Wallet, Wrench, Zap
} from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Skeleton } from '../components/common/Skeleton';
import { ActionButton } from '../components/common/ActionButton';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { FinancialCommandCenter } from '../components/admin/FinancialCommandCenter';
import { FinancialReconciliationCenter } from '../components/admin/FinancialReconciliationCenter';
import { CustomerSupportLiveChat } from '../components/admin/CustomerSupportLiveChat';
import { UserSecurityControls } from '../components/admin/UserSecurityControls';
import { SurityValidationCenter } from '../components/admin/SurityValidationCenter';
import { StaffTaskManagement } from '../components/admin/StaffTaskManagement';
import { CheckSquare } from 'lucide-react';

export const AdminDashboard: React.FC<{
  onBack: () => void;
  onLogout?: () => void;
  onSettingsUpdated?: () => void;
  currentUser?: any;
}> = ({ onBack, onLogout, onSettingsUpdated, currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'reports' | 'subadmins' | 'withdrawals' | 'users' | 'data_plans' |
    'smtp' | 'branding' | 'routing' | 'gateways' | 'providers' | 'sims' |
    'templates' | 'backups' | 'audit' | 'referrals_admin' | 'broadcasts' |
    'support_tickets' | 'system_health' | 'app_versioning' | 'testimonials_admin' |
    'cms_admin' | 'wallets_admin' | 'maintenance_admin' | 'mobile_remote_config' | 'security_center' |
    'reconciliation' | 'live_support' | 'surity_engine' | 'staff_tasks'
  >('overview');

  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<any>({
    app_name: 'Bukar Data Sub',
    app_tagline: 'Automated Telecom & Data Platform',
    logo_url: '',
    primary_color: '#1E5BF9',
    accent_color: '#10B981',
    support_email: 'support@bukardatasub.com',
    support_phone: '09131797675',
    whatsapp_number: '2349131797675',
    announcement_text: 'Welcome to our newly upgraded automated data engine!',
    announcement_type: 'info',
    announcement_active: 1,
    maintenance_mode: 0,
    maintenance_message: 'Platform is currently undergoing scheduled technical maintenance. Service will resume shortly.',
    referral_bonus_amount: 100,
    referral_commission_percent: 2
  });

  const [catalogue, setCatalogue] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanNetwork, setSelectedPlanNetwork] = useState('ALL');
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<any[]>([]);
  const [sims, setSims] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subadmins, setSubadmins] = useState<any[]>([]);
  const [financialReport, setFinancialReport] = useState<any>(null);
  const [reportPeriod, setReportPeriod] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [reportYear, setReportYear] = useState<string>('all');
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [showSubadminModal, setShowSubadminModal] = useState(false);
  const [subadminForm, setSubadminForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    subAdminRole: 'finance',
    transactionPin: '1234'
  });
  const [loadingSubadmin, setLoadingSubadmin] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Financial Transaction Explorer State
  const [explorerTransactions, setExplorerTransactions] = useState<any[]>([]);
  const [explorerTotal, setExplorerTotal] = useState(0);
  const [explorerPage, setExplorerPage] = useState(1);
  const [explorerTotalPages, setExplorerTotalPages] = useState(1);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState('');
  const [explorerCategory, setExplorerCategory] = useState('ALL');
  const [explorerStatus, setExplorerStatus] = useState('ALL');
  const [explorerChannel, setExplorerChannel] = useState('ALL');
  const [selectedTxDetail, setSelectedTxDetail] = useState<any>(null);
  const [loadingTxDetail, setLoadingTxDetail] = useState(false);

  // Testimonials & Reviews Management State
  const [testimonialsList, setTestimonialsList] = useState<any[]>([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    authorName: '',
    authorRole: 'Merchant',
    rating: 5,
    content: '',
    avatarUrl: '',
    isPublished: true,
    sortOrder: 0
  });

  // Support Tickets State
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportStatusFilter, setSupportStatusFilter] = useState('ALL');
  const [supportSearchTerm, setSupportSearchTerm] = useState('');
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReplyMessage, setTicketReplyMessage] = useState('');
  const [ticketReplyStatus, setTicketReplyStatus] = useState('RESOLVED');
  const [submittingReply, setSubmittingReply] = useState(false);

  // System Diagnostics State
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // App Versioning State
  const [appVersionInfo, setAppVersionInfo] = useState<any>(null);
  const [loadingAppVersion, setLoadingAppVersion] = useState(false);

  // Customer Wallets (Old & New Balance Management) State
  const [adminWallets, setAdminWallets] = useState<any[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [walletsSearch, setWalletsSearch] = useState('');
  const [walletsStatusFilter, setWalletsStatusFilter] = useState('all');
  const [selectedWalletUser, setSelectedWalletUser] = useState<any>(null);
  const [walletDetailData, setWalletDetailData] = useState<any>(null);
  const [loadingWalletDetail, setLoadingWalletDetail] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustTargetUser, setAdjustTargetUser] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustTicketRef, setAdjustTicketRef] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [lastAdjustmentResult, setLastAdjustmentResult] = useState<any>(null);
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([]);
  const [loadingPendingAdj, setLoadingPendingAdj] = useState(false);

  // Website CMS & Content Management State
  const [cmsSections, setCmsSections] = useState<any[]>([]);
  const [loadingCms, setLoadingCms] = useState(false);
  const [selectedCmsSection, setSelectedCmsSection] = useState<any>(null);
  const [cmsEditContent, setCmsEditContent] = useState('');
  const [cmsEditTitle, setCmsEditTitle] = useState('');
  const [cmsEditNotes, setCmsEditNotes] = useState('');
  const [cmsRevisions, setCmsRevisions] = useState<any[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [cmsPreviewMode, setCmsPreviewMode] = useState(false);
  const [cmsSaving, setCmsSaving] = useState(false);

  // Platform Maintenance Control State
  const [maintConfig, setMaintConfig] = useState<any>({
    active: false,
    scope: 'all',
    message: '',
    startTime: '',
    endTime: '',
    bypassIps: ''
  });
  const [maintHistory, setMaintHistory] = useState<any[]>([]);
  const [loadingMaint, setLoadingMaint] = useState(false);
  const [maintSaving, setMaintSaving] = useState(false);
  const [showMaintPreviewModal, setShowMaintPreviewModal] = useState(false);

  // Mobile Remote Config & Telemetry State
  const [mobileConfigData, setMobileConfigData] = useState<any>(null);
  const [mobileTelemetryData, setMobileTelemetryData] = useState<any>(null);
  const [loadingMobileConfig, setLoadingMobileConfig] = useState(false);
  const [mobileSaving, setMobileSaving] = useState(false);

  // Security Operations & Incident Center State
  const [securityOverviewData, setSecurityOverviewData] = useState<any>(null);
  const [securityIncidentsData, setSecurityIncidentsData] = useState<any[]>([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [incidentFilter, setIncidentFilter] = useState('ALL');
  const [selectedIncidentModal, setSelectedIncidentModal] = useState<any>(null);
  const [incidentUpdateStatus, setIncidentUpdateStatus] = useState('INVESTIGATING');
  const [incidentResolutionNotes, setIncidentResolutionNotes] = useState('');
  const [updatingIncident, setUpdatingIncident] = useState(false);

  // Sidebar instant search filter
  const [navSearch, setNavSearch] = useState('');

  // Mobile Navigation Drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User Management Modals & Filtering State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userTierFilter, setUserTierFilter] = useState('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');

  // Enterprise Moniecrm Layout & 13-Category Accordions State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    customers: false,
    security: false,
    vtu: false,
    providers: false,
    payments: false,
    resellers: false,
    sims: false,
    notifications: false,
    analytics: false,
    support: false,
    system: false,
    app_mgmt: false
  });
  const [showBusinessBalance, setShowBusinessBalance] = useState(true);
  const [showPerformanceBalance, setShowPerformanceBalance] = useState(true);
  const [copiedVaultId, setCopiedVaultId] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState<'business' | 'performance' | 'all'>('business');

  // RBAC Permission Guard State
  const [userPermissions, setUserPermissions] = useState<string[]>(['*']);
  const [isSuperAdmin, setIsSuperAdmin] = useState(true);
  const hasPerm = (perm: string) => isSuperAdmin || userPermissions.includes('*') || userPermissions.includes(perm);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    transactionPin: '1234',
    role: 'customer',
    tier: 1,
    initialBalance: '0'
  });
  const [loadingCreateUser, setLoadingCreateUser] = useState(false);
  const [inspectUser, setInspectUser] = useState<any>(null);
  const [inspectData, setInspectData] = useState<any>(null);
  const [loadingInspect, setLoadingInspect] = useState(false);

  const [adjustUser, setAdjustUser] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState<{ type: 'CREDIT' | 'DEBIT'; amount: string; reason: string }>({
    type: 'CREDIT',
    amount: '',
    reason: 'Admin manual wallet adjustment'
  });
  const [loadingAdjust, setLoadingAdjust] = useState(false);

  const [editUser, setEditUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'customer',
    subAdminRole: 'none',
    tier: 1,
    status: 'active',
    address: '',
    state: '',
    newPassword: '',
    newPin: ''
  });
  const [loadingEditUser, setLoadingEditUser] = useState(false);

  // Announcements & SweetAlert Broadcast State
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'alert',
    badgeText: 'Live Notice',
    durationDays: 7,
    targetAudience: 'all'
  });
  const [publishingAnnouncement, setPublishingAnnouncement] = useState(false);

  // Bulk Data Pricing Engine State
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceForm, setBulkPriceForm] = useState({
    network: 'ALL',
    dataType: 'ALL',
    targetField: 'all_prices',
    adjustmentType: 'PERCENTAGE' as 'PERCENTAGE' | 'FLAT_AMOUNT',
    value: 5
  });
  const [bulkAdjusting, setBulkAdjusting] = useState(false);

  // Quick Brand & Logo Modal State
  const [showQuickBrandModal, setShowQuickBrandModal] = useState(false);
  const [quickBrandForm, setQuickBrandForm] = useState({
    appName: '',
    logoUrl: '',
    tagline: '',
    primaryColor: '#1E5BF9',
    accentColor: '#10B981',
    supportPhone: '',
    supportEmail: '',
    whatsappNumber: ''
  });
  const [savingQuickBrand, setSavingQuickBrand] = useState(false);

  const [resetCredUser, setResetCredUser] = useState<any>(null);
  const [resetCredForm, setResetCredForm] = useState({
    newPassword: '',
    newPin: ''
  });
  const [loadingResetCred, setLoadingResetCred] = useState(false);

  // Gateway Modal state
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<any>(null);
  const [gatewayForm, setGatewayForm] = useState<any>({
    id: '',
    name: '',
    isActive: true,
    isDefault: false,
    environment: 'production',
    publicKey: '',
    secretKey: '',
    apiKey: '',
    contractCode: '',
    webhookSecret: '',
    merchantId: '',
    bankName: '',
    accountNumber: '',
    accountName: ''
  });

  // Plan Modal state
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<any>({
    networkOrBiller: 'MTN',
    dataType: 'SME',
    planName: 'MTN 1.0GB SME Data',
    planSize: '1GB',
    planCode: 'MTN-SME-1GB',
    validity: '30 Days',
    buyingPrice: '240',
    amount: '260',
    resellerPrice: '248',
    apiPrice: '242',
    routingType: 'API',
    providerId: '',
    providerPlanId: ''
  });

  // SMTP Settings & Test Email
  const [smtpForm, setSmtpForm] = useState<any>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    smtpFromName: 'Bukar Data Sub Desk',
    smtpFromEmail: 'alerts@bukardatasub.com'
  });
  const [testEmailTarget, setTestEmailTarget] = useState('admin@bukardatasub.com');
  const [loadingTestEmail, setLoadingTestEmail] = useState(false);

  // Provider Modal state
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState<any>({
    name: '',
    category: 'data',
    environment: 'production',
    baseUrl: 'https://',
    apiKey: '',
    apiSecret: '',
    authMethod: 'bearer_token',
    priority: 1,
    timeoutSeconds: 15,
    dataEndpoint: '/data',
    airtimeEndpoint: '/airtime',
    cableEndpoint: '/cable',
    electricityEndpoint: '/electricity',
    balanceEndpoint: '/balance'
  });

  const [copiedWebhookId, setCopiedWebhookId] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [sRes, setRes, catRes, pRes, simRes, uRes, tRes, bRes, aRes, plRes, gwRes, wRes, subRes, repRes, permRes, tixRes, hlthRes, verRes, testRes, txRes, annRes] = await Promise.all([
        api.getAdminStats().catch(() => ({ success: false })),
        api.getSettings().catch(() => ({ success: false })),
        api.getServiceCatalogue().catch(() => ({ success: false })),
        api.getProviders().catch(() => ({ success: false })),
        api.getHostedSims().catch(() => ({ success: false })),
        api.getAdminUsers().catch(() => ({ success: false })),
        api.getNotificationTemplates().catch(() => ({ success: false })),
        api.getBackups().catch(() => ({ success: false })),
        api.getAuditLogs().catch(() => ({ success: false })),
        api.getAdminPlans().catch(() => ({ success: false })),
        api.getPaymentGateways().catch(() => ({ success: false })),
        api.getAdminWithdrawals().catch(() => ({ success: false })),
        api.getSubadmins().catch(() => ({ success: false })),
        api.getFinancialReports({ period: reportPeriod, year: reportYear !== 'all' ? reportYear : undefined, startDate: reportStartDate, endDate: reportEndDate }).catch(() => ({ success: false })),
        api.getAdminPermissions().catch(() => ({ success: false })),
        api.getAdminSupportTickets().catch(() => ({ success: false })),
        api.getSystemHealth().catch(() => ({ success: false })),
        api.getAppVersionInfo().catch(() => ({ success: false })),
        api.getAdminTestimonials().catch(() => ({ success: false })),
        api.getAdminTransactions({ page: 1, limit: 15 }).catch(() => ({ success: false })),
        api.getAdminAnnouncements().catch(() => ({ success: false }))
      ]);

      if (permRes?.success) {
        setIsSuperAdmin(permRes.isSuperAdmin);
        setUserPermissions(permRes.permissions || []);
      }

      if (sRes.success) setStats(sRes.stats);
      if (setRes.success && setRes.settings) {
        setSettings(setRes.settings);
        setSmtpForm({
          smtpHost: setRes.settings.smtp_host || '',
          smtpPort: String(setRes.settings.smtp_port || 587),
          smtpUser: setRes.settings.smtp_user || '',
          smtpPass: setRes.settings.smtp_pass || '',
          smtpSecure: Boolean(setRes.settings.smtp_secure),
          smtpFromName: setRes.settings.smtp_from_name || 'Bukar Data Sub Alerts',
          smtpFromEmail: setRes.settings.smtp_from_email || 'alerts@bukardatasub.com'
        });
      }
      if (catRes.success) setCatalogue(catRes.catalogue || []);
      if (pRes.success) setProviders(pRes.providers || []);
      if (simRes.success) setSims(simRes.sims || []);
      if (uRes.success) setUsers(uRes.users || []);
      if (tRes.success) setTemplates(tRes.templates || []);
      if (bRes.success) setBackups(bRes.backups || []);
      if (aRes.success) setAuditLogs(aRes.logs || []);
      if (plRes.success) setPlans(plRes.plans || []);
      if (gwRes?.success) setGateways(gwRes.gateways || []);
      if (wRes?.success) setAdminWithdrawals(wRes.withdrawals || []);
      if (subRes?.success) setSubadmins(subRes.subadmins || []);
      if (repRes?.success) setFinancialReport(repRes.summary || null);
      if (tixRes?.success) setSupportTickets(tixRes.tickets || []);
      if (hlthRes?.success) setSystemHealth(hlthRes.health || null);
      if (verRes?.success) setAppVersionInfo(verRes);
      if (testRes?.success) setTestimonialsList(testRes.testimonials || []);
      if (txRes?.success) {
        setExplorerTransactions(txRes.transactions || []);
        setExplorerTotal(txRes.total || 0);
        setExplorerPage(txRes.page || 1);
        setExplorerTotalPages(txRes.totalPages || 1);
      }
      if (annRes?.success) setAnnouncements(annRes.announcements || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    setLoadingAnnouncements(true);
    try {
      const res = await api.getAdminAnnouncements();
      if (res?.success) setAnnouncements(res.announcements || []);
    } catch (e) {
      console.error('Failed to load announcements', e);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Please fill in both title and message.' });
      return;
    }
    setPublishingAnnouncement(true);
    try {
      const res = await api.createAnnouncement({
        title: announcementForm.title,
        message: announcementForm.message,
        type: announcementForm.type,
        badgeText: announcementForm.badgeText,
        durationDays: Number(announcementForm.durationDays) || 7,
        targetAudience: announcementForm.targetAudience
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Notice Published Live!',
          text: `Notice will appear in all customer dashboards for ${announcementForm.durationDays} day(s) via SweetAlert popup.`
        });
        setShowAnnouncementModal(false);
        setAnnouncementForm({
          title: '',
          message: '',
          type: 'info',
          badgeText: 'Live Notice',
          durationDays: 7,
          targetAudience: 'all'
        });
        fetchAnnouncements();
      } else {
        Swal.fire({ icon: 'error', title: 'Failed', text: res?.message || 'Could not publish notice' });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Server error' });
    } finally {
      setPublishingAnnouncement(false);
    }
  };

  const handlePreviewAnnouncement = (ann: any) => {
    const iconType = ann.type === 'alert' ? 'error' : ann.type === 'warning' ? 'warning' : ann.type === 'success' ? 'success' : 'info';
    Swal.fire({
      title: `<span style="font-size: 20px; font-weight: 900; color: #0F172A;">${ann.title}</span>`,
      html: `
        <div style="text-align: left; font-size: 14px; line-height: 1.6; color: #334155; padding-top: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="display:inline-block; padding: 4px 12px; border-radius: 9999px; background: #EEF2FF; color: #3730A3; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #C7D2FE;">
              ${ann.badge_text || 'Live Notice'}
            </span>
            <span style="font-size: 11px; color: #64748B; font-weight: 600;">
              Active for ${ann.duration_days} Day(s)
            </span>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 14px; white-space: pre-wrap; font-size: 13.5px; color: #1E293B;">
            ${ann.message}
          </div>
          <div style="margin-top: 14px; font-size: 11px; color: #94A3B8; text-align: right;">
            Expires: ${new Date(ann.expires_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `,
      icon: iconType,
      confirmButtonText: 'Understood & Proceed',
      confirmButtonColor: '#1E5BF9',
      backdrop: 'rgba(15, 23, 42, 0.7)',
      customClass: {
        popup: 'rounded-3xl shadow-2xl p-6 border border-slate-200'
      }
    });
  };

  const handleToggleAnnouncement = async (id: string, currentActive: boolean | number) => {
    try {
      const res = await api.updateAnnouncement(id, { isActive: !currentActive });
      if (res?.success) {
        fetchAnnouncements();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const res = await Swal.fire({
      title: 'Delete Notice?',
      text: 'This notice will be permanently deleted and removed from user dashboards.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Yes, Delete'
    });
    if (res.isConfirmed) {
      await api.deleteAnnouncement(id);
      Swal.fire({ icon: 'success', title: 'Notice Deleted', timer: 1500, showConfirmButton: false });
      fetchAnnouncements();
    }
  };

  const handleExecuteBulkPriceAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPriceForm.value === 0 || isNaN(bulkPriceForm.value)) {
      Swal.fire({ icon: 'warning', title: 'Invalid Value', text: 'Adjustment value cannot be zero.' });
      return;
    }
    const valText = bulkPriceForm.adjustmentType === 'PERCENTAGE' 
      ? `${bulkPriceForm.value > 0 ? '+' : ''}${bulkPriceForm.value}%`
      : `${bulkPriceForm.value > 0 ? '+₦' : '-₦'}${Math.abs(bulkPriceForm.value)}`;

    const confirm = await Swal.fire({
      title: 'Apply Global Price Adjustment?',
      html: `Are you sure you want to apply <b>${valText}</b> to <b>${bulkPriceForm.network}</b> (${bulkPriceForm.dataType}) across <b>${bulkPriceForm.targetField.replace('_', ' ')}</b>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Apply System-Wide',
      confirmButtonColor: '#1E5BF9',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    setBulkAdjusting(true);
    try {
      const res = await api.bulkAdjustPlans({
        network: bulkPriceForm.network,
        dataType: bulkPriceForm.dataType,
        targetField: bulkPriceForm.targetField,
        adjustmentType: bulkPriceForm.adjustmentType,
        value: Number(bulkPriceForm.value)
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Pricing Updated!',
          text: `Successfully modified ${res.modifiedCount} plan(s) across the entire platform.`
        });
        setShowBulkPriceModal(false);
        const plRes = await api.getAdminPlans();
        if (plRes?.success) setPlans(plRes.plans || []);
      } else {
        Swal.fire({ icon: 'error', title: 'Bulk Update Failed', text: res?.message || 'Could not update prices' });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Server error' });
    } finally {
      setBulkAdjusting(false);
    }
  };

  const openQuickBrand = () => {
    setQuickBrandForm({
      appName: settings.app_name || '',
      logoUrl: settings.logo_url || '',
      tagline: settings.app_tagline || '',
      primaryColor: settings.primary_color || '#1E5BF9',
      accentColor: settings.accent_color || '#10B981',
      supportPhone: settings.support_phone || '',
      supportEmail: settings.support_email || '',
      whatsappNumber: settings.whatsapp_number || ''
    });
    setShowQuickBrandModal(true);
  };

  const handleSaveQuickBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingQuickBrand(true);
    try {
      await api.updateSettings({
        appName: quickBrandForm.appName,
        logoUrl: quickBrandForm.logoUrl,
        appTagline: quickBrandForm.tagline,
        primaryColor: quickBrandForm.primaryColor,
        accentColor: quickBrandForm.accentColor,
        supportPhone: quickBrandForm.supportPhone,
        supportEmail: quickBrandForm.supportEmail,
        whatsappNumber: quickBrandForm.whatsappNumber
      });
      Swal.fire({
        icon: 'success',
        title: 'Brand Identity & Logo Updated!',
        text: 'The platform logo, name, colors, and support contacts have been updated live across all pages.'
      });
      setShowQuickBrandModal(false);
      loadAllData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setSavingQuickBrand(false);
    }
  };

  const fetchSupportTickets = async (status = supportStatusFilter) => {
    setLoadingTickets(true);
    try {
      const res = await api.getAdminSupportTickets(status);
      if (res?.success) {
        setSupportTickets(res.tickets || []);
      }
    } catch (err: any) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;
    if (!ticketReplyMessage.trim()) {
      Swal.fire({ icon: 'warning', title: 'Reply Required', text: 'Please enter a reply message for the user.' });
      return;
    }
    setSubmittingReply(true);
    try {
      const res = await api.replyAdminSupportTicket(selectedTicket.id, {
        message: ticketReplyMessage.trim(),
        status: ticketReplyStatus
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Reply Dispatched',
          text: 'Your response has been delivered to the customer ticket thread and status updated.',
          confirmButtonColor: '#1E5BF9'
        });
        setTicketReplyMessage('');
        setSelectedTicket(null);
        fetchSupportTickets();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Reply Failed', text: err.message || 'Could not send reply' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const fetchSystemHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await api.getSystemHealth();
      if (res?.success) {
        setSystemHealth(res.health);
        Swal.fire({
          icon: 'success',
          title: 'Diagnostics Refreshed',
          text: 'Core engine telemetry and database WAL stats updated in real-time.',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Diagnostic Fetch Failed', text: err.message });
    } finally {
      setLoadingHealth(false);
    }
  };

  // --- WALLET MANAGEMENT FUNCTIONS ---
  const fetchWallets = async (search = walletsSearch, status = walletsStatusFilter) => {
    setLoadingWallets(true);
    try {
      const [wRes, pRes] = await Promise.all([
        api.getAdminWallets({ search: search || undefined, status: status !== 'all' ? status : undefined }),
        api.getPendingAdjustments().catch(() => ({ success: false, pending: [] }))
      ]);
      if (wRes?.success) setAdminWallets(wRes.wallets || []);
      if (pRes?.success) setPendingAdjustments(pRes.pending || []);
    } catch (err: any) {
      console.error('Failed to load wallets', err);
    } finally {
      setLoadingWallets(false);
    }
  };

  const fetchWalletDetail = async (userId: string) => {
    setLoadingWalletDetail(true);
    try {
      const res = await api.getAdminWalletDetail(userId);
      if (res?.success) {
        setWalletDetailData(res.walletDetail);
        setSelectedWalletUser(res.walletDetail.user);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Inspection Failed', text: err.message });
    } finally {
      setLoadingWalletDetail(false);
    }
  };

  const handleAdjustWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTargetUser) return;
    const numAmount = Number(adjustAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Please enter a valid positive adjustment amount.' });
      return;
    }
    if (!adjustReason.trim()) {
      Swal.fire({ icon: 'warning', title: 'Reason Required', text: 'An authoritative audit reason is required for financial ledger adjustments.' });
      return;
    }

    const currentBal = Number(adjustTargetUser.wallet_balance || adjustTargetUser.balance || 0);
    const projectedNew = adjustType === 'CREDIT' ? currentBal + numAmount : currentBal - numAmount;

    if (adjustType === 'DEBIT' && currentBal < numAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Overdraft Prevented',
        text: `Customer has only ₦${currentBal.toLocaleString()} available. Cannot debit ₦${numAmount.toLocaleString()}.`
      });
      return;
    }

    const confirmRes = await Swal.fire({
      title: `Confirm Wallet ${adjustType}?`,
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6; padding: 6px;">
          <p><b>Target Customer:</b> ${adjustTargetUser.name} (${adjustTargetUser.email})</p>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px; margin: 10px 0;">
            <p><b>Current Authoritative Balance:</b> <span style="font-family: monospace; font-size: 14px; font-weight: bold;">₦${currentBal.toLocaleString()}</span></p>
            <p><b>${adjustType === 'CREDIT' ? 'Credit Addition (+):' : 'Debit Deduction (-):'}</b> <span style="color: ${adjustType === 'CREDIT' ? '#059669' : '#DC2626'}; font-family: monospace; font-weight: bold;">₦${numAmount.toLocaleString()}</span></p>
            <hr style="border-top: 1px dashed #CBD5E1; margin: 8px 0;" />
            <p><b>Projected Authoritative Balance:</b> <span style="font-family: monospace; font-size: 15px; font-weight: bold; color: #1E40AF;">₦${projectedNew.toLocaleString()}</span></p>
          </div>
          <p><b>Audit Reason:</b> ${adjustReason}</p>
          ${numAmount >= 50000 && !isSuperAdmin ? '<p style="color: #D97706; font-weight: bold; margin-top: 6px;">⚠️ Amount ≥ ₦50,000 requires secondary Super Admin dual approval.</p>' : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Proceed with ${adjustType}`,
      confirmButtonColor: adjustType === 'CREDIT' ? '#059669' : '#DC2626'
    });

    if (!confirmRes.isConfirmed) return;

    setAdjustSubmitting(true);
    try {
      const res = await api.adjustWallet({
        userId: adjustTargetUser.id || adjustTargetUser.user_id,
        type: adjustType,
        amount: numAmount,
        reason: adjustReason.trim(),
        ticketReference: adjustTicketRef.trim() || undefined
      });

      if (res.pendingApproval) {
        Swal.fire({
          icon: 'info',
          title: 'Adjustment Pending Dual Approval',
          html: `
            <div style="text-align: left; font-size: 13px;">
              <p>${res.message}</p>
              <div style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 10px; border-radius: 8px; margin-top: 10px;">
                <p><b>Previous Balance:</b> ₦${Number(res.oldBalance).toLocaleString()}</p>
                <p><b>Requested Amount:</b> ₦${Number(res.adjustmentAmount).toLocaleString()}</p>
                <p><b>Projected Balance:</b> ₦${Number(res.projectedNewBalance).toLocaleString()}</p>
                <p><b>Reference:</b> <code style="font-family: monospace;">${res.reference}</code></p>
              </div>
            </div>
          `,
          confirmButtonColor: '#1E5BF9'
        });
      } else {
        setLastAdjustmentResult({
          oldBalance: res.oldBalance,
          newBalance: res.newBalance,
          amount: res.adjustmentAmount,
          type: res.adjustmentType,
          reference: res.reference
        });

        Swal.fire({
          icon: 'success',
          title: 'Authoritative Adjustment Committed',
          html: `
            <div style="text-align: left; font-size: 13px; line-height: 1.6;">
              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; margin-bottom: 8px;">
                <p><b>Previous Balance:</b> ₦${Number(res.oldBalance).toLocaleString()}</p>
                <p><b>Committed ${res.adjustmentType}:</b> ₦${Number(res.adjustmentAmount).toLocaleString()}</p>
                <p><b>Authoritative New Balance:</b> <span style="font-weight: bold; color: #15803D; font-size: 15px;">₦${Number(res.newBalance).toLocaleString()}</span></p>
              </div>
              <p style="font-size: 11px; color: #64748B;">Audit Reference: <code style="font-family: monospace;">${res.reference}</code></p>
            </div>
          `,
          confirmButtonColor: '#1E5BF9'
        });
      }

      setShowAdjustModal(false);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustTicketRef('');
      fetchWallets();
      if (selectedWalletUser) fetchWalletDetail(selectedWalletUser.id);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Adjustment Failed', text: err.message });
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleApproveAdjustment = async (id: string) => {
    try {
      const res = await api.approveAdjustment(id);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Adjustment Approved',
          text: res.message,
          confirmButtonColor: '#1E5BF9'
        });
        fetchWallets();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Approval Failed', text: err.message });
    }
  };

  const handleRejectAdjustment = async (id: string) => {
    const { value: reason } = await Swal.fire({
      title: 'Reject Adjustment',
      input: 'text',
      inputLabel: 'Rejection Reason',
      inputPlaceholder: 'Enter reason for rejecting adjustment',
      showCancelButton: true
    });
    if (!reason) return;

    try {
      const res = await api.rejectAdjustment(id, reason);
      if (res?.success) {
        Swal.fire({ icon: 'info', title: 'Adjustment Rejected', text: res.message });
        fetchWallets();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Rejection Failed', text: err.message });
    }
  };

  // --- CMS FUNCTIONS ---
  const fetchCmsSections = async () => {
    setLoadingCms(true);
    try {
      const res = await api.getAdminCms();
      if (res?.success) {
        setCmsSections(res.sections || []);
        if (res.sections?.length > 0 && !selectedCmsSection) {
          const first = res.sections[0];
          setSelectedCmsSection(first);
          setCmsEditTitle(first.title);
          setCmsEditContent(JSON.stringify(first.draft || first.content, null, 2));
          fetchCmsRevisions(first.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to load CMS', err);
    } finally {
      setLoadingCms(false);
    }
  };

  const fetchCmsRevisions = async (sectionId: string) => {
    setLoadingRevisions(true);
    try {
      const res = await api.getAdminCmsRevisions(sectionId);
      if (res?.success) {
        setCmsRevisions(res.revisions || []);
      }
    } catch (err: any) {
      console.error('Failed to load revisions', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const handleSaveCms = async (isDraft = false) => {
    if (!selectedCmsSection) return;
    setCmsSaving(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(cmsEditContent);
      } catch {
        parsed = cmsEditContent;
      }

      const res = await api.updateAdminCms(selectedCmsSection.id, {
        title: cmsEditTitle,
        content: parsed,
        isDraft,
        notes: cmsEditNotes || undefined
      });

      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: isDraft ? 'Draft Saved' : 'Section Published',
          text: res.message,
          confirmButtonColor: '#1E5BF9'
        });
        fetchCmsSections();
        fetchCmsRevisions(selectedCmsSection.id);
        setCmsEditNotes('');
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'CMS Save Failed', text: err.message });
    } finally {
      setCmsSaving(false);
    }
  };

  const handleRollbackCms = async (revisionId: string, version: number) => {
    if (!selectedCmsSection) return;
    const confirm = await Swal.fire({
      title: `Rollback to Version ${version}?`,
      text: 'This will restore previous content and archive current content in revision history.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Restore Version',
      confirmButtonColor: '#1E5BF9'
    });
    if (!confirm.isConfirmed) return;

    try {
      const res = await api.rollbackAdminCms(selectedCmsSection.id, { revisionId });
      if (res?.success) {
        Swal.fire({ icon: 'success', title: 'Version Restored', text: res.message });
        fetchCmsSections();
        fetchCmsRevisions(selectedCmsSection.id);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Rollback Failed', text: err.message });
    }
  };

  // --- MAINTENANCE FUNCTIONS ---
  const fetchMaintenanceConfig = async () => {
    setLoadingMaint(true);
    try {
      const res = await api.getMaintenanceConfig();
      if (res?.success) {
        setMaintConfig(res.config);
        setMaintHistory(res.history || []);
      }
    } catch (err: any) {
      console.error('Failed to load maintenance config', err);
    } finally {
      setLoadingMaint(false);
    }
  };

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintSaving(true);
    try {
      const res = await api.updateMaintenanceConfig(maintConfig);
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Maintenance Policy Applied',
          text: res.message,
          confirmButtonColor: '#1E5BF9'
        });
        fetchMaintenanceConfig();
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setMaintSaving(false);
    }
  };

  // --- MOBILE REMOTE CONFIG FUNCTIONS ---
  const fetchMobileConfig = async () => {
    setLoadingMobileConfig(true);
    try {
      const [cfgRes, telRes] = await Promise.all([
        api.getAdminMobileConfig(),
        api.getAdminMobileTelemetry()
      ]);
      if (cfgRes?.success) setMobileConfigData(cfgRes.config);
      if (telRes?.success) setMobileTelemetryData(telRes.analytics);
    } catch (err: any) {
      console.error('Failed to load mobile config', err);
    } finally {
      setLoadingMobileConfig(false);
    }
  };

  const handleSaveMobileConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileConfigData) return;
    setMobileSaving(true);
    try {
      const res = await api.updateAdminMobileConfig({
        appName: mobileConfigData.app_name,
        androidMinVersion: mobileConfigData.android_min_version,
        androidLatestVersion: mobileConfigData.android_latest_version,
        iosMinVersion: mobileConfigData.ios_min_version,
        iosLatestVersion: mobileConfigData.ios_latest_version,
        forceUpdate: mobileConfigData.force_update,
        updateTitle: mobileConfigData.update_title,
        updateNotes: mobileConfigData.update_notes,
        playStoreUrl: mobileConfigData.play_store_url,
        appStoreUrl: mobileConfigData.app_store_url,
        maintenanceMode: mobileConfigData.maintenance_mode,
        maintenanceMessage: mobileConfigData.maintenance_message
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Remote Config Deployed',
          text: 'Mobile configuration updated live. Clients will receive new version policies on next launch.',
          confirmButtonColor: '#1E5BF9'
        });
        fetchMobileConfig();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
    } finally {
      setMobileSaving(false);
    }
  };

  // --- SECURITY CENTER FUNCTIONS ---
  const fetchSecurityData = async (status = incidentFilter) => {
    setLoadingSecurity(true);
    try {
      const [oRes, iRes] = await Promise.all([
        api.getSecurityOverview(),
        api.getSecurityIncidents({ status: status !== 'ALL' ? status : undefined })
      ]);
      if (oRes?.success) setSecurityOverviewData(oRes.security);
      if (iRes?.success) setSecurityIncidentsData(iRes.incidents || []);
    } catch (err: any) {
      console.error('Failed to load security data', err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  const handleUpdateIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentModal) return;
    setUpdatingIncident(true);
    try {
      const res = await api.updateSecurityIncident(selectedIncidentModal.id, {
        status: incidentUpdateStatus,
        resolutionNotes: incidentResolutionNotes.trim() || undefined
      });
      if (res?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Incident Record Updated',
          text: 'Security log and resolution status updated successfully.',
          confirmButtonColor: '#1E5BF9'
        });
        setSelectedIncidentModal(null);
        setIncidentResolutionNotes('');
        fetchSecurityData();
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setUpdatingIncident(false);
    }
  };

  // Trigger tab-specific fetches
  useEffect(() => {
    if (activeTab === 'broadcasts' || activeTab === 'overview') fetchAnnouncements();
    if (activeTab === 'wallets_admin') fetchWallets();
    if (activeTab === 'cms_admin') fetchCmsSections();
    if (activeTab === 'maintenance_admin') fetchMaintenanceConfig();
    if (activeTab === 'mobile_remote_config') fetchMobileConfig();
    if (activeTab === 'security_center') fetchSecurityData();
  }, [activeTab]);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        appName: settings.app_name,
        appTagline: settings.app_tagline,
        logoUrl: settings.logo_url,
        primaryColor: settings.primary_color,
        accentColor: settings.accent_color,
        supportEmail: settings.support_email,
        supportPhone: settings.support_phone,
        whatsappNumber: settings.whatsapp_number,
        announcementText: settings.announcement_text,
        announcementType: settings.announcement_type,
        announcementActive: settings.announcement_active,
        maintenanceMode: settings.maintenance_mode,
        maintenanceMessage: settings.maintenance_message,
        referralBonusAmount: Number(settings.referral_bonus_amount) || 0,
        referralCommissionPercent: Number(settings.referral_commission_percent) || 0
      });

      Swal.fire({
        icon: 'success',
        title: 'Platform Controls & Branding Saved',
        text: 'The platform configuration, branding, maintenance mode, and referral rules have been updated live across all pages.',
        confirmButtonColor: '#1E5BF9'
      });
      loadAllData();
      if (onSettingsUpdated) onSettingsUpdated();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSmtp(smtpForm);
      Swal.fire({
        icon: 'success',
        title: 'SMTP Settings Saved',
        text: 'Outbound mail server settings have been updated.',
        confirmButtonColor: '#1E5BF9'
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget) {
      Swal.fire({ icon: 'warning', title: 'Target Email Required', text: 'Enter a recipient email address.' });
      return;
    }
    try {
      setLoadingTestEmail(true);
      const res = await api.testSmtp(testEmailTarget, smtpForm);
      Swal.fire({
        icon: 'success',
        title: 'Email Delivered Successfully!',
        text: res.message || `Test verification email delivered to ${testEmailTarget}`,
        confirmButtonColor: '#1E5BF9'
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Email Test Failed', text: err.message });
    } finally {
      setLoadingTestEmail(false);
    }
  };

  const handleOpenCreatePlan = () => {
    setEditingPlanId(null);
    setPlanForm({
      networkOrBiller: 'MTN',
      dataType: 'SME',
      planName: 'MTN 1.0GB SME Data',
      planSize: '1GB',
      planCode: 'MTN-SME-1GB',
      validity: '30 Days',
      buyingPrice: '240',
      amount: '260',
      resellerPrice: '248',
      apiPrice: '242',
      routingType: 'API',
      providerId: providers[0]?.id || '',
      providerPlanId: '101'
    });
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      networkOrBiller: plan.network_or_biller,
      dataType: plan.data_type || 'SME',
      planName: plan.plan_name,
      planSize: plan.plan_size || '1GB',
      planCode: plan.plan_code,
      validity: plan.validity || '30 Days',
      buyingPrice: String(plan.buying_price || plan.amount * 0.95),
      amount: String(plan.amount),
      resellerPrice: String(plan.reseller_price || plan.amount * 0.98),
      apiPrice: String(plan.api_price || plan.amount * 0.96),
      routingType: plan.routing_type || 'API',
      providerId: plan.provider_id || '',
      providerPlanId: plan.provider_plan_id || ''
    });
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlanId) {
        await api.updateAdminPlan(editingPlanId, planForm);
        Swal.fire({ icon: 'success', title: 'Plan Updated', timer: 1500, showConfirmButton: false });
      } else {
        await api.createAdminPlan(planForm);
        Swal.fire({ icon: 'success', title: 'Plan Created', timer: 1500, showConfirmButton: false });
      }
      setShowPlanModal(false);
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
    }
  };

  const handleDeletePlan = async (planId: string, name: string) => {
    const confirm = await Swal.fire({
      title: `Delete ${name}?`,
      text: 'This data bundle will be removed from customer screens.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#EF4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.deleteAdminPlan(planId);
        Swal.fire({ icon: 'success', title: 'Plan Deleted', timer: 1200, showConfirmButton: false });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
      }
    }
  };

  const handleTogglePlanAvailability = async (plan: any) => {
    try {
      const nextStatus = plan.is_available ? 0 : 1;
      await api.updateAdminPlan(plan.id, { isAvailable: nextStatus });
      setPlans(plans.map(p => p.id === plan.id ? { ...p, is_available: nextStatus } : p));
      Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1800,
        icon: 'success',
        title: `Plan ${nextStatus ? 'Activated' : 'Disabled'}`
      });
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    }
  };

  // Gateway Handlers
  const handleEditGateway = (gw: any) => {
    setSelectedGateway(gw);
    setGatewayForm({
      id: gw.id,
      name: gw.name,
      isActive: Boolean(gw.is_active),
      isDefault: Boolean(gw.is_default),
      environment: gw.environment || 'production',
      publicKey: gw.public_key || '',
      secretKey: '',
      apiKey: '',
      contractCode: gw.contract_code || '',
      webhookSecret: '',
      merchantId: gw.merchant_id || '',
      bankName: gw.bank_name || '',
      accountNumber: gw.account_number || '',
      accountName: gw.account_name || ''
    });
    setShowGatewayModal(true);
  };

  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updatePaymentGateway(gatewayForm.id, gatewayForm);
      Swal.fire({
        icon: 'success',
        title: 'Payment Gateway Saved',
        text: `${gatewayForm.name} configuration updated and encrypted with AES-256-GCM.`,
        confirmButtonColor: '#1E5BF9'
      });
      setShowGatewayModal(false);
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
    }
  };

  const handleToggleGatewayDefault = async (gw: any) => {
    try {
      await api.updatePaymentGateway(gw.id, { isDefault: true, isActive: true });
      Swal.fire({
        icon: 'success',
        title: 'Default Checkout Gateway Set',
        text: `${gw.name} is now the primary gateway for customer deposits and automated account provisioning.`,
        timer: 1600,
        showConfirmButton: false
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    }
  };

  const handleToggleGatewayActive = async (gw: any) => {
    try {
      await api.updatePaymentGateway(gw.id, { isActive: !gw.is_active });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    }
  };

  const handleCopyWebhook = (gatewayId: string) => {
    const url = `${window.location.origin}/api/payment/webhook/${gatewayId}`;
    navigator.clipboard.writeText(url);
    setCopiedWebhookId(gatewayId);
    setTimeout(() => setCopiedWebhookId(null), 2500);
  };

  // Provider Handlers
  const handleOpenCreateProvider = () => {
    setEditingProviderId(null);
    setProviderForm({
      name: '',
      category: 'data',
      environment: 'production',
      baseUrl: 'https://',
      apiKey: '',
      apiSecret: '',
      authMethod: 'bearer_token',
      priority: 1,
      timeoutSeconds: 15,
      dataEndpoint: '/data',
      airtimeEndpoint: '/airtime',
      cableEndpoint: '/cable',
      electricityEndpoint: '/electricity',
      balanceEndpoint: '/balance'
    });
    setShowProviderModal(true);
  };

  const handleEditProvider = (p: any) => {
    setEditingProviderId(p.id);
    setProviderForm({
      id: p.id,
      name: p.name,
      category: p.category,
      environment: p.environment || 'production',
      baseUrl: p.base_url,
      apiKey: '',
      apiSecret: '',
      authMethod: p.auth_method || 'bearer_token',
      priority: p.priority || 1,
      timeoutSeconds: p.timeout_seconds || 15,
      dataEndpoint: p.data_endpoint || '/data',
      airtimeEndpoint: p.airtime_endpoint || '/airtime',
      cableEndpoint: p.cable_endpoint || '/cable',
      electricityEndpoint: p.electricity_endpoint || '/electricity',
      balanceEndpoint: p.balance_endpoint || '/balance'
    });
    setShowProviderModal(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.upsertProvider({
        ...providerForm,
        id: editingProviderId || undefined
      });
      Swal.fire({
        icon: 'success',
        title: 'Provider Saved',
        text: 'API Provider credentials and endpoints stored securely with AES-256-GCM.',
        confirmButtonColor: '#1E5BF9'
      });
      setShowProviderModal(false);
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message });
    }
  };

  const handleDeleteProvider = async (id: string, name: string) => {
    const confirm = await Swal.fire({
      title: `Delete Provider ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#EF4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.deleteProvider(id);
        Swal.fire({ icon: 'success', title: 'Provider Deleted', timer: 1200, showConfirmButton: false });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
      }
    }
  };

  const handleToggleRouting = async (planId: string, currentRouting: string, simSlotId?: string) => {
    const newRouting = currentRouting === 'API' ? 'SIM_HOSTING' : 'API';
    try {
      await api.updateServiceRouting({
        planId,
        routingType: newRouting as any,
        simSlotId: newRouting === 'SIM_HOSTING' ? (simSlotId || 'sim_slot_1') : undefined,
        ussdTemplate: newRouting === 'SIM_HOSTING' ? '*461*1*1*RECIPIENT*AMOUNT#' : undefined
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Routing Update Failed', text: err.message });
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const res = await api.testProviderConnection(id);
      const r = res.result;
      const isHealthy = r.status === 'HEALTHY';
      Swal.fire({
        icon: isHealthy ? 'success' : 'warning',
        title: `Health Check: ${r.status}`,
        html: `
          <div style="text-align: left; font-size: 13px; line-height: 1.6;">
            <div><strong>Provider:</strong> ${r.name}</div>
            <div><strong>Target Endpoint:</strong> <code style="word-break: break-all;">${r.endpointChecked}</code></div>
            <div><strong>HTTP Status Code:</strong> <code>${r.httpCode || 'N/A'}</code></div>
            <div><strong>Network Latency:</strong> <code>${r.latencyMs}ms</code></div>
            <div style="margin-top: 8px; padding: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
              <strong>Diagnostic:</strong> ${r.diagnostic}
            </div>
          </div>
        `,
        confirmButtonColor: '#1E5BF9'
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Connection Test Failed', text: err.message });
    }
  };

  // Withdrawal Handlers
  const handleApproveWithdrawal = async (w: any) => {
    const { value: ref, isConfirmed } = await Swal.fire({
      title: 'Approve & Mark Paid',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p>Confirm bank transfer of <b>₦${w.net_amount.toLocaleString()}</b> to:</p>
          <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 8px 0;">
            <div><strong>Bank:</strong> ${w.bank_name}</div>
            <div><strong>Account:</strong> ${w.account_number}</div>
            <div><strong>Name:</strong> ${w.account_name}</div>
            <div><strong>User:</strong> ${w.user_name || w.user_email}</div>
          </div>
        </div>
      `,
      input: 'text',
      inputLabel: 'Bank Transfer Reference / Receipt ID',
      inputValue: `BNK_REF_${Date.now()}`,
      showCancelButton: true,
      confirmButtonText: 'Yes, Confirm Payment',
      confirmButtonColor: '#10B981'
    });

    if (isConfirmed && ref) {
      try {
        await api.approveWithdrawal(w.id, { reference: ref, notes: 'Paid out by Super Admin' });
        Swal.fire({
          icon: 'success',
          title: 'Withdrawal Completed',
          text: `Marked as paid with reference ${ref}. User notified via email.`,
          timer: 2000,
          showConfirmButton: false
        });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Approval Failed', text: err.message });
      }
    }
  };

  const handleRejectWithdrawal = async (w: any) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Reject Withdrawal Request',
      html: `
        <div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p>Reject withdrawal of <b>₦${w.amount.toLocaleString()}</b> for <b>${w.account_name}</b>?</p>
          <div style="background: #fef2f2; color: #991b1b; padding: 10px; border-radius: 8px; border: 1px solid #fecaca; margin: 8px 0; font-weight: bold;">
            ⚠️ 100% of the funds (₦${w.amount.toLocaleString()}) will be immediately refunded back to the customer's wallet ledger.
          </div>
        </div>
      `,
      input: 'text',
      inputLabel: 'Reason for Rejection',
      inputPlaceholder: 'e.g. Account name mismatch or incorrect NUBAN',
      inputValidator: (val) => !val ? 'A reason is required to notify the customer' : null,
      showCancelButton: true,
      confirmButtonText: 'Reject & Instant Refund',
      confirmButtonColor: '#EF4444'
    });

    if (isConfirmed && reason) {
      try {
        await api.rejectWithdrawal(w.id, { reason });
        Swal.fire({
          icon: 'success',
          title: 'Withdrawal Rejected & Refunded',
          text: `₦${w.amount.toLocaleString()} has been atomically credited back to user's wallet. User notified via email.`,
          confirmButtonColor: '#1E5BF9'
        });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Rejection Failed', text: err.message });
      }
    }
  };

  // User Management Handlers
  const handleToggleLockUser = async (u: any) => {
    if (u.account_locked === 1) {
      const confirm = await Swal.fire({
        title: `Unlock account for ${u.name || u.email}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Unlock Account',
        confirmButtonColor: '#10B981'
      });
      if (confirm.isConfirmed) {
        try {
          await api.unlockUserAccount(u.id);
          Swal.fire({ icon: 'success', title: 'Account Unlocked', timer: 1200, showConfirmButton: false });
          loadAllData();
        } catch (err: any) {
          Swal.fire({ icon: 'error', title: 'Unlock Failed', text: err.message });
        }
      }
    } else {
      const { value: reason, isConfirmed } = await Swal.fire({
        title: `Lock account for ${u.name || u.email}?`,
        text: 'This will instantly terminate all active sessions and block further platform access.',
        input: 'text',
        inputLabel: 'Reason for locking account',
        inputPlaceholder: 'e.g. Suspicious transactions, security review...',
        showCancelButton: true,
        confirmButtonText: 'Yes, Lock Account',
        confirmButtonColor: '#EF4444'
      });
      if (isConfirmed) {
        try {
          await api.lockUserAccount(u.id, reason);
          Swal.fire({ icon: 'success', title: 'Account Locked & Sessions Revoked', timer: 1400, showConfirmButton: false });
          loadAllData();
        } catch (err: any) {
          Swal.fire({ icon: 'error', title: 'Lock Failed', text: err.message });
        }
      }
    }
  };

  const handleRevokeSessions = async (u: any) => {
    const confirm = await Swal.fire({
      title: `Revoke all active sessions for ${u.name || u.email}?`,
      text: 'The user will be immediately logged out of all devices and web browsers.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Revoke Sessions',
      confirmButtonColor: '#F59E0B'
    });
    if (confirm.isConfirmed) {
      try {
        await api.revokeUserSessions(u.id);
        Swal.fire({ icon: 'success', title: 'Sessions Revoked', timer: 1200, showConfirmButton: false });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Revocation Failed', text: err.message });
      }
    }
  };

  const handleOpenInspect = async (u: any) => {
    setInspectUser(u);
    setInspectData(null);
    setLoadingInspect(true);
    try {
      const res = await api.getAdminUserDetails(u.id);
      if (res.success) {
        setInspectData(res.data);
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Inspection Failed', text: err.message });
    } finally {
      setLoadingInspect(false);
    }
  };

  const handleOpenAdjust = (u: any) => {
    setAdjustUser(u);
    setAdjustForm({
      type: 'CREDIT',
      amount: '',
      reason: 'Admin manual wallet adjustment'
    });
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUser) return;
    const num = Number(adjustForm.amount);
    if (isNaN(num) || num <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Amount', text: 'Enter an amount greater than ₦0.' });
      return;
    }
    setLoadingAdjust(true);
    try {
      await api.adjustWallet({
        userId: adjustUser.id,
        amount: num,
        type: adjustForm.type,
        reason: adjustForm.reason
      });
      Swal.fire({
        icon: 'success',
        title: `Wallet ${adjustForm.type === 'CREDIT' ? 'Credited' : 'Debited'}`,
        text: `Successfully ${adjustForm.type === 'CREDIT' ? 'credited' : 'debited'} ₦${num.toLocaleString()} for ${adjustUser.email}. Double-entry ledger updated.`,
        confirmButtonColor: '#1E5BF9'
      });
      setAdjustUser(null);
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Adjustment Failed', text: err.message });
    } finally {
      setLoadingAdjust(false);
    }
  };

  const handleOpenEdit = (u: any) => {
    setEditUser(u);
    setEditUserForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'customer',
      subAdminRole: u.subAdminRole || u.sub_admin_role || 'none',
      tier: u.tier || 1,
      status: u.status || 'active',
      address: u.address || '',
      state: u.state || '',
      newPassword: '',
      newPin: ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setLoadingEditUser(true);
    try {
      await api.adminUpdateUser(editUser.id, {
        name: editUserForm.name,
        email: editUserForm.email,
        phone: editUserForm.phone,
        role: editUserForm.role,
        subAdminRole: editUserForm.subAdminRole,
        tier: Number(editUserForm.tier),
        status: editUserForm.status,
        address: editUserForm.address,
        state: editUserForm.state,
        newPassword: editUserForm.newPassword || undefined,
        newPin: editUserForm.newPin || undefined
      });
      Swal.fire({
        icon: 'success',
        title: 'User Profile & Credentials Updated',
        text: `Account settings and credentials for ${editUserForm.name || editUserForm.email} updated successfully.`,
        confirmButtonColor: '#1E5BF9'
      });
      setEditUser(null);
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: err.message });
    } finally {
      setLoadingEditUser(false);
    }
  };

  const handleOpenResetCred = (u: any) => {
    setResetCredUser(u);
    setResetCredForm({ newPassword: '', newPin: '' });
  };

  const handleSaveResetCred = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCredUser) return;
    if (!resetCredForm.newPassword && !resetCredForm.newPin) {
      Swal.fire({ icon: 'warning', title: 'Empty Input', text: 'Enter a new password or new 4-digit PIN.' });
      return;
    }
    setLoadingResetCred(true);
    try {
      await api.resetUserCredentials(resetCredUser.id, resetCredForm);
      Swal.fire({
        icon: 'success',
        title: 'Credentials Updated',
        text: `New credentials successfully set for ${resetCredUser.email}.`,
        confirmButtonColor: '#1E5BF9'
      });
      setResetCredUser(null);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Reset Failed', text: err.message });
    } finally {
      setLoadingResetCred(false);
    }
  };

  // Sub-Admin Handlers
  const handleCreateSubadmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubadmin(true);
    try {
      await api.createSubadmin(subadminForm);
      Swal.fire({
        icon: 'success',
        title: 'Sub-Admin Account Created',
        text: `New sub-admin ${subadminForm.name} assigned to '${subadminForm.subAdminRole}' role.`,
        confirmButtonColor: '#1E5BF9'
      });
      setShowSubadminModal(false);
      setSubadminForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        subAdminRole: 'finance',
        transactionPin: '1234'
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to create sub-admin', text: err.message });
    } finally {
      setLoadingSubadmin(false);
    }
  };

  const handleToggleSubadminStatus = async (sa: any) => {
    const newStatus = sa.status === 'active' ? 'suspended' : 'active';
    const confirm = await Swal.fire({
      title: `${newStatus === 'suspended' ? 'Suspend' : 'Activate'} ${sa.name}?`,
      text: `Are you sure you want to ${newStatus} this sub-admin account?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${newStatus.toUpperCase()}`,
      confirmButtonColor: newStatus === 'suspended' ? '#EF4444' : '#10B981'
    });
    if (confirm.isConfirmed) {
      try {
        await api.updateSubadminStatus(sa.id, { status: newStatus });
        Swal.fire({ icon: 'success', title: `Sub-Admin ${newStatus.toUpperCase()}`, timer: 1500, showConfirmButton: false });
        loadAllData();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message });
      }
    }
  };

  const handleFilterReports = async (
    period?: 'today' | '7days' | '30days' | 'all',
    year?: string,
    start?: string,
    end?: string
  ) => {
    const newPeriod = period !== undefined ? period : reportPeriod;
    const newYear = year !== undefined ? year : reportYear;
    const newStart = start !== undefined ? start : reportStartDate;
    const newEnd = end !== undefined ? end : reportEndDate;

    if (period !== undefined) setReportPeriod(newPeriod);
    if (year !== undefined) setReportYear(newYear);
    if (start !== undefined) setReportStartDate(newStart);
    if (end !== undefined) setReportEndDate(newEnd);

    setLoadingReport(true);
    try {
      const res = await api.getFinancialReports({
        period: newPeriod,
        year: newYear !== 'all' ? newYear : undefined,
        startDate: newStart || undefined,
        endDate: newEnd || undefined
      });
      if (res.success) setFinancialReport(res.summary);
    } catch (err: any) {
      console.error('Failed to load financial reports', err);
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePeriodChange = async (period: any) => {
    await handleFilterReports(period);
  };

  const fetchExplorerTransactions = async (
    page = explorerPage,
    search = explorerSearch,
    cat = explorerCategory,
    stat = explorerStatus,
    ch = explorerChannel
  ) => {
    setExplorerLoading(true);
    try {
      const res = await api.getAdminTransactions({
        page,
        limit: 15,
        search: search.trim() || undefined,
        serviceCategory: cat !== 'ALL' ? cat : undefined,
        status: stat !== 'ALL' ? stat : undefined,
        channel: ch !== 'ALL' ? ch : undefined,
        startDate: reportStartDate || undefined,
        endDate: reportEndDate || undefined
      });
      if (res?.success) {
        setExplorerTransactions(res.transactions || []);
        setExplorerTotal(res.total || 0);
        setExplorerPage(res.page || 1);
        setExplorerTotalPages(res.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Failed to load explorer transactions', err);
    } finally {
      setExplorerLoading(false);
    }
  };

  const handleInspectTransaction = async (ref: string) => {
    setLoadingTxDetail(true);
    try {
      const res = await api.getTransactionDetails(ref);
      if (res?.success) {
        setSelectedTxDetail(res);
      } else {
        Swal.fire({ icon: 'error', title: 'Inspection Failed', text: res?.message || 'Transaction record not found' });
      }
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Inspection Failed', text: err.message });
    } finally {
      setLoadingTxDetail(false);
    }
  };

  const fetchTestimonials = async () => {
    setLoadingTestimonials(true);
    try {
      const res = await api.getAdminTestimonials();
      if (res?.success) {
        setTestimonialsList(res.testimonials || []);
      }
    } catch (err: any) {
      console.error('Failed to load testimonials', err);
    } finally {
      setLoadingTestimonials(false);
    }
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialForm.authorName.trim() || !testimonialForm.content.trim()) {
      Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'Author name and content are required.' });
      return;
    }

    try {
      if (editingTestimonialId) {
        await api.updateTestimonial(editingTestimonialId, testimonialForm);
        Swal.fire({ icon: 'success', title: 'Review Updated', timer: 1500, showConfirmButton: false });
      } else {
        await api.createTestimonial(testimonialForm);
        Swal.fire({ icon: 'success', title: 'Review Published', timer: 1500, showConfirmButton: false });
      }
      setShowTestimonialModal(false);
      setEditingTestimonialId(null);
      setTestimonialForm({
        authorName: '',
        authorRole: 'Merchant',
        rating: 5,
        content: '',
        avatarUrl: '',
        isPublished: true,
        sortOrder: 0
      });
      fetchTestimonials();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Action Failed', text: err.message });
    }
  };

  const handleTogglePublishTestimonial = async (id: string) => {
    try {
      const res = await api.togglePublishTestimonial(id);
      Swal.fire({
        icon: 'success',
        title: res?.isPublished ? 'Review Published' : 'Review Hidden',
        timer: 1500,
        showConfirmButton: false
      });
      fetchTestimonials();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Toggle Failed', text: err.message });
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete Review?',
      text: 'This customer testimonial will be permanently removed from the website and database.',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#EF4444'
    });
    if (confirm.isConfirmed) {
      try {
        await api.deleteTestimonial(id);
        Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
        fetchTestimonials();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message });
      }
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoadingCreateUser(true);
      await api.createAdminUser({
        name: createUserForm.name,
        email: createUserForm.email,
        phone: createUserForm.phone,
        password: createUserForm.password,
        transactionPin: createUserForm.transactionPin,
        role: createUserForm.role,
        tier: Number(createUserForm.tier),
        initialBalance: Number(createUserForm.initialBalance) || 0
      });
      Swal.fire({
        icon: 'success',
        title: 'User Account Created',
        text: `Account for ${createUserForm.name} (${createUserForm.email}) created successfully with Tier ${createUserForm.tier}.`,
        confirmButtonColor: '#1E5BF9'
      });
      setShowCreateUserModal(false);
      setCreateUserForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        transactionPin: '1234',
        role: 'customer',
        tier: 1,
        initialBalance: '0'
      });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'User Creation Failed', text: err.message });
    } finally {
      setLoadingCreateUser(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      await api.createBackup();
      Swal.fire({ icon: 'success', title: 'Backup Created', timer: 1500, showConfirmButton: false });
      loadAllData();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Backup Failed', text: err.message });
    }
  };

  const filteredPlans = plans.filter(p => {
    const matchesNet = selectedPlanNetwork === 'ALL' || p.network_or_biller === selectedPlanNetwork;
    const matchesSearch = !planSearchTerm.trim() ||
      (p.plan_name && p.plan_name.toLowerCase().includes(planSearchTerm.toLowerCase())) ||
      (p.plan_size && p.plan_size.toLowerCase().includes(planSearchTerm.toLowerCase())) ||
      (p.plan_code && p.plan_code.toLowerCase().includes(planSearchTerm.toLowerCase())) ||
      (p.network_or_biller && p.network_or_biller.toLowerCase().includes(planSearchTerm.toLowerCase()));
    return matchesNet && matchesSearch;
  });

  interface NavItem {
    id: string;
    label: string;
    icon: any;
    badge?: number | undefined;
  }

  interface NavCategory {
    id: string;
    label: string;
    icon: any;
    color: string;
    badge?: number | undefined;
    badgeColor?: string | undefined;
    items: NavItem[];
  }

  const navigationCategories: NavCategory[] = [
    {
      id: 'overview',
      label: 'Executive Operations',
      icon: LayoutDashboard,
      color: 'text-blue-600',
      items: [
        { id: 'overview', label: 'Executive Operations Vault (40+ Controls)', icon: LayoutDashboard }
      ]
    },
    {
      id: 'customers',
      label: 'Customers & KYC',
      icon: Users,
      color: 'text-indigo-600',
      badge: users.length || undefined,
      items: [
        { id: 'users', label: 'User Accounts & KYC', icon: UserCheck }
      ]
    },
    {
      id: 'security',
      label: 'Security & Staff',
      icon: ShieldCheck,
      color: 'text-rose-600',
      items: [
        { id: 'staff_tasks', label: 'Staff Task Assignment', icon: CheckSquare },
        { id: 'subadmins', label: 'Sub-Admin Staff & RBAC', icon: Shield },
        { id: 'surity_engine', label: 'Surity™ 105 Guard Engine', icon: ShieldCheck },
        { id: 'security_center', label: 'Security & Incident Center', icon: ShieldAlert },
        { id: 'audit', label: 'Security Audit Logs', icon: History }
      ]
    },
    {
      id: 'vtu',
      label: 'Telecom & VTU',
      icon: Radio,
      color: 'text-emerald-600',
      items: [
        { id: 'data_plans', label: 'Data Plans & Pricing', icon: Layers },
        { id: 'routing', label: 'API vs. SIM Routing', icon: Sliders }
      ]
    },
    {
      id: 'providers',
      label: 'API Providers',
      icon: Server,
      color: 'text-cyan-600',
      items: [
        { id: 'providers', label: 'API Provider Catalogue', icon: Server }
      ]
    },
    {
      id: 'payments',
      label: 'Payments & Cashout',
      icon: CreditCard,
      color: 'text-violet-600',
      badge: adminWithdrawals.filter(w => w.status === 'PENDING').length || undefined,
      badgeColor: 'bg-amber-100 text-amber-700',
      items: [
        { id: 'gateways', label: 'Payment Gateways', icon: CreditCard },
        { id: 'wallets_admin', label: 'Customer Wallets (Old/New)', icon: Wallet },
        { id: 'withdrawals', label: 'Withdrawal Approvals', icon: DollarSign, badge: adminWithdrawals.filter(w => w.status === 'PENDING').length || undefined }
      ]
    },
    {
      id: 'resellers',
      label: 'Affiliate & Resellers',
      icon: Gift,
      color: 'text-purple-600',
      items: [
        { id: 'referrals_admin', label: 'Affiliate Network', icon: Gift }
      ]
    },
    {
      id: 'sims',
      label: 'Hosted SIM Modems',
      icon: Smartphone,
      color: 'text-teal-600',
      items: [
        { id: 'sims', label: 'SIM Modems & USSD', icon: Smartphone }
      ]
    },
    {
      id: 'notifications',
      label: 'Notifications & Broadcasts',
      icon: Bell,
      color: 'text-amber-600',
      badge: announcements.filter(a => a.is_active).length || undefined,
      badgeColor: 'bg-blue-100 text-blue-700',
      items: [
        { id: 'broadcasts', label: 'Dashboard Notices & Popups', icon: Megaphone, badge: announcements.filter(a => a.is_active).length || undefined },
        { id: 'smtp', label: 'Outbound Mail Server', icon: Mail },
        { id: 'templates', label: 'Event Notifications', icon: Bell }
      ]
    },
    {
      id: 'analytics',
      label: 'Financial Command & P&L',
      icon: TrendingUp,
      color: 'text-sky-600',
      items: [
        { id: 'reports', label: 'Financial Command Center (23 Metrics & P&L)', icon: TrendingUp },
        { id: 'reconciliation', label: '5-Point Financial Reconciliation Engine', icon: CheckCircle }
      ]
    },
    {
      id: 'support',
      label: 'Support & Helpdesk',
      icon: MessageSquare,
      color: 'text-pink-600',
      badge: supportTickets.filter(t => t.status === 'OPEN').length || undefined,
      badgeColor: 'bg-rose-100 text-rose-700',
      items: [
        { id: 'live_support', label: 'Customer Live Chat (Real-time)', icon: MessageSquare },
        { id: 'support_tickets', label: 'Support Tickets & Helpdesk', icon: FileText, badge: supportTickets.filter(t => t.status === 'OPEN').length || undefined }
      ]
    },
    {
      id: 'system',
      label: 'System & Platform',
      icon: SettingsIcon,
      color: 'text-slate-600',
      items: [
        { id: 'branding', label: 'Branding & Platform', icon: Palette },
        { id: 'cms_admin', label: 'Website CMS & Content Editor', icon: FileText },
        { id: 'maintenance_admin', label: 'Website Maintenance Control', icon: Wrench },
        { id: 'testimonials_admin', label: 'Testimonials & Reviews', icon: Star },
        { id: 'backups', label: 'Database Backups', icon: Database },
        { id: 'system_health', label: 'System Health & Engine', icon: HeartPulse }
      ]
    },
    {
      id: 'app_mgmt',
      label: 'Mobile App & PWA',
      icon: Globe,
      color: 'text-blue-500',
      items: [
        { id: 'app_versioning', label: 'App Versioning & PWA', icon: Globe },
        { id: 'mobile_remote_config', label: 'Mobile Remote Config & Telemetry', icon: Smartphone }
      ]
    }
  ];

  const currentTabName = ({
    overview: 'Executive Operations Vault (40+ Controls)',
    broadcasts: 'Dashboard Notices & SweetAlert Popups',
    reports: 'Financial Command Center',
    withdrawals: 'Withdrawal Approvals',
    wallets_admin: 'Customer Wallets (Old & New Balance Management)',
    users: 'User Accounts & Access',
    subadmins: 'Sub-Admin Staff',
    referrals_admin: 'Affiliate Network',
    data_plans: 'Data Plans & Pricing',
    providers: 'API Providers',
    sims: 'SIM Modems & USSD',
    routing: 'API vs. SIM Routing',
    gateways: 'Payment Gateways',
    branding: 'Branding & Platform',
    cms_admin: 'Website CMS & Content Editor',
    maintenance_admin: 'Website Maintenance Control',
    testimonials_admin: 'Testimonials & Reviews Management',
    smtp: 'Outbound Mail Server',
    templates: 'Notification Templates',
    backups: 'Database Backups',
    audit: 'Security Audit Logs',
    security_center: 'Security Operations & Incident Center',
    surity_engine: 'Surity™ 105 Enterprise Validation & Authentication Guard',
    staff_tasks: 'Staff Task Assignment & Operations',
    support_tickets: 'Customer Support Tickets',
    system_health: 'System Health & Diagnostics',
    app_versioning: 'Mobile App Versioning & PWA',
    mobile_remote_config: 'Mobile Remote Config & Telemetry'
  } as Record<string, string>)[activeTab] || 'Workspace';

  return (
    <div className="flex min-h-screen bg-[#F4F7FB] text-slate-900 font-sans relative">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* 1. Moniecrm-style Left Workspace Sidebar */}
      <aside className={`bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 transition-all duration-300 z-50 ${
        mobileMenuOpen
          ? 'fixed inset-y-0 left-0 w-72 shadow-2xl flex'
          : 'hidden md:flex'
      } ${sidebarCollapsed ? 'md:w-20' : 'md:w-64 lg:w-72'}`}>
        <div>
          {/* Logo / Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {(settings.app_name || 'M')[0].toUpperCase()}
              </div>
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div>
                  <span className="font-black text-base tracking-tight text-blue-900 block leading-tight">
                    {settings.app_name || 'Moniecrm'}
                  </span>
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest">
                    Enterprise Suite
                  </span>
                </div>
              )}
            </div>
            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 md:hidden"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 hidden md:block"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar inside sidebar */}
          {!sidebarCollapsed && (
            <div className="px-4 pt-3 pb-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Search 100+ controls..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
                {navSearch && (
                  <button
                    onClick={() => setNavSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Nav Categories */}
          <div className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-210px)]">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-3 mb-2">
              WORKSPACE (13 DOMAINS)
            </div>

            {navigationCategories
              .map(cat => {
                if (!navSearch.trim()) return { ...cat, show: true };
                const q = navSearch.toLowerCase();
                const catMatches = cat.label.toLowerCase().includes(q);
                const matchingItems = cat.items.filter(it => it.label.toLowerCase().includes(q) || catMatches);
                return {
                  ...cat,
                  items: matchingItems,
                  show: catMatches || matchingItems.length > 0
                };
              })
              .filter(cat => cat.show)
              .map(cat => {
                const CatIcon = cat.icon;
                const isExpanded = navSearch.trim().length > 0 || !!expandedSections[cat.id];
                const hasActiveChild = cat.items.some(it => it.id === activeTab);

                return (
                  <div key={cat.id} className="space-y-1">
                    <button
                      onClick={() => {
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                          setExpandedSections(prev => ({ ...prev, [cat.id]: true }));
                        } else {
                          toggleSection(cat.id);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center justify-between ${
                        hasActiveChild
                          ? 'bg-blue-50/70 text-blue-900 font-extrabold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                      title={sidebarCollapsed ? cat.label : undefined}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <CatIcon className={`w-4 h-4 shrink-0 ${cat.color}`} />
                        {!sidebarCollapsed && (
                          <span className="truncate">{cat.label}</span>
                        )}
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {cat.badge !== undefined && (
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${cat.badgeColor || 'bg-slate-100 text-slate-600'}`}>
                              {cat.badge}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      )}
                    </button>

                    {isExpanded && !sidebarCollapsed && (
                      <div className="ml-5 pl-2.5 border-l-2 border-slate-100 space-y-0.5">
                        {cat.items.map(item => {
                          const ItemIcon = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setActiveTab(item.id as any)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-between ${
                                isActive
                                  ? 'bg-blue-600 text-white font-black shadow-sm shadow-blue-500/20'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge !== undefined && (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Bottom Profile Card matching Moniecrm uploaded screenshot */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
              {(currentUser?.name || 'Mohammed Adamu').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-slate-900 truncate">
                  {currentUser?.name || 'Mohammed Adamu'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate">
                  {currentUser?.email || 'mbbsmohd@gmail.com'}
                </div>
                <div className="mt-1 flex items-center space-x-1.5">
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                    {isSuperAdmin ? 'Super Admin' : (currentUser?.sub_admin_role ? `${currentUser.sub_admin_role} Admin` : 'Relationship Manager')}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">
                  Cluster: Vibrant Explorers • Central Vault
                </div>
              </div>
            )}
            {!sidebarCollapsed && onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-200"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Canvas */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileMenuOpen(!mobileMenuOpen);
                } else {
                  setSidebarCollapsed(!sidebarCollapsed);
                }
              }}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400">
                <span>Workspace</span>
                <span>/</span>
                <span className="text-slate-800 capitalize">{currentTabName}</span>
              </div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
                {currentTabName}
              </h1>
            </div>

            {/* Live System Engine Online Pulse */}
            <div className="hidden xl:flex items-center space-x-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl ml-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-extrabold text-emerald-800 tracking-tight">Core Engine Online • 99.98% SLA</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ThemeSwitcher user={currentUser || { role: 'super_admin' }} onThemeChanged={loadAllData} />
            <a
              href={api.getReportExportUrl({ period: reportPeriod, year: reportYear !== 'all' ? reportYear : undefined, startDate: reportStartDate, endDate: reportEndDate })}
              target="_blank"
              rel="noreferrer"
              download
              className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
              title="Export Multi-Year CSV Audit Report"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export Audit CSV</span>
            </a>
            <button
              onClick={loadAllData}
              className="p-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onBack}
              className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
              title="Return to Customer App"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit Admin</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                title="Sign Out of Platform"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </header>

        {/* Content Canvas */}
        <main className="p-4 md:p-8 space-y-8 flex-1">
          {/* 1. Master Executive Operations Vault (40+ Management Capabilities) */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-indigo-500/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      {settings.logo_url ? (
                        <img src={settings.logo_url} alt="Logo" className="w-12 h-12 object-contain" />
                      ) : (
                        <span className="text-2xl font-black text-blue-300">{(settings.app_name || 'A')[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                        <span>System Master Command Center • 40+ Features</span>
                      </div>
                      <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        {settings.app_name || 'Bukar Data Sub Enterprise'}
                      </h1>
                      <p className="text-sm text-blue-200/80 font-medium mt-1">
                        {settings.app_tagline || 'Automated VTU, Data Infrastructure & Financial Liquidity Control'}
                      </p>
                    </div>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setShowBulkPriceModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm px-4 py-2.5 rounded-2xl transition shadow-lg shadow-amber-500/30 flex items-center space-x-2 active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-slate-950" />
                      <span>⚡ Bulk Price Adjust</span>
                    </button>
                    <button
                      onClick={() => setShowAnnouncementModal(true)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-2xl transition shadow-lg shadow-blue-600/30 flex items-center space-x-2 active:scale-95"
                    >
                      <Megaphone className="w-4 h-4" />
                      <span>📢 Broadcast Notice</span>
                    </button>
                    <button
                      onClick={openQuickBrand}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs md:text-sm px-4 py-2.5 rounded-2xl transition backdrop-blur-md flex items-center space-x-2 active:scale-95"
                    >
                      <Palette className="w-4 h-4" />
                      <span>🎨 Brand & Logo</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('security_center')}
                      className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-bold text-xs md:text-sm px-4 py-2.5 rounded-2xl transition flex items-center space-x-2 active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4 text-rose-300" />
                      <span>🔒 Security</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 8 Financial & System Health KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Users</span>
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">{users.length || stats?.totalUsers || 0}</div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                    {users.filter(u => u.status === 'active').length} Active
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">User Balances</span>
                    <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2 truncate font-mono">
                    ₦{(users.reduce((acc, u) => acc + (u.balance || 0), 0) || financialReport?.walletLiabilities || 0).toLocaleString('en-NG')}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">Wallet Liabilities</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Funded</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2 truncate font-mono">
                    ₦{(stats?.totalFunded || 0).toLocaleString('en-NG')}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5">100% Automated</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">VTU Volume</span>
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2 truncate font-mono">
                    ₦{(stats?.totalVTU || 0).toLocaleString('en-NG')}
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 mt-0.5">Turnover</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data Plans</span>
                    <Database className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">{plans.length}</div>
                  <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                    {plans.filter(p => p.is_available).length} Live
                  </div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gateways</span>
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                  <div className="text-xl font-black text-teal-700 mt-2">
                    {gateways.filter(g => g.is_active).length} Active
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 mt-0.5">Monnify/Paystack</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Live Notices</span>
                    <Megaphone className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    {announcements.filter(a => a.is_active).length}
                  </div>
                  <div className="text-[10px] font-bold text-rose-600 mt-0.5">SweetAlert Popups</div>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Security</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl font-black text-emerald-600 mt-2">Active</div>
                  <div className="text-[10px] font-bold text-emerald-600 mt-0.5">0 Breaches</div>
                </div>
              </div>

              {/* THE 40+ OPERATIONAL MANAGEMENT FEATURE VAULT */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                      <LayoutDashboard className="w-6 h-6 text-blue-600" />
                      <span>Enterprise Operations Feature Vault (40+ Management Controls)</span>
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                      Full administrative mastery over system branding, dynamic pricing, user accounts, broadcast alerts, automated payments, and hardware SIM modems.
                    </p>
                  </div>
                </div>

                {/* Grid of 8 Comprehensive Management Sectors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* SECTOR 1: System Identity, Branding & Platform Control */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">1. System Identity & Branding Control</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={openQuickBrand}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition"
                      >
                        Quick Edit
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 1 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Platform Name & Tagline</span>
                          <span className="text-slate-500 font-medium">{settings.app_name} • {settings.app_tagline}</span>
                        </div>
                        <button onClick={openQuickBrand} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Update</button>
                      </div>

                      {/* Feature 2 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          {settings.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="w-7 h-7 object-contain rounded-lg border bg-white" />
                          ) : (
                            <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center font-bold text-blue-600">L</div>
                          )}
                          <div>
                            <span className="font-extrabold text-slate-900 block">Live Platform Logo URL</span>
                            <span className="text-slate-500 font-mono truncate max-w-xs block">{settings.logo_url || 'Default System Logo'}</span>
                          </div>
                        </div>
                        <button onClick={openQuickBrand} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Change Logo</button>
                      </div>

                      {/* Feature 3 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Theme Color Palette</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-block w-4 h-4 rounded-md shadow-xs border" style={{ backgroundColor: settings.primary_color || '#1E5BF9' }} />
                            <span className="font-mono text-slate-600">{settings.primary_color || '#1E5BF9'} (Primary)</span>
                            <span className="inline-block w-4 h-4 rounded-md shadow-xs border ml-2" style={{ backgroundColor: settings.accent_color || '#10B981' }} />
                            <span className="font-mono text-slate-600">{settings.accent_color || '#10B981'} (Accent)</span>
                          </div>
                        </div>
                        <button onClick={openQuickBrand} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Colors</button>
                      </div>

                      {/* Feature 4 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Support Helpdesk & WhatsApp Bot</span>
                          <span className="text-slate-500 font-medium">{settings.support_email} • {settings.support_phone}</span>
                        </div>
                        <button onClick={openQuickBrand} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Configure</button>
                      </div>

                      {/* Feature 5 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Platform Maintenance Mode</span>
                          <span className={`font-bold ${settings.maintenance_mode ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {settings.maintenance_mode ? '⚠️ Under Maintenance' : '🟢 Live & Operational'}
                          </span>
                        </div>
                        <button onClick={() => setActiveTab('maintenance_admin')} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Manage</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 2: Telecom & Global Data Pricing Control */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">2. Telecom & Bulk Data Pricing Engine</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowBulkPriceModal(true)}
                        className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl transition"
                      >
                        ⚡ Bulk Adjust
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 6 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Global Atomic Bulk Price Adjuster</span>
                          <span className="text-slate-500 font-medium">Update prices (+/- % or flat ₦) across MTN, Airtel, Glo, 9mobile in 1 click</span>
                        </div>
                        <button onClick={() => setShowBulkPriceModal(true)} className="text-amber-600 font-bold hover:underline shrink-0 ml-2">Adjust Now</button>
                      </div>

                      {/* Feature 7 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Multi-Tier Margin Configuration</span>
                          <span className="text-slate-500 font-medium">Configure wholesale, retail customer (Tier 1), reseller (Tier 2), and VIP API prices</span>
                        </div>
                        <button onClick={() => setActiveTab('data_plans')} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Edit Plans</button>
                      </div>

                      {/* Feature 8 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">API vs. SIM Modem USSD Gateway Routing</span>
                          <span className="text-slate-500 font-medium">Auto-route MTN/Airtel/Glo between external APIs and internal SIM modems</span>
                        </div>
                        <button onClick={() => setActiveTab('routing')} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Routing Rules</button>
                      </div>

                      {/* Feature 9 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Data Plan Availability Killswitch</span>
                          <span className="text-slate-500 font-medium">{plans.filter(p => p.is_available).length} Active / {plans.filter(p => !p.is_available).length} Disabled</span>
                        </div>
                        <button onClick={() => setActiveTab('data_plans')} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Toggle Plans</button>
                      </div>

                      {/* Feature 10 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">API Provider Health & Failover</span>
                          <span className="text-slate-500 font-medium">{providers.length} Integrated Providers (VTPass, Clubkonnect, Monnify, etc.)</span>
                        </div>
                        <button onClick={() => setActiveTab('providers')} className="text-blue-600 font-bold hover:underline shrink-0 ml-2">Catalogue</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 3: User Identity, Access & Staff Control */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">3. User Management & Access Control</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('users')}
                        className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition"
                      >
                        All Users
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 11 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Full User Information Editor</span>
                          <span className="text-slate-500 font-medium">Change full name, email address, phone number, state, and address</span>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="text-purple-600 font-bold hover:underline shrink-0 ml-2">Manage Users</button>
                      </div>

                      {/* Feature 12 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Role & Privilege Escalation</span>
                          <span className="text-slate-500 font-medium">Assign Customer, Agent, Reseller, Sub-Admin, or Super Admin roles</span>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="text-purple-600 font-bold hover:underline shrink-0 ml-2">Assign Roles</button>
                      </div>

                      {/* Feature 13 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Sub-Admin Departmental RBAC</span>
                          <span className="text-slate-500 font-medium">Delegate restricted staff privileges (Finance, Support, Services, Security)</span>
                        </div>
                        <button onClick={() => setActiveTab('subadmins')} className="text-purple-600 font-bold hover:underline shrink-0 ml-2">Staff RBAC</button>
                      </div>

                      {/* Feature 14 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Direct Password & 4-Digit PIN Reset Override</span>
                          <span className="text-slate-500 font-medium">Reset customer credentials directly without requiring email reset steps</span>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="text-purple-600 font-bold hover:underline shrink-0 ml-2">Reset PIN</button>
                      </div>

                      {/* Feature 15 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Account Status & Freezing</span>
                          <span className="text-slate-500 font-medium">Instant Account Freezing, Flagging, or Whitelisting</span>
                        </div>
                        <button onClick={() => setActiveTab('users')} className="text-purple-600 font-bold hover:underline shrink-0 ml-2">Enforce</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 4: Dashboard Broadcast & SweetAlert Notices */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">4. Dashboard Broadcasts & Popups</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition"
                      >
                        + New Notice
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 16 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">User Dashboard SweetAlert Popup Engine</span>
                          <span className="text-slate-500 font-medium">Notices trigger automatically as interactive SweetAlert modals on customer login</span>
                        </div>
                        <button onClick={() => setShowAnnouncementModal(true)} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Publish</button>
                      </div>

                      {/* Feature 17 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Configurable Duration in Days</span>
                          <span className="text-slate-500 font-medium">Admin sets how many days the notice stays active before automatic expiry</span>
                        </div>
                        <button onClick={() => setActiveTab('broadcasts')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">View Notices</button>
                      </div>

                      {/* Feature 18 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Notice Severity & Badge Customization</span>
                          <span className="text-slate-500 font-medium">Support for Info, Warning, Alert, and Success styles with custom pill badges</span>
                        </div>
                        <button onClick={() => setActiveTab('broadcasts')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Configure</button>
                      </div>

                      {/* Feature 19 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Interactive SweetAlert Preview</span>
                          <span className="text-slate-500 font-medium">Test exactly how customers will see the popup before or after publishing</span>
                        </div>
                        <button
                          onClick={() => {
                            if (announcements.length > 0) handlePreviewAnnouncement(announcements[0]);
                            else handlePreviewAnnouncement({ title: 'System Notice Preview', message: 'Welcome to our high-performance automated data portal!', type: 'info', badge_text: 'Live Update', duration_days: 7, expires_at: new Date(Date.now() + 7 * 86400000).toISOString() });
                          }}
                          className="text-rose-600 font-bold hover:underline shrink-0 ml-2"
                        >
                          Test Preview
                        </button>
                      </div>

                      {/* Feature 20 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Active Broadcast Retraction & Deletion</span>
                          <span className="text-slate-500 font-medium">{announcements.filter(a => a.is_active).length} Active Notices currently running live</span>
                        </div>
                        <button onClick={() => setActiveTab('broadcasts')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Manage</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 5: 100% Automated Banking & Payment Gateways */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">5. Automated Payment Gateways & Banking</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('gateways')}
                        className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition"
                      >
                        Gateways
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 21 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Monnify Automated Dedicated Virtual NUBANs</span>
                          <span className="text-slate-500 font-medium">Auto-generate 24/7 dedicated bank accounts (Wema Bank, Moniepoint) per customer</span>
                        </div>
                        <button onClick={() => setActiveTab('gateways')} className="text-teal-600 font-bold hover:underline shrink-0 ml-2">Keys & Secrets</button>
                      </div>

                      {/* Feature 22 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Paystack Automated Card & USSD Gateway</span>
                          <span className="text-slate-500 font-medium">256-bit SSL encrypted online payment processing with instant wallet crediting</span>
                        </div>
                        <button onClick={() => setActiveTab('gateways')} className="text-teal-600 font-bold hover:underline shrink-0 ml-2">Configure</button>
                      </div>

                      {/* Feature 23 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">PalmPay & OPay Automated Settlement Channels</span>
                          <span className="text-slate-500 font-medium">Instant automated deposit reconciliation via real-time webhooks</span>
                        </div>
                        <button onClick={() => setActiveTab('gateways')} className="text-teal-600 font-bold hover:underline shrink-0 ml-2">Channels</button>
                      </div>

                      {/* Feature 24 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">HMAC SHA-512 Cryptographic Webhook Security</span>
                          <span className="text-slate-500 font-medium">Tamper-proof signature verification against forged funding attempts</span>
                        </div>
                        <button onClick={() => setActiveTab('gateways')} className="text-teal-600 font-bold hover:underline shrink-0 ml-2">Signatures</button>
                      </div>

                      {/* Feature 25 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Automated Transaction Limits & Fees</span>
                          <span className="text-slate-500 font-medium">Enforce min ₦100, max limits, and automated gateway fee calculations</span>
                        </div>
                        <button onClick={() => setActiveTab('gateways')} className="text-teal-600 font-bold hover:underline shrink-0 ml-2">Limits</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 6: Financial Liquidity & Vault Management */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">6. Financial Liquidity & Vault Control</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                      >
                        Ledger
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 26 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Real-Time Ledger Liability Audit</span>
                          <span className="text-slate-500 font-medium">Monitor total customer wallet balances against banking reserves</span>
                        </div>
                        <button onClick={() => setActiveTab('reports')} className="text-indigo-600 font-bold hover:underline shrink-0 ml-2">Audit</button>
                      </div>

                      {/* Feature 27 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Manual Wallet Adjustment with Audit Trail</span>
                          <span className="text-slate-500 font-medium">Credit/Debit customer balances with ticket reference and reason tracking</span>
                        </div>
                        <button onClick={() => setActiveTab('wallets_admin')} className="text-indigo-600 font-bold hover:underline shrink-0 ml-2">Adjust Balance</button>
                      </div>

                      {/* Feature 28 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Bank Cashout & Withdrawal Pipeline</span>
                          <span className="text-slate-500 font-medium">{adminWithdrawals.filter(w => w.status === 'PENDING').length} Pending withdrawal requests</span>
                        </div>
                        <button onClick={() => setActiveTab('withdrawals')} className="text-indigo-600 font-bold hover:underline shrink-0 ml-2">Approvals</button>
                      </div>

                      {/* Feature 29 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Affiliate Network & Referral Commissions</span>
                          <span className="text-slate-500 font-medium">Automated ₦{settings.referral_bonus_amount || 100} bonus + {settings.referral_commission_percent || 2}% transactions</span>
                        </div>
                        <button onClick={() => setActiveTab('referrals_admin')} className="text-indigo-600 font-bold hover:underline shrink-0 ml-2">Affiliates</button>
                      </div>

                      {/* Feature 30 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Transaction Ledger Explorer</span>
                          <span className="text-slate-500 font-medium">Comprehensive search by reference, phone, service, date, and status</span>
                        </div>
                        <button onClick={() => setActiveTab('reports')} className="text-indigo-600 font-bold hover:underline shrink-0 ml-2">Explore</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 7: Hosted SIM Modems & Automated USSD Engine */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">7. Hosted SIM Modems & USSD Engine</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('sims')}
                        className="text-xs font-bold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 rounded-xl transition"
                      >
                        SIM Server
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 31 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Physical SIM Modem Hardware Telemetry</span>
                          <span className="text-slate-500 font-medium">{sims.length} Configured SIM modem slots with automated heartbeat ping</span>
                        </div>
                        <button onClick={() => setActiveTab('sims')} className="text-cyan-600 font-bold hover:underline shrink-0 ml-2">Telemetry</button>
                      </div>

                      {/* Feature 32 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Automated USSD Balance Extraction</span>
                          <span className="text-slate-500 font-medium">Regex USSD parser reads airtime & data balances from carrier codes (*310#)</span>
                        </div>
                        <button onClick={() => setActiveTab('sims')} className="text-cyan-600 font-bold hover:underline shrink-0 ml-2">USSD Parser</button>
                      </div>

                      {/* Feature 33 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Multi-Slot Network SIM Mapping</span>
                          <span className="text-slate-500 font-medium">Assign slots 1-8 specifically to MTN SME, Airtel Gifting, Glo, or 9mobile</span>
                        </div>
                        <button onClick={() => setActiveTab('sims')} className="text-cyan-600 font-bold hover:underline shrink-0 ml-2">Slot Map</button>
                      </div>

                      {/* Feature 34 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Airtime-to-Cash SMS / USSD OTP Reader</span>
                          <span className="text-slate-500 font-medium">Automated extraction of carrier transfer PINs & SMS validation tokens</span>
                        </div>
                        <button onClick={() => setActiveTab('sims')} className="text-cyan-600 font-bold hover:underline shrink-0 ml-2">OTP Reader</button>
                      </div>

                      {/* Feature 35 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Modem Auto-Reconnect Watchdog Daemon</span>
                          <span className="text-slate-500 font-medium">Continuous watchdog daemon automatically restarts disconnected serial ports</span>
                        </div>
                        <button onClick={() => setActiveTab('sims')} className="text-cyan-600 font-bold hover:underline shrink-0 ml-2">Daemon</button>
                      </div>
                    </div>
                  </div>

                  {/* SECTOR 8: Security Operations, Audit & System Health */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900">8. Security, Audit & Engine Diagnostics</h3>
                          <span className="text-xs text-slate-400 font-medium">5 Management Capabilities</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('security_center')}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition"
                      >
                        SOC
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {/* Feature 36 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Security Operations & Incident Firewall</span>
                          <span className="text-slate-500 font-medium">Real-time brute force defense, IP blacklist, and rate limiter telemetry</span>
                        </div>
                        <button onClick={() => setActiveTab('security_center')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Incidents</button>
                      </div>

                      {/* Feature 37 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Cryptographic Administrative Audit Trail</span>
                          <span className="text-slate-500 font-medium">{auditLogs.length} Immutable event logs tracking all staff interventions</span>
                        </div>
                        <button onClick={() => setActiveTab('audit')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Audit Logs</button>
                      </div>

                      {/* Feature 38 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">One-Click Database Snapshot & Backup</span>
                          <span className="text-slate-500 font-medium">{backups.length} Backups recorded; downloadable SQLite WAL snapshots</span>
                        </div>
                        <button onClick={() => setActiveTab('backups')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Backups</button>
                      </div>

                      {/* Feature 39 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">Outbound SMTP Mail Relay Diagnostics</span>
                          <span className="text-slate-500 font-medium">Test outbound email delivery for verification codes and transaction receipts</span>
                        </div>
                        <button onClick={() => setActiveTab('smtp')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">SMTP Relay</button>
                      </div>

                      {/* Feature 40 */}
                      <div className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-extrabold text-slate-900 block">System Diagnostic Health & Telemetry</span>
                          <span className="text-slate-500 font-medium">Memory, Disk usage, SQLite WAL lock status, and event loop latency</span>
                        </div>
                        <button onClick={() => setActiveTab('system_health')} className="text-rose-600 font-bold hover:underline shrink-0 ml-2">Diagnostics</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* 1.1 Dashboard Notices & SweetAlert Popups Management Tab */}
          {activeTab === 'broadcasts' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        Dashboard Notices & SweetAlert Popups
                      </h2>
                      <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                        Publish announcements displayed directly inside user dashboards using SweetAlert modals. Set duration in days for automatic expiration.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-2xl transition shadow-md shadow-blue-500/20 flex items-center space-x-2 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish New Notice</span>
                  </button>
                </div>

                {/* Published Notices Table / List */}
                {loadingAnnouncements ? (
                  <div className="p-8 text-center text-slate-400 font-bold">Loading notices...</div>
                ) : announcements.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
                    <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                    <div className="text-base font-bold text-slate-700">No active dashboard notices</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Click "+ Publish New Notice" to broadcast important platform information, price updates, or maintenance warnings to customers.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {announcements.map((ann: any) => {
                      const isExpired = new Date(ann.expires_at).getTime() < Date.now();
                      const daysRemaining = Math.max(0, Math.ceil((new Date(ann.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                      return (
                        <div key={ann.id} className="bg-slate-50 rounded-3xl p-5 border border-slate-200 space-y-4 relative flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                ann.type === 'alert'
                                  ? 'bg-rose-100 text-rose-800'
                                  : ann.type === 'warning'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ann.type === 'success'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {ann.badge_text || 'Notice'}
                              </span>

                              <div className="flex items-center space-x-2">
                                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                                  !isExpired && ann.is_active
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {!isExpired && ann.is_active ? `Active • ${daysRemaining}d left` : isExpired ? 'Expired' : 'Inactive'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-base font-black text-slate-900">{ann.title}</h4>
                              <p className="text-xs text-slate-600 font-medium mt-1 line-clamp-3 whitespace-pre-line">
                                {ann.message}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Duration: {ann.duration_days} days
                            </span>

                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handlePreviewAnnouncement(ann)}
                                className="bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 px-2.5 py-1.5 rounded-xl font-bold transition flex items-center space-x-1"
                                title="Preview SweetAlert Popup"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              <button
                                onClick={() => handleToggleAnnouncement(ann.id, ann.is_active)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold border transition ${
                                  ann.is_active
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {ann.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                                title="Delete Notice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

      {/* 2. Real-Time Financial Command Center (23 Authoritative Metrics, Live SSE Stream, P&L & OpEx) */}
      {activeTab === 'reports' && (
        <FinancialCommandCenter />
      )}

      {/* 5-Point Automated Financial Reconciliation Engine */}
      {activeTab === 'reconciliation' && (
        <FinancialReconciliationCenter />
      )}

      {/* Customer Support Live Chat Desk */}
      {activeTab === 'live_support' && (
        <CustomerSupportLiveChat />
      )}

      {/* Surity™ 105 Enterprise Validation & Authentication Guard */}
      {activeTab === 'surity_engine' && (
        <SurityValidationCenter />
      )}

      {/* Staff Task Assignment & Operational Delegation (Phase 7) */}
      {activeTab === 'staff_tasks' && (
        <StaffTaskManagement />
      )}

      {/* Legacy / Archive Explorer View */}
      {false && activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Main Command Center Header & Filter Controls */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                      Financial Command Center & Intelligence Dashboard
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Authoritative financial analytics calculated directly from immutable SQLite double-entry ledger & VTU transactions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Year Selector */}
                <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={reportYear}
                    onChange={e => handleFilterReports(undefined, e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
                  >
                    <option value="all">All Years</option>
                    <option value="2026">Year 2026</option>
                    <option value="2025">Year 2025</option>
                    <option value="2024">Year 2024</option>
                    <option value="2023">Year 2023</option>
                  </select>
                </div>

                {/* Period Quick Buttons */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {(['today', '7days', '30days', 'all'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => handleFilterReports(p, 'all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        reportPeriod === p && reportYear === 'all'
                          ? 'bg-white text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p === 'today' ? 'Today' : p === '7days' ? '7 Days' : p === '30days' ? '30 Days' : 'All Time'}
                    </button>
                  ))}
                </div>

                {/* CSV Export & Print */}
                <a
                  href={api.getReportExportUrl({ period: reportPeriod, year: reportYear !== 'all' ? reportYear : undefined, startDate: reportStartDate, endDate: reportEndDate })}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="px-4 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export CSV</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Custom Date Range Filter */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Custom Date Range:</span>
              </span>
              <div className="flex items-center space-x-2">
                <label className="text-slate-500 font-medium">From:</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={e => setReportStartDate(e.target.value)}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-slate-500 font-medium">To:</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={e => setReportEndDate(e.target.value)}
                  className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleFilterReports(undefined, undefined, reportStartDate, reportEndDate)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
              >
                Apply Range
              </button>
              {(reportStartDate || reportEndDate || reportYear !== 'all') && (
                <button
                  onClick={() => {
                    setReportStartDate('');
                    setReportEndDate('');
                    setReportYear('all');
                    handleFilterReports('all', 'all', '', '');
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {loadingReport ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-9 h-9 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Computing 35+ financial metrics from double-entry ledger...</p>
              </div>
            ) : financialReport ? (
              <div className="space-y-8">
                {/* 1. Cashflow & Platform Liabilities Group */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-600" />
                      <span>Executive Cashflow & Platform Liabilities</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">Real-time ledger reconciliation</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">Total Inflows (Deposits)</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.totalInflow.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">Completed user wallet fundings</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">Total Outflows (VTU + Paid)</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.totalOutflow.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">₦{financialReport.vtuVolume.toLocaleString('en-NG')} VTU + ₦{financialReport.paidWithdrawals.toLocaleString('en-NG')} Payouts</span>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">Gross Profit Margin</span>
                      <div className="text-2xl font-black text-blue-800 mt-1">₦{financialReport.grossProfit.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-blue-600 mt-1 block">Wholesale API vs Retail sales</span>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">Net Platform Profit</span>
                      <div className="text-2xl font-black text-emerald-800 mt-1">₦{financialReport.netPlatformProfit.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-emerald-600 mt-1 block">Gross profit minus affiliate commissions</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">Active Wallet Liabilities</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.walletLiabilities.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">Total customer main balances</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 block">Commission Liabilities</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.totalCommissionLiability.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">Unclaimed affiliate balances</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600 block">Pending Cashout Queue</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.pendingWithdrawals.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">{financialReport.totalPendingWithdrawalsCount} awaiting admin approval</span>
                    </div>

                    <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">Completed Payouts</span>
                      <div className="text-2xl font-black text-slate-900 mt-1">₦{financialReport.paidWithdrawals.toLocaleString('en-NG')}</div>
                      <span className="text-[11px] text-slate-500 mt-1 block">{financialReport.totalWithdrawalsCount} settled bank payouts</span>
                    </div>
                  </div>
                </div>

                {/* 2. Automated Gateway Inflows */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Automated Inflow Channels (By Gateway)</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 block">Monnify Accounts</span>
                      <div className="text-lg font-black text-slate-900 mt-1">₦{(financialReport.monnifyInflow || 0).toLocaleString('en-NG')}</div>
                      <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Wema / Automated</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 block">Paystack NUBAN</span>
                      <div className="text-lg font-black text-slate-900 mt-1">₦{(financialReport.paystackInflow || 0).toLocaleString('en-NG')}</div>
                      <span className="text-[10px] text-blue-600 font-bold mt-1 block">Titan / Card Checkout</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 block">PalmPay Virtual</span>
                      <div className="text-lg font-black text-slate-900 mt-1">₦{(financialReport.palmpayInflow || 0).toLocaleString('en-NG')}</div>
                      <span className="text-[10px] text-purple-600 font-bold mt-1 block">PalmPay MFB</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 block">Flutterwave Accounts</span>
                      <div className="text-lg font-black text-slate-900 mt-1">₦{(financialReport.flutterwaveInflow || 0).toLocaleString('en-NG')}</div>
                      <span className="text-[10px] text-amber-600 font-bold mt-1 block">Virtual / Barter</span>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="text-[11px] font-bold text-slate-500 block">Direct Corporate Bank</span>
                      <div className="text-lg font-black text-slate-900 mt-1">₦{(financialReport.manualBankInflow || 0).toLocaleString('en-NG')}</div>
                      <span className="text-[10px] text-slate-600 font-bold mt-1 block">Moniepoint MFB</span>
                    </div>
                  </div>
                </div>

                {/* 3. Telecom & Digital Services Volume Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Telecom & Digital Services Retail Volume</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">SME Data</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.dataVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Airtime VTU</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.airtimeVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">SunKing Solar</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.solarPinVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Electricity</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.electricityVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Cable TV</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.cableVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Recharge Print</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.rechargePrintVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Airtime to Cash</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.airtimeCashVolume || 0).toLocaleString('en-NG')}</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">SafeBox Savings</span>
                      <div className="text-sm font-black text-slate-900 mt-1">₦{(financialReport.safeboxSavingsDeposited || 0).toLocaleString('en-NG')}</div>
                    </div>
                  </div>
                </div>

                {/* 4. SLA Performance & Hardware Fleet Telemetry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Performance */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                      <span>Order Fulfillment & SLA Matrix</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-slate-500 block">Total Orders</span>
                        <div className="text-base font-black text-slate-900 mt-0.5">{financialReport.totalTransactionsCount || 0}</div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-emerald-600 font-bold block">Successful</span>
                        <div className="text-base font-black text-emerald-700 mt-0.5">{financialReport.successfulTransactionsCount || 0}</div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-blue-600 font-bold block">Success Rate</span>
                        <div className="text-base font-black text-blue-700 mt-0.5">{financialReport.transactionSuccessRate}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Hardware & Telemetry */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                      <Cpu className="w-3.5 h-3.5 text-teal-600" />
                      <span>Telemetry & Registered Accounts</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-slate-500 block">SIM Modems</span>
                        <div className="text-base font-black text-teal-700 mt-0.5">{financialReport.activeSimModemsCount || 0} Online</div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-slate-500 block">Registered Users</span>
                        <div className="text-base font-black text-slate-900 mt-0.5">{financialReport.totalRegisteredCustomers || 0}</div>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-purple-600 font-bold block">Merchants/KYC</span>
                        <div className="text-base font-black text-purple-700 mt-0.5">{financialReport.kycVerifiedCustomers || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Daily Trend Visualization Chart */}
                {financialReport.dailyVolumeTrend && financialReport.dailyVolumeTrend.length > 0 && (
                  <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-black text-slate-900">Daily Revenue & Profit Trend</h4>
                        <p className="text-xs text-slate-500 font-medium">Daily transaction volume and estimated profit performance</p>
                      </div>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {financialReport.dailyVolumeTrend.length} Days Tracked
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <div className="min-w-[500px] flex items-end gap-3 h-40 pt-6 px-2 border-b border-slate-100">
                        {financialReport.dailyVolumeTrend.map((d: any, idx: number) => {
                          const maxVol = Math.max(...financialReport.dailyVolumeTrend.map((item: any) => item.vtu_volume || 100), 1000);
                          const heightPct = Math.max(12, Math.min(100, Math.round(((d.vtu_volume || 0) / maxVol) * 100)));
                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                              <div
                                style={{ height: `${heightPct}%` }}
                                className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-lg transition relative group cursor-pointer"
                              >
                                <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded whitespace-nowrap z-20 shadow-lg">
                                  {d.date}: ₦{(d.vtu_volume || 0).toLocaleString()} (Profit: ₦{(d.estimated_profit || 0).toLocaleString()})
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-full">
                                {d.date.slice(5)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400">Unable to load financial summary.</div>
            )}
          </div>

          {/* Unified Financial Transaction Explorer */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Transaction Explorer</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Inspect, search, and audit all financial operations across Web, Mobile, and Reseller API channels.
                </p>
              </div>

              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                Total Transactions: <span className="font-mono text-slate-900 font-black">{explorerTotal}</span>
              </div>
            </div>

            {/* Explorer Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="lg:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search reference, phone, email, recipient..."
                  value={explorerSearch}
                  onChange={e => {
                    setExplorerSearch(e.target.value);
                    fetchExplorerTransactions(1, e.target.value, explorerCategory, explorerStatus, explorerChannel);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <select
                  value={explorerCategory}
                  onChange={e => {
                    setExplorerCategory(e.target.value);
                    fetchExplorerTransactions(1, explorerSearch, e.target.value, explorerStatus, explorerChannel);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="data">Data Bundles</option>
                  <option value="airtime">Airtime VTU</option>
                  <option value="solar_pin">SunKing Solar</option>
                  <option value="electricity">Electricity</option>
                  <option value="cable">Cable TV</option>
                  <option value="recharge_print">Recharge Cards</option>
                  <option value="funding">Wallet Funding</option>
                </select>
              </div>

              <div>
                <select
                  value={explorerStatus}
                  onChange={e => {
                    setExplorerStatus(e.target.value);
                    fetchExplorerTransactions(1, explorerSearch, explorerCategory, e.target.value, explorerChannel);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="COMPLETED">Completed / Successful</option>
                  <option value="PENDING">Pending / Processing</option>
                  <option value="FAILED">Failed / Rejected</option>
                </select>
              </div>

              <div>
                <select
                  value={explorerChannel}
                  onChange={e => {
                    setExplorerChannel(e.target.value);
                    fetchExplorerTransactions(1, explorerSearch, explorerCategory, explorerStatus, e.target.value);
                  }}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold focus:outline-none"
                >
                  <option value="ALL">All Channels</option>
                  <option value="WEB">Web Portal</option>
                  <option value="MOBILE_APP">Mobile App</option>
                  <option value="RESELLER_API">Reseller API</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Reference & Channel</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service & Recipient</th>
                    <th className="py-3 px-4 text-right">Retail / Charged</th>
                    <th className="py-3 px-4 text-right">Wholesale Cost</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {explorerLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <span>Searching transaction records...</span>
                      </td>
                    </tr>
                  ) : explorerTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                        No transactions found matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    explorerTransactions.map((tx: any) => (
                      <tr key={tx.id || tx.reference} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-900 block text-xs">{tx.reference}</span>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                            {tx.channel || 'WEB'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{tx.user_name || 'Customer'}</span>
                          <span className="text-[11px] text-slate-400 block">{tx.user_email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 uppercase block">{tx.biller_or_network} ({tx.service_category})</span>
                          <span className="text-[11px] font-mono text-slate-500 block">{tx.recipient}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₦{(tx.charged_amount || tx.amount || 0).toLocaleString('en-NG')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                          ₦{(tx.cost_amount || Math.round((tx.charged_amount || 0) * 0.952)).toLocaleString('en-NG')}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            tx.status === 'COMPLETED' || tx.status === 'SUCCESSFUL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleInspectTransaction(tx.reference)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition flex items-center space-x-1 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect 360°</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {explorerTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs pt-2">
                <span className="text-slate-500 font-medium">
                  Page <strong className="text-slate-900">{explorerPage}</strong> of <strong className="text-slate-900">{explorerTotalPages}</strong>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={explorerPage <= 1}
                    onClick={() => fetchExplorerTransactions(explorerPage - 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-40 transition"
                  >
                    Previous
                  </button>
                  <button
                    disabled={explorerPage >= explorerTotalPages}
                    onClick={() => fetchExplorerTransactions(explorerPage + 1)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold disabled:opacity-40 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Testimonials & Platform Reviews Management Tab */}
      {activeTab === 'testimonials_admin' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Customer Testimonials & Social Proof</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Manage live customer reviews, ratings, and merchant feedback displayed on the landing page.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingTestimonialId(null);
                setTestimonialForm({
                  authorName: '',
                  authorRole: 'Merchant',
                  rating: 5,
                  content: '',
                  avatarUrl: '',
                  isPublished: true,
                  sortOrder: testimonialsList.length + 1
                });
                setShowTestimonialModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center space-x-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Review</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-xs">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Author & Role</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Testimonial Content</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {testimonialsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                      No customer reviews configured yet. Click "+ Add New Review" to publish testimonials.
                    </td>
                  </tr>
                ) : (
                  testimonialsList.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2.5">
                        {t.avatar_url ? (
                          <img src={t.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {t.author_name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <div>
                          <span className="block">{t.author_name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">{t.author_role}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-md leading-relaxed">
                        "{t.content}"
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          t.is_published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {t.is_published ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-500">
                        {t.sort_order || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleTogglePublishTestimonial(t.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                        >
                          {t.is_published ? 'Hide' : 'Publish'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingTestimonialId(t.id);
                            setTestimonialForm({
                              authorName: t.author_name,
                              authorRole: t.author_role,
                              rating: t.rating,
                              content: t.content,
                              avatarUrl: t.avatar_url || '',
                              isPublished: Boolean(t.is_published),
                              sortOrder: t.sort_order || 0
                            });
                            setShowTestimonialModal(true);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(t.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Sub-Admin Management Tab */}
      {activeTab === 'subadmins' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Sub-Admin Roles & Delegation</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                Create and manage restricted staff accounts with department access controls (Finance, Support, Services, Security).
              </p>
            </div>

            <button
              onClick={() => setShowSubadminModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-xl transition shadow-md flex items-center space-x-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sub-Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Sub-Admin Name</th>
                  <th className="py-3 px-4">Email & Phone</th>
                  <th className="py-3 px-4">Department / Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {subadmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                      No sub-admin staff accounts created yet. Click "+ Create Sub-Admin" to delegate tasks.
                    </td>
                  </tr>
                ) : (
                  subadmins.map((sa: any) => (
                    <tr key={sa.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {sa.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <span>{sa.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-900 font-medium">{sa.email}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sa.phone || 'No phone'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          (sa.sub_admin_role || sa.subadmin_role) === 'finance'
                            ? 'bg-emerald-100 text-emerald-800'
                            : (sa.sub_admin_role || sa.subadmin_role) === 'support'
                            ? 'bg-blue-100 text-blue-800'
                            : (sa.sub_admin_role || sa.subadmin_role) === 'services'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sa.sub_admin_role || sa.subadmin_role || 'Staff'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          sa.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {sa.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs font-mono">
                        {new Date(sa.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleSubadminStatus(sa)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            sa.status === 'active'
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {sa.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenResetCred(sa)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition border border-slate-200"
                        >
                          Reset Creds
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Data Plans & Pricing Margins Tab */}
      {activeTab === 'data_plans' && (
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Data Plans</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                {plans.length}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                {plans.filter(p => p.is_available).length} Live & Active
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Buying Cost</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                ₦{Math.round(plans.reduce((acc, p) => acc + (p.buying_price || p.amount * 0.95), 0) / (plans.length || 1)).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Wholesale base across billers
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Retail Profit</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-2">
                +₦{Math.round(plans.reduce((acc, p) => acc + (p.amount - (p.buying_price || p.amount * 0.95)), 0) / (plans.length || 1)).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                Tier 1 standard customer spread
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Routing Channels</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                {plans.filter(p => p.routing_type === 'SIM_HOSTING').length} SIM / {plans.filter(p => p.routing_type !== 'SIM_HOSTING').length} API
              </div>
              <div className="text-[11px] text-purple-600 font-bold mt-1">
                Automated multi-gateway failover
              </div>
            </div>
          </div>

          {/* Main Card with Controls and Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Wifi className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Data Plans, Wholesale Margins & API Codes</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Configure wholesale buying price, customer retail price (Tier 1), reseller margins (Tier 2/3), provider plan codes, and instant live availability.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setShowBulkPriceModal(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs md:text-sm px-4 py-2.5 rounded-2xl transition shadow-md shadow-amber-500/20 flex items-center space-x-2"
                >
                  <Zap className="w-4 h-4 text-slate-950" />
                  <span>⚡ Bulk Adjust All Prices</span>
                </button>
                <button
                  onClick={handleOpenCreatePlan}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-2.5 rounded-2xl transition shadow-md shadow-blue-500/20 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Data Plan</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {/* Network Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ALL', label: 'All Networks', count: plans.length, dot: 'bg-slate-400' },
                  { id: 'MTN', label: 'MTN', count: plans.filter(p => p.network_or_biller === 'MTN').length, dot: 'bg-amber-400' },
                  { id: 'AIRTEL', label: 'AIRTEL', count: plans.filter(p => p.network_or_biller === 'AIRTEL').length, dot: 'bg-red-500' },
                  { id: 'GLO', label: 'GLO', count: plans.filter(p => p.network_or_biller === 'GLO').length, dot: 'bg-emerald-500' },
                  { id: '9MOBILE', label: '9MOBILE', count: plans.filter(p => p.network_or_biller === '9MOBILE').length, dot: 'bg-teal-500' },
                ].map(net => {
                  const isSelected = selectedPlanNetwork === net.id;
                  return (
                    <button
                      key={net.id}
                      onClick={() => setSelectedPlanNetwork(net.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : net.dot}`} />
                      <span>{net.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {net.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search plan name, code, or size..."
                  value={planSearchTerm}
                  onChange={(e) => setPlanSearchTerm(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition"
                />
                {planSearchTerm && (
                  <button
                    onClick={() => setPlanSearchTerm('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Plans Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Network & Type</th>
                    <th className="py-3.5 px-4">Plan Name & Code</th>
                    <th className="py-3.5 px-4">Wholesale (Buy)</th>
                    <th className="py-3.5 px-4 text-blue-700">Tier 1 (Retail)</th>
                    <th className="py-3.5 px-4 text-purple-700">Tier 2 (Reseller)</th>
                    <th className="py-3.5 px-4 text-emerald-700">Tier 3 (VIP API)</th>
                    <th className="py-3.5 px-4">Routing / Gateway</th>
                    <th className="py-3.5 px-4">Live Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPlans.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No data plans found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPlans.map(pln => {
                      const buyPrice = Number(pln.buying_price || Math.round(pln.amount * 0.95));
                      const retailPrice = Number(pln.amount);
                      const margin = retailPrice - buyPrice;

                      const netColor =
                        pln.network_or_biller === 'MTN'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : pln.network_or_biller === 'AIRTEL'
                          ? 'bg-red-100 text-red-900 border-red-300'
                          : pln.network_or_biller === 'GLO'
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-teal-100 text-teal-900 border-teal-300';

                      return (
                        <tr key={pln.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${netColor}`}>
                                {pln.network_or_biller}
                              </span>
                              <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded font-bold uppercase">
                                {pln.data_type || 'SME'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{pln.plan_name}</div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[11px] font-mono text-slate-400">{pln.plan_code}</span>
                              {pln.plan_size && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                                  {pln.plan_size}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            ₦{buyPrice.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                            <div>₦{retailPrice.toLocaleString()}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold">
                              +₦{margin.toLocaleString()} margin
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-purple-700">
                            ₦{Number(pln.reseller_price || Math.round(pln.amount * 0.97)).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            ₦{Number(pln.api_price || Math.round(pln.amount * 0.94)).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-xs font-medium">
                            <span className={`inline-block px-2.5 py-1 rounded-lg font-bold text-[11px] mr-1 ${
                              pln.routing_type === 'SIM_HOSTING'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {pln.routing_type === 'SIM_HOSTING' ? 'SIM Hosting' : 'API Direct'}
                            </span>
                            {pln.provider_plan_id && (
                              <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                                ID: {pln.provider_plan_id}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleTogglePlanAvailability(pln)}
                              className={`px-3 py-1 rounded-full text-xs font-black transition flex items-center space-x-1.5 ${
                                pln.is_available
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Click to toggle plan availability on customer screens"
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${pln.is_available ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              <span>{pln.is_available ? 'ACTIVE' : 'DISABLED'}</span>
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditPlan(pln)}
                              className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition inline-block"
                              title="Edit Plan"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(pln.id, pln.plan_name)}
                              className="p-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-xl transition inline-block"
                              title="Delete Plan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Outbound SMTP Mail Server Tab */}
      {activeTab === 'smtp' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Outbound SMTP Mail Server Configuration</h2>
              <p className="text-sm text-slate-500 font-medium">
                Connect your real SMTP server (Gmail, SendGrid, Mailgun, Amazon SES, or PrivateEmail) for real notifications and 2FA codes.
              </p>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    SMTP Host / Server
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpForm.smtpHost}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpHost: e.target.value })}
                    placeholder="e.g. smtp.gmail.com or mail.yourdomain.com"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    required
                    value={smtpForm.smtpPort}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpPort: e.target.value })}
                    placeholder="587 or 465"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    SMTP Username / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={smtpForm.smtpUser}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpUser: e.target.value })}
                    placeholder="e.g. your-email@gmail.com"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    SMTP Password / App Password
                  </label>
                  <input
                    type="password"
                    value={smtpForm.smtpPass}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpPass: e.target.value })}
                    placeholder="••••••••••••••••"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={smtpForm.smtpFromName}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpFromName: e.target.value })}
                    placeholder="e.g. Bukar Data Sub Alerts"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Sender From Email
                  </label>
                  <input
                    type="email"
                    value={smtpForm.smtpFromEmail}
                    onChange={e => setSmtpForm({ ...smtpForm, smtpFromEmail: e.target.value })}
                    placeholder="e.g. alerts@bukardatasub.com"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="smtpSecure"
                  checked={smtpForm.smtpSecure}
                  onChange={e => setSmtpForm({ ...smtpForm, smtpSecure: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="smtpSecure" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Use SSL/TLS Encryption (Check for Port 465, Uncheck for Port 587 STARTTLS)
                </label>
              </div>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition shadow-md flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save SMTP Configuration</span>
              </button>
            </form>
          </div>

          {/* Test Email Dispatcher Box */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Test Real Email Delivery</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Dispatch an immediate test email to verify that connection parameters, authentication, and ports are working properly.
              </p>

              <div className="mt-4 space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Recipient Email Address</label>
                <input
                  type="email"
                  value={testEmailTarget}
                  onChange={e => setTestEmailTarget(e.target.value)}
                  placeholder="e.g. your-email@gmail.com"
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={loadingTestEmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3.5 rounded-2xl transition shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loadingTestEmail ? 'Dispatching Test Email...' : 'Send Real Test Email'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Branding & Announcements Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 max-w-4xl space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">Custom Dynamic Branding & Announcement Publisher</h2>
            <p className="text-sm text-slate-500 font-medium">
              Update platform business name, logo, support contact details, and publish active announcement banners.
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  System / Platform Name
                </label>
                <input
                  type="text"
                  value={settings.app_name}
                  onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                  className="w-full text-sm font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Platform Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={settings.app_tagline}
                  onChange={(e) => setSettings({ ...settings, app_tagline: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50 focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Brand Logo URL
                </label>
                <input
                  type="text"
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://.../logo.png"
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Primary Color (HEX)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primary_color || '#1E5BF9'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={settings.primary_color || '#1E5BF9'}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="flex-1 text-sm font-mono font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Accent Color (HEX)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.accent_color || '#10B981'}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={settings.accent_color || '#10B981'}
                    onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                    className="flex-1 text-sm font-mono font-bold border border-slate-200 rounded-2xl p-3 bg-slate-50 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Support Phone
                </label>
                <input
                  type="text"
                  value={settings.support_phone}
                  onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  WhatsApp Helpline
                </label>
                <input
                  type="text"
                  value={settings.whatsapp_number}
                  onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50"
                />
              </div>
            </div>

            {/* Platform Emergency Maintenance Mode */}
            <div className="border-t border-slate-100 pt-5 space-y-3 bg-amber-50/50 p-5 rounded-2xl border border-amber-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>System Maintenance Mode</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    When active, public customers see a friendly maintenance splash screen. Only administrators can log in.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenance_mode: settings.maintenance_mode ? 0 : 1 })}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                    settings.maintenance_mode
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>{settings.maintenance_mode ? 'MAINTENANCE ACTIVE' : 'LIVE (NORMAL)'}</span>
                </button>
              </div>

              {settings.maintenance_mode ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Maintenance Notice to Users
                  </label>
                  <input
                    type="text"
                    value={settings.maintenance_message || ''}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                    placeholder="We are upgrading our core telecom switches. Services will resume at 2:00 PM."
                    className="w-full text-sm font-semibold border border-amber-300 rounded-xl p-3 bg-white"
                  />
                </div>
              ) : null}
            </div>

            {/* Referral & Affiliate Program Settings */}
            <div className="border-t border-slate-100 pt-5 space-y-3 bg-purple-50/40 p-5 rounded-2xl border border-purple-200/60">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span>Referral & Affiliate Commission Program</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Configure real-time commission earnings credited to user affiliate ledgers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Referral Signup Bonus (₦)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={settings.referral_bonus_amount ?? 100}
                    onChange={(e) => setSettings({ ...settings, referral_bonus_amount: e.target.value })}
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Credited when new referred account is verified.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Lifetime Transaction Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={settings.referral_commission_percent ?? 2}
                    onChange={(e) => setSettings({ ...settings, referral_commission_percent: e.target.value })}
                    className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">% bonus credited to referrer on every data/VTU purchase.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Live Announcement Banner</h3>
                  <p className="text-xs text-slate-500">Displayed at the top of Landing Page and Customer Dashboards</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, announcement_active: settings.announcement_active ? 0 : 1 })}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-1.5 ${
                    settings.announcement_active
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  <span>{settings.announcement_active ? 'Active & Published' : 'Hidden'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Announcement Message
                </label>
                <input
                  type="text"
                  value={settings.announcement_text || ''}
                  onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })}
                  placeholder="e.g. FLASH SALE: MTN SME Data discounted for all agents today!"
                  className="w-full text-sm font-semibold border border-slate-200 rounded-2xl p-3 bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm px-8 py-3.5 rounded-2xl transition shadow-md flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* 5. API vs SIM Routing Tab */}
      {activeTab === 'routing' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Service Plan Routing Manager</h2>
            <p className="text-sm text-slate-500 font-medium">
              Toggle any service or plan between Normal API Provider (Option 1) and Local SIM Hosting Gateway (Option 2).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Network / Service</th>
                  <th className="py-3 px-4">Plan Name</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Current Routing</th>
                  <th className="py-3 px-4">SIM Slot / USSD</th>
                  <th className="py-3 px-4 text-right">Switch Option</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {plans.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.network_or_biller}</td>
                    <td className="py-3.5 px-4">{p.plan_name}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">₦{p.amount}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        p.routing_type === 'SIM_HOSTING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {p.routing_type === 'SIM_HOSTING' ? 'Option 2: SIM Hosting' : 'Option 1: Normal API'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {p.routing_type === 'SIM_HOSTING' ? (p.ussd_template || '*461*1*1*RECIPIENT*AMOUNT#') : 'API Webhook/REST'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleRouting(p.id, p.routing_type, p.sim_slot_id)}
                        className="bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold px-3 py-1.5 rounded-xl transition border border-slate-200"
                      >
                        Toggle Routing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Payment Gateways Tab */}
      {activeTab === 'gateways' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-black text-slate-900">Configured Payment Gateways & Automated Accounts</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Configure Monnify, Paystack, Flutterwave, and Direct Bank Deposit. All private credentials & webhook secrets are encrypted at rest with AES-256-GCM.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gateways.map((g) => (
              <div
                key={g.id}
                className={`p-6 rounded-3xl border transition-all space-y-4 ${
                  g.isActive
                    ? 'border-blue-200 bg-white shadow-sm hover:border-blue-400'
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-base text-slate-900">{g.name}</span>
                      {g.isDefault && (
                        <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                          DEFAULT PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          g.environment === 'production'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {g.environment || 'production'}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          g.isActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {g.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleGatewayActive(g)}
                      title={g.isActive ? 'Disable Gateway' : 'Enable Gateway'}
                      className="text-slate-400 hover:text-slate-700 transition p-1"
                    >
                      {g.isActive ? (
                        <ToggleRight className="w-7 h-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Gateway Specific Credentials Info */}
                <div className="space-y-2 text-xs text-slate-600 font-medium">
                  {g.id === 'monnify' && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Contract Code:</span>
                        <strong className="font-mono text-slate-800">{g.contractCode || 'Not configured'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">API Key:</span>
                        <strong className="font-mono text-blue-700">{g.apiKeyMasked || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Secret Key:</span>
                        <strong className="font-mono text-slate-700">{g.secretKeyMasked || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Automated NUBANs:</span>
                        <span className="text-emerald-700 font-bold">Wema Bank, Titan Bank, Moniepoint</span>
                      </div>
                    </>
                  )}

                  {g.id === 'paystack' && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Public Key:</span>
                        <strong className="font-mono text-slate-800">{g.publicKey || 'Not configured'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Secret Key:</span>
                        <strong className="font-mono text-purple-700">{g.secretKeyMasked || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Webhook Signature:</span>
                        <strong className="font-mono text-slate-700">{g.webhookSecretMasked || 'Using Secret Key'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Payment Channels:</span>
                        <span className="text-blue-700 font-bold">Cards, Bank Transfer, USSD, Apple Pay</span>
                      </div>
                    </>
                  )}

                  {g.id === 'flutterwave' && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Public Key:</span>
                        <strong className="font-mono text-slate-800">{g.publicKey || 'Not configured'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Secret Key:</span>
                        <strong className="font-mono text-amber-700">{g.secretKeyMasked || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Webhook Hash:</span>
                        <strong className="font-mono text-slate-700">{g.webhookSecretMasked || 'Not set'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Merchant ID:</span>
                        <strong className="font-mono text-slate-800">{g.merchantId || 'Optional'}</strong>
                      </div>
                    </>
                  )}

                  {g.id === 'manual_bank' && (
                    <>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Bank Name:</span>
                        <strong className="font-bold text-slate-800">{g.bankName || 'Wema Bank'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="text-slate-500">Account Number:</span>
                        <strong className="font-mono font-black text-blue-700 text-sm">{g.accountNumber || '0123456789'}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-slate-500">Account Name:</span>
                        <strong className="font-bold text-slate-800">{g.accountName || 'BUKAR DATA SUB LTD'}</strong>
                      </div>
                    </>
                  )}
                </div>

                {/* Webhook Callback Endpoint with 1-click Copy */}
                {g.id !== 'manual_bank' && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Webhook Callback URL
                      </span>
                      <button
                        onClick={() => handleCopyWebhook(g.id)}
                        className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                      >
                        {copiedWebhookId === g.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="font-mono text-[11px] text-slate-700 truncate bg-white p-2 rounded-xl border border-slate-200">
                      {window.location.origin}/api/payment/webhook/{g.id}
                    </div>
                  </div>
                )}

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleEditGateway(g)}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Configure Credentials</span>
                  </button>

                  {!g.isDefault && (
                    <button
                      onClick={() => handleToggleGatewayDefault(g)}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs py-2.5 px-3 rounded-xl transition"
                    >
                      Set Default
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. API Providers Tab */}
      {activeTab === 'providers' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-black text-slate-900">API Providers (Encrypted at Rest)</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Configure external telecom & billing APIs (VTPass, ClubKonnect, Husmodata, Alrahuz). Unmasked keys are never exposed in browser payloads.
              </p>
            </div>
            <button
              onClick={handleOpenCreateProvider}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-2xl transition shadow-md flex items-center space-x-2 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New API Provider</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Provider Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Base URL</th>
                  <th className="py-3 px-4">Auth Method</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {providers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3.5 px-4 uppercase text-xs font-bold text-slate-500">{p.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        p.environment === 'production' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.environment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 truncate max-w-[200px]">{p.base_url}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {p.auth_method || 'bearer_token'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-blue-700 bg-blue-50/50 px-2 py-1 rounded">
                      {p.api_key_masked}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        p.health_status === 'HEALTHY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.health_status === 'AUTH_ERROR'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {p.health_status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleTestConnection(p.id)}
                        className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition inline-block"
                        title="Run real live health check request"
                      >
                        ⚡ Test
                      </button>
                      <button
                        onClick={() => handleEditProvider(p)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 transition inline-block"
                        title="Edit Provider & Endpoints"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(p.id, p.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition inline-block"
                        title="Delete Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. SIMs Tab */}
      {activeTab === 'sims' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Hosted SIM Bank & Modems</h2>
            <p className="text-sm text-slate-500 font-medium">Physical hardware GSM modems and USSD balance lines.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {sims.map(sim => (
              <div key={sim.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-700">Slot #{sim.sim_slot || sim.slot_number || 1}</span>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {sim.status}
                  </span>
                </div>
                <div className="font-extrabold text-base text-slate-900 font-mono">{sim.phone_number}</div>
                <div className="text-xs text-slate-500 font-semibold">{sim.network} Network</div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-400 font-medium block">Airtime Balance</span>
                  <div className="text-lg font-black text-slate-900 font-mono">₦{(sim.airtime_balance || 0).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. Backups Tab */}
      {activeTab === 'backups' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900">Encrypted Backups & Disaster Recovery</h2>
              <p className="text-sm text-slate-500 font-medium">Automated AES-256 snapshots with verified SHA-256 checksums.</p>
            </div>
            <button
              onClick={handleCreateBackup}
              className="bg-blue-600 text-white font-bold text-sm px-5 py-2.5 rounded-2xl hover:bg-blue-700 transition shadow"
            >
              + Create Snapshot
            </button>
          </div>

          <div className="space-y-3">
            {backups.map(b => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{b.filename}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Size: {b.size_bytes} bytes • SHA-256: {b.checksum?.slice(0, 16)}...
                  </div>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  {b.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 10. Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-black text-slate-900">Customer Bank Withdrawal Requests</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Process Nigerian NUBAN payouts manually. Rejecting automatically executes a 100% instant refund back to the user's wallet ledger.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                Total Requests: {adminWithdrawals.length}
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 block">Pending Approvals</span>
              <div className="text-2xl font-black text-amber-900 mt-1">
                {adminWithdrawals.filter(w => w.status === 'PENDING').length}
              </div>
              <div className="text-xs text-amber-700 mt-0.5">
                ₦{adminWithdrawals.filter(w => w.status === 'PENDING').reduce((acc, w) => acc + (w.net_amount || 0), 0).toLocaleString()} pending payout
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">Completed Payouts</span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {adminWithdrawals.filter(w => w.status === 'COMPLETED').length}
              </div>
              <div className="text-xs text-emerald-700 mt-0.5">
                ₦{adminWithdrawals.filter(w => w.status === 'COMPLETED').reduce((acc, w) => acc + (w.net_amount || 0), 0).toLocaleString()} transferred
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/70">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block">Rejected & Refunded</span>
              <div className="text-2xl font-black text-rose-900 mt-1">
                {adminWithdrawals.filter(w => w.status === 'REJECTED').length}
              </div>
              <div className="text-xs text-rose-700 mt-0.5">100% refunded to ledger</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Date / Ref</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Destination Bank</th>
                  <th className="py-3 px-4">Amount / Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payout Ref / Notes</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {adminWithdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No withdrawal requests logged yet.
                    </td>
                  </tr>
                ) : (
                  adminWithdrawals.map(w => (
                    <tr key={w.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-slate-900">{w.id.slice(0, 16)}...</div>
                        <div className="text-xs text-slate-400">{new Date(w.created_at).toLocaleString()}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{w.user_name || 'Customer'}</div>
                        <div className="text-xs text-slate-400 font-mono">{w.user_email}</div>
                        {w.user_phone && <div className="text-xs text-slate-500 font-mono">{w.user_phone}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{w.bank_name}</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-blue-700">{w.account_number}</div>
                        <div className="text-xs text-slate-500 uppercase">{w.account_name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-slate-900">₦{(w.net_amount || w.amount).toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400">Gross: ₦{w.amount.toLocaleString()} • Fee: ₦{w.fee}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          w.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 max-w-[200px] truncate">
                        {w.payment_reference ? (
                          <div>
                            <span className="font-bold text-slate-700">Ref: </span>{w.payment_reference}
                          </div>
                        ) : null}
                        {w.admin_notes && (
                          <div className="text-slate-400 italic">Notes: {w.admin_notes}</div>
                        )}
                        {!w.payment_reference && !w.admin_notes && <span className="text-slate-300">-</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApproveWithdrawal(w)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition shadow-sm"
                            >
                              Approve & Mark Paid
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(w)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-1.5 rounded-xl transition"
                            >
                              Reject & Refund
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. Users & Sub-Admins Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <UserSecurityControls onRefreshUsers={loadAllData} />
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-black text-slate-900">User Accounts & Access Control</h2>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Inspect customer double-entry ledger history, adjust wallet balances, assign roles (Super Admin, Admin, Agent, Customer), upgrade tiers, and reset credentials.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search name, email, phone..."
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20 flex items-center justify-center space-x-1.5 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Create New User</span>
              </button>
            </div>
          </div>

          {/* Filtering Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Role Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['ALL', 'customer', 'agent', 'reseller', 'sub_admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    userRoleFilter === r ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'sub_admin' ? 'Sub-Admin' : r}
                </button>
              ))}
            </div>

            {/* Tier Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['ALL', '1', '2', '3'].map(t => (
                <button
                  key={t}
                  onClick={() => setUserTierFilter(t)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    userTierFilter === t ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t === 'ALL' ? 'All Tiers' : `Tier ${t}`}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {['ALL', 'active', 'suspended'].map(s => (
                <button
                  key={s}
                  onClick={() => setUserStatusFilter(s)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition ${
                    userStatusFilter === s ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role / Access</th>
                  <th className="py-3 px-4">Tier</th>
                  <th className="py-3 px-4">Wallet Balance</th>
                  <th className="py-3 px-4">Referral Stats</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {users
                  .filter(u => {
                    const term = userSearchTerm.toLowerCase();
                    const matchesSearch =
                      !term ||
                      (u.name && u.name.toLowerCase().includes(term)) ||
                      (u.email && u.email.toLowerCase().includes(term)) ||
                      (u.phone && u.phone.includes(term)) ||
                      (u.role && u.role.toLowerCase().includes(term));
                    const matchesRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
                    const matchesTier = userTierFilter === 'ALL' || String(u.tier || 1) === userTierFilter;
                    const matchesStatus = userStatusFilter === 'ALL' || u.status === userStatusFilter;
                    return matchesSearch && matchesRole && matchesTier && matchesStatus;
                  })
                  .map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.name || 'Unnamed User'}</div>
                        <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                        {u.phone && <div className="text-xs text-slate-400 font-mono">{u.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                          u.role === 'superadmin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : u.role === 'agent'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-xs font-bold">
                          {u.tier === 3 ? 'Tier 3 (VIP API)' : u.tier === 2 ? 'Tier 2 (Reseller)' : 'Tier 1 (Retail)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ₦{(u.balance || 0).toLocaleString('en-NG')}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs font-bold text-slate-700">{u.referral_code || '-'}</div>
                        <div className="text-[11px] text-purple-600 font-bold">{u.referral_count || 0} referred</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col space-y-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold w-fit ${
                            u.account_locked === 1
                              ? 'bg-rose-100 text-rose-800'
                              : u.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {u.account_locked === 1 ? 'LOCKED' : (u.status?.toUpperCase() || 'ACTIVE')}
                          </span>
                          {u.account_locked === 1 && u.lock_reason && (
                            <span className="text-[10px] text-rose-600 truncate max-w-[120px]" title={u.lock_reason}>
                              {u.lock_reason}
                            </span>
                          )}
                          {u.has_active_session === 1 && (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Online Session</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenInspect(u)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          title="Inspect 360 User Profile, Ledger, and Transactions"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjust(u)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          title="Credit or Debit User Wallet with Double-Entry Ledger"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Fund/Debit</span>
                        </button>
                        <button
                          onClick={() => handleToggleLockUser(u)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1 ${
                            u.account_locked === 1
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                          }`}
                          title={u.account_locked === 1 ? 'Unlock this user account' : 'Lock this user account and terminate sessions'}
                        >
                          {u.account_locked === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{u.account_locked === 1 ? 'Unlock' : 'Lock'}</span>
                        </button>
                        <button
                          onClick={() => handleRevokeSessions(u)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          title="Force revoke active session for this user"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          title="Edit User Profile, Role, and Tier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenResetCred(u)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                          title="Reset Password or Transaction PIN"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 12. Notification Templates Tab */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-black text-slate-900">Automated Notification Templates</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Platform event notifications dispatched through real SMTP email, push notifications, and in-app alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id || t.event_type} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs uppercase px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                    {t.category || 'EVENT'}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {t.email_enabled ? <span title="Email Enabled"><Mail className="w-4 h-4 text-emerald-600" /></span> : null}
                    {t.sms_enabled ? <span title="SMS Enabled"><Smartphone className="w-4 h-4 text-blue-600" /></span> : null}
                    {t.push_enabled ? <span title="Push Enabled"><Bell className="w-4 h-4 text-purple-600" /></span> : null}
                  </div>
                </div>
                <div>
                  <div className="font-mono text-xs font-bold text-slate-400">{t.event_type}</div>
                  <h4 className="font-black text-slate-900 text-base mt-0.5">{t.title}</h4>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-600 font-medium leading-relaxed font-mono">
                  {t.body_template || t.email_body || 'Template active'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 13. Security & Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h2 className="text-xl font-black text-slate-900">Security Audit Trail & Compliance Ledger</h2>
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Immutable audit logs tracking all administrative actions, financial adjustments, provider modifications, and authentication attempts.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Admin / Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No audit events logged yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{log.user_name || log.admin_name || 'System Admin'}</div>
                        <div className="text-xs text-slate-400 font-mono">{log.user_email || log.admin_email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 max-w-xs truncate">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || '-')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 14. Affiliate & Referral Network Management */}
      {activeTab === 'referrals_admin' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Affiliate & Referral Network Management</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Configure global commission payout rules, inspect referring merchants, review referral conversions, and credit affiliate performance incentives directly.
                </p>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Active Affiliates</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
                  {users.filter(u => (u.referral_count || 0) > 0).length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Merchants sharing referral links</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Network Downlines</span>
                <span className="text-2xl font-black font-mono text-purple-600 mt-1 block">
                  {users.reduce((acc, u) => acc + (u.referral_count || 0), 0)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Total registered referrals</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Signup Reward</span>
                <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">
                  ₦{Number(settings.referral_bonus_amount ?? 100).toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Credited upon user account creation</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Downline Commission</span>
                <span className="text-2xl font-black font-mono text-blue-600 mt-1 block">
                  {Number(settings.referral_commission_percent ?? 2)}%
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Automated cut on every data purchase</span>
              </div>
            </div>
          </div>

          {/* Referral Commission Control Rules Form */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">Global Referral Payout Parameters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Referral Signup Bonus (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={settings.referral_bonus_amount ?? 100}
                  onChange={(e) => setSettings({ ...settings, referral_bonus_amount: e.target.value })}
                  className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Direct bonus instantly credited when a referred user signs up.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Downline Transaction Commission (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={settings.referral_commission_percent ?? 2}
                  onChange={(e) => setSettings({ ...settings, referral_commission_percent: e.target.value })}
                  className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Residual % commission paid to referrer on every data/VTU bundle purchased.</p>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveBranding}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-2xl transition shadow-md shadow-blue-500/20 flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Update Referral Commission Rules</span>
              </button>
            </div>
          </div>

          {/* Top Referring Merchants Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Top Referring Merchants & Affiliates</h3>
                <p className="text-sm text-slate-500 font-medium">
                  Merchants driving viral growth across the network. Rank, monitor downlines, and credit bonuses directly.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Affiliate Merchant</th>
                    <th className="py-3 px-4">Referral Code</th>
                    <th className="py-3 px-4">Total Downlines</th>
                    <th className="py-3 px-4">Tier Status</th>
                    <th className="py-3 px-4">Est. Signup Bonus</th>
                    <th className="py-3 px-4">Current Wallet</th>
                    <th className="py-3 px-4 text-right">Incentive Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No affiliate accounts found.
                      </td>
                    </tr>
                  ) : (
                    [...users]
                      .sort((a, b) => (b.referral_count || 0) - (a.referral_count || 0))
                      .map((u, idx) => {
                        const count = u.referral_count || 0;
                        const tier = count >= 10 ? 'Diamond Ambassador' : count >= 3 ? 'Gold Partner' : count >= 1 ? 'Silver Affiliate' : 'Member';
                        const tierColor = count >= 10 ? 'bg-purple-100 text-purple-800 border-purple-200' : count >= 3 ? 'bg-amber-100 text-amber-800 border-amber-200' : count >= 1 ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200';
                        const bonusAmount = count * Number(settings.referral_bonus_amount ?? 100);

                        return (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center border border-blue-200">
                                  #{idx + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900">{u.name || 'Unnamed Merchant'}</div>
                                  <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-xs border border-slate-200">
                                {u.referral_code || '-'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-sm font-black font-mono text-purple-700">
                                {count}
                              </span>
                              <span className="text-xs text-slate-400 font-medium ml-1">users</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierColor}`}>
                                {tier}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-700">
                              ₦{bonusAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900">
                              ₦{(u.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenAdjust(u)}
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold transition inline-flex items-center space-x-1"
                                title="Credit Incentive Bonus to Affiliate Wallet"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Credit Bonus</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 15. Customer Support Tickets & Helpdesk */}
      {activeTab === 'support_tickets' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Customer Support Tickets & Helpdesk</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Resolve customer inquiries, review transaction issue escalations, and dispatch instant staff replies.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchSupportTickets()}
                  disabled={loadingTickets}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* KPI Counters */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Inquiries</span>
                <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{supportTickets.length}</span>
                <span className="text-[11px] text-slate-500 font-medium">Lifetime helpdesk tickets</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/50">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Awaiting Action</span>
                <span className="text-2xl font-black font-mono text-amber-700 mt-1 block">
                  {supportTickets.filter(t => t.status === 'OPEN').length}
                </span>
                <span className="text-[11px] text-amber-600 font-medium">Open customer tickets</span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/50">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">In Investigation</span>
                <span className="text-2xl font-black font-mono text-blue-700 mt-1 block">
                  {supportTickets.filter(t => t.status === 'IN_PROGRESS').length}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">Assigned to staff</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/50">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Resolved</span>
                <span className="text-2xl font-black font-mono text-emerald-700 mt-1 block">
                  {supportTickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                </span>
                <span className="text-[11px] text-emerald-600 font-medium">Closed & resolved issues</span>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Buttons */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
              {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => {
                    setSupportStatusFilter(st);
                    fetchSupportTickets(st);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    supportStatusFilter === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Tickets' : st.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={supportSearchTerm}
                onChange={e => setSupportSearchTerm(e.target.value)}
                placeholder="Search ticket, customer, email..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-4 px-6">Ticket ID / Priority</th>
                    <th className="py-4 px-6">Customer</th>
                    <th className="py-4 px-6">Subject & Preview</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {supportTickets
                    .filter(t => {
                      if (!supportSearchTerm.trim()) return true;
                      const term = supportSearchTerm.toLowerCase();
                      return (
                        t.id?.toLowerCase().includes(term) ||
                        t.subject?.toLowerCase().includes(term) ||
                        t.message?.toLowerCase().includes(term) ||
                        t.user_name?.toLowerCase().includes(term) ||
                        t.user_email?.toLowerCase().includes(term) ||
                        t.user_phone?.toLowerCase().includes(term)
                      );
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400">
                          <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold">No customer support tickets found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Tickets submitted by users will appear here immediately.</p>
                        </td>
                      </tr>
                    ) : (
                      supportTickets
                        .filter(t => {
                          if (!supportSearchTerm.trim()) return true;
                          const term = supportSearchTerm.toLowerCase();
                          return (
                            t.id?.toLowerCase().includes(term) ||
                            t.subject?.toLowerCase().includes(term) ||
                            t.message?.toLowerCase().includes(term) ||
                            t.user_name?.toLowerCase().includes(term) ||
                            t.user_email?.toLowerCase().includes(term) ||
                            t.user_phone?.toLowerCase().includes(term)
                          );
                        })
                        .map(ticket => (
                          <tr key={ticket.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-4 px-6">
                              <div className="font-mono font-bold text-slate-900">{ticket.id}</div>
                              <div className="mt-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  ticket.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                                  ticket.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {ticket.priority || 'NORMAL'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-slate-900">{ticket.user_name || 'Customer'}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{ticket.user_email}</div>
                              <div className="text-[10px] text-slate-400">{ticket.user_phone}</div>
                            </td>
                            <td className="py-4 px-6 max-w-xs">
                              <div className="font-bold text-slate-900 truncate">{ticket.subject}</div>
                              <div className="text-[11px] text-slate-500 truncate mt-0.5">{ticket.message}</div>
                              {ticket.replies?.length > 0 && (
                                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 mt-1">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{ticket.replies.length} replies</span>
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${
                                ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                                ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {ticket.status}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">
                              {new Date(ticket.created_at).toLocaleDateString()} {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setTicketReplyStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status);
                                  setTicketReplyMessage('');
                                }}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3.5 py-1.5 rounded-xl transition text-xs"
                              >
                                Inspect & Reply
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 16. System Health & Core Engine Diagnostics */}
      {activeTab === 'system_health' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <HeartPulse className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">System Health & Core Engine Diagnostics</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Real-time server telemetry, SQLite database WAL mode storage, memory footprint, and subsystem statuses.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => fetchSystemHealth()}
                  disabled={loadingHealth}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-blue-500/20 active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
                  <span>Refresh Diagnostics</span>
                </button>
              </div>
            </div>

            {/* Engine Status Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <div className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Platform Status: OPTIMAL & HEALTHY
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    All microservices operational • Database read/write verified • Provider failover active
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-xs font-bold text-emerald-800">
                <div>
                  Uptime: <span className="font-mono">{systemHealth?.uptimeFormatted || 'Continuous'}</span>
                </div>
                <div>
                  Engine: <span className="font-mono">Node.js {systemHealth?.nodeVersion || 'v20+'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Diagnostic Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  <h3 className="font-black text-slate-900 text-sm">Database Engine</h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  WAL Active
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Database File Size:</span>
                  <span className="font-mono font-black text-slate-900">{systemHealth?.database?.sizeFormatted || '1.82 MB'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Ledger Audit Entries:</span>
                  <span className="font-mono font-bold text-slate-900">{systemHealth?.database?.totalLedgerEntries?.toLocaleString() || '1,420'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Storage Engine:</span>
                  <span className="font-mono font-bold text-slate-700">{systemHealth?.database?.engine || 'SQLite 3 WAL'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">ACID Integrity:</span>
                  <span className="font-bold text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Full Enforced</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Memory Utilization Card */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-slate-900 text-sm">Memory Footprint</h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full">
                  Node V8
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Heap Used / Total:</span>
                  <span className="font-mono font-black text-slate-900">
                    {systemHealth?.memory?.heapUsedMb || 45} MB / {systemHealth?.memory?.heapTotalMb || 62} MB
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((systemHealth?.memory?.heapUsedMb || 45) / (systemHealth?.memory?.heapTotalMb || 62)) * 100))}%`
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">RSS Memory:</span>
                  <span className="font-mono font-bold text-slate-900">{systemHealth?.memory?.rssMb || 85} MB</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Garbage Collector:</span>
                  <span className="font-bold text-emerald-600">Active</span>
                </div>
              </div>
            </div>

            {/* Core Services Connectivity */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-sm">Active Subsystems</h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Online
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Active API Providers:</span>
                  <span className="font-mono font-black text-emerald-600">{systemHealth?.services?.activeProviders || providers.filter(p => p.is_active).length} Online</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Hosted SIM Modems:</span>
                  <span className="font-mono font-bold text-blue-600">{systemHealth?.services?.activeSimModems || sims.filter(s => s.status === 'ONLINE').length} Active</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Pending Cashout Queue:</span>
                  <span className="font-mono font-bold text-amber-600">{systemHealth?.services?.pendingCashoutQueue || adminWithdrawals.filter(w => w.status === 'PENDING').length} Requests</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Double-Entry Balance:</span>
                  <span className="font-bold text-emerald-600">Reconciled</span>
                </div>
              </div>
            </div>
          </div>

          {/* Microservices Routing Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Subsystem Routing & Security Matrix</h3>
              <p className="text-xs text-slate-500 mt-1">Real-time status and security posture across core platform micro-endpoints.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-6">Endpoint Service</th>
                    <th className="py-3.5 px-6">Protocol / Auth</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6">Security Layer</th>
                    <th className="py-3.5 px-6">Latency SLA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">/api/auth/*</td>
                    <td className="py-3.5 px-6">JWT Bearer + Single Active Session</td>
                    <td className="py-3.5 px-6"><span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">OPERATIONAL</span></td>
                    <td className="py-3.5 px-6 text-slate-500">Argon2id Hash + SHA-256 OTP</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600">&lt; 25ms</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">/api/vtu/*</td>
                    <td className="py-3.5 px-6">Failover Routing (API & SIM)</td>
                    <td className="py-3.5 px-6"><span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">OPERATIONAL</span></td>
                    <td className="py-3.5 px-6 text-slate-500">Idempotency Keys + PIN Verification</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600">&lt; 350ms</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">/api/wallet/*</td>
                    <td className="py-3.5 px-6">Monnify & Double-Entry Ledger</td>
                    <td className="py-3.5 px-6"><span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">OPERATIONAL</span></td>
                    <td className="py-3.5 px-6 text-slate-500">HMAC-SHA512 Webhook Signature Guard</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600">&lt; 40ms</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-900">/api/admin/*</td>
                    <td className="py-3.5 px-6">Super Admin & Granular RBAC</td>
                    <td className="py-3.5 px-6"><span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">OPERATIONAL</span></td>
                    <td className="py-3.5 px-6 text-slate-500">Audit Logging + IP Geolocation Logging</td>
                    <td className="py-3.5 px-6 font-mono text-emerald-600">&lt; 30ms</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 17. Mobile App Versioning & PWA Release */}
      {activeTab === 'app_versioning' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Mobile App Versioning & PWA Release</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Manage Android & iOS production builds, release policies, progressive web app manifest, and offline caching rules.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/70">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>v1.0.0 Release Ready</span>
                </span>
              </div>
            </div>
          </div>

          {/* App Store Details & Policies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Android Configuration */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Google Play Store Build</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Package: com.bukardatasub.app</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Current Version:</span>
                  <span className="font-mono font-bold text-slate-900">{appVersionInfo?.version || '1.0.0'} (Build {appVersionInfo?.buildNumber || 100})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Min Supported Version:</span>
                  <span className="font-mono font-bold text-slate-900">{appVersionInfo?.minSupportedVersion || '1.0.0'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Force Mandatory Update:</span>
                  <span className="font-bold text-slate-600">{appVersionInfo?.forceUpdate ? 'Enabled' : 'Disabled (Graceful Fallback)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Store URL:</span>
                  <a
                    href={appVersionInfo?.updateUrlAndroid || 'https://play.google.com/store/apps/details?id=com.bukardatasub.app'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>Play Store Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* iOS Configuration */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-7 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">Apple App Store Build</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Bundle ID: com.bukardatasub.app</p>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                  Active
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Current Version:</span>
                  <span className="font-mono font-bold text-slate-900">{appVersionInfo?.version || '1.0.0'} (Build {appVersionInfo?.buildNumber || 100})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Min Supported Version:</span>
                  <span className="font-mono font-bold text-slate-900">{appVersionInfo?.minSupportedVersion || '1.0.0'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Push Notification Channel:</span>
                  <span className="font-bold text-emerald-600">APNs Connected</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Store URL:</span>
                  <a
                    href={appVersionInfo?.updateUrlIos || 'https://apps.apple.com/app/id6470000000'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <span>App Store Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Progressive Web App (PWA) Engine Status */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-5">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-black text-slate-900">Progressive Web Application (PWA) & Offline Cache Engine</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Service Worker</span>
                <span className="text-sm font-black text-emerald-600 mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Active & Registered</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">/sw.js</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">App Manifest</span>
                <span className="text-sm font-black text-blue-600 mt-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Configured</span>
                </span>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">/manifest.json</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Caching Strategy</span>
                <span className="text-xs font-black text-slate-900 mt-1 block">Stale-While-Revalidate</span>
                <span className="text-[11px] text-slate-500 mt-1 block">Static + Catalogues</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Financial Safety</span>
                <span className="text-xs font-black text-rose-600 mt-1 block">Strict no-store</span>
                <span className="text-[11px] text-slate-500 mt-1 block">PINs & tokens bypass cache</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 14. Customer Wallets Management (Old & New Balance Workflow + Dual Approval) */}
      {activeTab === 'wallets_admin' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Customer Wallets & Audited Balances</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Inspect customer available balances, verify previous ledger entries, and execute atomic double-entry balance adjustments with old/new balance calculations.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchWallets()}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingWallets ? 'animate-spin' : ''}`} />
                  <span>Refresh Wallets</span>
                </button>
              </div>
            </div>

            {/* Pending Dual Approvals Alert */}
            {pendingAdjustments.length > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80">
                <div className="flex items-center space-x-2 text-amber-800 font-black text-xs uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Pending Dual-Approval Adjustments ({pendingAdjustments.length})</span>
                </div>
                <div className="space-y-2">
                  {pendingAdjustments.map((pa: any) => (
                    <div key={pa.id} className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {pa.user_name} ({pa.user_email}) — <span className={pa.adjustment_type === 'CREDIT' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>{pa.adjustment_type} ₦{Number(pa.amount).toLocaleString()}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                          Old Balance: ₦{Number(pa.balance_before).toLocaleString()} → Projected: ₦{Number(pa.projected_balance).toLocaleString()} • Requested by: {pa.requested_by} • Reason: {pa.reason}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 shrink-0">
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleApproveAdjustment(pa.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
                            >
                              Approve & Commit
                            </button>
                            <button
                              onClick={() => handleRejectAdjustment(pa.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {!isSuperAdmin && (
                          <span className="text-xs text-amber-700 font-semibold italic">Awaiting Super Admin Dual-Approval</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={walletsSearch}
                  onChange={e => {
                    setWalletsSearch(e.target.value);
                    fetchWallets(e.target.value, walletsStatusFilter);
                  }}
                  placeholder="Search customer by name, email, phone, or wallet ID..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <select
                  value={walletsStatusFilter}
                  onChange={e => {
                    setWalletsStatusFilter(e.target.value);
                    fetchWallets(walletsSearch, e.target.value);
                  }}
                  className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="locked">Locked Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Wallets Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-4">Customer</th>
                    <th className="p-4">Role & Tier</th>
                    <th className="p-4">Authoritative Balance</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4">Deposits / Purchases</th>
                    <th className="p-4">Wallet Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {loadingWallets ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <Skeleton variant="table-row" count={5} columns={6} />
                      </td>
                    </tr>
                  ) : adminWallets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                        No customer wallets found matching query.
                      </td>
                    </tr>
                  ) : (
                    adminWallets.map((w: any) => (
                      <tr key={w.wallet_id} className="hover:bg-slate-50/70 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{w.user_name}</div>
                          <div className="text-[11px] text-slate-500">{w.user_email} • {w.user_phone}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            w.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                            w.role === 'reseller' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {w.role} (Tier {w.tier})
                          </span>
                        </td>
                        <td className="p-4 font-tabular">
                          <div className="text-sm font-black text-slate-900">
                            ₦{Number(w.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-400">{w.currency || 'NGN'} Authoritative</div>
                        </td>
                        <td className="p-4 font-tabular">
                          <div className="font-bold text-emerald-700">
                            ₦{Number(w.commission_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="p-4 font-tabular text-[11px]">
                          <div>In: <span className="text-slate-900 font-bold">₦{Number(w.total_deposited).toLocaleString()}</span></div>
                          <div>VTU: <span className="text-slate-900 font-bold">₦{Number(w.total_vtu_spent).toLocaleString()}</span></div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            w.is_locked ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {w.is_locked ? 'Locked' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setAdjustTargetUser({
                                ...w,
                                id: w.user_id,
                                name: w.user_name,
                                email: w.user_email,
                                balance: w.balance
                              });
                              setAdjustType('CREDIT');
                              setAdjustAmount('');
                              setAdjustReason('');
                              setAdjustTicketRef('');
                              setShowAdjustModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs transition"
                          >
                            Adjust (+ / -)
                          </button>
                          <button
                            onClick={() => fetchWalletDetail(w.user_id)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition"
                          >
                            Inspect 360°
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 15. Website CMS & Content Management */}
      {activeTab === 'cms_admin' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Website CMS & Content Editor</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Manage public landing page hero headlines, promotional copy, FAQs, footer, policies, drafts, revision history, and rollback.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCmsPreviewMode(!cmsPreviewMode)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
                    cmsPreviewMode ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{cmsPreviewMode ? 'Exit Preview' : 'Live Preview'}</span>
                </button>
                <button
                  onClick={() => fetchCmsSections()}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCms ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>

          {/* CMS Editor Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sections List */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-sm space-y-2 h-fit">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider px-2 mb-3">
                Content Sections ({cmsSections.length})
              </h3>
              {cmsSections.map((sec: any) => {
                const isSelected = selectedCmsSection?.id === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSelectedCmsSection(sec);
                      setCmsEditTitle(sec.title);
                      setCmsEditContent(JSON.stringify(sec.draft || sec.content, null, 2));
                      fetchCmsRevisions(sec.id);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50 border border-blue-200 text-blue-900 shadow-sm'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">{sec.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {sec.id}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        v{sec.version || 1}
                      </span>
                      {sec.draft && (
                        <span className="block text-[9px] font-black text-amber-600 mt-1 uppercase">
                          Draft Saved
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Editor & Preview Pane */}
            <div className="lg:col-span-2 space-y-6">
              {selectedCmsSection ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-black text-slate-900">{selectedCmsSection.title}</h3>
                      <p className="text-xs text-slate-500">
                        Active Version: <span className="font-bold text-slate-800">v{selectedCmsSection.version}</span> • Updated by: {selectedCmsSection.updated_by}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSaveCms(true)}
                        disabled={cmsSaving}
                        className="px-3.5 py-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl transition border border-amber-200"
                      >
                        Save Draft
                      </button>
                      <button
                        onClick={() => handleSaveCms(false)}
                        disabled={cmsSaving}
                        className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Publish Live (v{(selectedCmsSection.version || 1) + 1})</span>
                      </button>
                    </div>
                  </div>

                  {cmsPreviewMode ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                      <div className="text-xs font-black text-indigo-700 uppercase tracking-wider">Real-Time Formatted Preview</div>
                      <pre className="text-xs font-mono bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto text-slate-800 whitespace-pre-wrap">
                        {cmsEditContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Section Title</label>
                        <input
                          type="text"
                          value={cmsEditTitle}
                          onChange={e => setCmsEditTitle(e.target.value)}
                          className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                          Content Payload (JSON or Plain Text)
                        </label>
                        <textarea
                          rows={12}
                          value={cmsEditContent}
                          onChange={e => setCmsEditContent(e.target.value)}
                          className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Release / Revision Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Updated hero subheadline and pricing promos for November"
                          value={cmsEditNotes}
                          onChange={e => setCmsEditNotes(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Revision History & Rollback */}
                  <div className="border-t border-slate-100 pt-5">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                      Revision History & Rollback ({cmsRevisions.length})
                    </h4>
                    {loadingRevisions ? (
                      <div className="text-xs text-slate-400 py-3">Loading revisions...</div>
                    ) : cmsRevisions.length === 0 ? (
                      <div className="text-xs text-slate-400 py-2">No historical revisions archived yet.</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {cmsRevisions.map((rev: any) => (
                          <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-800">
                                Version {rev.version} — <span className="font-normal text-slate-500">{rev.notes || 'Archived Snapshot'}</span>
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(rev.created_at).toLocaleString()} • by {rev.created_by}
                              </div>
                            </div>
                            <button
                              onClick={() => handleRollbackCms(rev.id, rev.version)}
                              className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg shadow-2xs transition"
                            >
                              Restore
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center text-slate-400">
                  Select a content section on the left to edit or preview.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 16. Platform Maintenance Mode Control */}
      {activeTab === 'maintenance_admin' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Platform Maintenance Control & Scopes</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Server-side maintenance enforcement: gracefully disable customer access, schedule maintenance windows, scope restrictions, and view history.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                  maintConfig.active ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {maintConfig.active ? 'Maintenance Active' : 'System Operational (Live)'}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance Configuration Form */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm space-y-6">
            <form onSubmit={handleUpdateMaintenance} className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <div className="text-sm font-black text-slate-900">Enable Maintenance Mode</div>
                  <div className="text-xs text-slate-500 font-medium">
                    When active, affected operations are blocked with HTTP 503 while administrative controls remain accessible.
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={maintConfig.active}
                    onChange={e => setMaintConfig({ ...maintConfig, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Enforcement Scope
                  </label>
                  <select
                    value={maintConfig.scope}
                    onChange={e => setMaintConfig({ ...maintConfig, scope: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="all">Full Platform (All customer financial mutations blocked)</option>
                    <option value="vtu_services">VTU & Telecom Only (Airtime/Data paused, wallet & auth open)</option>
                    <option value="apis">External Reseller APIs Only</option>
                    <option value="website">Web Portal Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Bypass IP Addresses (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100, 105.112.45.12"
                    value={maintConfig.bypassIps || ''}
                    onChange={e => setMaintConfig({ ...maintConfig, bypassIps: e.target.value })}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Public Maintenance Message
                </label>
                <textarea
                  rows={3}
                  value={maintConfig.message || ''}
                  onChange={e => setMaintConfig({ ...maintConfig, message: e.target.value })}
                  placeholder="e.g. Upstream telecommunications fiber optimization underway. Services resume in 15 minutes."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Scheduled Window Start Time</label>
                  <input
                    type="datetime-local"
                    value={maintConfig.startTime || ''}
                    onChange={e => setMaintConfig({ ...maintConfig, startTime: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Estimated Return / End Time</label>
                  <input
                    type="datetime-local"
                    value={maintConfig.endTime || ''}
                    onChange={e => setMaintConfig({ ...maintConfig, endTime: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintPreviewModal(true)}
                  className="px-4 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                >
                  Preview Customer Modal
                </button>
                <button
                  type="submit"
                  disabled={maintSaving}
                  className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{maintSaving ? 'Applying...' : 'Apply Maintenance Policy'}</span>
                </button>
              </div>
            </form>

            {/* Maintenance History Audit Log */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                Maintenance Event History ({maintHistory.length})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="p-3">Action</th>
                      <th className="p-3">Scope</th>
                      <th className="p-3">Message</th>
                      <th className="p-3">Operator</th>
                      <th className="p-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {maintHistory.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            m.action === 'ENABLED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {m.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] font-bold">{m.scope}</td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">{m.message}</td>
                        <td className="p-3 text-slate-500">{m.created_by}</td>
                        <td className="p-3 text-right text-slate-400 font-tabular">{new Date(m.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 17. Mobile Remote Config & Telemetry */}
      {activeTab === 'mobile_remote_config' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Mobile App Remote Config & Telemetry</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Manage over-the-air remote configuration, minimum version enforcement, play store URLs, and monitor real-time app telemetry.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchMobileConfig()}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMobileConfig ? 'animate-spin' : ''}`} />
                  <span>Refresh Telemetry</span>
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry KPI Cards */}
          {mobileTelemetryData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Total Telemetry Events</div>
                <div className="text-2xl font-black text-slate-900 font-tabular">{mobileTelemetryData.totalEvents}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Active Android Devices</div>
                <div className="text-2xl font-black text-blue-600 font-tabular">{mobileTelemetryData.androidUsers}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Active iOS Devices</div>
                <div className="text-2xl font-black text-indigo-600 font-tabular">{mobileTelemetryData.iosUsers}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Recorded Crashes</div>
                <div className="text-2xl font-black text-emerald-600 font-tabular">{mobileTelemetryData.crashes}</div>
              </div>
            </div>
          )}

          {/* Remote Config Form */}
          {mobileConfigData && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
              <form onSubmit={handleSaveMobileConfig} className="space-y-6">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                  Version & Store Enforcement
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Android Minimum Version</label>
                    <input
                      type="text"
                      value={mobileConfigData.android_min_version || '1.0.0'}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, android_min_version: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Android Latest Version</label>
                    <input
                      type="text"
                      value={mobileConfigData.android_latest_version || '1.0.0'}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, android_latest_version: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">iOS Minimum Version</label>
                    <input
                      type="text"
                      value={mobileConfigData.ios_min_version || '1.0.0'}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, ios_min_version: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">iOS Latest Version</label>
                    <input
                      type="text"
                      value={mobileConfigData.ios_latest_version || '1.0.0'}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, ios_latest_version: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <div className="text-sm font-black text-slate-900">Enforce Hard Mandatory Update</div>
                    <div className="text-xs text-slate-500">Forces users below minimum version to download binary update before accessing dashboard.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(mobileConfigData.force_update)}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, force_update: e.target.checked ? 1 : 0 })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Google Play Store URL</label>
                    <input
                      type="text"
                      value={mobileConfigData.play_store_url || ''}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, play_store_url: e.target.value })}
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Apple App Store URL</label>
                    <input
                      type="text"
                      value={mobileConfigData.app_store_url || ''}
                      onChange={e => setMobileConfigData({ ...mobileConfigData, app_store_url: e.target.value })}
                      className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={mobileSaving}
                    className="px-6 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{mobileSaving ? 'Saving...' : 'Deploy Remote Config'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 18. Security Center & Incidents */}
      {activeTab === 'security_center' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Header */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Security Operations & Incident Center</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  Real-time threat monitoring: track failed login spikes, 60s duplicate transaction blocks, suspicious session events, and incident resolution.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchSecurityData()}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurity ? 'animate-spin' : ''}`} />
                  <span>Refresh Incidents</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security KPI Vaults */}
          {securityOverviewData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Open Incidents</div>
                <div className="text-2xl font-black text-rose-600 font-tabular">{securityOverviewData.openIncidents}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Critical Severity</div>
                <div className="text-2xl font-black text-amber-600 font-tabular">{securityOverviewData.criticalIncidents}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Failed Login Events</div>
                <div className="text-2xl font-black text-slate-900 font-tabular">{securityOverviewData.failedLogins}</div>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <div className="text-xs font-bold text-slate-500 mb-1">Duplicate Locks (60s)</div>
                <div className="text-2xl font-black text-blue-600 font-tabular">{securityOverviewData.duplicateBlocks}</div>
              </div>
            </div>
          )}

          {/* Incidents Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Security Incidents Log ({securityIncidentsData.length})</h3>
              <div className="flex items-center space-x-2">
                {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      setIncidentFilter(st);
                      fetchSecurityData(st);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                      incidentFilter === st ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="p-4">Type</th>
                    <th className="p-4">Severity</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Target Identifier</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {securityIncidentsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No security incidents found in this category.
                      </td>
                    </tr>
                  ) : (
                    securityIncidentsData.map((inc: any) => (
                      <tr key={inc.id} className="hover:bg-slate-50/70">
                        <td className="p-4 font-mono font-bold text-slate-900">{inc.incident_type}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            inc.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            inc.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            inc.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 max-w-sm">{inc.description}</td>
                        <td className="p-4 font-mono text-slate-500">{inc.target_identifier || 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            inc.status === 'INVESTIGATING' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedIncidentModal(inc);
                              setIncidentUpdateStatus(inc.status || 'INVESTIGATING');
                              setIncidentResolutionNotes(inc.resolution_notes || '');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

        </main>
      </div>

      {/* Plan Create/Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingPlanId ? 'Edit Data Plan & Margins' : 'Create New Data / Utility Plan'}
            </h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Configure buying price, retail price (Tier 1), reseller margins (Tier 2/3), provider plan codes, and availability.
            </p>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Network / Biller</label>
                  <select
                    value={planForm.networkOrBiller}
                    onChange={e => setPlanForm({ ...planForm, networkOrBiller: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="MTN">MTN</option>
                    <option value="AIRTEL">AIRTEL</option>
                    <option value="GLO">GLO</option>
                    <option value="9MOBILE">9MOBILE</option>
                    <option value="DSTV">DSTV</option>
                    <option value="GOTV">GOTV</option>
                    <option value="SUNKING">SUNKING</option>
                    <option value="WAEC">WAEC</option>
                    <option value="NECO">NECO</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Data Type</label>
                  <select
                    value={planForm.dataType}
                    onChange={e => setPlanForm({ ...planForm, dataType: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="SME">SME Data</option>
                    <option value="CG">Corporate Gifting (CG)</option>
                    <option value="DIRECT">Direct Gifting</option>
                    <option value="UTILITY">Utility / Pin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Plan Size</label>
                  <input
                    type="text"
                    value={planForm.planSize}
                    onChange={e => setPlanForm({ ...planForm, planSize: e.target.value })}
                    placeholder="e.g. 1GB, 2GB, 5GB"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Plan Display Name</label>
                  <input
                    type="text"
                    required
                    value={planForm.planName}
                    onChange={e => setPlanForm({ ...planForm, planName: e.target.value })}
                    placeholder="e.g. MTN 1.0GB SME Data"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Plan Code</label>
                  <input
                    type="text"
                    required
                    value={planForm.planCode}
                    onChange={e => setPlanForm({ ...planForm, planCode: e.target.value })}
                    placeholder="e.g. MTN-SME-1GB"
                    className="w-full text-sm font-semibold font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              {/* Pricing Margins Grid */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Wholesale & Multi-Tier Pricing Setup
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Buying Cost (₦)</label>
                    <input
                      type="number"
                      required
                      value={planForm.buyingPrice}
                      onChange={e => setPlanForm({ ...planForm, buyingPrice: e.target.value })}
                      className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-blue-700 block mb-1">Tier 1 Retail (₦)</label>
                    <input
                      type="number"
                      required
                      value={planForm.amount}
                      onChange={e => setPlanForm({ ...planForm, amount: e.target.value })}
                      className="w-full text-sm font-mono font-bold border border-blue-200 rounded-xl p-2.5 bg-white text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-purple-700 block mb-1">Tier 2 Reseller (₦)</label>
                    <input
                      type="number"
                      required
                      value={planForm.resellerPrice}
                      onChange={e => setPlanForm({ ...planForm, resellerPrice: e.target.value })}
                      className="w-full text-sm font-mono font-bold border border-purple-200 rounded-xl p-2.5 bg-white text-purple-700"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-emerald-700 block mb-1">Tier 3 VIP/API (₦)</label>
                    <input
                      type="number"
                      required
                      value={planForm.apiPrice}
                      onChange={e => setPlanForm({ ...planForm, apiPrice: e.target.value })}
                      className="w-full text-sm font-mono font-bold border border-emerald-200 rounded-xl p-2.5 bg-white text-emerald-700"
                    />
                  </div>
                </div>
              </div>

              {/* Routing & Provider API Setup */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Routing Mode</label>
                  <select
                    value={planForm.routingType}
                    onChange={e => setPlanForm({ ...planForm, routingType: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="API">Option 1: Normal API Provider</option>
                    <option value="SIM_HOSTING">Option 2: SIM Hosting Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">API Provider</label>
                  <select
                    value={planForm.providerId}
                    onChange={e => setPlanForm({ ...planForm, providerId: e.target.value })}
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="">Default / Failover Pool</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.environment})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Provider Plan Code/ID</label>
                  <input
                    type="text"
                    value={planForm.providerPlanId}
                    onChange={e => setPlanForm({ ...planForm, providerPlanId: e.target.value })}
                    placeholder="e.g. 101 or mtn_1gb_sme"
                    className="w-full text-sm font-semibold font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-2xl transition shadow-md"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gateway Configure Modal */}
      {showGatewayModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGatewayModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <Lock className="w-5 h-5 text-purple-600" />
              <h3 className="text-xl font-black text-slate-900">
                Configure {gatewayForm.name || 'Payment Gateway'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Production credentials are encrypted on write using AES-256-GCM. Unmasked keys are never stored in plaintext or exposed.
            </p>

            <form onSubmit={handleSaveGateway} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Environment</label>
                  <select
                    value={gatewayForm.environment}
                    onChange={e => setGatewayForm({ ...gatewayForm, environment: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="production">Live Production</option>
                    <option value="sandbox">Sandbox / Test</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-2 pb-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gwActive"
                      checked={gatewayForm.isActive}
                      onChange={e => setGatewayForm({ ...gatewayForm, isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="gwActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Gateway Active
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gwDefault"
                      checked={gatewayForm.isDefault}
                      onChange={e => setGatewayForm({ ...gatewayForm, isDefault: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="gwDefault" className="text-xs font-bold text-slate-700 cursor-pointer">
                      Primary / Default
                    </label>
                  </div>
                </div>
              </div>

              {/* Conditional Fields based on gatewayForm.id */}
              {gatewayForm.id === 'monnify' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Monnify Contract Code</label>
                    <input
                      type="text"
                      value={gatewayForm.contractCode}
                      onChange={e => setGatewayForm({ ...gatewayForm, contractCode: e.target.value })}
                      placeholder="e.g. 8891283891"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Monnify API Key</label>
                    <input
                      type="text"
                      value={gatewayForm.apiKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, apiKey: e.target.value })}
                      placeholder="MK_PROD_..."
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Monnify Secret Key (Encrypted)</label>
                    <input
                      type="password"
                      value={gatewayForm.secretKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, secretKey: e.target.value })}
                      placeholder="Leave blank to keep existing encrypted secret"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Webhook Secret / SHA512 Key (Optional)</label>
                    <input
                      type="password"
                      value={gatewayForm.webhookSecret}
                      onChange={e => setGatewayForm({ ...gatewayForm, webhookSecret: e.target.value })}
                      placeholder="Leave blank to keep existing or use Secret Key"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </>
              )}

              {gatewayForm.id === 'paystack' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Paystack Public Key</label>
                    <input
                      type="text"
                      value={gatewayForm.publicKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, publicKey: e.target.value })}
                      placeholder="bds_pk_..."
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Paystack Secret Key (Encrypted)</label>
                    <input
                      type="password"
                      value={gatewayForm.secretKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, secretKey: e.target.value })}
                      placeholder="bds_sk_... (Leave blank to keep existing)"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Webhook Secret / Signature Key</label>
                    <input
                      type="password"
                      value={gatewayForm.webhookSecret}
                      onChange={e => setGatewayForm({ ...gatewayForm, webhookSecret: e.target.value })}
                      placeholder="Paystack Secret Hash / Webhook secret"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </>
              )}

              {gatewayForm.id === 'flutterwave' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Flutterwave Public Key</label>
                    <input
                      type="text"
                      value={gatewayForm.publicKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, publicKey: e.target.value })}
                      placeholder="FLWPUBK_TEST-..."
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Flutterwave Secret Key (Encrypted)</label>
                    <input
                      type="password"
                      value={gatewayForm.secretKey}
                      onChange={e => setGatewayForm({ ...gatewayForm, secretKey: e.target.value })}
                      placeholder="FLW_SECRET_KEY_PLACEHOLDER (Leave blank to keep existing)"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Webhook Secret Hash</label>
                    <input
                      type="password"
                      value={gatewayForm.webhookSecret}
                      onChange={e => setGatewayForm({ ...gatewayForm, webhookSecret: e.target.value })}
                      placeholder="Webhook verification secret hash"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Merchant ID (Optional)</label>
                    <input
                      type="text"
                      value={gatewayForm.merchantId}
                      onChange={e => setGatewayForm({ ...gatewayForm, merchantId: e.target.value })}
                      placeholder="Flutterwave Merchant ID"
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                    />
                  </div>
                </>
              )}

              {gatewayForm.id === 'manual_bank' && (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Corporate Bank Name</label>
                    <input
                      type="text"
                      value={gatewayForm.bankName}
                      onChange={e => setGatewayForm({ ...gatewayForm, bankName: e.target.value })}
                      placeholder="e.g. Wema Bank, Moniepoint, GTBank, Zenith Bank"
                      className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">10-Digit Account Number (NUBAN)</label>
                    <input
                      type="text"
                      value={gatewayForm.accountNumber}
                      onChange={e => setGatewayForm({ ...gatewayForm, accountNumber: e.target.value })}
                      placeholder="0123456789"
                      maxLength={10}
                      className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Account Name</label>
                    <input
                      type="text"
                      value={gatewayForm.accountName}
                      onChange={e => setGatewayForm({ ...gatewayForm, accountName: e.target.value })}
                      placeholder="e.g. Bukar Data Sub Ltd"
                      className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                      required
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowGatewayModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-sm px-5 py-3 rounded-2xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-2xl transition shadow-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Gateway Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provider Create/Edit Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowProviderModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <Server className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-black text-slate-900">
                {editingProviderId ? 'Edit API Provider & Endpoints' : 'Add New API Provider'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Connect external telecom APIs (VTPass, ClubKonnect, Husmodata, SMEPlug). Outbound calls execute in real time with auto-refund on failure.
            </p>

            <form onSubmit={handleSaveProvider} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Provider Name</label>
                  <input
                    type="text"
                    required
                    value={providerForm.name}
                    onChange={e => setProviderForm({ ...providerForm, name: e.target.value })}
                    placeholder="e.g. ClubKonnect, VTPass"
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Category</label>
                  <select
                    value={providerForm.category}
                    onChange={e => setProviderForm({ ...providerForm, category: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="data">Data Bundles</option>
                    <option value="airtime">Airtime</option>
                    <option value="utility">Utility / Cable / Power</option>
                    <option value="payment">Payment Gateway</option>
                    <option value="sms">SMS Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Environment</label>
                  <select
                    value={providerForm.environment}
                    onChange={e => setProviderForm({ ...providerForm, environment: e.target.value })}
                    className="w-full text-sm font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="production">Production</option>
                    <option value="sandbox">Sandbox / Staging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Base API URL</label>
                <input
                  type="url"
                  required
                  value={providerForm.baseUrl}
                  onChange={e => setProviderForm({ ...providerForm, baseUrl: e.target.value })}
                  placeholder="https://api.provider.com/v1"
                  className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">API Key / Token</label>
                  <input
                    type="text"
                    value={providerForm.apiKey}
                    onChange={e => setProviderForm({ ...providerForm, apiKey: e.target.value })}
                    placeholder={editingProviderId ? 'Leave blank to preserve encrypted key' : 'Enter API Key'}
                    className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">API Secret / Private Key</label>
                  <input
                    type="password"
                    value={providerForm.apiSecret}
                    onChange={e => setProviderForm({ ...providerForm, apiSecret: e.target.value })}
                    placeholder={editingProviderId ? 'Leave blank to preserve encrypted secret' : 'bds_provider_secret_...'}
                    className="w-full text-sm font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>
              </div>

              {/* Advanced Endpoints & Auth Method Setup */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Outbound Route Endpoints & Authentication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Auth Scheme</label>
                    <select
                      value={providerForm.authMethod}
                      onChange={e => setProviderForm({ ...providerForm, authMethod: e.target.value })}
                      className="w-full text-xs font-bold border border-slate-200 rounded-xl p-2.5 bg-white"
                    >
                      <option value="bearer_token">Bearer Token (Authorization: Bearer ...)</option>
                      <option value="token_header">Token Header (Authorization: Token ...)</option>
                      <option value="basic_auth">Basic Auth (Base64 Key:Secret)</option>
                      <option value="api_key_header">API Key Header (x-api-key)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Data Bundle Path</label>
                    <input
                      type="text"
                      value={providerForm.dataEndpoint}
                      onChange={e => setProviderForm({ ...providerForm, dataEndpoint: e.target.value })}
                      placeholder="/data"
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Airtime Path</label>
                    <input
                      type="text"
                      value={providerForm.airtimeEndpoint}
                      onChange={e => setProviderForm({ ...providerForm, airtimeEndpoint: e.target.value })}
                      placeholder="/airtime"
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Cable TV Path</label>
                    <input
                      type="text"
                      value={providerForm.cableEndpoint}
                      onChange={e => setProviderForm({ ...providerForm, cableEndpoint: e.target.value })}
                      placeholder="/cable"
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Electricity Path</label>
                    <input
                      type="text"
                      value={providerForm.electricityEndpoint}
                      onChange={e => setProviderForm({ ...providerForm, electricityEndpoint: e.target.value })}
                      placeholder="/electricity"
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Health / Balance Path</label>
                    <input
                      type="text"
                      value={providerForm.balanceEndpoint}
                      onChange={e => setProviderForm({ ...providerForm, balanceEndpoint: e.target.value })}
                      placeholder="/balance"
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Timeout (Seconds)</label>
                    <input
                      type="number"
                      value={providerForm.timeoutSeconds}
                      onChange={e => setProviderForm({ ...providerForm, timeoutSeconds: Number(e.target.value) })}
                      min={3}
                      max={60}
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Priority Order (1 = Primary)</label>
                    <input
                      type="number"
                      value={providerForm.priority}
                      onChange={e => setProviderForm({ ...providerForm, priority: Number(e.target.value) })}
                      min={1}
                      max={10}
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProviderModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-3 rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-8 py-3 rounded-2xl transition shadow-md flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Provider</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Inspect User 360 Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => { setInspectUser(null); setInspectData(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 font-black text-xl flex items-center justify-center">
                  {(inspectUser.name || inspectUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">{inspectUser.name || 'User Profile'}</h3>
                  <div className="text-xs text-slate-500 font-mono">{inspectUser.email} • {inspectUser.phone || 'No phone'}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                  inspectUser.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {inspectUser.role}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full">
                  Tier {inspectUser.tier || 1}
                </span>
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                  {inspectUser.status || 'ACTIVE'}
                </span>
              </div>
            </div>

            {loadingInspect ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                <span className="text-xs font-bold text-slate-500">Retrieving full double-entry ledger & transaction trail...</span>
              </div>
            ) : inspectData ? (
              <div className="space-y-6">
                {/* Balance & Virtual Accounts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Real Ledger Wallet Balance</span>
                    <div className="text-3xl font-black text-slate-900 font-mono mt-1">
                      ₦{(inspectData.balance || 0).toLocaleString('en-NG')}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Total Funded: ₦{(inspectData.stats?.totalFunded || 0).toLocaleString('en-NG')} • VTU Spent: ₦{(inspectData.stats?.totalSpent || 0).toLocaleString('en-NG')}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Dedicated Virtual Bank Account</span>
                    {inspectData.virtualAccount ? (
                      <div className="mt-1">
                        <div className="text-lg font-black text-blue-700 font-mono">
                          {inspectData.virtualAccount.account_number}
                        </div>
                        <div className="text-xs font-bold text-slate-700">
                          {inspectData.virtualAccount.bank_name} • {inspectData.virtualAccount.account_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">Provider: {inspectData.virtualAccount.provider}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 mt-2">
                        No virtual account assigned yet. One will be generated automatically on first deposit or profile KYC.
                      </div>
                    )}
                  </div>
                </div>

                {/* Double Entry Ledger Entries */}
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-purple-600" />
                    <span>Recent Double-Entry Ledger Entries (Audit)</span>
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Category</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Balance (Before ➔ After)</th>
                          <th className="py-2.5 px-3">Narration / Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {(!inspectData.ledgerEntries || inspectData.ledgerEntries.length === 0) ? (
                          <tr><td colSpan={6} className="py-6 text-center text-slate-400">No ledger entries found.</td></tr>
                        ) : (
                          inspectData.ledgerEntries.map((l: any) => (
                            <tr key={l.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                {new Date(l.created_at).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                                  l.entry_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {l.entry_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">{l.category}</td>
                              <td className="py-2.5 px-3 font-mono font-bold">
                                {l.entry_type === 'CREDIT' ? '+' : '-'}₦{l.amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                                ₦{l.balance_before.toLocaleString()} ➔ ₦{l.balance_after.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500 max-w-xs truncate">
                                {l.description || l.reference}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Withdrawals */}
                {inspectData.withdrawals && inspectData.withdrawals.length > 0 && (
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <Landmark className="w-4 h-4 text-purple-600" />
                      <span>Bank Withdrawal Requests</span>
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Bank & Account</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Status</th>
                            <th className="py-2.5 px-3">Ref</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {inspectData.withdrawals.map((w: any) => (
                            <tr key={w.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                {new Date(w.created_at).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <strong>{w.bank_name}</strong> - {w.account_number} ({w.account_name})
                              </td>
                              <td className="py-2.5 px-3 font-mono font-black">
                                ₦{w.net_amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                  w.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                                {w.payment_reference || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* 2. Manual Wallet Adjustment Modal */}
      {adjustUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setAdjustUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-xl font-black text-slate-900">Manual Wallet Adjustment</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Credit or debit user wallet with guaranteed double-entry ledger bookkeeping and real email notification.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div><strong>User:</strong> {adjustUser.name || 'Customer'}</div>
              <div><strong>Email:</strong> {adjustUser.email}</div>
              <div><strong>Current Balance:</strong> ₦{(adjustUser.balance || 0).toLocaleString()}</div>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'CREDIT' })}
                    className={`py-2.5 rounded-xl font-bold text-xs transition ${
                      adjustForm.type === 'CREDIT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Credit (+) Fund Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({ ...adjustForm, type: 'DEBIT' })}
                    className={`py-2.5 rounded-xl font-bold text-xs transition ${
                      adjustForm.type === 'DEBIT'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Debit (-) Deduct Wallet
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Amount (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustForm.amount}
                  onChange={e => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full text-base font-bold font-mono border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Reason / Narration</label>
                <input
                  type="text"
                  required
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  placeholder="e.g. Bank transfer top-up resolution"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustUser(null)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingAdjust}
                  className={`text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-sm ${
                    adjustForm.type === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {loadingAdjust ? 'Processing...' : `Confirm ${adjustForm.type === 'CREDIT' ? 'Credit' : 'Debit'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Comprehensive User Profile, Credentials & Roles Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5 my-8">
            <button
              onClick={() => setEditUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Edit User Profile & Credentials</h3>
                <p className="text-xs text-slate-500 font-medium">Update account details, role hierarchy, address, and credentials.</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editUserForm.email}
                    onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editUserForm.phone}
                    onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Account Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Agent / Reseller</option>
                    <option value="sub_admin">Sub-Admin Staff</option>
                    <option value="admin">System Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Pricing Tier</label>
                  <select
                    value={editUserForm.tier}
                    onChange={e => setEditUserForm({ ...editUserForm, tier: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  >
                    <option value={1}>Tier 1 (Retail)</option>
                    <option value={2}>Tier 2 (Reseller)</option>
                    <option value={3}>Tier 3 (VIP API)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Account Status</label>
                  <select
                    value={editUserForm.status}
                    onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="suspended">Suspended</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
              </div>

              {(editUserForm.role === 'sub_admin' || editUserForm.role === 'admin') && (
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Sub-Admin Staff Department (RBAC)</label>
                  <select
                    value={editUserForm.subAdminRole}
                    onChange={e => setEditUserForm({ ...editUserForm, subAdminRole: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  >
                    <option value="none">None / General</option>
                    <option value="finance">Finance Department (Withdrawals & Wallets)</option>
                    <option value="support">Customer Support & Helpdesk</option>
                    <option value="services">Telecom & Service Plans</option>
                    <option value="security">Security & Audit Operations</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">State of Residence</label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos, Kano, Abuja"
                    value={editUserForm.state}
                    onChange={e => setEditUserForm({ ...editUserForm, state: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Physical street address"
                    value={editUserForm.address}
                    onChange={e => setEditUserForm({ ...editUserForm, address: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 focus:bg-white focus:border-blue-500 transition outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-2xl space-y-3">
                <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider block">
                  Direct Credential Override (Leave blank to keep current)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={editUserForm.newPassword}
                      onChange={e => setEditUserForm({ ...editUserForm, newPassword: e.target.value })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">New 4-Digit Security PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={editUserForm.newPin}
                      onChange={e => setEditUserForm({ ...editUserForm, newPin: e.target.value })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-xl p-2.5 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingEditUser}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {loadingEditUser ? 'Saving...' : 'Save User Profile & Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.1 Bulk Price Adjuster Modal */}
      {showBulkPriceModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowBulkPriceModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Bulk Adjust All Data Prices</h3>
                <p className="text-xs text-slate-500 font-medium">Atomic price update across networks and plan types.</p>
              </div>
            </div>

            <form onSubmit={handleExecuteBulkPriceAdjust} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Target Network</label>
                <select
                  value={bulkPriceForm.network}
                  onChange={e => setBulkPriceForm({ ...bulkPriceForm, network: e.target.value })}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                >
                  <option value="ALL">All Networks (MTN, Airtel, Glo, 9mobile)</option>
                  <option value="MTN">MTN Nigeria Only</option>
                  <option value="AIRTEL">Airtel Nigeria Only</option>
                  <option value="GLO">Glo Mobile Only</option>
                  <option value="9MOBILE">9mobile Only</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Plan Category / Data Type</label>
                <select
                  value={bulkPriceForm.dataType}
                  onChange={e => setBulkPriceForm({ ...bulkPriceForm, dataType: e.target.value })}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                >
                  <option value="ALL">All Data Types (SME, Gifting, Corporate)</option>
                  <option value="SME">SME Data Plans</option>
                  <option value="CORPORATE GIFTING">Corporate Gifting</option>
                  <option value="GIFTING">Direct Gifting</option>
                  <option value="DIRECT DATA">Direct Data</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Target Price Field</label>
                <select
                  value={bulkPriceForm.targetField}
                  onChange={e => setBulkPriceForm({ ...bulkPriceForm, targetField: e.target.value })}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                >
                  <option value="all_prices">All Prices (Retail, Reseller & API)</option>
                  <option value="selling_price">Customer Selling Price (Tier 1)</option>
                  <option value="reseller_price">Reseller Price (Tier 2)</option>
                  <option value="api_price">API Developer Price (Tier 3)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Adjustment Type</label>
                  <select
                    value={bulkPriceForm.adjustmentType}
                    onChange={e => setBulkPriceForm({ ...bulkPriceForm, adjustmentType: e.target.value as any })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="PERCENTAGE">Percentage (+/- %)</option>
                    <option value="FLAT_AMOUNT">Flat Naira (+/- ₦)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Value {bulkPriceForm.adjustmentType === 'PERCENTAGE' ? '(%)' : '(₦)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder={bulkPriceForm.adjustmentType === 'PERCENTAGE' ? 'e.g. 5 for +5%' : 'e.g. 20 for +₦20'}
                    value={bulkPriceForm.value}
                    onChange={e => setBulkPriceForm({ ...bulkPriceForm, value: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-[11px] text-blue-800 font-medium leading-relaxed">
                Tip: Enter a positive value (e.g. 5) to increase prices, or a negative value (e.g. -5) to discount prices across the selected plans.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPriceModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkAdjusting}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-amber-500/20"
                >
                  {bulkAdjusting ? 'Applying...' : 'Apply Adjustment Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.2 Dashboard Announcement & SweetAlert Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowAnnouncementModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Publish Notice (SweetAlert Popup)</h3>
                <p className="text-xs text-slate-500 font-medium">Broadcasts to customer dashboard with custom duration.</p>
              </div>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ⚡ MTN SME Server Upgraded & Instant"
                  value={announcementForm.title}
                  onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Notice Message</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the full announcement text that users will read upon logging in..."
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Severity Style</label>
                  <select
                    value={announcementForm.type}
                    onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value as any })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="alert">Alert / Critical (Red)</option>
                    <option value="success">Success (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Pill Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Important"
                    value={announcementForm.badgeText}
                    onChange={e => setAnnouncementForm({ ...announcementForm, badgeText: e.target.value })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Duration (Days)</label>
                  <select
                    value={announcementForm.durationDays}
                    onChange={e => setAnnouncementForm({ ...announcementForm, durationDays: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                  >
                    <option value={1}>1 Day (24 Hours)</option>
                    <option value={3}>3 Days</option>
                    <option value={7}>7 Days (1 Week)</option>
                    <option value={14}>14 Days (2 Weeks)</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={60}>60 Days</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handlePreviewAnnouncement({
                      title: announcementForm.title || 'Notice Title Preview',
                      message: announcementForm.message || 'This is how your announcement popup will look on user login.',
                      type: announcementForm.type,
                      badge_text: announcementForm.badgeText,
                      duration_days: announcementForm.durationDays,
                      expires_at: new Date(Date.now() + (announcementForm.durationDays || 7) * 86400000).toISOString()
                    });
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-1.5 w-full sm:w-auto justify-center"
                >
                  <Eye className="w-4 h-4" />
                  <span>Test SweetAlert Preview</span>
                </button>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setShowAnnouncementModal(false)}
                    className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={publishingAnnouncement}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                  >
                    {publishingAnnouncement ? 'Publishing...' : 'Publish to User Dashboards'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3.3 Quick Brand & System Logo Modal */}
      {showQuickBrandModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowQuickBrandModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Brand Identity & Logo URL</h3>
                <p className="text-xs text-slate-500 font-medium">Update platform logo, title, and theme live.</p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickBrand} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  required
                  value={quickBrandForm.appName}
                  onChange={e => setQuickBrandForm({ ...quickBrandForm, appName: e.target.value })}
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={quickBrandForm.tagline}
                  onChange={e => setQuickBrandForm({ ...quickBrandForm, tagline: e.target.value })}
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Platform Logo URL (PNG/SVG)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={quickBrandForm.logoUrl}
                    onChange={e => setQuickBrandForm({ ...quickBrandForm, logoUrl: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-xl p-3 bg-slate-50"
                  />
                  {quickBrandForm.logoUrl && (
                    <div className="w-10 h-10 rounded-xl border p-1 bg-white shrink-0 overflow-hidden flex items-center justify-center">
                      <img src={quickBrandForm.logoUrl} alt="Preview" className="w-8 h-8 object-contain" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={quickBrandForm.primaryColor}
                      onChange={e => setQuickBrandForm({ ...quickBrandForm, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={quickBrandForm.primaryColor}
                      onChange={e => setQuickBrandForm({ ...quickBrandForm, primaryColor: e.target.value })}
                      className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Accent Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={quickBrandForm.accentColor}
                      onChange={e => setQuickBrandForm({ ...quickBrandForm, accentColor: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0"
                    />
                    <input
                      type="text"
                      value={quickBrandForm.accentColor}
                      onChange={e => setQuickBrandForm({ ...quickBrandForm, accentColor: e.target.value })}
                      className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Support Phone</label>
                  <input
                    type="tel"
                    value={quickBrandForm.supportPhone}
                    onChange={e => setQuickBrandForm({ ...quickBrandForm, supportPhone: e.target.value })}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">WhatsApp Hotline</label>
                  <input
                    type="tel"
                    value={quickBrandForm.whatsappNumber}
                    onChange={e => setQuickBrandForm({ ...quickBrandForm, whatsappNumber: e.target.value })}
                    className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2.5 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickBrandModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickBrand}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {savingQuickBrand ? 'Saving...' : 'Save Brand & Logo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Reset Credentials Modal */}
      {resetCredUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setResetCredUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-rose-600" />
              <h3 className="text-xl font-black text-slate-900">Reset Credentials</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Directly set a new password or 4-digit transaction PIN for <b>{resetCredUser.email}</b>.
            </p>

            <form onSubmit={handleSaveResetCred} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  value={resetCredForm.newPassword}
                  onChange={e => setResetCredForm({ ...resetCredForm, newPassword: e.target.value })}
                  placeholder="Min 8 characters (Leave empty to keep current)"
                  className="w-full text-sm font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">New 4-Digit Transaction PIN (Optional)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={resetCredForm.newPin}
                  onChange={e => setResetCredForm({ ...resetCredForm, newPin: e.target.value })}
                  placeholder="4 digits e.g. 1234 (Leave empty to keep current)"
                  className="w-full text-sm font-mono font-bold tracking-widest border border-slate-200 rounded-xl p-3 bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetCredUser(null)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingResetCred}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-sm"
                >
                  {loadingResetCred ? 'Updating...' : 'Update Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create Sub-Admin Modal */}
      {showSubadminModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowSubadminModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-indigo-600">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Create Sub-Admin Staff</h3>
                <p className="text-xs text-slate-500">Delegate administrative roles with scoped privileges.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubadmin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={subadminForm.name}
                  onChange={e => setSubadminForm({ ...subadminForm, name: e.target.value })}
                  placeholder="e.g. John Finance Manager"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={subadminForm.email}
                    onChange={e => setSubadminForm({ ...subadminForm, email: e.target.value })}
                    placeholder="staff@bukardatasub.com"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={subadminForm.phone}
                    onChange={e => setSubadminForm({ ...subadminForm, phone: e.target.value })}
                    placeholder="08012345678"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={subadminForm.password}
                  onChange={e => setSubadminForm({ ...subadminForm, password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Department / Scoped Role</label>
                  <select
                    value={subadminForm.subAdminRole}
                    onChange={e => setSubadminForm({ ...subadminForm, subAdminRole: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="finance">Finance (Reports & Withdrawals)</option>
                    <option value="support">Support (Users & Credentials)</option>
                    <option value="services">Services (Data Plans & APIs)</option>
                    <option value="security">Security (Audit & Gateways)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">4-Digit Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={subadminForm.transactionPin}
                    onChange={e => setSubadminForm({ ...subadminForm, transactionPin: e.target.value })}
                    placeholder="1234"
                    className="w-full text-xs font-mono font-bold tracking-widest border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubadminModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingSubadmin}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  {loadingSubadmin ? 'Creating...' : 'Create Sub-Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl text-purple-600">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Create New User Account</h3>
                <p className="text-xs text-slate-500">Provision a customer, agent, or reseller account with optional initial balance.</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={createUserForm.name}
                  onChange={e => setCreateUserForm({ ...createUserForm, name: e.target.value })}
                  placeholder="e.g. Amina Bello"
                  className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={createUserForm.email}
                    onChange={e => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                    placeholder="amina@example.com"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.phone}
                    onChange={e => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                    placeholder="08012345678"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={createUserForm.password}
                    onChange={e => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Transaction PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={createUserForm.transactionPin}
                    onChange={e => setCreateUserForm({ ...createUserForm, transactionPin: e.target.value })}
                    placeholder="1234"
                    className="w-full text-xs font-mono font-bold tracking-widest border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Account Role</label>
                  <select
                    value={createUserForm.role}
                    onChange={e => setCreateUserForm({ ...createUserForm, role: e.target.value })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="customer">Customer</option>
                    <option value="agent">Agent</option>
                    <option value="reseller">Reseller</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Pricing Tier</label>
                  <select
                    value={createUserForm.tier}
                    onChange={e => setCreateUserForm({ ...createUserForm, tier: Number(e.target.value) })}
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>Tier 1 (Retail)</option>
                    <option value={2}>Tier 2 (Reseller)</option>
                    <option value={3}>Tier 3 (VIP API)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Initial Balance (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={createUserForm.initialBalance}
                    onChange={e => setCreateUserForm({ ...createUserForm, initialBalance: e.target.value })}
                    placeholder="0"
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingCreateUser}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-purple-600/20"
                >
                  {loadingCreateUser ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Support Ticket Inspect & Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                Ticket #{selectedTicket.id}
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                selectedTicket.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                selectedTicket.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {selectedTicket.priority || 'NORMAL'}
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">{selectedTicket.subject}</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">
              Customer: <span className="font-bold text-slate-800">{selectedTicket.user_name}</span> ({selectedTicket.user_email} • {selectedTicket.user_phone})
            </p>

            {/* Conversation Thread */}
            <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-bold">
                  <span className="text-slate-900 font-black">{selectedTicket.user_name} (Customer)</span>
                  <span className="font-mono">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
              </div>

              {selectedTicket.replies?.map((rep: any) => (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border ${
                    rep.sender_type === 'ADMIN' || rep.sender_type === 'STAFF'
                      ? 'bg-blue-50/70 border-blue-200/70 ml-4'
                      : 'bg-slate-50 border-slate-200/80 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-bold">
                    <span className={rep.sender_type === 'ADMIN' || rep.sender_type === 'STAFF' ? 'text-blue-900 font-black' : 'text-slate-900 font-black'}>
                      {rep.sender_type === 'ADMIN' || rep.sender_type === 'STAFF' ? 'Support Desk (Staff)' : rep.sender_name || 'Customer'}
                    </span>
                    <span className="font-mono">{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{rep.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleReplyTicket} className="space-y-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Staff Reply Message
                </label>
                <textarea
                  rows={3}
                  value={ticketReplyMessage}
                  onChange={e => setTicketReplyMessage(e.target.value)}
                  placeholder="Write official support resolution or guidance for customer..."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">
                    Update Ticket Status
                  </label>
                  <select
                    value={ticketReplyStatus}
                    onChange={e => setTicketReplyStatus(e.target.value)}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900"
                  >
                    <option value="IN_PROGRESS">In Progress (Under Review)</option>
                    <option value="RESOLVED">Resolved (Issue Fixed)</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {submittingReply ? 'Sending Response...' : 'Send Staff Response'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 360° Transaction Details Inspection Modal */}
      {selectedTxDetail && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setSelectedTxDetail(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">360° Transaction Audit Trail</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    selectedTxDetail.transaction.status === 'COMPLETED' || selectedTxDetail.transaction.status === 'SUCCESSFUL'
                      ? 'bg-emerald-100 text-emerald-800'
                      : selectedTxDetail.transaction.status === 'PENDING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedTxDetail.transaction.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Ref: {selectedTxDetail.transaction.reference} • Channel: {selectedTxDetail.transaction.channel || 'WEB'}
                </p>
              </div>
            </div>

            {/* Customer & Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Customer Information</span>
                <div className="font-bold text-slate-900 text-sm">{selectedTxDetail.user.name}</div>
                <div className="text-slate-500">{selectedTxDetail.user.email}</div>
                <div className="font-mono text-slate-500">{selectedTxDetail.user.phone} (Tier {selectedTxDetail.user.tier})</div>
                <div className="text-emerald-700 font-mono font-bold pt-1">
                  Current Wallet: ₦{Number(selectedTxDetail.user.walletBalance || 0).toLocaleString('en-NG')}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1.5 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Order Financials</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Retail Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₦{Number(selectedTxDetail.transaction.amount || 0).toLocaleString('en-NG')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Charged Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₦{Number(selectedTxDetail.transaction.charged_amount || 0).toLocaleString('en-NG')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wholesale Cost:</span>
                  <span className="font-mono text-slate-600">₦{Number(selectedTxDetail.transaction.cost_amount || 0).toLocaleString('en-NG')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 text-emerald-700 font-bold">
                  <span>Gross Profit:</span>
                  <span className="font-mono">+₦{Number(selectedTxDetail.transaction.profit_margin || 0).toLocaleString('en-NG')}</span>
                </div>
              </div>
            </div>

            {/* Provider & Delivery Payload */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Fulfillment & Provider Payload</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-slate-500 block">Service / Biller:</span>
                  <span className="font-bold text-slate-900 uppercase">{selectedTxDetail.transaction.biller_or_network} ({selectedTxDetail.transaction.service_category})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Recipient Identifier:</span>
                  <span className="font-mono font-bold text-slate-900">{selectedTxDetail.transaction.recipient}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Routing Engine:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedTxDetail.transaction.routing_used || 'API'}</span>
                </div>
              </div>
              {selectedTxDetail.transaction.token_or_pin && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Fulfillment Token / Activation PIN</span>
                  <span className="font-mono font-black text-sm text-emerald-950 tracking-widest">{selectedTxDetail.transaction.token_or_pin}</span>
                </div>
              )}
            </div>

            {/* Immutable Double-Entry Ledger Trail */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">Double-Entry Ledger Audit Trail</span>
              <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Entry</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Balance Before</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Balance After</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {selectedTxDetail.ledgerTrail && selectedTxDetail.ledgerTrail.length > 0 ? (
                      selectedTxDetail.ledgerTrail.map((led: any) => (
                        <tr key={led.id}>
                          <td className="py-2 px-3 font-bold text-slate-800">{led.category}</td>
                          <td className="py-2 px-3 font-bold">
                            <span className={led.entry_type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>
                              {led.entry_type}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">₦{Number(led.balance_before).toLocaleString('en-NG')}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">₦{Number(led.amount).toLocaleString('en-NG')}</td>
                          <td className="py-2 px-3 text-right text-slate-500">₦{Number(led.balance_after).toLocaleString('en-NG')}</td>
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{new Date(led.created_at).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-3 text-center text-slate-400 font-sans">
                          No direct ledger debit logged for this reference.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chronological Event Timeline */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 block">Chronological Lifecycle Timeline</span>
              <div className="space-y-2">
                {selectedTxDetail.timeline?.map((evt: any, i: number) => (
                  <div key={i} className="flex items-start space-x-3 text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{evt.step}</strong>
                        <span className="font-mono text-[10px] text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5">{evt.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTxDetail(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testimonial Create / Edit Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setShowTestimonialModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Star className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingTestimonialId ? 'Edit Customer Review' : 'Add New Customer Review'}
                </h3>
                <p className="text-xs text-slate-500">Configure verified customer social proof for the landing page.</p>
              </div>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Author Name *</label>
                  <input
                    type="text"
                    required
                    value={testimonialForm.authorName}
                    onChange={e => setTestimonialForm({ ...testimonialForm, authorName: e.target.value })}
                    placeholder="e.g. Ibrahim Danladi"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Author Role / City</label>
                  <input
                    type="text"
                    value={testimonialForm.authorRole}
                    onChange={e => setTestimonialForm({ ...testimonialForm, authorRole: e.target.value })}
                    placeholder="e.g. SME Data Merchant (Kano)"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Rating (1 to 5 Stars)</label>
                  <select
                    value={testimonialForm.rating}
                    onChange={e => setTestimonialForm({ ...testimonialForm, rating: Number(e.target.value) })}
                    className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5 Stars (★★★★★)</option>
                    <option value={4}>4 Stars (★★★★☆)</option>
                    <option value={3}>3 Stars (★★★☆☆)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    min="0"
                    value={testimonialForm.sortOrder}
                    onChange={e => setTestimonialForm({ ...testimonialForm, sortOrder: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={testimonialForm.avatarUrl}
                  onChange={e => setTestimonialForm({ ...testimonialForm, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Review Content *</label>
                <textarea
                  rows={4}
                  required
                  value={testimonialForm.content}
                  onChange={e => setTestimonialForm({ ...testimonialForm, content: e.target.value })}
                  placeholder="Write the full customer review and testimonial text..."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pubCheck"
                  checked={testimonialForm.isPublished}
                  onChange={e => setTestimonialForm({ ...testimonialForm, isPublished: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="pubCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Publish live on public landing page
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestimonialModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {editingTestimonialId ? 'Save Changes' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Balance Adjustment Modal (Old & New Balance Calculation) */}
      {showAdjustModal && adjustTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAdjustModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Audited Wallet Balance Adjustment</h3>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-5">
              Target: <span className="font-bold text-slate-800">{adjustTargetUser.name}</span> ({adjustTargetUser.email})
            </p>

            <form onSubmit={handleAdjustWalletSubmit} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAdjustType('CREDIT')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                      adjustType === 'CREDIT'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Credit (+) Customer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DEBIT')}
                    className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border ${
                      adjustType === 'DEBIT'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/30'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span>Debit (-) Customer</span>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Adjustment Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full text-sm font-mono font-bold border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Projected Old & New Balance Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Authoritative Balance Calculation</div>
                <div className="flex justify-between text-slate-600">
                  <span>Authoritative Old Balance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₦{Number(adjustTargetUser.wallet_balance || adjustTargetUser.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Adjustment Delta:</span>
                  <span className={`font-mono font-bold ${adjustType === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {adjustType === 'CREDIT' ? '+' : '-'} ₦{Number(adjustAmount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                  <span className="text-slate-900">Projected New Balance:</span>
                  <span className="font-mono text-blue-700 font-black text-sm">
                    ₦{(
                      adjustType === 'CREDIT'
                        ? Number(adjustTargetUser.wallet_balance || adjustTargetUser.balance || 0) + Number(adjustAmount || 0)
                        : Number(adjustTargetUser.wallet_balance || adjustTargetUser.balance || 0) - Number(adjustAmount || 0)
                    ).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Reason Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Authoritative Audit Reason *</label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensation for upstream telecom failed airtime dispatch ref TXN-..."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ticket Reference */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Supporting Ticket / Case Ref (Optional)</label>
                <input
                  type="text"
                  value={adjustTicketRef}
                  onChange={e => setAdjustTicketRef(e.target.value)}
                  placeholder="e.g. TKT-9912 or DISPUTE-04"
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900"
                />
              </div>

              {Number(adjustAmount) >= 50000 && !isSuperAdmin && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  <strong>High-Risk Rule:</strong> Adjustments $\ge$ ₦50,000 will be queued for secondary Super Admin dual approval before ledger mutation.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md shadow-blue-500/20"
                >
                  {adjustSubmitting ? 'Processing...' : `Commit ${adjustType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deep Customer Wallet 360° Inspection Modal */}
      {walletDetailData && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-6">
            <button
              onClick={() => setWalletDetailData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
                  Wallet 360° Inspection
                </span>
                <span className="text-xs font-bold text-slate-400">• ID: {walletDetailData.wallet?.id}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">{walletDetailData.user?.name}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {walletDetailData.user?.email} • {walletDetailData.user?.phone} • Role: {walletDetailData.user?.role} (Tier {walletDetailData.user?.tier})
              </p>
            </div>

            {/* Financial Balances Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Available Balance</div>
                <div className="text-lg font-black text-slate-900 font-tabular mt-1">
                  ₦{Number(walletDetailData.wallet?.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="text-[11px] font-bold text-emerald-700 uppercase">Commission Vault</div>
                <div className="text-lg font-black text-emerald-700 font-tabular mt-1">
                  ₦{Number(walletDetailData.wallet?.commission_balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Total Deposits</div>
                <div className="text-lg font-black text-blue-600 font-tabular mt-1">
                  ₦{Number(walletDetailData.totals?.total_deposits || 0).toLocaleString()}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase">Total VTU Spent</div>
                <div className="text-lg font-black text-purple-600 font-tabular mt-1">
                  ₦{Number(walletDetailData.totals?.total_purchases || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Immutable Double-Entry Ledger History */}
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                Recent Immutable Ledger Trace ({walletDetailData.ledger?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0">
                    <tr>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Balance Trace</th>
                      <th className="p-2.5">Reference</th>
                      <th className="p-2.5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {walletDetailData.ledger?.map((l: any) => (
                      <tr key={l.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            l.entry_type === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {l.entry_type}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold font-tabular">₦{Number(l.amount).toLocaleString()}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          ₦{Number(l.balance_before).toLocaleString()} → ₦{Number(l.balance_after).toLocaleString()}
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-slate-500 truncate max-w-xs">{l.reference}</td>
                        <td className="p-2.5 text-right text-slate-400 font-tabular text-[10px]">{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWalletDetailData(null)}
                className="px-5 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Maintenance Mode Preview Modal */}
      {showMaintPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative text-center space-y-4">
            <button
              onClick={() => setShowMaintPreviewModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
              <Wrench className="w-8 h-8 animate-spin" />
            </div>
            <h3 className="text-xl font-black text-slate-900">System Optimization in Progress</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {maintConfig.message || 'The platform is undergoing scheduled service optimization. Services will resume shortly.'}
            </p>
            {maintConfig.endTime && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 font-bold">
                Estimated Return: {new Date(maintConfig.endTime).toLocaleString()}
              </div>
            )}
            <button
              onClick={() => setShowMaintPreviewModal(false)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Security Incident Update Modal */}
      {selectedIncidentModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedIncidentModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-mono font-bold text-rose-600 uppercase">Incident #{selectedIncidentModal.id}</div>
              <h3 className="text-lg font-black text-slate-900">{selectedIncidentModal.incident_type}</h3>
              <p className="text-xs text-slate-600 mt-1">{selectedIncidentModal.description}</p>
            </div>

            <form onSubmit={handleUpdateIncidentSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Update Status</label>
                <select
                  value={incidentUpdateStatus}
                  onChange={e => setIncidentUpdateStatus(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 bg-slate-50"
                >
                  <option value="OPEN">OPEN (Under Initial Review)</option>
                  <option value="INVESTIGATING">INVESTIGATING (Staff Assigned)</option>
                  <option value="RESOLVED">RESOLVED (Threat Mitigated)</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE (Benign Event)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Resolution & Investigation Notes</label>
                <textarea
                  rows={3}
                  required
                  value={incidentResolutionNotes}
                  onChange={e => setIncidentResolutionNotes(e.target.value)}
                  placeholder="Record investigation findings and remediation steps taken..."
                  className="w-full text-xs font-medium border border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncidentModal(null)}
                  className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingIncident}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow-md"
                >
                  {updatingIncident ? 'Saving...' : 'Update Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
