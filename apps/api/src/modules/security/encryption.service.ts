import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const secret = this.config.get<string>('ENCRYPTION_KEY');
    if (!secret) {
      throw new Error('CRITICAL: ENCRYPTION_KEY environment variable is not defined.');
    }

    this.key = Buffer.from(secret, 'utf8');

    if (this.key.length !== 32) {
      throw new Error(
        `CRITICAL: ENCRYPTION_KEY must be exactly 32 bytes. Current length: ${this.key.length}`
      );
    }
  }

  /**
   * Encrypts a string and returns a prefixed format 'enc:<iv>:<tag>:<encrypted_data>'
   * Empty strings are encrypted to ensure authentication.
   */
  encrypt(text: string | null | undefined): string | null | undefined {
    if (text === null || text === undefined) return text;

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      // We process the input as utf8 and output as hex
      const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

      const tag = cipher.getAuthTag();

      return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    } catch (error: any) {
      this.logger.error(`Encryption failed: ${error.message}`);
      throw new Error('Encryption operation failed');
    }
  }

  /**
   * Decrypts a string formatted as 'enc:<iv>:<tag>:<content>'
   * Returns null if decryption fails or format is invalid.
   * Authentication tag is verified during final().
   */
  decrypt(encryptedText: string | null | undefined): string | null | undefined {
    if (!encryptedText) return encryptedText;

    if (!encryptedText.startsWith('enc:')) {
      return encryptedText;
    }

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 4) {
        this.logger.warn('Invalid encryption format detected during decryption');
        return null;
      }

      const iv = Buffer.from(parts[1], 'hex');
      const tag = Buffer.from(parts[2], 'hex');
      const encryptedData = Buffer.from(parts[3], 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);

      // Process as buffers to avoid encoding issues before verification
      const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error: any) {
      this.logger.error(`Decryption failed: ${error.message}`);
      // Return null on failure as per audit recommendation for safe fallback
      return null;
    }
  }

  /**
   * Utility to check if a field is encrypted
   */
  isEncrypted(text: string | null | undefined): boolean {
    return !!text && text.startsWith('enc:');
  }
}
