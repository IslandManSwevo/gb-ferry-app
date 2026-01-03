import * as crypto from 'crypto';

/**
 * Field-level encryption utilities for sensitive data
 * (passport numbers, identity documents)
 * 
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a string value using AES-256-GCM
 * @param value - The plaintext value to encrypt
 * @param key - 32-byte encryption key (from environment)
 * @returns Base64-encoded encrypted value (IV + ciphertext + authTag)
 */
export function encryptField(value: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  // Ensure key is 32 bytes
  const keyBuffer = Buffer.from(encryptionKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  // Encrypt
  let encrypted = cipher.update(value, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get auth tag
  const authTag = cipher.getAuthTag();
  
  // Combine IV + encrypted + authTag
  const combined = Buffer.concat([
    iv,
    Buffer.from(encrypted, 'base64'),
    authTag,
  ]);
  
  return combined.toString('base64');
}

/**
 * Decrypts a value encrypted with encryptField
 * @param encryptedValue - Base64-encoded encrypted value
 * @param key - 32-byte encryption key (from environment)
 * @returns Decrypted plaintext value
 */
export function decryptField(encryptedValue: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  
  if (!encryptionKey) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }

  const keyBuffer = Buffer.from(encryptionKey, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }

  // Decode combined value
  const combined = Buffer.from(encryptedValue, 'base64');
  
  // Extract IV, encrypted data, and auth tag
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
  const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString('utf8');
}

/**
 * Masks a sensitive field for display (e.g., "***1234")
 * @param value - The value to mask
 * @param visibleChars - Number of characters to show at the end
 * @returns Masked value
 */
export function maskField(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars) {
    return '****';
  }
  
  const visible = value.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(value.length - visibleChars, 8));
  
  return masked + visible;
}

/**
 * Generates a new encryption key
 * @returns 32-byte key as hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hashes a value for comparison (e.g., checking duplicates)
 * @param value - Value to hash
 * @returns SHA-256 hash
 */
export function hashField(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
