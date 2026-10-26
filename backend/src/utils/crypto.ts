import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config/index.js';

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(CONFIG.ENCRYPTION_KEY).digest();

/**
 * Encrypt sensitive string data (e.g. API secrets, webhook keys) using AES-256-GCM
 */
export function encryptField(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt field encrypted with AES-256-GCM
 */
export function decryptField(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) return '';
    const [ivB64, tagB64, cipherB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const ciphertext = Buffer.from(cipherB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    console.error('Decryption failure:', err);
    return '';
  }
}

/**
 * Safely masks secret keys for admin UI / API responses
 * Example: 'bds_live_981273918237' -> 'bds_...237'
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';
  if (secret.length <= 8) return '****';
  const prefix = secret.slice(0, 4);
  const suffix = secret.slice(-4);
  return `${prefix}${'*'.repeat(Math.min(secret.length - 8, 12))}${suffix}`;
}

/**
 * Masks phone numbers as seen on the user's mobile UI (e.g. 913****675)
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return phone;
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    // 09131797675 -> 913****675
    return `${clean.slice(1, 4)}****${clean.slice(-3)}`;
  }
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

/**
 * Hash password with bcrypt (salt rounds = 10)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function hashPasswordSync(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Compare password with hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate cryptographically secure numeric OTP (e.g. 6 digits)
 */
export function generateNumericOTP(length = 6): string {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
}

/**
 * Generate unique transaction reference (e.g. ABK-20261022-XXXXXX)
 */
export function generateReference(prefix = 'TXN'): string {
  const dateStr = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}
