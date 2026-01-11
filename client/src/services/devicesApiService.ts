// Devices API service for managing registered devices

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface DeviceInfo {
  credential_id: string;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
  is_current: boolean;
}

export interface GetDevicesRequest {
  phone: string;
}

export interface GetDevicesResponse {
  success: boolean;
  devices: DeviceInfo[];
  message: string;
}

export interface DeleteDeviceRequest {
  phone: string;
  credential_id: string;
}

export interface DeleteDeviceResponse {
  success: boolean;
  message: string;
}

// Get list of devices for a phone number
export async function getDevices(phone: string): Promise<GetDevicesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/devices/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phone } as GetDevicesRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to get devices: ${response.statusText}`);
  }

  return response.json();
}

// Delete a device
export async function deleteDevice(phone: string, credentialId: string): Promise<DeleteDeviceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/devices/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      phone,
      credential_id: credentialId,
    } as DeleteDeviceRequest),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete device: ${response.statusText}`);
  }

  return response.json();
}

