# Account security

**Problems / answers :**
- Check if user is not a bot:
    - Captcha/PoW
    - SMS confirmation
        - Heuristic phone number check 
        - Later: use dark-web to get accurate MNP database

- Authentification: 
    - Register via WebAuthn + QR code (for private key / history imports)

- Recovery / All device lost:
    - NEW onboarding but we keep contacts (anno) / payements rest have to be retyped 


# Message security

v1
- FCS : Forward Secrecy
    -> Clé privée volée; messages passé sauvés ?

v2 : besoin mdp user ?
- PCS : Post-Compromise Security
    -> On protège les messages dans le futur si une clé de session est volée
    -> inutile si clés privées stockés en clair 

    -> pour les stocker autrement -> besoin mdp user ... 


=> une clé FHE clair 
=> clé chat chiffrée par device

# PSI Security

Alice encrypt his choices with Bob public key
Server evaluate circuit
Bob decrypt circuit