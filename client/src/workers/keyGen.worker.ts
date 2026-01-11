// Web Worker for key generation

import Tfhe, { 
    Boolean,
    BooleanPublicKey,
    BooleanCompressedServerKey,
    BooleanClientKey
} from "../tfhe/tfhe"

// ---------- Crypto key type model ----------
interface AsymmetricCryptoKeyType {
    readonly algorithm: { name: "Ed25519" | "X25519" };
    readonly usagesGenerate: readonly KeyUsage[];
    readonly usagesImportPrivate: readonly KeyUsage[];
    readonly usagesImportPublic: readonly KeyUsage[];
}

const ED25519: AsymmetricCryptoKeyType = {
    algorithm: { name: "Ed25519" },
    usagesGenerate: ["sign", "verify"] as const,
    usagesImportPrivate: ["sign"] as const,
    usagesImportPublic: ["verify"] as const,
};

const X25519: AsymmetricCryptoKeyType = {
    algorithm: { name: "X25519" },
    usagesGenerate: ["deriveKey", "deriveBits"] as const,
    usagesImportPrivate: ["deriveKey", "deriveBits"] as const,
    usagesImportPublic: ["deriveKey", "deriveBits"] as const,
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

// ---------- Helper functions for serialization ----------
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function uint8ArrayToBase64(arr: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < arr.length; i++) {
        binary += String.fromCharCode(arr[i]);
    }
    return btoa(binary);
}

// ---------- Key generation, encryption, and storage ----------
async function safe_gen_and_store_key(
    keyDef: AsymmetricCryptoKeyType,
    userPassword: string
): Promise<{ 
    publicKeyBytes: Uint8Array;
    encryptedPrivateKey: ArrayBuffer;
    salt: Uint8Array;
    iv: Uint8Array;
}> {
    // Step 1: Generate extractable keypair
    const keyPair = await crypto.subtle.generateKey(
        keyDef.algorithm,
        true, // extractable = true (temporarily, to export for encryption)
        keyDef.usagesGenerate
    ) as CryptoKeyPair;

    // Step 2: Export public key
    const rawPublicKey = await crypto.subtle.exportKey("raw", keyPair.publicKey);
    const publicKeyBytes = new Uint8Array(rawPublicKey);
    
    // Step 3: Export private key bytes for encryption
    let privateKeyBytes: Uint8Array;
    let keyFormat: "raw" | "pkcs8";
    try {
        // Try exporting as raw first (works for Ed25519/X25519)
        const rawPrivateKey = await crypto.subtle.exportKey("raw", keyPair.privateKey);
        privateKeyBytes = new Uint8Array(rawPrivateKey);
        keyFormat = "raw";
    } catch (error) {
        // Fallback: try pkcs8 if raw doesn't work
        const pkcs8PrivateKey = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
        privateKeyBytes = new Uint8Array(pkcs8PrivateKey);
        keyFormat = "pkcs8";
    }

    // Step 4: Encrypt private key with user-supplied password
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const aesKey = await deriveAESKey(userPassword, salt);
    const encryptedPrivateKey = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        privateKeyBytes.buffer as ArrayBuffer
    );

    // Step 5: Re-import private key as non-extractable (secure storage)
    const privateKeyBytesCopy = new Uint8Array(privateKeyBytes);
    await crypto.subtle.importKey(
        keyFormat,
        privateKeyBytesCopy,
        keyDef.algorithm,
        false, // ⛔ NON-extractable
        keyDef.usagesImportPrivate
    );

    // Step 6: Fill original clear private key with zeros (security)
    privateKeyBytes.fill(0);

    // Step 7: Return encrypted data (worker doesn't keep key handles)
    return {
        publicKeyBytes,
        encryptedPrivateKey,
        salt,
        iv,
    };
}

// ---------- Progress message types ----------
export interface ProgressMessage {
    type: 'progress';
    stepName: string;
    progress: number;
}

export interface KeyDataMessage {
    type: 'keys';
    ed25519: {
        pk: string;
        sk_encrypted: string;
        salt: string;
        iv: string;
    };
    x25519: {
        pk: string;
        sk_encrypted: string;
        salt: string;
        iv: string;
    };
    fhe_sk: string;
}

export interface StartMessage {
    type: 'start';
    userPassword: string;
}

