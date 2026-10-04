/**
 * Google OAuth2 Token Management
 * Handles access token refresh for Google Classroom and Google Drive APIs
 */

let cachedAccessToken: string | null = null;
let tokenExpiryTimestamp: number = 0;

export async function getGoogleAccessToken(forceRefresh = false): Promise<string> {
  const now = Date.now();

  // Return cached token if valid for at least another 60 seconds
  if (!forceRefresh && cachedAccessToken && tokenExpiryTimestamp > now + 60_000) {
    return cachedAccessToken;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing Google OAuth2 credentials. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set.'
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google OAuth token refresh failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const accessToken = data.access_token as string;
  const expiresInSeconds = (data.expires_in as number) || 3600;

  cachedAccessToken = accessToken;
  tokenExpiryTimestamp = now + expiresInSeconds * 1000;

  return accessToken;
}
