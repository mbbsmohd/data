import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('user_token');
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('user_token', token);
}

export async function clearAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('user_token');
}

export async function mobileRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const MobileAPI = {
  // 1. Authentication
  login: (credentials: { identifier: string; password: string; twoFactorOtp?: string }) =>
    mobileRequest<any>('/auth/customer/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload: { name: string; email: string; phone: string; password: string; referralCode?: string }) =>
    mobileRequest<any>('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (email: string) =>
    mobileRequest<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload: { email: string; otp: string; newPassword: string }) =>
    mobileRequest<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => mobileRequest<any>('/auth/me'),
  logout: () => mobileRequest<any>('/auth/logout', { method: 'POST' }),

  // 2. Wallet & Balances
  getWallet: () => mobileRequest<any>('/wallet'),
  getLedger: (limit = 20, offset = 0) => mobileRequest<any>(`/wallet/ledger?limit=${limit}&offset=${offset}`),
  requestWithdrawal: (payload: { amount: number; bankName: string; bankCode: string; accountNumber: string; accountName: string; transactionPin: string }) =>
    mobileRequest<any>('/wallet/withdrawal/request', { method: 'POST', body: JSON.stringify(payload) }),
  initiateFunding: (amount: number, gateway = 'monnify') =>
    mobileRequest<any>('/payment/initiate', { method: 'POST', body: JSON.stringify({ amount, gateway }) }),
  verifyPayment: (reference: string) =>
    mobileRequest<any>(`/payment/verify/${reference}`),

  // 3. VTU & Digital Services
  getPlans: (network?: string, dataType?: string) => {
    const params = new URLSearchParams();
    if (network) params.append('network', network);
    if (dataType) params.append('dataType', dataType);
    return mobileRequest<any>(`/vtu/plans?${params.toString()}`);
  },
  purchaseVTU: (payload: {
    category: string;
    billerOrNetwork: string;
    planCode?: string;
    recipient: string;
    amount: number;
    transactionPin: string;
  }) => mobileRequest<any>('/vtu/purchase', { method: 'POST', body: JSON.stringify(payload) }),
  verifyCustomer: (category: string, billerOrNetwork: string, customerId: string) =>
    mobileRequest<any>('/vtu/verify-customer', {
      method: 'POST',
      body: JSON.stringify({ category, billerOrNetwork, customerId })
    }),
  getRecentActivity: (limit = 20) =>
    mobileRequest<any>(`/vtu/recent-activity?limit=${limit}`),

  // 4. User Profile & Security
  updateProfile: (payload: any) =>
    mobileRequest<any>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  changePassword: (payload: any) =>
    mobileRequest<any>('/profile/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  setPin: (pin: string) =>
    mobileRequest<any>('/profile/pin', { method: 'POST', body: JSON.stringify({ pin }) }),
  requestKYCUpdate: (payload: any) =>
    mobileRequest<any>('/profile/request-kyc-update', { method: 'POST', body: JSON.stringify(payload) }),
  getReferralSummary: () =>
    mobileRequest<any>('/referrals/summary'),
  transferReferralCommission: (amount: number) =>
    mobileRequest<any>('/referrals/transfer-to-wallet', { method: 'POST', body: JSON.stringify({ amount }) }),

  // 5. System Settings
  getSettings: () => mobileRequest<any>('/settings'),

  // 6. Remote Config & Telemetry
  getMobileConfig: () => mobileRequest<any>('/settings/mobile-config'),
  sendTelemetry: (payload: { platform: string; appVersion: string; deviceModel?: string; osVersion?: string; eventType: string; details?: any }) =>
    mobileRequest<any>('/settings/mobile-telemetry', { method: 'POST', body: JSON.stringify(payload) })
};
