import { CallTracker, type CallTrackerPermissions, type PermissionGroup } from './callTracker';
import { isNative, nativePlatform } from './platform';

const INITIAL_PERMISSION_PROMPT_KEY = 'pixbe_android_permission_prompt_v2';

const canPrompt = (state: string | undefined) =>
  state === 'prompt' || state === 'prompt-with-rationale';

function markInitialPromptAttempted(): void {
  try {
    localStorage.setItem(INITIAL_PERMISSION_PROMPT_KEY, new Date().toISOString());
  } catch {}
}

function hasAttemptedInitialPrompt(): boolean {
  try {
    return Boolean(localStorage.getItem(INITIAL_PERMISSION_PROMPT_KEY));
  } catch {
    return false;
  }
}

/**
 * Requests only the permissions needed to reliably log calls. Android renders
 * its own permission dialogs; this function never opens an in-app rationale UI.
 */
export async function requestInitialAndroidPermissions(): Promise<CallTrackerPermissions | null> {
  if (!isNative || nativePlatform !== 'android' || hasAttemptedInitialPrompt()) return null;

  const current = await CallTracker.checkPermissions();
  const groups: PermissionGroup[] = [];

  if (canPrompt(current.phone)) groups.push('phone');
  if (canPrompt(current.callLog)) groups.push('callLog');
  if (canPrompt(current.notifications)) groups.push('notifications');

  const result = groups.length ? await CallTracker.requestPermissions({ groups }) : current;
  markInitialPromptAttempted();
  return result;
}

/**
 * Re-checks access at the point a call feature is used. Promptable permissions
 * use Android's native dialogs; permanently denied access is handled by the
 * Device Permissions page and the plugin's dialer fallback.
 */
export async function requestPermissionsForCall(options: {
  includeRecording: boolean;
}): Promise<CallTrackerPermissions | null> {
  if (!isNative || nativePlatform !== 'android') return null;

  const current = await CallTracker.checkPermissions();
  const groups: PermissionGroup[] = [];

  if (canPrompt(current.phone)) groups.push('phone');
  if (canPrompt(current.callLog)) groups.push('callLog');
  if (canPrompt(current.notifications)) groups.push('notifications');
  if (
    options.includeRecording &&
    !current.recordingFolder &&
    canPrompt(current.audio)
  ) {
    groups.push('audio');
  }

  return groups.length ? CallTracker.requestPermissions({ groups }) : current;
}
