

//import("./fhe.js");
// Source - https://stackoverflow.com/a
// Posted by Andrew
// Retrieved 2025-12-08, License - CC BY-SA 4.0

//import * as assert from "node:assert"
import Tfhe, { 
    Boolean,
    BooleanPublicKey,
    BooleanCompressedServerKey,
    BooleanClientKey
} from "../tfhe/tfhe"

///////////////////////////////////////////////

// === FHE keys ===

// public encryption key
export let fhe_pk: BooleanPublicKey

// public evaluation key
export let fhe_ek: BooleanCompressedServerKey

// secret decryption key
export let fhe_sk: BooleanClientKey

// === Messaging keys ===

// public encryption key
export let msg_pk: CryptoKey

// secret decryption key
export let msg_sk: CryptoKey

///////////////////////////////////////////////

async function init_fhe_keys()
{
    console.log("=== generating fhe keys ===")

    console.log("loading tfhe...")
    const tfhe = await Tfhe() 
    console.log("tfhe loaded")

    let params = Boolean.get_parameters(0);
    console.log("Generating fhe secret key...")
    fhe_sk = Boolean.new_client_key(params);

 
//    let serialized_cks = Boolean.serialize_client_key(cks);
    console.log("Generating server key...")
    fhe_ek = Boolean.new_compressed_server_key(fhe_sk);


    console.log("Generating public key...")
    fhe_pk = Boolean.new_public_key(fhe_sk)
    
    console.log("=== fhe key gen done ===")
}

async function init_msg_keys() {
    console.log("=== generating messaging keys ===")

    const algorithm = {
        name: "ECDH",
        namedCurve: "P-256",
    };

    const keyPair = await crypto.subtle.generateKey(
        algorithm,
        true,
        ["deriveKey", "deriveBits"]
    );

    msg_pk = keyPair.privateKey;
    msg_sk = keyPair.publicKey;

    console.log("=== messaging key gen done ===")

}

async function test_fhe_keys()
{
    const N = false

    {   // test1 : use sk to encr/decr & serialization of sk / cipher
        let ct = Boolean.encrypt(fhe_sk, N);

        let serialized_cks = Boolean.serialize_client_key(fhe_sk);
        let deserialized_cks = Boolean.deserialize_client_key(serialized_cks);

        let serialized_ct = Boolean.serialize_ciphertext(ct);
        let deserialized_ct = Boolean.deserialize_ciphertext(serialized_ct);

        let decrypted = Boolean.decrypt(deserialized_cks, deserialized_ct);

        console.assert(decrypted === N, "test1: decrypted shall be euqal to N");
    }

    { // test2: use public key to encr/sk to decr  & serialization of pk
        let ct = Boolean.encrypt_with_public_key(fhe_pk, N);
        let decrypted = Boolean.decrypt(fhe_sk, ct);
        console.assert(decrypted === N, "test2: decrypted shall be euqal to N");
    }

    {
        // todo: more tests...
    }

    console.log("fhe tests done")
}

///////////////////////////////////////////////
// Exports                                  //
///////////////////////////////////////////////

export function fhe_encr(bit: boolean): Uint8Array {
    return Boolean.serialize_ciphertext(Boolean.encrypt_with_public_key(fhe_sk, bit));
}

export function fhe_decr(cipher: Uint8Array): boolean {
    return Boolean.decrypt(fhe_sk, Boolean.deserialize_ciphertext(cipher))
}

//todo: messaging keys
//export function msg_encr(msg: string): Uint8Array {
//    crypto.
//}

export async function init_keys() {
    await init_fhe_keys();
    await test_fhe_keys();
    await init_msg_keys();
}