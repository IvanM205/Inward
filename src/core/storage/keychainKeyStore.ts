/**
 * Production KeyStore: the SQLCipher key lives in the iOS Keychain / Android
 * Keystore via react-native-keychain, device-only, never synced (NFR-P2).
 */
import * as Keychain from 'react-native-keychain';
import { KeyStore } from './ports';

const SERVICE = 'inward.db.key';

function generateKeyHex(): string {
  // 32 random bytes → 64 hex chars. Math.random is not acceptable for key
  // material; use the platform CSPRNG exposed on globalThis.crypto (Hermes).
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export const keychainKeyStore: KeyStore = {
  async getOrCreateKey(): Promise<string> {
    const existing = await Keychain.getGenericPassword({ service: SERVICE });
    if (existing) return existing.password;

    const key = generateKeyHex();
    await Keychain.setGenericPassword('inward', key, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    return key;
  },

  async deleteKey(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};
