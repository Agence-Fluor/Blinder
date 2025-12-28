const KEY_TYPES = {
    ed25519: {
      algo: { name: "Ed25519" },
      usages_generate: ["sign", "verify"],
      usages_import: ["sign"],
      exportFormat: "raw",
    },
    x25519: {
      algo: { name: "X25519" },
      usages_generate: ["deriveKey", "deriveBits"],
      usages_import: ["deriveKey", "deriveBits"],
      exportFormat: "raw",
    },
  };
  

async function deriveAESKey(password, salt) {
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
        salt,
        iterations: 200_000,
        hash: "SHA-256",
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }
  

  async function safe_gen_and_store_key(key_type, user_pass, db) {
    const cfg = KEY_TYPES[key_type];
    if (!cfg) throw new Error("Unsupported key type");
  
    /* 1Generate extractable keypair */
    const keyPair = await crypto.subtle.generateKey(
      cfg.algo,
      true, // extractable TEMPORARILY
      cfg.usages_generate
    );
  
    /* Export private key bytes */
    const rawPrivateKey = await crypto.subtle.exportKey(
        "raw",
        keyPair.privateKey
    ) as ArrayBuffer;
    const privateKeyBytes = new Uint8Array(rawPrivateKey);
  
    /* 3Encrypt private key with password */
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
  
    const aesKey = await deriveAESKey(user_pass, salt);
  
    const encryptedPrivateKey = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      privateKeyBytes
    );
  
    /* 4Store encrypted backup */
    await db.put("key_backup", {
      type: key_type,
      encryptedPrivateKey,
      salt,
      iv,
    }, `${key_type}-backup`);
  
    /* 5Re-import as NON-extractable */
    const lockedPrivateKey = await crypto.subtle.importKey(
      cfg.exportFormat,
      privateKeyBytes,
      cfg.algo,
      false, // 🔒 non-extractable
      cfg.usages_import
    );
  
    /* 6Store opaque handle */
    await db.put("key_live", lockedPrivateKey, `${key_type}-private`);
    await db.put("key_live", keyPair.publicKey, `${key_type}-public`);
  
    /* 7Zero sensitive buffers */
    privateKeyBytes.fill(0);
  
    return {
      publicKey: keyPair.publicKey,
      privateKey: lockedPrivateKey, // opaque handle
    };
}
  

async function init() {

  // 

}