import { toast } from '../context/ToastContext';
import { TOKEN_KEY, USER_KEY } from './auth';
import { CallTracker } from './callTracker';
import { requestPermissionsForCall } from './devicePermissions';
import { API_BASE, isNative } from './platform';

export const OPEN_PHONE_SETUP_EVENT = 'pixbe:open-phone-setup';

export function openPhoneSetup(): void {
  window.dispatchEvent(new Event(OPEN_PHONE_SETUP_EVENT));
}

export interface DialContext {
  leadId?: string;
  leadName?: string;
}

interface PendingCall extends DialContext {
  phone: string;
  startedAt: string;
}

const PENDING_KEY = 'pixbe_pending_calls';
let recordingEnabled = true;

export function setRecordingEnabled(enabled: boolean): void {
  recordingEnabled = enabled;
}

export function isRecordingEnabled(): boolean {
  return recordingEnabled;
}

export function phoneTail(phone: string | undefined | null): string {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function readPending(): Record<string, PendingCall> {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePending(map: Record<string, PendingCall>): void {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const trimmed = Object.fromEntries(
      Object.entries(map).filter(([, p]) => new Date(p.startedAt).getTime() > cutoff)
    );
    localStorage.setItem(PENDING_KEY, JSON.stringify(trimmed));
  } catch {}
}

/** Lead context captured at dial time, consumed once the call-ended event arrives. */
export function takePendingCall(callId: string): PendingCall | undefined {
  const map = readPending();
  const pending = map[callId];
  if (pending) {
    delete map[callId];
    writePending(map);
  }
  return pending;
}

/** Give the native upload worker the current session so it can post recordings on its own. */
export async function syncNativeAuth(): Promise<void> {
  if (!isNative) return;
  try {
    const token = sessionStorage.getItem(TOKEN_KEY) || '';
    const user = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null');
    if (!token || !user?.tenantId) {
      await CallTracker.setAuth({ clear: true });
      return;
    }
    await CallTracker.setAuth({ apiBase: API_BASE, token, tenantId: user.tenantId });
  } catch (err) {
    console.warn('[calling] setAuth failed', err);
  }
}

export async function clearNativeAuth(): Promise<void> {
  if (!isNative) return;
  await CallTracker.setAuth({ clear: true }).catch(() => {});
}

/** Place a call. On the mobile app the call is tracked and its recording attached to the lead. */
export async function dialNumber(phone: string, ctx: DialContext = {}): Promise<void> {
  const number = String(phone || '').trim();
  if (!number) return;

  if (!isNative) {
    window.location.href = `tel:${number}`;
    return;
  }

  const callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const map = readPending();
  map[callId] = { ...ctx, phone: number, startedAt: new Date().toISOString() };
  writePending(map);

  await syncNativeAuth();
  try {
    await requestPermissionsForCall({ includeRecording: recordingEnabled }).catch((err) => {
      console.warn('[calling] permission check failed', err);
    });
    const { tracked } = await CallTracker.startCall({
      number,
      callId,
      leadId: ctx.leadId,
      uploadRecording: recordingEnabled,
    });
    if (!tracked) {
      takePendingCall(callId);
      toast.warning('This call will not be logged until Phone access is allowed.', 'Call tracking off');
      openPhoneSetup();
    }
  } catch (err) {
    takePendingCall(callId);
    throw err;
  }
}

let telInterceptorInstalled = false;

/** Route every `<a href="tel:...">` in the app through `dialNumber` so those calls are tracked too. */
export function installTelLinkInterceptor(): void {
  if (!isNative || telInterceptorInstalled) return;
  telInterceptorInstalled = true;
  document.addEventListener(
    'click',
    (event) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[href^="tel:"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      event.preventDefault();
      const number = decodeURIComponent(anchor.getAttribute('href')!.slice(4));
      dialNumber(number).catch((err) => console.warn('[calling] dial failed', err));
    },
    true
  );
}
