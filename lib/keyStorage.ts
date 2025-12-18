const PRIVATE_KEY_STORAGE_KEY = "jblog_private_key";
const PUBLIC_KEY_STORAGE_KEY = "jblog_public_key";
const KEY_ID_STORAGE_KEY = "jblog_key_id";
const GROUP_KEYS_STORAGE_KEY = "jblog_group_keys";

export interface StoredKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export interface StoredGroupKey {
  groupId: string;
  groupKey: string;
  keyId: string;
}

export class KeyStorage {
  static saveKeyPair(keyPair: StoredKeyPair): void {
    try {
      localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, keyPair.privateKey);
      localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, keyPair.publicKey);
      localStorage.setItem(KEY_ID_STORAGE_KEY, keyPair.keyId);
    } catch (error) {
      console.error("Error saving key pair:", error);
      throw new Error("Gagal menyimpan key pair");
    }
  }

  static getKeyPair(): StoredKeyPair | null {
    try {
      const privateKey = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
      const publicKey = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
      const keyId = localStorage.getItem(KEY_ID_STORAGE_KEY);

      if (!privateKey || !publicKey || !keyId) {
        return null;
      }

      return {
        privateKey,
        publicKey,
        keyId,
      };
    } catch (error) {
      console.error("Error getting key pair:", error);
      return null;
    }
  }

  static hasKeyPair(): boolean {
    return this.getKeyPair() !== null;
  }

  static clearKeyPair(): void {
    try {
      localStorage.removeItem(PRIVATE_KEY_STORAGE_KEY);
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(KEY_ID_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing key pair:", error);
    }
  }

  static saveGroupKey(groupId: string, groupKey: string, keyId: string): void {
    try {
      const groupKeys = this.getAllGroupKeys();
      const existingIndex = groupKeys.findIndex((k) => k.groupId === groupId);

      const groupKeyData: StoredGroupKey = {
        groupId,
        groupKey,
        keyId,
      };

      if (existingIndex >= 0) {
        groupKeys[existingIndex] = groupKeyData;
      } else {
        groupKeys.push(groupKeyData);
      }

      localStorage.setItem(GROUP_KEYS_STORAGE_KEY, JSON.stringify(groupKeys));
    } catch (error) {
      console.error("Error saving group key:", error);
      throw new Error("Gagal menyimpan group key");
    }
  }

  static getGroupKey(groupId: string): StoredGroupKey | null {
    try {
      const groupKeys = this.getAllGroupKeys();
      return groupKeys.find((k) => k.groupId === groupId) || null;
    } catch (error) {
      console.error("Error getting group key:", error);
      return null;
    }
  }

  static getAllGroupKeys(): StoredGroupKey[] {
    try {
      const stored = localStorage.getItem(GROUP_KEYS_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored) as StoredGroupKey[];
    } catch (error) {
      console.error("Error getting all group keys:", error);
      return [];
    }
  }

  static removeGroupKey(groupId: string): void {
    try {
      const groupKeys = this.getAllGroupKeys();
      const filtered = groupKeys.filter((k) => k.groupId !== groupId);
      localStorage.setItem(GROUP_KEYS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing group key:", error);
    }
  }

  static clearAllGroupKeys(): void {
    try {
      localStorage.removeItem(GROUP_KEYS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing group keys:", error);
    }
  }
}

