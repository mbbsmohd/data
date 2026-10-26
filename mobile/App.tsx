import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { ServicesScreen } from './src/screens/ServicesScreen';
import { WalletScreen } from './src/screens/WalletScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { MobileAPI, getAuthToken } from './src/services/api';
import { theme } from './src/theme';
import { Platform } from 'react-native';

const APP_VERSION = '1.0.0';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'Dashboard' | 'Services' | 'Wallet' | 'Profile'>('Dashboard');
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [remoteConfig, setRemoteConfig] = useState<any>(null);

  useEffect(() => {
    checkActiveSession();
    fetchRemoteConfig();
  }, []);

  const fetchRemoteConfig = async () => {
    try {
      const res = await MobileAPI.getMobileConfig();
      if (res?.success && res.config) {
        setRemoteConfig(res.config);
      }
      // Send background telemetry
      MobileAPI.sendTelemetry({
        platform: Platform.OS,
        appVersion: APP_VERSION,
        eventType: 'APP_LAUNCH',
        details: { timestamp: new Date().toISOString() }
      }).catch(() => {});
    } catch {
      // Graceful offline fallback
    }
  };

  const checkActiveSession = async () => {
    try {
      setCheckingAuth(true);
      const token = await getAuthToken();
      if (token) {
        const meRes = await MobileAPI.getMe();
        if (meRes.success && meRes.user) {
          setUser(meRes.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setCheckingAuth(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Connecting to Bukar Data Sub...</Text>
      </View>
    );
  }

  // If not authenticated, render the real AuthScreen
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <AuthScreen onAuthenticated={(authedUser) => setUser(authedUser)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Screen Router */}
      <View style={styles.content}>
        {currentTab === 'Dashboard' && <HomeScreen onNavigateTab={(tab) => setCurrentTab(tab)} />}
        {currentTab === 'Services' && <ServicesScreen onNavigateToWallet={() => setCurrentTab('Wallet')} />}
        {currentTab === 'Wallet' && <WalletScreen />}
        {currentTab === 'Profile' && <ProfileScreen onLogout={() => setUser(null)} />}
      </View>

      {/* Modern Bottom Navigation Bar matching Web Design Tokens */}
      <View style={styles.tabBar}>
        {[
          { key: 'Dashboard', label: 'Home', icon: '⌂' },
          { key: 'Services', label: 'Services', icon: '⚡' },
          { key: 'Wallet', label: 'Wallet', icon: '💳' },
          { key: 'Profile', label: 'Account', icon: '👤' },
        ].map((tab) => {
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setCurrentTab(tab.key as any)}
              style={styles.tabItem}
            >
              <Text style={[styles.tabIcon, { color: isActive ? theme.colors.primary : theme.colors.textMuted }]}>
                {tab.icon}
              </Text>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    paddingBottom: 4,
    ...theme.shadows.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
