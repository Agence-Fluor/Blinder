Lors d'un changement; toujours bien lire le code; l'architecture est : 

Un client svelte avec Indexeddb, websocket, Webrtc qui parle a un serveur rust qui utilise une db postgresql. 

Le client est dans client/ le serveur dans server/ la db dans db/. 

Quand je fais une demande, toujours lire le code avant, puis propose un chagement qui ne requiert pas de quantité de ligne de code. Meme si on peut en enlever; refactorer ce qui n'est plus utilisé c'est encore mieux.

Ne propose pas de migration de DB / indexdb / de deprecation etc. Dis moi juste si je dois nettoyer DB / indexdb.