import { useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { CallTracker, type CallEndedEvent, type RecordingUploadedEvent } from '../lib/callTracker';
import { installTelLinkInterceptor, isRecordingEnabled, syncNativeAuth, takePendingCall } from '../lib/calling';
import { isNative } from '../lib/platform';

const PROCESSED_KEY = 'pixbe_processed_calls';
/** Test calls from the setup screen are never logged to the CRM. */
export const TEST_CALL_PREFIX = 'test-';

function alreadyProcessed(callId: string): boolean {
  try {
    const ids: string[] = JSON.parse(localStorage.getItem(PROCESSED_KEY) || '[]');
    if (ids.includes(callId)) return true;
    localStorage.setItem(PROCESSED_KEY, JSON.stringify([callId, ...ids].slice(0, 200)));
    return false;
  } catch {
    return false;
  }
}

export interface TrackedCall {
  event: CallEndedEvent;
  leadId?: string;
  leadName?: string;
  phone: string;
  recordingEnabled: boolean;
}

/**
 * Native-only: receives call-ended events from the CallTracker plugin (live, or queued while
 * the app was closed) and hands each one to the app exactly once.
 */
export function useCallTracker(
  enabled: boolean,
  onCallEnded: (call: TrackedCall) => void,
  onRecordingUploaded: (event: RecordingUploadedEvent) => void
): void {
  const endedRef = useRef(onCallEnded);
  const uploadedRef = useRef(onRecordingUploaded);
  endedRef.current = onCallEnded;
  uploadedRef.current = onRecordingUploaded;

  useEffect(() => {
    if (!isNative || !enabled) return;
    installTelLinkInterceptor();
    syncNativeAuth();

    const handle = (event: CallEndedEvent) => {
      if (!event?.callId || event.callId.startsWith(TEST_CALL_PREFIX) || alreadyProcessed(event.callId)) return;
      const pending = takePendingCall(event.callId);
      endedRef.current({
        event,
        leadId: event.leadId || pending?.leadId,
        leadName: pending?.leadName,
        phone: event.number || pending?.phone || '',
        recordingEnabled: isRecordingEnabled(),
      });
    };

    const drain = () =>
      CallTracker.drainCallEvents()
        .then(({ events }) => (events || []).forEach(handle))
        .catch(() => {});

    const handles = [
      CallTracker.addListener('callEnded', (event) => {
        handle(event);
        drain();
      }),
      CallTracker.addListener('recordingUploaded', (event) => uploadedRef.current(event)),
      CapApp.addListener('appStateChange', ({ isActive }) => {
        if (!isActive) return;
        syncNativeAuth();
        drain();
      }),
    ];
    drain();

    return () => {
      handles.forEach((h) => h.then((l) => l.remove()).catch(() => {}));
    };
  }, [enabled]);
}