// ---------- Main key generation in worker ----------
self.onmessage = async (event: MessageEvent<StartMessage>) => {
    if (event.data.type === 'start') {
        const { userPassword } = event.data;
        
        try {
            const totalSteps = 6;
            let currentStep = 0;
            
            // Step 1: Generate Ed25519 (Identity) keys
            console.log('[KeyGen Worker] Step 1 BEGIN: Generate Ed25519 keys');
            const step1Start = performance.now();
            const ed25519Keys = await safe_gen_and_store_key(ED25519, userPassword);
            const step1End = performance.now();
            console.log(`[KeyGen Worker] Step 1 END: Generate Ed25519 keys (${(step1End - step1Start).toFixed(2)}ms)`);

            // Step 2: Generate X25519 (Messaging) keys
            console.log('[KeyGen Worker] Step 2 BEGIN: Generate X25519 keys');
            const step2Start = performance.now();
            const x25519Keys = await safe_gen_and_store_key(X25519, userPassword);
            const step2End = performance.now();
            console.log(`[KeyGen Worker] Step 2 END: Generate X25519 keys (${(step2End - step2Start).toFixed(2)}ms)`);

            // Step 3: Load TFHE library
            console.log('[KeyGen Worker] Step 3 BEGIN: Load TFHE library');
            const step3Start = performance.now();
            await Tfhe();
            const step3End = performance.now();
            console.log(`[KeyGen Worker] Step 3 END: Load TFHE library (${(step3End - step3Start).toFixed(2)}ms)`);

            // Step 4: Generate FHE private key
            console.log('[KeyGen Worker] Step 4 BEGIN: Generate FHE private key');
            const step4Start = performance.now();
            const params = Boolean.get_parameters(0);
            const fhe_sk = Boolean.new_client_key(params);
            const fhe_sk_serialized = Boolean.serialize_client_key(fhe_sk);
            const step4End = performance.now();
            console.log(`[KeyGen Worker] Step 4 END: Generate FHE private key (${(step4End - step4Start).toFixed(2)}ms)`);

            // Step 5: Generate FHE evaluation key
            console.log('[KeyGen Worker] Step 5 BEGIN: Generate FHE evaluation key');
            const step5Start = performance.now();
            const fhe_ek = Boolean.new_compressed_server_key(fhe_sk);
            const fhe_ek_serialized = Boolean.serialize_compressed_server_key(fhe_ek);

            const step5End = performance.now();
            console.log(`[KeyGen Worker] Step 5 END: Generate FHE evaluation key (${(step5End - step5Start).toFixed(2)}ms)`);

            // Step 6: Generate FHE public key
            console.log('[KeyGen Worker] Step 6 BEGIN: Generate FHE public key');
            const step6Start = performance.now();
            const fhe_pk = Boolean.new_public_key(fhe_sk);
            const fke_pk_serialized = Boolean.serialize_public_key(fhe_pk);

            const step6End = performance.now();
            console.log(`[KeyGen Worker] Step 6 END: Generate FHE public key (${(step6End - step6Start).toFixed(2)}ms)`);
            
            console.log('[KeyGen Worker] All steps completed successfully!');

            // Send all keys back to main thread (this signals completion)
            self.postMessage({
                type: 'keys',
                ed25519: {
                    pk: uint8ArrayToBase64(ed25519Keys.publicKeyBytes),
                    sk_encrypted: arrayBufferToBase64(ed25519Keys.encryptedPrivateKey),
                    salt: uint8ArrayToBase64(ed25519Keys.salt),
                    iv: uint8ArrayToBase64(ed25519Keys.iv),
                },
                x25519: {
                    pk: uint8ArrayToBase64(x25519Keys.publicKeyBytes),
                    sk_encrypted: arrayBufferToBase64(x25519Keys.encryptedPrivateKey),
                    salt: uint8ArrayToBase64(x25519Keys.salt),
                    iv: uint8ArrayToBase64(x25519Keys.iv),
                },
                fhe_sk: uint8ArrayToBase64(fhe_sk_serialized),
                fhe_ek: uint8ArrayToBase64(fhe_ek_serialized),
                fhe_pk: uint8ArrayToBase64(fke_pk_serialized)
            } as KeyDataMessage);
        } catch (error) {
            console.error('[KeyGen Worker] Error generating keys:', error);
            self.postMessage({
                type: 'error',
                error: error instanceof Error ? error.message : 'Erreur lors de la génération des clés',
            });
        }
    }
};

