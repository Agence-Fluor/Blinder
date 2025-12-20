use tfhe::boolean::prelude::*;

fn main() {
    // Don't consider the following lines; you should follow the procedure above.
    let (client_key, server_key) = gen_keys();
    let ct_1 = client_key.encrypt(true);
    let ct_2 = client_key.encrypt(false);
    let encoded_1: Vec<u8> = bincode::serialize(&ct_1).unwrap();
    let encoded_2: Vec<u8> = bincode::serialize(&ct_2).unwrap();

    //---------------------------- ON SERVER SIDE ----------------------------

    // We deserialize the ciphertexts:
    let ct_1: Ciphertext = bincode::deserialize(&encoded_1[..])
        .expect("failed to deserialize");
    let ct_2: Ciphertext = bincode::deserialize(&encoded_2[..])
        .expect("failed to deserialize");

    // We use the server key to execute the boolean circuit:
    // if ((NOT ct_2) NAND (ct_1 AND ct_2)) then (NOT ct_2) else (ct_1 AND ct_2)
    let ct_3 = server_key.not(&ct_2);
    let ct_4 = server_key.and(&ct_1, &ct_2);
    let ct_5 = server_key.nand(&ct_3, &ct_4);
    let ct_6 = server_key.mux(&ct_5, &ct_3, &ct_4);

    // Then we serialize the output of the circuit:
    let encoded_output: Vec<u8> = bincode::serialize(&ct_6)
        .expect("failed to serialize output");

    // ...
    // And we send the output to the client
    // ...
}
