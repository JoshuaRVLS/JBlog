import crypto from "crypto";

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
  private static readonly ALGORITHM = "aes-256-gcm";
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly ECDH_CURVE = "prime256v1";

  static generateKeyPair(): KeyPair {
    const ecdh = crypto.createECDH(this.ECDH_CURVE);
    ecdh.generateKeys();

    return {
      publicKey: ecdh.getPublicKey("base64"),
      privateKey: ecdh.getPrivateKey("base64"),
    };
  }

  static deriveSharedSecret(privateKey: string, publicKey: string): Buffer {
    const ecdh = crypto.createECDH(this.ECDH_CURVE);
    ecdh.setPrivateKey(Buffer.from(privateKey, "base64"));
    return ecdh.computeSecret(Buffer.from(publicKey, "base64"));
  }

  static deriveEncryptionKey(sharedSecret: Buffer, salt?: Buffer): Buffer {
    if (!salt) {
      salt = crypto.randomBytes(16);
    }
    return crypto.pbkdf2Sync(sharedSecret, salt, 100000, this.KEY_LENGTH, "sha256");
  }

  static encrypt(content: string, key: Buffer): EncryptedMessage {
    const iv = crypto.randomBytes(this.IV_LENGTH);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

    let encrypted = cipher.update(content, "utf8", "base64");
    encrypted += cipher.final("base64");

    const tag = cipher.getAuthTag();

    return {
      encryptedContent: encrypted,
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
    };
  }

  static decrypt(encrypted: EncryptedMessage, key: Buffer): string {
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      key,
      Buffer.from(encrypted.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));

    let decrypted = decipher.update(encrypted.encryptedContent, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  static encryptForUser(
    content: string,
    senderPrivateKey: string,
    receiverPublicKey: string
  ): EncryptedMessage {
    const sharedSecret = this.deriveSharedSecret(senderPrivateKey, receiverPublicKey);
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);
    return this.encrypt(content, encryptionKey);
  }

  static decryptFromUser(
    encrypted: EncryptedMessage,
    receiverPrivateKey: string,
    senderPublicKey: string
  ): string {
    const sharedSecret = this.deriveSharedSecret(receiverPrivateKey, senderPublicKey);
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);
    return this.decrypt(encrypted, encryptionKey);
  }

  static encryptForGroup(
    content: string,
    groupKey: Buffer
  ): EncryptedMessage {
    return this.encrypt(content, groupKey);
  }

  static decryptFromGroup(
    encrypted: EncryptedMessage,
    groupKey: Buffer
  ): string {
    return this.decrypt(encrypted, groupKey);
  }

  static generateGroupKey(): Buffer {
    return crypto.randomBytes(this.KEY_LENGTH);
  }

  static encryptGroupKey(groupKey: Buffer, userPublicKey: string, userPrivateKey: string): string {
    const sharedSecret = this.deriveSharedSecret(userPrivateKey, userPublicKey);
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);
    const encrypted = this.encrypt(groupKey.toString("base64"), encryptionKey);
    return JSON.stringify(encrypted);
  }

  static decryptGroupKey(
    encryptedGroupKey: string,
    userPublicKey: string,
    userPrivateKey: string
  ): Buffer {
    const encrypted = JSON.parse(encryptedGroupKey) as EncryptedMessage;
    const sharedSecret = this.deriveSharedSecret(userPrivateKey, userPublicKey);
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);
    const decrypted = this.decrypt(encrypted, encryptionKey);
    return Buffer.from(decrypted, "base64");
  }
}

