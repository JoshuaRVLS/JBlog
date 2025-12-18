"use client";

import { useState, useEffect, useCallback } from "react";
import { EncryptionService, type KeyPair, type EncryptedMessage } from "@/lib/encryption";
import { KeyStorage, type StoredKeyPair, type StoredGroupKey } from "@/lib/keyStorage";
import AxiosInstance from "@/utils/api";
import toast from "react-hot-toast";

export interface UseEncryptionReturn {
  keyPair: StoredKeyPair | null;
  hasKeys: boolean;
  isLoading: boolean;
  generateKeyPair: () => Promise<void>;
  getUserPublicKey: (userId: string) => Promise<string | null>;
  encryptForUser: (content: string, receiverPublicKey: string) => Promise<EncryptedMessage | null>;
  decryptFromUser: (encrypted: EncryptedMessage, senderPublicKey: string) => Promise<string | null>;
  getGroupKey: (groupId: string) => Promise<CryptoKey | null>;
  encryptForGroup: (content: string, groupId: string) => Promise<EncryptedMessage | null>;
  decryptFromGroup: (encrypted: EncryptedMessage, groupId: string) => Promise<string | null>;
  initializeGroupEncryption: (groupId: string) => Promise<boolean>;
}

export function useEncryption(userId?: string): UseEncryptionReturn {
  const [keyPair, setKeyPair] = useState<StoredKeyPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = KeyStorage.getKeyPair();
    setKeyPair(stored);
    setIsLoading(false);
  }, []);

  const generateKeyPair = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Generate key pair using Web Crypto API (frontend) to ensure PKCS8 format
      console.log("🔑 Generating key pair using Web Crypto API...");
      const keyPair = await EncryptionService.generateKeyPair();
      
      // Send only public key to backend
      let keyId: string;
      try {
        const response = await AxiosInstance.post("/encryption/keys/generate", {
          publicKey: keyPair.publicKey, // Only send public key
        });
        keyId = response.data.keyId || response.data.id;
      } catch (error: any) {
        // If key already exists on server, try to get the existing key ID
        if (error.response?.status === 400 && error.response?.data?.error?.includes("sudah ada")) {
          // Try to get existing key
          if (userId) {
            try {
              const getResponse = await AxiosInstance.get(`/encryption/keys/user/${userId}`);
              keyId = getResponse.data.keyId || getResponse.data.id || "unknown";
              console.log("✅ Using existing key from server");
            } catch (getError) {
              // If we can't get key ID, generate a temporary one
              keyId = `temp-${Date.now()}`;
              console.warn("⚠️ Could not get key ID from server, using temporary ID");
            }
          } else {
            keyId = `temp-${Date.now()}`;
          }
        } else {
          throw error;
        }
      }

      const stored: StoredKeyPair = {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey, // PKCS8 format from Web Crypto API
        keyId: keyId,
      };

      KeyStorage.saveKeyPair(stored);
      setKeyPair(stored);
      toast.success("Key pair berhasil dibuat");
      console.log("✅ Key pair generated and saved locally");
    } catch (error: any) {
      console.error("❌ Error generating key pair:", error);
      
      if (error.response?.status === 400 && error.response?.data?.error?.includes("sudah ada")) {
        const stored = KeyStorage.getKeyPair();
        if (stored) {
          setKeyPair(stored);
          toast.success("Key pair sudah ada dan dimuat");
          return;
        }
        toast.error("Key pair sudah ada di server, tapi tidak ditemukan di storage lokal");
      } else {
        toast.error(error.response?.data?.error || "Gagal membuat key pair");
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const getUserPublicKey = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const response = await AxiosInstance.get(`/encryption/keys/user/${userId}`);
      return response.data.publicKey || null;
    } catch (error: any) {
      console.error("Error getting user public key:", error);
      if (error.response?.status === 404) {
        return null;
      }
      toast.error("Gagal mengambil public key user");
      return null;
    }
  }, []);

  const encryptForUser = useCallback(
    async (content: string, receiverPublicKey: string): Promise<EncryptedMessage | null> => {
      if (!keyPair) {
        toast.error("Key pair belum dibuat. Silakan generate key pair dulu");
        return null;
      }

      try {
        const encrypted = await EncryptionService.encryptForUser(
          content,
          keyPair.privateKey,
          receiverPublicKey
        );
        return encrypted;
      } catch (error) {
        console.error("Error encrypting for user:", error);
        toast.error("Gagal mengenkripsi pesan");
        return null;
      }
    },
    [keyPair]
  );

  const decryptFromUser = useCallback(
    async (encrypted: EncryptedMessage, senderPublicKey: string): Promise<string | null> => {
      if (!keyPair) {
        return null;
      }

      try {
        const decrypted = await EncryptionService.decryptFromUser(
          encrypted,
          keyPair.privateKey,
          senderPublicKey
        );
        return decrypted;
      } catch (error) {
        console.error("Error decrypting from user:", error);
        return null;
      }
    },
    [keyPair]
  );

  const getGroupKey = useCallback(async (groupId: string): Promise<CryptoKey | null> => {
    try {
      const stored = KeyStorage.getGroupKey(groupId);
      if (stored) {
        return await EncryptionService.importGroupKey(stored.groupKey);
      }

      if (!keyPair || !userId) {
        return null;
      }

      const response = await AxiosInstance.get(`/encryption/keys/group/${groupId}`);
      const { encryptedGroupKey, userPublicKey } = response.data;

      if (!encryptedGroupKey || !userPublicKey) {
        return null;
      }

      const groupKey = await EncryptionService.decryptGroupKey(
        encryptedGroupKey,
        userPublicKey,
        keyPair.privateKey
      );

      const groupKeyBase64 = await EncryptionService.exportGroupKey(groupKey);
      KeyStorage.saveGroupKey(groupId, groupKeyBase64, response.data.keyId || "");

      return groupKey;
    } catch (error: any) {
      // Don't log error for 404 or 400 - these are expected if encryption is not enabled or key not found
      if (error.response?.status === 404 || error.response?.status === 400) {
        // Encryption not enabled or key not found - this is normal, just return null
        return null;
      }
      // Only log unexpected errors
      console.error("Error getting group key:", error);
      return null;
    }
  }, [keyPair, userId]);

  const encryptForGroup = useCallback(
    async (content: string, groupId: string): Promise<EncryptedMessage | null> => {
      const groupKey = await getGroupKey(groupId);
      if (!groupKey) {
        return null;
      }

      try {
        return await EncryptionService.encryptForGroup(content, groupKey);
      } catch (error) {
        console.error("Error encrypting for group:", error);
        toast.error("Gagal mengenkripsi pesan");
        return null;
      }
    },
    [getGroupKey]
  );

  const decryptFromGroup = useCallback(
    async (encrypted: EncryptedMessage, groupId: string): Promise<string | null> => {
      const groupKey = await getGroupKey(groupId);
      if (!groupKey) {
        return null;
      }

      try {
        return await EncryptionService.decryptFromGroup(encrypted, groupKey);
      } catch (error) {
        console.error("Error decrypting from group:", error);
        return null;
      }
    },
    [getGroupKey]
  );

  const initializeGroupEncryption = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!keyPair || !userId) {
        toast.error("Key pair user belum dibuat atau user belum login.");
        return false;
      }

      try {
        setIsLoading(true);

        // 1. Get public keys of all group members
        const membersResponse = await AxiosInstance.get(`/encryption/keys/group/${groupId}/members`);
        const members = membersResponse.data.members || [];

        // Filter members that have public keys
        let membersWithKeys = members.filter((m: any) => m.publicKey !== null);

        // Ensure current user (admin) is included in the list
        const currentUserInList = membersWithKeys.find((m: any) => m.userId === userId);
        if (!currentUserInList && keyPair.publicKey) {
          // Add current user to the list if not already included
          membersWithKeys.push({
            userId: userId,
            userName: "You",
            publicKey: keyPair.publicKey,
            keyId: keyPair.keyId,
          });
        }

        if (membersWithKeys.length === 0) {
          toast.error("Tidak ada member yang memiliki encryption keys. Minta mereka untuk generate key pair terlebih dahulu.");
          return false;
        }

        // 2. Generate group key in frontend
        const groupKey = await EncryptionService.generateGroupKey();
        const groupKeyBase64 = await EncryptionService.exportGroupKey(groupKey);

        // 3. Encrypt group key for each member using their public key
        const encryptedKeys = await Promise.all(
          membersWithKeys.map(async (member: any) => {
            try {
              // Validate member has valid public key
              if (!member.publicKey || typeof member.publicKey !== 'string') {
                console.error(`Invalid public key for user ${member.userId}`);
                return null;
              }

              // Validate admin has valid private key
              if (!keyPair.privateKey || typeof keyPair.privateKey !== 'string') {
                console.error(`Invalid private key for admin`);
                return null;
              }

              const encryptedGroupKey = await EncryptionService.encryptGroupKey(
                groupKey,
                member.publicKey,
                keyPair.privateKey
              );
              return {
                userId: member.userId,
                encryptedGroupKey: encryptedGroupKey,
                keyId: member.keyId,
              };
            } catch (error: any) {
              console.error(`Error encrypting group key for user ${member.userId}:`, error);
              console.error(`  - Error message: ${error.message}`);
              console.error(`  - Member public key length: ${member.publicKey?.length || 0}`);
              console.error(`  - Admin private key length: ${keyPair.privateKey?.length || 0}`);
              return null;
            }
          })
        );

        // Filter out failed encryptions
        const validEncryptedKeys = encryptedKeys.filter((key: any) => key !== null);

        if (validEncryptedKeys.length === 0) {
          toast.error("Gagal mengenkripsi group key untuk semua member.");
          return false;
        }

        // 4. Send encrypted keys to backend
        await AxiosInstance.post("/encryption/keys/group/initialize", {
          groupId,
          encryptedKeys: validEncryptedKeys,
        });

        // 5. Store group key locally for current user
        KeyStorage.saveGroupKey(groupId, groupKeyBase64, `group-${groupId}`);

        toast.success("Group encryption berhasil diaktifkan");
        return true;
      } catch (error: any) {
        console.error("Error initializing group encryption:", error);
        toast.error(error.response?.data?.error || "Gagal mengaktifkan group encryption");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [keyPair, userId]
  );

  return {
    keyPair,
    hasKeys: keyPair !== null,
    isLoading,
    generateKeyPair,
    getUserPublicKey,
    encryptForUser,
    decryptFromUser,
    getGroupKey,
    encryptForGroup,
    decryptFromGroup,
    initializeGroupEncryption,
  };
}

