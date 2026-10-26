/**
 * ==============================================================================
 * BUKAR DATA SUB MOBILE — TRANSACTION PROCESSING MODAL
 * ==============================================================================
 * Reusable animated circular processing & status feedback component for React Native.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Clipboard
} from 'react-native';
import { theme } from '../theme';

export type MobileProcessingStatus = 'IDLE' | 'PROCESSING' | 'CONFIRMING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';

export interface MobileProcessingModalProps {
  visible: boolean;
  status: MobileProcessingStatus;
  title: string;
  description: string;
  reference?: string;
  amount?: number;
  errorMessage?: string;
  onSuccess?: () => void;
  onRetry?: () => void;
  onClose: () => void;
  timeoutSeconds?: number;
}

export const ProcessingModal: React.FC<MobileProcessingModalProps> = ({
  visible,
  status,
  title,
  description,
  reference,
  amount,
  errorMessage,
  onSuccess,
  onRetry,
  onClose,
  timeoutSeconds = 30
}) => {
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer: any = null;
    if (visible && (status === 'PROCESSING' || status === 'CONFIRMING')) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, status]);

  if (!visible || status === 'IDLE') return null;

  const isTimedOut = status === 'TIMEOUT' || (elapsed >= timeoutSeconds && (status === 'PROCESSING' || status === 'CONFIRMING'));

  const handleCopy = () => {
    if (!reference) return;
    Clipboard.setString(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        if (status === 'SUCCESS' || status === 'FAILED' || isTimedOut) {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Top Status Icon */}
          <View style={styles.iconContainer}>
            {status === 'SUCCESS' ? (
              <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Text style={{ fontSize: 36 }}>✅</Text>
              </View>
            ) : status === 'FAILED' ? (
              <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={{ fontSize: 36 }}>❌</Text>
              </View>
            ) : isTimedOut ? (
              <View style={[styles.iconCircle, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={{ fontSize: 36 }}>⏳</Text>
              </View>
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isTimedOut
              ? 'Awaiting Confirmation'
              : status === 'SUCCESS'
              ? 'Transaction Successful'
              : status === 'FAILED'
              ? 'Transaction Failed'
              : title}
          </Text>

          {/* Amount if available */}
          {amount !== undefined && amount > 0 && (
            <Text style={styles.amountText}>
              ₦{amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          )}

          {/* Description */}
          <Text style={styles.description}>
            {isTimedOut
              ? 'We dispatched your transaction to the telecom provider. Please check your transaction history before retrying to prevent duplicate spending.'
              : status === 'FAILED'
              ? errorMessage || description || 'The transaction could not be completed. Your wallet balance has been preserved.'
              : description}
          </Text>

          {/* Reference Pill */}
          {reference && (
            <TouchableOpacity style={styles.refBox} onPress={handleCopy} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={styles.refLabel}>TRANSACTION REFERENCE</Text>
                <Text style={styles.refValue} numberOfLines={1}>{reference}</Text>
              </View>
              <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {status === 'SUCCESS' ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onSuccess || onClose}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
            ) : status === 'FAILED' ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {onRetry && (
                  <TouchableOpacity
                    style={[styles.primaryButton, { flex: 1 }]}
                    onPress={onRetry}
                  >
                    <Text style={styles.primaryButtonText}>Try Again</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.secondaryButton, { flex: 1 }]}
                  onPress={onClose}
                >
                  <Text style={styles.secondaryButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            ) : isTimedOut ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onClose}
              >
                <Text style={styles.primaryButtonText}>Check Transaction History</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.secureNotice}>
                🔒 Secured by Bukar Data Sub Authoritative Ledger
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.card,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...theme.shadows.md
  },
  iconContainer: {
    marginVertical: 12
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: 8
  },
  amountText: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.black,
    color: theme.colors.text,
    marginTop: 6
  },
  description: {
    fontSize: theme.typography.sizes.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 8,
    paddingHorizontal: 8
  },
  refBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    padding: 12,
    marginTop: 16
  },
  refLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted
  },
  refValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Courier',
    marginTop: 2
  },
  copyText: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.primary,
    marginLeft: 10
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.black
  },
  secondaryButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.sizes.base,
    fontWeight: theme.typography.weights.bold
  },
  secureNotice: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: 8
  }
});
