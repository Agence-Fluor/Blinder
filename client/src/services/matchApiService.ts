// API service for matching backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface MatchRequest {
  phone: string;
  age: number;
  gender: string;
  department: string;
  interests: string[];
}

export interface MatchResponse {
  success: boolean;
  matches: Array<{
    phone: string;
    encryptedAge: string; // Base64 encoded encrypted age
    encryptedDepartment: string; // Base64 encoded encrypted department
    avatarUrl: string; // Cartoon avatar URL
    matchId: string;
  }>;
  message: string;
}

// Get matches from backend
export async function getMatches(profile: MatchRequest): Promise<MatchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/matches/get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(`Failed to get matches: ${response.statusText}`);
  }

  return response.json();
}

// Send match request
export async function requestMatch(profile: MatchRequest): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/matches/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error(`Failed to request match: ${response.statusText}`);
  }

  return response.json();
}

