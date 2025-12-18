# End-to-End Encryption (E2EE) Implementation

Implementasi enkripsi end-to-end untuk Direct Messages dan Group Chat menggunakan ECDH (Elliptic Curve Diffie-Hellman) dan AES-GCM.

## Fitur

- ✅ ECDH key exchange untuk secure key sharing
- ✅ AES-256-GCM untuk enkripsi pesan
- ✅ Support untuk Direct Messages (1-on-1)
- ✅ Support untuk Group Chat dengan group keys
- ✅ Forward secrecy (setiap session punya key berbeda)

## Cara Menggunakan

### 1. Generate Key Pair (User)

**Backend:**
```bash
POST /api/encryption/keys/generate
```

**Response:**
```json
{
  "message": "Key pair berhasil dibuat",
  "publicKey": "base64_encoded_public_key",
  "privateKey": "base64_encoded_private_key",
  "keyId": "key_id"
}
```

**PENTING:** Simpan private key dengan aman di frontend (localStorage/IndexedDB). Private key tidak akan dikirim lagi.

### 2. Get Public Key User Lain

**Backend:**
```bash
GET /api/encryption/keys/user/:userId
```

**Response:**
```json
{
  "publicKey": "base64_encoded_public_key",
  "keyId": "key_id"
}
```

### 3. Kirim Encrypted Direct Message

**Frontend:**
```typescript
import { EncryptionService } from "@/lib/encryption";

// Encrypt message
const encrypted = await EncryptionService.encryptForUser(
  "Hello, ini pesan rahasia!",
  senderPrivateKey,
  receiverPublicKey
);

// Send to backend
await AxiosInstance.post("/api/direct-messages", {
  receiverId: "receiver_id",
  encryptedContent: JSON.stringify(encrypted),
  encryptionKeyId: "key_id",
  content: "", // Optional: plain text fallback
  type: "text"
});
```

### 4. Decrypt Direct Message

**Frontend:**
```typescript
// Get encrypted message from backend
const message = await AxiosInstance.get(`/api/direct-messages/conversation/${userId}`);

// Decrypt
if (message.encryptedContent) {
  const encrypted = JSON.parse(message.encryptedContent);
  const decrypted = await EncryptionService.decryptFromUser(
    encrypted,
    receiverPrivateKey,
    senderPublicKey
  );
  console.log("Decrypted:", decrypted);
}
```

### 5. Initialize Group Encryption

**Backend (Admin only):**
```bash
POST /api/encryption/keys/group/initialize
Body: { groupId: "group_id" }
```

Ini akan:
- Generate group key
- Encrypt group key untuk setiap member
- Store encrypted group keys di database

### 6. Get Group Encryption Key

**Backend:**
```bash
GET /api/encryption/keys/group/:groupId
```

**Response:**
```json
{
  "encryptedGroupKey": "encrypted_group_key_json",
  "keyId": "key_id"
}
```

**Frontend:**
```typescript
// Get encrypted group key
const response = await AxiosInstance.get(`/api/encryption/keys/group/${groupId}`);

// Decrypt group key
const groupKey = await EncryptionService.decryptGroupKey(
  response.data.encryptedGroupKey,
  userPublicKey,
  userPrivateKey
);

// Encrypt message dengan group key
const encrypted = await EncryptionService.encryptForGroup(
  "Hello group!",
  groupKey
);
```

## Database Schema

### EncryptionKey Model
- `id`: Key ID
- `userId`: User yang punya key
- `publicKey`: Public key (ECDH)
- `privateKeyEncrypted`: Encrypted private key (untuk backup, optional)
- `keyType`: "ecdh" atau "group"
- `groupChatId`: Untuk group keys
- `isActive`: Status key

### DirectMessage & Message Models
- `encryptedContent`: Encrypted message content (JSON string)
- `encryptionKeyId`: Reference ke encryption key yang digunakan
- `encryptedMediaUrl`: Encrypted media URL (optional)

## Security Notes

1. **Private Key Storage**: Private key hanya disimpan di frontend (browser). Jangan kirim ke backend.
2. **Key Rotation**: Implementasikan key rotation secara berkala untuk forward secrecy yang lebih baik.
3. **Key Verification**: Implementasikan key verification UI untuk memastikan user berkomunikasi dengan user yang benar.
4. **Backup**: Private key bisa di-encrypt dan disimpan sebagai backup (optional).

## Next Steps

1. ✅ Basic encryption/decryption
2. ⏳ Key verification UI
3. ⏳ Key rotation mechanism
4. ⏳ Message history encryption
5. ⏳ Device management (multiple devices)

