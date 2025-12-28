# Registration # SOLUTION 1

**Problems / answers :**
- Check if user is not a bot:
    - Captcha/PoW
    - SMS confirmation
        - Heuristic phone number check 
        - Later: use dark-web to get accurate MNP database

- Authentification: 
    - Register via WebAuthn

- Recovery / Device change:
    - Via QR code + user password

**Summary**
- SMS
- WebAuthn
- Password


# Registration # SOLUTION 2

**Problems / answers :**
- Check if user is not a bot:
    - Captcha/PoW
    - SMS confirmation
        - Heuristic phone number check 
        - Later: use dark-web to get accurate MNP database

- Authentification:
    - SMS OTP or SMS+Password


- Recovery / Device change:
    - Via QR code + user password

**Summary**
- SMS
- Password


# Registration # SOLUTION 3

**Problems / answers :**
- Check if user is not a bot:
    - Captcha/PoW
    - SMS confirmation
        - Heuristic phone number check 
        - Later: use dark-web to get accurate MNP database

- Authentification: 
    - Register via WebAuthn

- Recovery / Device change:
    - Via QR code

**Summary**
- SMS
- WebAuthn

**Issues**
- How to encrypt extractable private key without user-supplied password ?
- => BACKUP (user clear data) is available by definition
- => PRIVATE-KEYS shall be per device

- => WE SHARE only backup and create new identity per device ? + share fhe key
