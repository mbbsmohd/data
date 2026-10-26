import { playSuccessSound } from '../utils/sound';
import { globalLoading } from '../utils/loadingManager';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('bds_token') || localStorage.getItem('abk_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('bds_token', token);
  localStorage.setItem('abk_token', token);
}

export function clearStoredToken(): void {
  localStorage.removeItem('bds_token');
  localStorage.removeItem('bds_user');
  localStorage.removeItem('abk_token');
  localStorage.removeItem('abk_user');
}

export function getStoredAdminToken(): string | null {
  return localStorage.getItem('bds_admin_token') || localStorage.getItem('bds_token') || localStorage.getItem('abk_admin_token') || localStorage.getItem('abk_token');
}

export function setStoredAdminToken(token: string): void {
  localStorage.setItem('bds_admin_token', token);
  localStorage.setItem('abk_admin_token', token);
  localStorage.setItem('bds_token', token);
  localStorage.setItem('abk_token', token);
}

export function clearStoredAdminToken(): void {
  localStorage.removeItem('bds_admin_token');
  localStorage.removeItem('bds_admin_user');
  localStorage.removeItem('abk_admin_token');
  localStorage.removeItem('abk_admin_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  globalLoading.start();
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } finally {
    globalLoading.stop();
  }
}

export const api = {
  // Generic HTTP methods
  get: (endpoint: string, options?: RequestInit) => request<any>(endpoint, { method: 'GET', ...options }),
  post: (endpoint: string, body?: any, options?: RequestInit) =>
    request<any>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
  patch: (endpoint: string, body?: any, options?: RequestInit) =>
    request<any>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, ...options }),
  put: (endpoint: string, body?: any, options?: RequestInit) =>
    request<any>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: (endpoint: string, options?: RequestInit) => request<any>(endpoint, { method: 'DELETE', ...options }),

  // Staff Task Operations
  getStaffTasks: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/admin/tasks${qs}`);
  },
  createStaffTask: (data: any) => request<any>('/admin/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateStaffTaskStatus: (id: string, data: any) => request<any>(`/admin/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  getStaffMembers: () => request<any>('/admin/tasks/staff/list'),
  getTaskComments: (id: string) => request<any>(`/admin/tasks/${id}/comments`),
  addTaskComment: (id: string, comment: string) => request<any>(`/admin/tasks/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }) }),

  // Auth
  login: (credentials: { identifier: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  customerLogin: (credentials: { identifier: string; password: string }) =>
    request<any>('/auth/customer/login', { method: 'POST', body: JSON.stringify(credentials) }),
  adminLogin: (credentials: { identifier: string; password: string }) =>
    request<any>('/auth/admin/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: any) =>
    request<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => request<any>('/auth/me'),
  verifyPin: (pin: string) => request<any>('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  changePin: (payload: { oldPin?: string; newPin: string }) =>
    request<any>('/auth/change-pin', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (payload: { oldPassword: string; newPassword: string }) =>
    request<any>('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  upgradeTier: (targetTier: number) =>
    request<any>('/auth/upgrade-tier', { method: 'POST', body: JSON.stringify({ targetTier }) }),
  getSessions: () => request<any>('/auth/sessions'),
  toggleBiometrics: (enabled: boolean) =>
    request<any>('/auth/biometrics/toggle', { method: 'POST', body: JSON.stringify({ enabled }) }),
  verifyOtp: (payload: { identifier: string; code: string; purpose?: string }) =>
    request<any>('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) }),
  sendOtp: (payload: { identifier: string; purpose?: string }) =>
    request<any>('/auth/send-otp', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload: { identifier: string }) =>
    request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload: { identifier: string; code: string; newPassword: string }) =>
    request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  toggle2FA: (enabled: boolean) =>
    request<any>('/auth/toggle-2fa', { method: 'POST', body: JSON.stringify({ enabled }) }),

  // System Dynamic Settings, Branding & Announcements
  getSettings: () => request<any>('/settings'),
  updateSettings: (payload: any) =>
    request<any>('/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  updateSmtp: (payload: any) =>
    request<any>('/settings/smtp', { method: 'POST', body: JSON.stringify(payload) }),
  testSmtp: (targetEmail: string, customConfig?: any) =>
    request<any>('/settings/test-smtp', { method: 'POST', body: JSON.stringify({ targetEmail, customConfig }) }),
  getAdminPlans: () => request<any>('/settings/plans'),
  createAdminPlan: (payload: any) =>
    request<any>('/settings/plans', { method: 'POST', body: JSON.stringify(payload) }),
  updateAdminPlan: (id: string, payload: any) =>
    request<any>(`/settings/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAdminPlan: (id: string) =>
    request<any>(`/settings/plans/${id}`, { method: 'DELETE' }),
  updateServiceRouting: (payload: { planId: string; routingType: 'API' | 'SIM_HOSTING'; simSlotId?: string; ussdTemplate?: string }) =>
    request<any>('/settings/service-routing', { method: 'POST', body: JSON.stringify(payload) }),
  getBeneficiaries: () => request<any>('/settings/beneficiaries'),
  addBeneficiary: (payload: any) =>
    request<any>('/settings/beneficiaries', { method: 'POST', body: JSON.stringify(payload) }),

  // Wallet
  getWallet: () => request<any>('/wallet'),
  getLedgerHistory: (limit = 50) => request<any>(`/wallet/history?limit=${limit}`),
  transferCommission: (amount: number) =>
    request<any>('/wallet/transfer-commission', { method: 'POST', body: JSON.stringify({ amount }) }),

  // Payments & Automated Gateways
  getVirtualAccount: () => request<any>('/payment/virtual-account'),
  initiateFunding: (amount: number, gateway = 'paystack') =>
    request<any>('/payment/initiate', { method: 'POST', body: JSON.stringify({ amount, gateway }) }),
  getPaymentGateways: () => request<any>('/payment/gateways'),
  updatePaymentGateway: (id: string, payload: any) =>
    request<any>(`/payment/gateways/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // VTU & Bills
  getServiceCatalogue: () => request<any>('/vtu/catalogue'),
  getPlans: (network?: string, dataType?: string) => {
    const params = new URLSearchParams();
    if (network) params.append('network', network);
    if (dataType) params.append('dataType', dataType);
    return request<any>(`/vtu/plans?${params.toString()}`);
  },
  verifyCustomer: (category: string, billerOrNetwork: string, customerId: string) =>
    request<any>('/vtu/verify-customer', { method: 'POST', body: JSON.stringify({ category, billerOrNetwork, customerId }) }),
  detectNetwork: (phone: string) =>
    request<any>(`/vtu/detect-network?phone=${phone}`),
  generateRechargeCards: (payload: { network: string; denomination: number; quantity: number; businessName: string }) =>
    request<any>('/vtu/generate-recharge-cards', { method: 'POST', body: JSON.stringify(payload) }),
  sendBulkSMS: (payload: { senderId: string; recipients: string[]; message: string }) =>
    request<any>('/vtu/send-bulk-sms', { method: 'POST', body: JSON.stringify(payload) }),
  purchaseVTU: async (payload: { category: string; billerOrNetwork: string; planCode?: string; recipient: string; amount: number }) => {
    const res = await request<any>('/vtu/purchase', { method: 'POST', body: JSON.stringify(payload) });
    if (res && res.success) {
      try { playSuccessSound(); } catch {}
    }
    return res;
  },
  getRecentActivity: (limit = 20) => request<any>(`/vtu/recent-activity?limit=${limit}`),
  getTransactions: (filters: { category?: string; status?: string; search?: string; limit?: number } = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', String(filters.limit));
    return request<any>(`/vtu/transactions?${params.toString()}`);
  },
  getTransactionReceipt: (reference: string) =>
    request<any>(`/vtu/receipt/${reference}`),

  // Airtime to Cash
  submitAirtimeToCash: (payload: { network: string; senderPhone: string; airtimeAmount: number }) =>
    request<any>('/airtime-to-cash/submit', { method: 'POST', body: JSON.stringify(payload) }),
  getMyAirtimeToCashOrders: () => request<any>('/airtime-to-cash/my-orders'),
  getAllAirtimeToCashOrders: () => request<any>('/airtime-to-cash/all-orders'),
  approveAirtimeToCash: (id: string, notes?: string) =>
    request<any>(`/airtime-to-cash/approve/${id}`, { method: 'POST', body: JSON.stringify({ notes }) }),

  // SafeBox Savings
  getSafeBoxes: () => request<any>('/savings'),
  depositSafeBox: (payload: { targetTitle: string; amount: number; lockPeriodDays?: number }) =>
    request<any>('/savings/deposit', { method: 'POST', body: JSON.stringify(payload) }),
  withdrawSafeBox: (id: string) =>
    request<any>(`/savings/withdraw/${id}`, { method: 'POST' }),

  // KYC Verification Tasks (Matching Screenshot 3)
  getKYCTasks: (status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return request<any>(`/kyc/tasks?${params.toString()}`);
  },
  submitKYCTask: (payload: any) =>
    request<any>('/kyc/submit', { method: 'POST', body: JSON.stringify(payload) }),
  reviewKYCTask: (id: string, decision: 'COMPLETED' | 'REJECTED' | 'CANCELLED', reason?: string) =>
    request<any>(`/kyc/review/${id}`, { method: 'POST', body: JSON.stringify({ decision, reason }) }),

  // SIM Hosting & Telecom
  getHostedSims: () => request<any>('/sim-hosting'),
  executeUSSD: (simId: string, ussdCode: string) =>
    request<any>('/sim-hosting/ussd', { method: 'POST', body: JSON.stringify({ simId, ussdCode }) }),
  upsertHostedSim: (payload: any) =>
    request<any>('/sim-hosting/upsert', { method: 'POST', body: JSON.stringify(payload) }),

  // Providers & API Management
  getProviders: () => request<any>('/providers'),
  upsertProvider: (payload: any) =>
    request<any>('/providers/upsert', { method: 'POST', body: JSON.stringify(payload) }),
  deleteProvider: (id: string) =>
    request<any>(`/providers/${id}`, { method: 'DELETE' }),
  testProviderConnection: (id: string) =>
    request<any>(`/providers/test-connection/${id}`, { method: 'POST' }),

  // Notifications
  getNotifications: (limit = 30) => request<any>(`/notifications?limit=${limit}`),
  markNotificationRead: (id: string) => request<any>(`/notifications/mark-read/${id}`, { method: 'POST' }),
  markAllNotificationsRead: () => request<any>('/notifications/mark-all-read', { method: 'POST' }),
  getNotificationTemplates: () => request<any>('/notifications/templates'),
  updateNotificationTemplate: (id: string, payload: any) =>
    request<any>(`/notifications/templates/${id}`, { method: 'POST', body: JSON.stringify(payload) }),

  // Withdrawals (Customer & Admin)
  requestWithdrawal: (payload: { amount: number; bankName: string; accountNumber: string; accountName: string; pin: string; narration?: string }) =>
    request<any>('/withdrawals/request', { method: 'POST', body: JSON.stringify(payload) }),
  getMyWithdrawals: () => request<any>('/withdrawals/my-requests'),
  getAdminWithdrawals: (status?: string) =>
    request<any>(`/withdrawals/admin/all${status ? '?status=' + encodeURIComponent(status) : ''}`),
  approveWithdrawal: (id: string, payload: { reference?: string; notes?: string }) =>
    request<any>(`/withdrawals/admin/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
  rejectWithdrawal: (id: string, payload: { reason: string }) =>
    request<any>(`/withdrawals/admin/${id}/reject`, { method: 'POST', body: JSON.stringify(payload) }),

  // Admin & Security
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminPermissions: () => request<any>('/admin/my-permissions'),
  getAdminUsers: () => request<any>('/admin/users'),
  getAdminUserDetails: (id: string) => request<any>(`/admin/users/${id}`),
  updateAdminUser: (id: string, payload: any) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  resetUserCredentials: (id: string, payload: { newPassword?: string; newPin?: string }) =>
    request<any>(`/admin/users/${id}/reset-credentials`, { method: 'POST', body: JSON.stringify(payload) }),
  updateUserStatus: (id: string, payload: any) =>
    request<any>(`/admin/users/${id}/update-status`, { method: 'POST', body: JSON.stringify(payload) }),
  adjustWallet: (payload: {
    userId: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    reason: string;
    ticketReference?: string;
    idempotencyKey?: string;
  }) => request<any>('/admin/wallets/adjustment', { method: 'POST', body: JSON.stringify(payload) }),
  getAuditLogs: () => request<any>('/admin/audit-logs'),
  getBackups: () => request<any>('/admin/backups'),
  createBackup: () => request<any>('/admin/backups/create', { method: 'POST' }),
  testRestoreBackup: (id: string) => request<any>(`/admin/backups/test-restore/${id}`, { method: 'POST' }),

  // Sub-Admins Management
  getSubadmins: () => request<any>('/admin/subadmins'),
  createSubadmin: (payload: any) =>
    request<any>('/admin/subadmins', { method: 'POST', body: JSON.stringify(payload) }),
  updateSubadminStatus: (id: string, payload: any) =>
    request<any>(`/admin/subadmins/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  createAdminUser: (payload: any) =>
    request<any>('/admin/users', { method: 'POST', body: JSON.stringify(payload) }),

  // Financial Reports & Analytics Summary with Year and Date Filtering
  getFinancialReports: (params?: { period?: string; year?: string; startDate?: string; endDate?: string } | string) => {
    const query = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) query.append('period', params);
    } else if (params) {
      if (params.period) query.append('period', params.period);
      if (params.year) query.append('year', params.year);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }
    const qs = query.toString();
    return request<any>(`/admin/reports/summary${qs ? '?' + qs : ''}`);
  },
  getReportExportUrl: (params?: { period?: string; year?: string; startDate?: string; endDate?: string } | string) => {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (typeof params === 'string') {
      if (params) query.append('period', params);
    } else if (params) {
      if (params.period) query.append('period', params.period);
      if (params.year) query.append('year', params.year);
      if (params.startDate) query.append('startDate', params.startDate);
      if (params.endDate) query.append('endDate', params.endDate);
    }
    if (token) query.append('token', token);
    const qs = query.toString();
    return `${window.location.origin}/api/admin/reports/export${qs ? '?' + qs : ''}`;
  },

  // User Profile & Anti-Fraud Locked Field Request
  updateProfile: (payload: { address?: string; state?: string; dateOfBirth?: string; avatarUrl?: string; bio?: string; whatsappNumber?: string; name?: string; email?: string; phone?: string }) =>
    request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  requestProfileChangeTicket: (payload: { requestedChanges: string; reason: string }) =>
    request<any>('/auth/profile/request-update-ticket', { method: 'POST', body: JSON.stringify(payload) }),

  // Referrals Program
  getReferralSummary: () => request<any>('/referrals/summary'),
  transferReferralCommission: (payload: { amount: number }) =>
    request<any>('/referrals/transfer-commission', { method: 'POST', body: JSON.stringify(payload) }),

  // Reseller Business Keys
  getResellerKeys: () => request<any>('/reseller/keys'),
  generateResellerKey: (payload: { name: string; ipAllowlist?: string }) =>
    request<any>('/reseller/keys/generate', { method: 'POST', body: JSON.stringify(payload) }),

  // Support Tickets
  getSupportTickets: () => request<any>('/notifications/tickets'),
  createSupportTicket: (payload: { subject: string; category: string; priority?: string; message: string }) =>
    request<any>('/notifications/tickets', { method: 'POST', body: JSON.stringify(payload) }),
  getSupportTicketDetails: (id: string) => request<any>(`/notifications/tickets/${id}`),
  replySupportTicket: (id: string, message: string) =>
    request<any>(`/notifications/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),

  // Admin Support Tickets, System Diagnostics & App Versioning
  getAdminSupportTickets: (status?: string) =>
    request<any>(`/admin/support/tickets${status ? '?status=' + status : ''}`),
  replyAdminSupportTicket: (id: string, payload: { message: string; status?: string }) =>
    request<any>(`/admin/support/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify(payload) }),
  getSystemHealth: () => request<any>('/admin/system-health'),
  getAppVersionInfo: () => request<any>('/admin/app-version'),

  // Admin Financial Transaction Explorer
  getAdminTransactions: (filters: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    serviceCategory?: string;
    channel?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const query = new URLSearchParams();
    if (filters.page) query.append('page', String(filters.page));
    if (filters.limit) query.append('limit', String(filters.limit));
    if (filters.status) query.append('status', filters.status);
    if (filters.search) query.append('search', filters.search);
    if (filters.serviceCategory) query.append('serviceCategory', filters.serviceCategory);
    if (filters.channel) query.append('channel', filters.channel);
    if (filters.startDate) query.append('startDate', filters.startDate);
    if (filters.endDate) query.append('endDate', filters.endDate);
    const qs = query.toString();
    return request<any>(`/admin/transactions${qs ? '?' + qs : ''}`);
  },
  getTransactionDetails: (ref: string) =>
    request<any>(`/admin/transactions/${encodeURIComponent(ref)}/details`),

  // Testimonials & Reviews
  getAdminTestimonials: () => request<any>('/admin/testimonials'),
  createTestimonial: (payload: {
    authorName: string;
    authorRole?: string;
    rating?: number;
    content: string;
    avatarUrl?: string;
    isPublished?: boolean;
    sortOrder?: number;
  }) => request<any>('/admin/testimonials', { method: 'POST', body: JSON.stringify(payload) }),
  updateTestimonial: (id: string, payload: any) =>
    request<any>(`/admin/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  togglePublishTestimonial: (id: string) =>
    request<any>(`/admin/testimonials/${id}/publish`, { method: 'PATCH' }),
  deleteTestimonial: (id: string) =>
    request<any>(`/admin/testimonials/${id}`, { method: 'DELETE' }),
  getPublicTestimonials: () =>
    request<any>('/settings/testimonials'),

  // Website Content Management (CMS)
  getCmsSections: () => request<any>('/settings/cms'),
  getAdminCms: () => request<any>('/settings/admin/cms'),
  getAdminCmsRevisions: (sectionId: string) => request<any>(`/settings/admin/cms/${sectionId}/revisions`),
  updateAdminCms: (sectionId: string, payload: { title?: string; content: any; isDraft?: boolean; notes?: string }) =>
    request<any>(`/settings/admin/cms/${sectionId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  rollbackAdminCms: (sectionId: string, payload: { revisionId?: string; version?: number }) =>
    request<any>(`/settings/admin/cms/${sectionId}/rollback`, { method: 'POST', body: JSON.stringify(payload) }),

  // Maintenance Management & Scoped Control
  getMaintenanceConfig: () => request<any>('/settings/admin/maintenance'),
  updateMaintenanceConfig: (payload: {
    active: boolean;
    scope?: string;
    message?: string;
    startTime?: string;
    endTime?: string;
    bypassIps?: string;
  }) => request<any>('/settings/admin/maintenance', { method: 'POST', body: JSON.stringify(payload) }),

  // Mobile App Remote Config & Telemetry
  getMobileConfig: () => request<any>('/settings/mobile-config'),
  getAdminMobileConfig: () => request<any>('/settings/admin/mobile-config'),
  updateAdminMobileConfig: (payload: any) =>
    request<any>('/settings/admin/mobile-config', { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminMobileTelemetry: () => request<any>('/settings/admin/mobile-telemetry'),

  // Customer Wallets Management & Audited Adjustments
  getAdminWallets: (filters: { search?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (filters.search) q.append('search', filters.search);
    if (filters.status) q.append('status', filters.status);
    const qs = q.toString();
    return request<any>(`/admin/wallets${qs ? '?' + qs : ''}`);
  },
  getAdminWalletDetail: (userId: string) =>
    request<any>(`/admin/wallets/${userId}/detail`),
  getPendingAdjustments: () =>
    request<any>('/admin/wallets/adjustments/pending'),
  approveAdjustment: (id: string) =>
    request<any>(`/admin/wallets/adjustments/${id}/approve`, { method: 'POST' }),
  rejectAdjustment: (id: string, reason?: string) =>
    request<any>(`/admin/wallets/adjustments/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Security Center & Incidents
  getSecurityOverview: () => request<any>('/admin/security/overview'),
  getSecurityIncidents: (filters: { status?: string; severity?: string } = {}) => {
    const q = new URLSearchParams();
    if (filters.status) q.append('status', filters.status);
    if (filters.severity) q.append('severity', filters.severity);
    const qs = q.toString();
    return request<any>(`/admin/security/incidents${qs ? '?' + qs : ''}`);
  },
  updateSecurityIncident: (id: string, payload: { status?: string; assignedTo?: string; resolutionNotes?: string }) =>
    request<any>(`/admin/security/incidents/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Dashboard Announcements & SweetAlert Broadcast Popups
  getActiveAnnouncements: () => request<any>('/announcements/active'),
  getAdminAnnouncements: () => request<any>('/announcements/admin'),
  createAnnouncement: (payload: { title: string; message: string; type?: string; badgeText?: string; durationDays?: number; targetAudience?: string }) =>
    request<any>('/announcements/admin', { method: 'POST', body: JSON.stringify(payload) }),
  updateAnnouncement: (id: string, payload: any) =>
    request<any>(`/announcements/admin/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteAnnouncement: (id: string) =>
    request<any>(`/announcements/admin/${id}`, { method: 'DELETE' }),

  // Bulk Data Plan Pricing
  bulkAdjustPlans: (payload: { network?: string; dataType?: string; targetField?: string; adjustmentType: 'PERCENTAGE' | 'FLAT_AMOUNT'; value: number }) =>
    request<any>('/settings/plans/bulk-adjust', { method: 'POST', body: JSON.stringify(payload) }),

  // Full User Information & Credential Updates
  adminUpdateUser: (id: string, payload: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    subAdminRole?: string;
    tier?: number;
    status?: string;
    address?: string;
    state?: string;
    newPassword?: string;
    newPin?: string;
  }) => request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Real-Time Financial Command Center
  getFinancialCommandMetrics: (params: { period?: string; startDate?: string; endDate?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.period) q.append('period', params.period);
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    const qs = q.toString();
    return request<any>(`/admin/financial-command/metrics${qs ? '?' + qs : ''}`);
  },
  getProfitLossAnalytics: (params: { period?: string; startDate?: string; endDate?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.period) q.append('period', params.period);
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    const qs = q.toString();
    return request<any>(`/admin/financial-command/profit-loss${qs ? '?' + qs : ''}`);
  },
  getOperatingExpenses: () => request<any>('/admin/financial-command/operating-expenses'),
  addOperatingExpense: (payload: { title: string; category: string; amount: number; notes?: string }) =>
    request<any>('/admin/financial-command/operating-expenses', { method: 'POST', body: JSON.stringify(payload) }),
  deleteOperatingExpense: (id: string) =>
    request<any>(`/admin/financial-command/operating-expenses/${id}`, { method: 'DELETE' }),

  // 5-Point Financial Reconciliation Engine
  runReconciliationAudit: () => request<any>('/admin/reconciliation/audit-run'),
  getReconciliationHistory: () => request<any>('/admin/reconciliation/history'),
  resolveReconciliationDiscrepancy: (id: string, notes: string) =>
    request<any>(`/admin/reconciliation/resolve/${id}`, { method: 'POST', body: JSON.stringify({ notes }) }),

  // Customer Support Live Chat (Admin & Customer)
  getSupportConversations: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<any>(`/support/chat/conversations${q}`);
  },
  createSupportConversation: (payload: { subject?: string; initialMessage?: string }) =>
    request<any>('/support/chat/conversations', { method: 'POST', body: JSON.stringify(payload) }),
  getSupportConversationMessages: (conversationId: string) =>
    request<any>(`/support/chat/conversations/${conversationId}/messages`),
  sendSupportChatMessage: (conversationId: string, payload: { message: string; isInternalNote?: boolean; attachmentUrl?: string }) =>
    request<any>(`/support/chat/conversations/${conversationId}/messages`, { method: 'POST', body: JSON.stringify(payload) }),
  updateSupportConversation: (conversationId: string, payload: { status?: string; assignedTo?: string; internalNotes?: string }) =>
    request<any>(`/support/chat/conversations/${conversationId}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  // Security, Session Revocation, Account Lock & Login History
  getUserRegistrationStats: () => request<any>('/admin/users/registration-stats'),
  lockUserAccount: (userId: string, reason?: string) =>
    request<any>(`/admin/users/${userId}/lock`, { method: 'POST', body: JSON.stringify({ reason }) }),
  unlockUserAccount: (userId: string) =>
    request<any>(`/admin/users/${userId}/unlock`, { method: 'POST' }),
  revokeUserSessions: (userId: string) =>
    request<any>(`/admin/users/${userId}/revoke-sessions`, { method: 'POST' }),
  getLoginHistory: (filters: { search?: string; status?: string; limit?: number; offset?: number } = {}) => {
    const q = new URLSearchParams();
    if (filters.search) q.append('search', filters.search);
    if (filters.status) q.append('status', filters.status);
    if (filters.limit) q.append('limit', String(filters.limit));
    if (filters.offset) q.append('offset', String(filters.offset));
    const qs = q.toString();
    return request<any>(`/admin/security/login-history${qs ? '?' + qs : ''}`);
  },

  // 100+ Surity Validation & Authentication Engine
  getSurityRules: () => request<any>('/admin/security/surity-rules'),
  runSurityAudit: () => request<any>('/admin/security/surity-audit', { method: 'POST' }),
};
