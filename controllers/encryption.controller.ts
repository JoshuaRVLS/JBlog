import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthRequest } from "../middleware/auth.middleware";
import db from "../lib/db";
import { EncryptionService } from "../lib/encryption";

export const generateUserKeyPair = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    if (!db || !db.encryptionKey) {
      console.error("Prisma client belum di-generate dengan model EncryptionKey. Jalankan: npx prisma generate");
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: "Database client belum siap. Silakan restart server setelah menjalankan 'npx prisma generate'",
      });
    }

    const existingKey = await db.encryptionKey.findFirst({
      where: {
        userId,
        keyType: "ecdh",
        isActive: true,
      },
    });

    // Frontend should generate key pair using Web Crypto API and send only public key
    // This ensures private key never leaves the client (better security)
    const { publicKey } = req.body;

    if (!publicKey || typeof publicKey !== "string") {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "Public key harus dikirim dari frontend. Frontend harus generate key pair menggunakan Web Crypto API.",
      });
    }

    let encryptionKey;
    if (existingKey) {
      // Regenerate / rotate: update existing active key with new public key
      encryptionKey = await db.encryptionKey.update({
        where: { id: existingKey.id },
        data: {
          publicKey: publicKey,
          isActive: true,
        },
      });
    } else {
      // First time: create new key record
      encryptionKey = await db.encryptionKey.create({
        data: {
          userId,
          publicKey: publicKey,
          keyType: "ecdh",
          isActive: true,
        },
      });
    }

    res.status(StatusCodes.CREATED).json({
      message: existingKey ? "Public key berhasil diperbarui" : "Public key berhasil disimpan",
      keyId: encryptionKey.id,
      note: "Private key tetap di frontend dan tidak pernah dikirim ke server (E2EE best practice)",
    });
  } catch (error: any) {
    console.error("Error generating key pair:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal membuat key pair",
      details: error.message,
    });
  }
};

export const getUserPublicKey = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    const encryptionKey = await db.encryptionKey.findFirst({
      where: {
        userId,
        keyType: "ecdh",
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!encryptionKey) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Public key tidak ditemukan",
      });
    }

    res.json({
      publicKey: encryptionKey.publicKey,
      keyId: encryptionKey.id,
    });
  } catch (error: any) {
    console.error("Error getting public key:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil public key",
      details: error.message,
    });
  }
};

export const getGroupEncryptionKey = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    const groupChat = await db.groupChat.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Group chat tidak ditemukan",
      });
    }

    if (groupChat.members.length === 0) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "Anda bukan member group ini",
      });
    }

    if (!groupChat.encryptionEnabled) {
      // Return 404 instead of 400 to match frontend error handling
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Encryption tidak diaktifkan untuk group ini",
      });
    }

    const userKey = await db.encryptionKey.findFirst({
      where: {
        userId,
        keyType: "ecdh",
        isActive: true,
      },
    });

    if (!userKey) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "User key tidak ditemukan. Silakan generate key pair dulu",
      });
    }

    // Find group key for the current user (each member has their own encrypted copy)
    const groupKey = await db.encryptionKey.findFirst({
      where: {
        userId, // Filter by current user - each member has their own encrypted group key
        groupChatId: groupId,
        keyType: "group",
        isActive: true,
      },
    });

    if (!groupKey) {
      // Debug: Check if encryption is enabled and if user is a member
      console.log(`Group key not found for user ${userId} in group ${groupId}`);
      console.log(`   - Encryption enabled: ${groupChat.encryptionEnabled}`);
      console.log(`   - User is member: ${groupChat.members.some((m) => m.userId === userId)}`);
      
      // Check if there are any group keys for this group
      const anyGroupKey = await db.encryptionKey.findFirst({
        where: {
          groupChatId: groupId,
          keyType: "group",
        },
      });
      console.log(`   - Any group key exists for this group: ${!!anyGroupKey}`);
      
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Group encryption key tidak ditemukan. Pastikan group encryption sudah diaktifkan dan Anda adalah member group ini.",
      });
    }

    // Get the admin/creator's public key (the one who encrypted the group key)
    // The group key was encrypted by the admin who initialized encryption
    // We can find this by checking who created the group or who is admin
    const groupChatWithCreator = await db.groupChat.findUnique({
      where: { id: groupId },
      select: { createdBy: true },
    });

    // Try to get admin's public key (the one who initialized encryption)
    // First try the group creator, then try the current user if they're admin
    let adminPublicKey: string | null = null;
    
    if (groupChatWithCreator?.createdBy) {
      const adminKey = await db.encryptionKey.findFirst({
        where: {
          userId: groupChatWithCreator.createdBy,
          keyType: "ecdh",
          isActive: true,
        },
      });
      if (adminKey) {
        adminPublicKey = adminKey.publicKey;
      }
    }

    // If we couldn't find creator's key, use current user's key as fallback
    // (assuming they might be the admin who initialized)
    if (!adminPublicKey) {
      adminPublicKey = userKey.publicKey;
    }

    res.json({
      encryptedGroupKey: groupKey.privateKeyEncrypted,
      keyId: groupKey.id,
      userPublicKey: adminPublicKey, // Public key of the admin who encrypted the group key
    });
  } catch (error: any) {
    console.error("Error getting group encryption key:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil group encryption key",
      details: error.message,
    });
  }
};

