// WebRTC service for voice/video calls with ED25519 authentication

// Get backend URLs - use backend server, not frontend dev server
const getBackendUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000';
  } else {
    return `https://${hostname}:3000`;
  }
};

const getWebSocketUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'ws://127.0.0.1:3000';
  } else {
    // Production: convert https:// to wss:// or http:// to ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${hostname}:3000`;
  }
};

const API_BASE_URL = import.meta.env.VITE_API_URL || getBackendUrl();
const WS_BASE_URL = import.meta.env.VITE_WS_URL || getWebSocketUrl();

import { signWithIdentityKey, verifyIdentitySignature, getIdentityPublicKey } from './identityKeyService';

export interface CallOffer {
  callId: string;
  from: string; // phone number
  to: string; // phone number
  offer: RTCSessionDescriptionInit;
}

export interface CallAnswer {
  callId: string;
  answer: RTCSessionDescriptionInit;
}

export interface ICECandidate {
  callId: string;
  candidate: RTCIceCandidateInit;
}

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private localStream: MediaStream | null = null;
  private callId: string | null = null;
  private fromPhone: string | null = null;
  private toPhone: string | null = null;

  // Initialize WebRTC connection
  async initializeCall(
    fromPhone: string,
    toPhone: string,
    callId: string
  ): Promise<void> {
    this.fromPhone = fromPhone;
    this.toPhone = toPhone;
    this.callId = callId;

    // Create peer connection
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // TODO: Add TURN servers for production
      ],
    });

    // Get local media stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false, // Voice only for now
      });

      // Add tracks to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Impossible d\'accéder au microphone');
    }

    // Connect to signaling server
    await this.connectSignaling(callId);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ice_candidate',
          callId,
          candidate: event.candidate,
        }));
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      // Remote stream received
      const remoteStream = event.streams[0];
      // Emit event for UI to handle
      window.dispatchEvent(new CustomEvent('remote-stream', { detail: remoteStream }));
    };
  }

  // Connect to WebSocket signaling server
  private async connectSignaling(callId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${WS_BASE_URL}/ws/call?callId=${callId}&from=${this.fromPhone}&to=${this.toPhone}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected for call signaling');
        resolve();
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'offer':
            await this.handleOffer(
              message.offer,
              message.signature,
              message.identityPublicKey
            );
            break;
          case 'answer':
            await this.handleAnswer(
              message.answer,
              message.signature,
              message.identityPublicKey
            );
            break;
          case 'ice_candidate':
            await this.handleICECandidate(message.candidate);
            break;
          case 'call_ended':
            this.endCall();
            break;
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
      };
    });
  }

  // Create and send offer with ED25519 signature
  async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Sign the SDP with identity key to prevent MITM
    const sdpString = offer.sdp || '';
    const { signature, publicKey } = await signWithIdentityKey(sdpString);

    // Send offer via WebSocket with signature
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'offer',
        callId: this.callId,
        offer,
        signature: Array.from(signature),
        identityPublicKey: Array.from(publicKey),
      }));
    }
  }

  // Handle incoming offer with ED25519 signature verification
  async handleOffer(
    offer: RTCSessionDescriptionInit,
    signature?: number[],
    identityPublicKey?: number[]
  ): Promise<void> {
    if (!this.peerConnection) return;

    // Verify signature if provided
    if (signature && identityPublicKey && offer.sdp) {
      const isValid = await verifyIdentitySignature(
        offer.sdp,
        new Uint8Array(signature),
        new Uint8Array(identityPublicKey)
      );

      if (!isValid) {
        console.error('Invalid SDP signature! Possible MITM attack.');
        throw new Error('Invalid signature on SDP offer');
      }
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    // Sign the answer SDP
    const sdpString = answer.sdp || '';
    const { signature: answerSignature, publicKey } = await signWithIdentityKey(sdpString);

    // Send answer via WebSocket with signature
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'answer',
        callId: this.callId,
        answer,
        signature: Array.from(answerSignature),
        identityPublicKey: Array.from(publicKey),
      }));
    }
  }

  // Handle incoming answer with ED25519 signature verification
  async handleAnswer(
    answer: RTCSessionDescriptionInit,
    signature?: number[],
    identityPublicKey?: number[]
  ): Promise<void> {
    if (!this.peerConnection) return;

    // Verify signature if provided
    if (signature && identityPublicKey && answer.sdp) {
      const isValid = await verifyIdentitySignature(
        answer.sdp,
        new Uint8Array(signature),
        new Uint8Array(identityPublicKey)
      );

      if (!isValid) {
        console.error('Invalid SDP signature! Possible MITM attack.');
        throw new Error('Invalid signature on SDP answer');
      }
    }

    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  // Handle ICE candidate
  async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // End call
  endCall(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.callId = null;
    this.fromPhone = null;
    this.toPhone = null;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}

// Singleton instance
const webrtcManager = new WebRTCManager();

// Start a call
export async function startCall(
  fromPhone: string,
  toPhone: string
): Promise<string> {
  const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  await webrtcManager.initializeCall(fromPhone, toPhone, callId);
  await webrtcManager.createOffer();
  return callId;
}

// Answer a call
export async function answerCall(
  fromPhone: string,
  toPhone: string,
  callId: string
): Promise<void> {
  await webrtcManager.initializeCall(fromPhone, toPhone, callId);
  // Answer will be sent when offer is received
}

// End call
export function endCall(): void {
  webrtcManager.endCall();
}

// Get local stream
export function getLocalStream(): MediaStream | null {
  return webrtcManager.getLocalStream();
}

