async function init() {

    if (true) {
        // todo : check : is key already in storage ? if not :

        // STEP1: keygen
        const keyPair = await crypto.subtle.generateKey(
            {
                name: "Ed25519",
            },
            true, // extractable (temporairement)
            ["sign", "verify"]
        );
        const rawPrivateKey = await crypto.subtle.exportKey(
            "raw",
            keyPair.privateKey
        );
        const privateKeyBytes = new Uint8Array(rawPrivateKey);

        // STEP4: safe store
        const lockedPrivateKey = await crypto.subtle.importKey(
            "raw",
            privateKeyBytes,
            {
              name: "Ed25519",
            },
            false, // ⛔ NON extractable
            ["sign"]
          );

}

function cipher_message() {

}

function decipher_message() {

}