// ---------- Crypto key type model (simplified) ----------


interface AsymmetricCryptoKeyType {
  readonly algorithm: { name: "Ed25519" | "X25519" };
  readonly usagesGenerate: readonly KeyUsage[];
  readonly usagesImport: readonly KeyUsage[];
}

// Define two objects directly
const ED25519: AsymmetricCryptoKeyType = {
  algorithm: { name: "Ed25519" },
  usagesGenerate: ["sign", "verify"] as const,
  usagesImport: ["sign"] as const,
};

const X25519: AsymmetricCryptoKeyType = {
  algorithm: { name: "X25519" },
  usagesGenerate: ["deriveKey", "deriveBits"] as const,
  usagesImport: ["deriveKey", "deriveBits"] as const,
};

// ---------- Password → AES-GCM key derivation ----------

async function deriveAESKey(
    password: string,
    salt: Uint8Array
): Promise<CryptoKey> {
    const baseKey = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: 200_000,
        hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}
  

// ---------- Minimal persistent storage interface ----------

interface KeyDB {
  put(store: "key_backup" | "key_live", value: unknown, key: string): Promise<void>;
}

// ---------- Key generation, encryption, and storage ----------

// we generate the keypair we asked
// we encrypt it using AES
// then we store it so it becomes non-extractable 

async function safe_gen_and_store_key(
    keyDef: AsymmetricCryptoKeyType,
    userPassword: string,
    db: KeyDB
): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {

  const keyPair = await crypto.subtle.generateKey(
    keyDef.algorithm,
    true,
    keyDef.usagesGenerate
  ) as CryptoKeyPair;

  const rawPrivateKey = await crypto.subtle.exportKey("raw", keyPair.privateKey);
  const privateKeyBytes = new Uint8Array(rawPrivateKey);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await deriveAESKey(userPassword, salt);

  const encryptedPrivateKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    privateKeyBytes
  );

  await db.put(
    "key_backup",
    { type: keyDef.algorithm.name, encryptedPrivateKey, salt, iv },
    `${keyDef.algorithm.name}-backup`
  );

  const lockedPrivateKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes,
    keyDef.algorithm,
    false,
    keyDef.usagesImport
  );

  await db.put("key_live", lockedPrivateKey, `${keyDef.algorithm.name}-private`);
  await db.put("key_live", keyPair.publicKey, `${keyDef.algorithm.name}-public`);

  privateKeyBytes.fill(0);

  return {
    publicKey: keyPair.publicKey,
    privateKey: lockedPrivateKey,
  };
}


function init() {

  // todo : use webauthm to safe_gen_and_store_key
}