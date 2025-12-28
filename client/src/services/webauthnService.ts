// WebAuthn service for authentication

const getBackendUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:3000';
  } else {
    // Production backend (skeleton - to be implemented)
    return 'https://api.blinder.example.com';
  }
};

export interface WebAuthnRegisterRequest {
  phone: string;
  username?: string;
}

export interface WebAuthnRegisterResponse {
  success: boolean;
  message: string;
  challenge?: string;
}

export interface WebAuthnAuthenticateRequest {
  phone: string;
  credentialId?: string;
}

export interface WebAuthnAuthenticateResponse {
  success: boolean;
  message: string;
  challenge?: string;
}

// Convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64url
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Start WebAuthn registration
export async function startWebAuthnRegistration(phone: string, username?: string): Promise<PublicKeyCredential> {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Get challenge from backend
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/webauthn/register/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, username }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start registration: ${response.statusText}`);
    }

    const data: WebAuthnRegisterResponse = await response.json();
    
    if (!data.success || !data.challenge) {
      throw new Error(data.message || 'Failed to get registration challenge');
    }

    // Convert challenge from base64url to ArrayBuffer
    const challenge = base64urlToArrayBuffer(data.challenge);

    // Create WebAuthn credential
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: "Blinder",
        id: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? 'localhost' 
          : window.location.hostname,
      },
      user: {
        id: new TextEncoder().encode(phone),
        name: username || phone,
        displayName: username || phone,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: "direct",
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Prefer platform authenticators (Touch ID, Face ID, etc.)
        userVerification: "preferred",
      },
    };

    // Create credential using WebAuthn API
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    }) as PublicKeyCredential;

    // Send credential to backend for verification
    const credentialResponse = await fetch(`${backendUrl}/api/webauthn/register/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        credential_id: arrayBufferToBase64url(credential.rawId),
        response: {
          client_data_json: arrayBufferToBase64url(credential.response.clientDataJSON),
          attestation_object: arrayBufferToBase64url((credential.response as AuthenticatorAttestationResponse).attestationObject),
        },
      }),
    });

    if (!credentialResponse.ok) {
      throw new Error(`Failed to complete registration: ${credentialResponse.statusText}`);
    }

    const result = await credentialResponse.json();
    if (!result.success) {
      throw new Error(result.message || 'Registration failed');
    }

    return credential;
  } else {
    // Production backend (skeleton)
    throw new Error('Production WebAuthn not yet implemented');
  }
}

// Start WebAuthn authentication
export async function startWebAuthnAuthentication(phone: string): Promise<PublicKeyCredential> {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Get challenge from backend
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/webauthn/authenticate/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start authentication: ${response.statusText}`);
    }

    const data: WebAuthnAuthenticateResponse = await response.json();
    
    if (!data.success || !data.challenge) {
      throw new Error(data.message || 'Failed to get authentication challenge');
    }

    // Convert challenge from base64url to ArrayBuffer
    const challenge = base64urlToArrayBuffer(data.challenge);

    // Get credential ID from backend (if available)
    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
    if (data.challenge) {
      // For now, we'll let the browser find the credential
      // In a real implementation, you'd pass the credential ID here
      allowCredentials = undefined;
    }

    // Create WebAuthn assertion request
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challenge,
      timeout: 60000,
      userVerification: "preferred",
      allowCredentials: allowCredentials,
    };

    // Get assertion using WebAuthn API
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    }) as PublicKeyCredential;

    // Send assertion to backend for verification
    const assertionResponse = await fetch(`${backendUrl}/api/webauthn/authenticate/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        credential_id: arrayBufferToBase64url(assertion.rawId),
        response: {
          client_data_json: arrayBufferToBase64url(assertion.response.clientDataJSON),
          authenticator_data: arrayBufferToBase64url((assertion.response as AuthenticatorAssertionResponse).authenticatorData),
          signature: arrayBufferToBase64url((assertion.response as AuthenticatorAssertionResponse).signature),
          user_handle: (assertion.response as AuthenticatorAssertionResponse).userHandle 
            ? arrayBufferToBase64url((assertion.response as AuthenticatorAssertionResponse).userHandle!) 
            : null,
        },
      }),
    });

    if (!assertionResponse.ok) {
      throw new Error(`Failed to complete authentication: ${assertionResponse.statusText}`);
    }

    const result = await assertionResponse.json();
    if (!result.success) {
      throw new Error(result.message || 'Authentication failed');
    }

    return assertion;
  } else {
    // Production backend (skeleton)
    throw new Error('Production WebAuthn not yet implemented');
  }
}

// Check if WebAuthn is supported
export function isWebAuthnSupported(): boolean {
  return typeof window.PublicKeyCredential !== 'undefined';
}

