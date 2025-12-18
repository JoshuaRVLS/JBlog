export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedMessage {
  encryptedContent: string;
  iv: string;
  tag: string;
  keyId?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 128;
  private static readonly ECDH_CURVE = "P-256";

  static async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "ECDH",
        namedCurve: this.ECDH_CURVE,
      },
      true,
      ["deriveKey", "deriveBits"]
    );

    const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    // Web Crypto API may export P-256 public key as:
    // - 65 bytes: already uncompressed format (0x04 + X(32) + Y(32))
    // - 64 bytes: X(32) + Y(32) without prefix
    // Normalize to 65 bytes with 0x04 prefix for compatibility with Node.js crypto.
    const publicKeyArray = new Uint8Array(publicKeyBuffer);
    let normalizedPublicKey: Uint8Array;

    if (publicKeyArray.length === 65) {
      // Already has prefix; just use as-is
      normalizedPublicKey = publicKeyArray;
    } else if (publicKeyArray.length === 64) {
      // Add 0x04 prefix
      normalizedPublicKey = new Uint8Array(65);
      normalizedPublicKey[0] = 0x04; // Uncompressed point indicator
      normalizedPublicKey.set(publicKeyArray, 1);
    } else {
      throw new Error(`Unexpected public key length: ${publicKeyArray.length} bytes (expected 64 or 65)`);
    }

    return {
      // Pass Uint8Array directly to avoid ArrayBufferLike typing issues
      publicKey: this.arrayBufferToBase64(normalizedPublicKey),
      privateKey: this.arrayBufferToBase64(privateKeyBuffer),
    };
  }

  static async deriveSharedSecret(
    privateKey: string,
    publicKey: string
  ): Promise<CryptoKey> {
    const privateKeyCrypto = await this.importPrivateKey(privateKey);
    const publicKeyCrypto = await this.importPublicKey(publicKey);

    return crypto.subtle.deriveKey(
      {
        name: "ECDH",
        public: publicKeyCrypto,
      },
      privateKeyCrypto,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      false,
      ["encrypt", "decrypt"]
    );
  }

  static async encrypt(content: string, key: CryptoKey): Promise<EncryptedMessage> {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
        tagLength: this.TAG_LENGTH,
      },
      key,
      data
    );

    const encryptedArray = new Uint8Array(encrypted);
    const tag = encryptedArray.slice(-this.TAG_LENGTH / 8);
    const ciphertext = encryptedArray.slice(0, -this.TAG_LENGTH / 8);

    return {
      encryptedContent: this.arrayBufferToBase64(ciphertext),
      iv: this.arrayBufferToBase64(iv),
      tag: this.arrayBufferToBase64(tag),
    };
  }

  static async decrypt(encrypted: EncryptedMessage, key: CryptoKey): Promise<string> {
    const iv = this.base64ToArrayBuffer(encrypted.iv);
    const tag = this.base64ToArrayBuffer(encrypted.tag);
    const ciphertext = this.base64ToArrayBuffer(encrypted.encryptedContent);

    const encryptedData = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    encryptedData.set(new Uint8Array(ciphertext), 0);
    encryptedData.set(new Uint8Array(tag), ciphertext.byteLength);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
        tagLength: this.TAG_LENGTH,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  static async encryptForUser(
    content: string,
    senderPrivateKey: string,
    receiverPublicKey: string
  ): Promise<EncryptedMessage> {
    const sharedSecret = await this.deriveSharedSecret(senderPrivateKey, receiverPublicKey);
    return this.encrypt(content, sharedSecret);
  }

  static async decryptFromUser(
    encrypted: EncryptedMessage,
    receiverPrivateKey: string,
    senderPublicKey: string
  ): Promise<string> {
    const sharedSecret = await this.deriveSharedSecret(receiverPrivateKey, senderPublicKey);
    return this.decrypt(encrypted, sharedSecret);
  }

  static async encryptForGroup(
    content: string,
    groupKey: CryptoKey
  ): Promise<EncryptedMessage> {
    return this.encrypt(content, groupKey);
  }

  static async decryptFromGroup(
    encrypted: EncryptedMessage,
    groupKey: CryptoKey
  ): Promise<string> {
    return this.decrypt(encrypted, groupKey);
  }

  static async generateGroupKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async exportGroupKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey("raw", key);
    return this.arrayBufferToBase64(exported);
  }

  static async importGroupKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyData);
    return crypto.subtle.importKey(
      "raw",
      keyBuffer,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  static async encryptGroupKey(
    groupKey: CryptoKey,
    userPublicKey: string,
    userPrivateKey: string
  ): Promise<string> {
    try {
      // Validate key formats
      if (!userPublicKey || !userPrivateKey) {
        throw new Error("Public key atau private key tidak valid");
      }

      // Import keys to validate format
      const privateKeyCrypto = await this.importPrivateKey(userPrivateKey);
      const publicKeyCrypto = await this.importPublicKey(userPublicKey);

      // Derive shared secret using ECDH
      const sharedSecret = await crypto.subtle.deriveKey(
        {
          name: "ECDH",
          public: publicKeyCrypto,
        },
        privateKeyCrypto,
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false,
        ["encrypt", "decrypt"]
      );

      const groupKeyData = await this.exportGroupKey(groupKey);
      const encrypted = await this.encrypt(groupKeyData, sharedSecret);
      return JSON.stringify(encrypted);
    } catch (error: any) {
      console.error("Error in encryptGroupKey:", error);
      throw new Error(`Gagal mengenkripsi group key: ${error.message}`);
    }
  }

  static async decryptGroupKey(
    encryptedGroupKey: string,
    userPublicKey: string,
    userPrivateKey: string
  ): Promise<CryptoKey> {
    const encrypted = JSON.parse(encryptedGroupKey) as EncryptedMessage;
    const sharedSecret = await this.deriveSharedSecret(userPrivateKey, userPublicKey);
    const decrypted = await this.decrypt(encrypted, sharedSecret);
    return this.importGroupKey(decrypted);
  }

  private static async importPrivateKey(keyData: string): Promise<CryptoKey> {
    try {
      if (!keyData || typeof keyData !== 'string') {
        throw new Error("Private key data tidak valid");
      }

      const keyBuffer = this.base64ToArrayBuffer(keyData);
      const keyLength = keyBuffer.byteLength;
      
      if (keyLength === 0) {
        throw new Error("Private key buffer kosong");
      }

      // Log key length for debugging
      console.log(`🔑 Importing private key, length: ${keyLength} bytes (${keyData.length} base64 chars)`);

      // PKCS8 format for ECDH P-256 is typically 121-138 bytes
      // Raw private key from Node.js crypto is 32 bytes
      // If key is too short (< 100 bytes), it's likely raw format and needs conversion
      if (keyLength < 100) {
        console.warn(`⚠️ Private key seems to be in raw format (${keyLength} bytes). This may not work with Web Crypto API.`);
        console.warn(`⚠️ Please regenerate key pair using frontend Web Crypto API.`);
        throw new Error(`Format private key tidak valid (${keyLength} bytes). Private key harus dalam format PKCS8. Silakan generate ulang key pair di frontend.`);
      }

      // Try importing as PKCS8 (standard format from Web Crypto API)
      try {
        const importedKey = await crypto.subtle.importKey(
          "pkcs8",
          keyBuffer,
          {
            name: "ECDH",
            namedCurve: this.ECDH_CURVE,
          },
          true,
          ["deriveKey", "deriveBits"]
        );
        console.log(`✅ Successfully imported private key as PKCS8`);
        return importedKey;
      } catch (pkcs8Error: any) {
        console.error("❌ Failed to import as PKCS8:", pkcs8Error);
        console.error("Key buffer first 20 bytes:", Array.from(new Uint8Array(keyBuffer).slice(0, 20)));
        
        // If PKCS8 import fails, the key might be corrupted or in wrong format
        throw new Error(`Gagal import private key sebagai PKCS8: ${pkcs8Error.message}. Pastikan key pair di-generate menggunakan Web Crypto API di frontend.`);
      }
    } catch (error: any) {
      console.error("❌ Error importing private key:", error);
      console.error("Key data length:", keyData?.length || 0);
      throw error; // Re-throw to preserve original error message
    }
  }

  private static async importPublicKey(keyData: string): Promise<CryptoKey> {
    try {
      if (!keyData || typeof keyData !== 'string') {
        throw new Error("Public key data tidak valid");
      }

      const keyBuffer = this.base64ToArrayBuffer(keyData);
      
      if (keyBuffer.byteLength === 0) {
        throw new Error("Public key buffer kosong");
      }

      // P-256 public key from Node.js crypto is 65 bytes (0x04 + 32 bytes X + 32 bytes Y)
      // Web Crypto API accepts this format with "raw" import
      // But we need to ensure it starts with 0x04 (uncompressed format)
      const keyArray = new Uint8Array(keyBuffer);
      
      // If key is 65 bytes and starts with 0x04, it's in uncompressed format (correct)
      // If key is 64 bytes, we need to add 0x04 prefix
      let finalKeyBuffer: ArrayBuffer;
      if (keyBuffer.byteLength === 64) {
        // Add 0x04 prefix for uncompressed format
        const prefixedKey = new Uint8Array(65);
        prefixedKey[0] = 0x04;
        prefixedKey.set(keyArray, 1);
        finalKeyBuffer = prefixedKey.buffer;
      } else if (keyBuffer.byteLength === 65 && keyArray[0] === 0x04) {
        // Already in correct format
        finalKeyBuffer = keyBuffer;
      } else if (keyBuffer.byteLength === 65 && keyArray[0] !== 0x04) {
        // Has prefix but not 0x04, try to use as-is or fix
        console.warn(`Public key has unexpected first byte: 0x${keyArray[0].toString(16)}`);
        finalKeyBuffer = keyBuffer;
      } else {
        throw new Error(`Public key length ${keyBuffer.byteLength} tidak valid untuk P-256 (harus 64 atau 65 bytes)`);
      }

      return await crypto.subtle.importKey(
        "raw",
        finalKeyBuffer,
        {
          name: "ECDH",
          namedCurve: this.ECDH_CURVE,
        },
        true,
        ["deriveKey", "deriveBits"]
      );
    } catch (error: any) {
      console.error("Error importing public key:", error);
      console.error(`  - Key data length: ${keyData?.length || 0}`);
      console.error(`  - Key data preview: ${keyData?.substring(0, 20)}...`);
      throw new Error(`Gagal import public key: ${error.message}`);
    }
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

