// Call API service for managing calls

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface InitiateCallRequest {
  from: string;
  to: string;
}

export interface InitiateCallResponse {
  success: boolean;
  callId: string;
  message: string;
}

export interface EndCallRequest {
  callId: string;
  from: string;
  to: string;
}

export interface EndCallResponse {
  success: boolean;
  message: string;
}

// Initiate a call
export async function initiateCall(
  from: string,
  to: string
): Promise<InitiateCallResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calls/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to } as InitiateCallRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to initiate call: ${response.statusText}`);
  }

  return response.json();
}

// End a call
export async function endCall(
  callId: string,
  from: string,
  to: string
): Promise<EndCallResponse> {
  const response = await fetch(`${API_BASE_URL}/api/calls/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ callId, from, to } as EndCallRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to end call: ${response.statusText}`);
  }

  return response.json();
}

