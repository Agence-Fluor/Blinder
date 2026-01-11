// Profile sharing service - generate QR code for adding friends

import QRCode from 'qrcode';

export interface ProfileShareData {
  action: 'add_friend';
  phone: string;
  displayName?: string; // Optional display name to pre-configure
  publicKey?: string; // Optional messaging public key (X25519)
}

// Generate QR code for sharing profile
export async function generateProfileShareQRCode(
  phone: string,
  publicKey?: CryptoKey,
  displayName?: string
): Promise<{ qrSvg: string; qrData: string }> {
  // Export public key if provided
  let publicKeyStr: string | undefined;
  if (publicKey) {
    const keyBytes = await crypto.subtle.exportKey('raw', publicKey);
    publicKeyStr = btoa(String.fromCharCode(...new Uint8Array(keyBytes)));
  }

  const qrData: ProfileShareData = {
    action: 'add_friend',
    phone,
    displayName,
    publicKey: publicKeyStr,
  };

  const qrSvg = await QRCode.toString(JSON.stringify(qrData), {
    type: 'svg',
    width: 300,
    margin: 2,
  });

  return { qrSvg, qrData: JSON.stringify(qrData) };
}

// Parse profile share QR code
export function parseProfileShareQRCode(qrDataString: string): ProfileShareData | null {
  try {
    const data = JSON.parse(qrDataString) as ProfileShareData;
    
    if (data.action === 'add_friend' && data.phone) {
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing profile share QR code:', error);
    return null;
  }
}

