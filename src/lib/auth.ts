import { Agent } from '../types';

const TOKEN_KEY = 'pixbe_auth_token';
const USER_KEY = 'pixbe_auth_user';

export async function loginWithApi(email: string, password?: string): Promise<{ success: boolean; user?: Agent; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success && data.user) {
      if (data.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }

    return { success: false, error: data.error || 'Authentication failed' };
  } catch (err: any) {
    console.warn('⚠️ Server auth endpoint unreachable, executing offline fallback:', err?.message || err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

export async function verifyCurrentSession(): Promise<Agent | null> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        return JSON.parse(storedUser) as Agent;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user as Agent;
      }
    }
  } catch (e) {
    console.warn('⚠️ Session verification notice:', e);
  }

  const storedUser = localStorage.getItem(USER_KEY);
  if (storedUser) {
    try {
      return JSON.parse(storedUser) as Agent;
    } catch (e) {
      return null;
    }
  }

  return null;
}

export async function logoutWithApi(): Promise<void> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (e) {
      console.warn('Logout API notice:', e);
    }
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
