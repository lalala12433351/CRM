import { Agent, RegisterPayload } from '../types';

export const TOKEN_KEY = 'pixbe_auth_token';
export const USER_KEY = 'pixbe_auth_user';

/**
 * Remove all stored authentication credentials, tokens, and session keys from localStorage
 * to ensure that opening the application always prompts for login.
 */
export function clearLocalStorageAuth(): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('pixbe_current_user');
    
    // Purge any temporary OTP keys in localStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('pixbe_otp_') || key.startsWith('token_') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Notice clearing local storage auth:', e);
  }
}

function clearSessionAuth(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('pixbe_current_user');
  } catch (e) {}
}

function persistSessionUser(user: Agent, token?: string): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.removeItem('pixbe_current_user');
  } catch (e) {}
}

// Immediately purge any stale credentials from localStorage upon module load
clearLocalStorageAuth();

export async function sendVerificationOtp(
  email: string,
  phone: string,
  extras?: { password?: string; name?: string; resend?: boolean }
): Promise<{ success: boolean; demoOtp?: string; via?: string; error?: string }> {
  try {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        phone,
        password: extras?.password,
        name: extras?.name,
        resend: extras?.resend
      }),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, demoOtp: data.demoOtp, via: data.via };
    }
    return { success: false, error: data.error || 'Failed to send OTP' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send OTP. Is the server running?' };
  }
}

export async function verifyRegistrationOtp(email: string, phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, otp }),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || 'Invalid verification code' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'OTP verification failed. Is the server running?' };
  }
}

export async function registerClientAccount(payload: RegisterPayload): Promise<{ success: boolean; user?: Agent; tenantId?: string; error?: string }> {
  clearLocalStorageAuth();
  clearSessionAuth();
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success && data.user) {
      persistSessionUser(data.user, data.token);
      return { success: true, user: data.user, tenantId: data.tenantId };
    }

    return { success: false, error: data.error || 'Registration failed' };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Registration failed. Please ensure the CRM server is running and try again.'
    };
  }
}

export async function loginWithApi(email: string, password?: string): Promise<{ success: boolean; user?: Agent; error?: string }> {
  clearLocalStorageAuth();
  clearSessionAuth();
  const cleanEmail = (email || '').trim().toLowerCase();
  const inputPass = (password || '').trim();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password: inputPass }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.user) {
      persistSessionUser(data.user, data.token);
      return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Invalid email or password. Please verify your credentials.' };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unable to reach the CRM server. Start the backend and try again.'
    };
  }
}

/** Verify browser session against the server; clears stale tokens on failure. */
export async function verifyCurrentSession(): Promise<Agent | null> {
  clearLocalStorageAuth();
  if (typeof sessionStorage === 'undefined') return null;

  const storedUser = sessionStorage.getItem(USER_KEY);
  const token = sessionStorage.getItem(TOKEN_KEY) || '';
  if (!storedUser || !token) {
    clearSessionAuth();
    return null;
  }

  try {
    const ok = await ensureServerSession();
    if (!ok) {
      clearSessionAuth();
      return null;
    }

    const me = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem(TOKEN_KEY) || token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!me.ok) {
      clearSessionAuth();
      return null;
    }
    const data = await me.json();
    if (data?.success && data.user) {
      persistSessionUser(data.user);
      return data.user as Agent;
    }
    clearSessionAuth();
    return null;
  } catch {
    clearSessionAuth();
    return null;
  }
}

export async function logoutWithApi(): Promise<void> {
  clearLocalStorageAuth();
  clearSessionAuth();
}

export function getAuthHeaders(): Record<string, string> {
  const token = typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem(TOKEN_KEY) || '') : '';
  const sessionStored = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(USER_KEY) : null;
  let tenantId = 'default_tenant';
  if (sessionStored) {
    try {
      const user = JSON.parse(sessionStored);
      if (user.tenantId) tenantId = user.tenantId;
    } catch {}
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    'x-tenant-id': tenantId
  };
}

/** Re-bind browser token to server after restart so creates/fetches keep working. */
export async function ensureServerSession(): Promise<boolean> {
  if (typeof sessionStorage === 'undefined') return false;
  const token = sessionStorage.getItem(TOKEN_KEY) || '';
  const rawUser = sessionStorage.getItem(USER_KEY);
  if (!token || !rawUser) return false;

  // Reject offline / non-server tokens — they cannot mutate the database
  const isJwt = token.split('.').length === 3 && !token.startsWith('pixbe_token_');
  const isLegacyServerToken = token.startsWith('pixbe_token_') && !token.startsWith('pixbe_token_offline_');
  if (!isJwt && !isLegacyServerToken) {
    clearSessionAuth();
    return false;
  }

  try {
    const me = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    if (me.ok) {
      const data = await me.json().catch(() => ({}));
      if (data?.user) persistSessionUser(data.user);
      return true;
    }

    const user = JSON.parse(rawUser);
    const restored = await fetch('/api/auth/restore', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'x-tenant-id': user.tenantId || ''
      },
      body: JSON.stringify({ token, user })
    });
    if (!restored.ok) return false;
    const data = await restored.json();
    if (data?.token && data?.user) {
      persistSessionUser(data.user, data.token);
      return Boolean(data?.success);
    }
    return false;
  } catch {
    return false;
  }
}

export async function fetchWithTenantAuth(url: string, options?: RequestInit): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options?.headers || {})
  };
  let response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    const ok = await ensureServerSession();
    if (ok) {
      const retryHeaders = {
        ...getAuthHeaders(),
        ...(options?.headers || {})
      };
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }
  return response;
}
