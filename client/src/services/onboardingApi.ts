// API service for onboarding with URL-based backend selection

const getBackendUrl = (): string => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use local backend
    return 'http://127.0.0.1:3000';
  } else {
    // Production backend (skeleton - to be implemented)
    return getProductionBackendUrl();
  }
};

const getProductionBackendUrl = (): string => {
  // Skeleton function for production backend
  // TODO: Implement production backend URL logic
  console.warn('Production backend not yet implemented');
  return 'https://api.blinder.example.com'; // Placeholder
};

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export const sendOtp = async (phone: string): Promise<SendOtpResponse> => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use local backend
    const backendUrl = getBackendUrl();
    const response = await fetch(`${backendUrl}/api/onboarding/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send OTP: ${response.statusText}`);
    }

    return await response.json();
  } else {
    // Production backend (skeleton)
    return sendOtpProduction(phone);
  }
};

export const verifyOtp = async (phone: string, code: string): Promise<VerifyOtpResponse> => {
  const backendUrl = getBackendUrl();
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Use local backend
    const response = await fetch(`${backendUrl}/api/onboarding/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone, code }),
    });

    if (!response.ok) {
      throw new Error(`Failed to verify OTP: ${response.statusText}`);
    }

    return await response.json();
  } else {
    // Production backend (skeleton)
    return verifyOtpProduction(phone, code);
  }
};

// Skeleton functions for production backend
const sendOtpProduction = async (phone: string): Promise<SendOtpResponse> => {
  // TODO: Implement production backend call
  console.warn('Production sendOtp not yet implemented');
  throw new Error('Production backend not yet implemented');
};

const verifyOtpProduction = async (phone: string, code: string): Promise<VerifyOtpResponse> => {
  // TODO: Implement production backend call
  console.warn('Production verifyOtp not yet implemented');
  throw new Error('Production backend not yet implemented');
};

