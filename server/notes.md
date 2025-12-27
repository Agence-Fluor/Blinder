# Blinder protocol 

User device#1 generates :
    - Identity paire : ED25119 pair
    - Messaging pair : X25119 pair   
    - PSI pair : TFHE-rs Boolean pair

    issues :
        => cant force store a private key in keychains + shall be in secure enclave
            - Use webauthn + keep private keys on device 
        =>

    options :
        - (webauthn +) single device + qr code to export
            => 

        - password + server-side encrypted private keys 
            => easy multi device


ideas: for E2E chat app :

- login / register by sms code
- new devices by qr code scan with : 
    + app-maintainer stored encrypted backup
    + aes key of backup stored in # portion of url 



-----------

Secure app login engine
----


sms/webauthn


High level approach : 
    - Per device WebAuthn pair

    - Multi devices via WebAuthn + ability to list/add/remove devices + ability to add a device by confirming an other (or via qr code)
    - Use SMS to register + PoW to avoid bots


E2EE extension : 
    - Identity paire : ED25119 pair
    - Messaging pair : X25119 pair   
    - PSI pair : TFHE-rs Boolean pair


    - Avoid private keys from beeing exposed : 
        JS polyfils that :
            - On a PWA : non extracable crypto API keys that are not JS exposed
            - On real apps (electron/capacitor) : use secure enclave / TPM when possible
    - how to backup / restore backup app content ?
    - how to share identity / messaging pairs accross devices etc. ?