// Get public keys of all group members
export const getGroupMembersPublicKeys = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    const groupChat = await db.groupChat.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Group chat tidak ditemukan",
      });
    }

    const isAdmin = groupChat.members.some(
      (m) => m.userId === userId && m.role === "admin"
    );

    if (!isAdmin && groupChat.createdBy !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "Hanya admin yang bisa melihat public keys member",
      });
    }

    // Get public keys for all members (including the admin who is calling this endpoint)
    const membersWithKeys = await Promise.all(
      groupChat.members.map(async (member) => {
        const userKey = await db.encryptionKey.findFirst({
          where: {
            userId: member.userId,
            keyType: "ecdh",
            isActive: true,
          },
        });

        return {
          userId: member.userId,
          userName: member.user.name,
          publicKey: userKey?.publicKey || null,
          keyId: userKey?.id || null,
        };
      })
    );

    // Also include the current user (admin) if they're not in the members list
    // This can happen if the admin is the creator but not explicitly added as a member
    const currentUserInList = membersWithKeys.find((m) => m.userId === userId);
    if (!currentUserInList) {
      const currentUserKey = await db.encryptionKey.findFirst({
        where: {
          userId: userId,
          keyType: "ecdh",
          isActive: true,
        },
      });

      if (currentUserKey) {
        membersWithKeys.push({
          userId: userId,
          userName: "You",
          publicKey: currentUserKey.publicKey,
          keyId: currentUserKey.id,
        });
      }
    }

    res.json({
      members: membersWithKeys,
    });
  } catch (error: any) {
    console.error("Error getting group members public keys:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengambil public keys member",
      details: error.message,
    });
  }
};

// Initialize group encryption - now receives encrypted keys from frontend
export const initializeGroupEncryption = async (req: AuthRequest, res: Response) => {
  try {
    const { groupId, encryptedKeys } = req.body; // encryptedKeys: [{ userId, encryptedGroupKey, keyId }]
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Harus login dulu",
      });
    }

    if (!encryptedKeys || !Array.isArray(encryptedKeys)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: "encryptedKeys harus berupa array",
      });
    }

    const groupChat = await db.groupChat.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    });

    if (!groupChat) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Group chat tidak ditemukan",
      });
    }

    const isAdmin = groupChat.members.some(
      (m) => m.userId === userId && m.role === "admin"
    );

    if (!isAdmin && groupChat.createdBy !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        error: "Hanya admin yang bisa mengaktifkan encryption",
      });
    }

    // Enable encryption for group
    await db.groupChat.update({
      where: { id: groupId },
      data: {
        encryptionEnabled: true,
      },
    });

    // Get admin's encryption key to also store group key for admin
    const adminKey = await db.encryptionKey.findFirst({
      where: {
        userId: userId, // Admin who is initializing
        keyType: "ecdh",
        isActive: true,
      },
    });

    // Store encrypted group keys for each member
    for (const encryptedKeyData of encryptedKeys) {
      const { userId: memberUserId, encryptedGroupKey, keyId } = encryptedKeyData;

      // Verify member is part of the group
      const isMember = groupChat.members.some((m) => m.userId === memberUserId);
      if (!isMember) {
        console.warn(`User ${memberUserId} is not a member of group ${groupId}`);
        continue;
      }

      // Get the user's encryption key to store the group key
      const userKey = await db.encryptionKey.findFirst({
        where: {
          userId: memberUserId,
          keyType: "ecdh",
          isActive: true,
        },
      });

      if (!userKey) {
        console.warn(`User ${memberUserId} doesn't have encryption keys`);
        continue;
      }

      // Store encrypted group key (upsert using findFirst + create/update)
      const existingGroupKey = await db.encryptionKey.findFirst({
        where: {
          userId: memberUserId,
          groupChatId: groupId,
          keyType: "group",
        },
      });

      if (existingGroupKey) {
        // Update existing group key
        await db.encryptionKey.update({
          where: { id: existingGroupKey.id },
          data: {
            privateKeyEncrypted: encryptedGroupKey,
            isActive: true,
          },
        });
      } else {
        // Create new group key
        await db.encryptionKey.create({
          data: {
            userId: memberUserId,
            groupChatId: groupId,
            keyType: "group",
            privateKeyEncrypted: encryptedGroupKey, // Store encrypted group key
            isActive: true,
          },
        });
      }
    }

    res.json({
      message: "Group encryption berhasil diaktifkan",
    });
  } catch (error: any) {
    console.error("Error initializing group encryption:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Gagal mengaktifkan group encryption",
      details: error.message,
    });
  }
};

