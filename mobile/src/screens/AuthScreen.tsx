import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { MobileAPI, setAuthToken } from '../services/api';
import { theme } from '../theme';

export const AuthScreen: React.FC<{ onAuthenticated: (user: any) => void }> = ({ onAuthenticated }) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  // Login form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorOtp, setTwoFactorOtp] = useState('');

  // Register form state
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Missing Fields', 'Please enter your email/phone and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await MobileAPI.login({
        identifier: identifier.trim(),
        password,
        twoFactorOtp: requires2FA ? twoFactorOtp.trim() : undefined
      });

      if (res.requires2FA) {
        setRequires2FA(true);
        Alert.alert('2FA Verification', res.message || 'Enter the 6-digit OTP code sent to your email.');
        return;
      }

      if (res.success && res.token) {
        await setAuthToken(res.token);
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      Alert.alert('Sign In Failed', err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !regEmail || !regPhone || !regPassword) {
      Alert.alert('Missing Fields', 'Please fill in all required registration fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await MobileAPI.register({
        name: name.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        referralCode: referralCode.trim() || undefined
      });

      if (res.success && res.token) {
        await setAuthToken(res.token);
        Alert.alert('Welcome!', 'Your account has been created successfully.');
        onAuthenticated(res.user);
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendForgotPassword = async () => {
    if (!forgotEmail) {
      Alert.alert('Email Required', 'Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await MobileAPI.forgotPassword(forgotEmail.trim());
      if (res.success) {
        setOtpSent(true);
        Alert.alert('OTP Dispatched', 'A 6-digit recovery code has been sent to your email.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send recovery OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetOtp || !newPassword) {
      Alert.alert('Missing Fields', 'Please enter the 6-digit OTP and your new password.');
      return;
    }

    try {
      setLoading(true);
      const res = await MobileAPI.resetPassword({
        email: forgotEmail.trim(),
        otp: resetOtp.trim(),
        newPassword
      });

      if (res.success) {
        Alert.alert('Password Updated', 'Your password was reset successfully. You can now log in.');
        setTab('login');
        setOtpSent(false);
      }
    } catch (err: any) {
      Alert.alert('Reset Failed', err.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.brandTitle}>Moniecrm Telecom Suite</Text>
          <Text style={styles.brandSubtitle}>Automated High-Speed Telecom & Digital Services Engine</Text>
        </View>

        {/* Tab Selector */}
        {tab !== 'forgot' && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
              onPress={() => setTab('login')}
            >
              <Text style={[styles.tabButtonText, tab === 'login' && styles.tabButtonTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
              onPress={() => setTab('register')}
            >
              <Text style={[styles.tabButtonText, tab === 'register' && styles.tabButtonTextActive]}>
                Create Account
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign in to your account</Text>
            <Text style={styles.formDesc}>Access your wallet, data bundles, and VTU services.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address or Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. agent@example.com or 08012345678"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={identifier}
                onChangeText={setIdentifier}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter account password"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>

            {requires2FA && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.primary }]}>
                  Two-Factor (2FA) 6-Digit OTP Code
                </Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.colors.primary, fontWeight: 'bold', letterSpacing: 4 }]}
                  placeholder="123456"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  maxLength={6}
                  value={twoFactorOtp}
                  onChangeText={setTwoFactorOtp}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => { setTab('forgot'); setOtpSent(false); }}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {requires2FA ? 'Verify 2FA & Sign In' : 'Sign In to Dashboard'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create a free account</Text>
            <Text style={styles.formDesc}>Instant wallet, wholesale data rates, and reseller commissions.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Legal Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Mohammed Adamu"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={regEmail}
                onChangeText={setRegEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="08012345678"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="phone-pad"
                value={regPhone}
                onChangeText={setRegPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                value={regPassword}
                onChangeText={setRegPassword}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. BDS-71F2C8"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="characters"
                value={referralCode}
                onChangeText={setReferralCode}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Free Account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Forgot Password Form */}
        {tab === 'forgot' && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Recover Account Access</Text>
            <Text style={styles.formDesc}>
              {otpSent
                ? 'Enter the 6-digit verification code sent to your email and your new password.'
                : 'Enter your registered email address to receive a fast 6-digit recovery OTP.'}
            </Text>

            {!otpSent ? (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor={theme.colors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={forgotEmail}
                    onChangeText={setForgotEmail}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleSendForgotPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send 6-Digit OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>6-Digit OTP Code</Text>
                  <TextInput
                    style={[styles.input, { letterSpacing: 4, fontWeight: 'bold' }]}
                    placeholder="123456"
                    placeholderTextColor={theme.colors.textMuted}
                    keyboardType="numeric"
                    maxLength={6}
                    value={resetOtp}
                    onChangeText={setResetOtp}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new strong password"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.buttonDisabled]}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Reset Password & Sign In</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => { setTab('login'); setOtpSent(false); }}
            >
              <Text style={styles.backToLoginText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl + 10,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  logoText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.display,
    fontWeight: theme.typography.weights.black,
  },
  brandTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.text,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: theme.borderRadius.lg,
    padding: 3,
    marginBottom: theme.spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.sm,
  },
  tabButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
  },
  formCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  formTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.text,
  },
  formDesc: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.bold,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.bold,
  },
  backToLoginButton: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
  },
  backToLoginText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.bold,
  },
});
