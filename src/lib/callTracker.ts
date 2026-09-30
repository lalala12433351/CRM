import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale' | 'unsupported';

export interface CallTrackerPermissions {
  phone: PermissionState;
  callLog: PermissionState;
  contacts: PermissionState;
  audio: PermissionState;
  notifications: PermissionState;
  /** A recorder folder has been granted through the system folder picker. */
  recordingFolder: boolean;
  recordingFolderName?: string;
  batteryUnrestricted: boolean;
  manufacturer: string;
  sdkInt: number;
}

export type PermissionGroup = 'phone' | 'callLog' | 'contacts' | 'audio' | 'notifications';

export interface CallEndedEvent {
  callId: string;
  leadId?: string;
  number: string;
  type: 'outgoing' | 'incoming' | 'missed' | 'rejected' | 'unanswered' | 'unknown';
  durationSec: number;
  startedAt: string;
  endedAt: string;
  simSlot?: number;
  recordingFound: boolean;
  /** Where duration came from: Android call log, phone-state timestamps, or iOS CallKit observer. */
  source: 'call_log' | 'phone_state' | 'call_observer';
}

export interface RecordingUploadedEvent {
  callId: string;
  status: 'uploaded' | 'not_found' | 'failed' | 'disabled';
}

export interface CallTrackerPlugin {
  /** `tracked` is false when Phone permission is missing: the dialer opens but the call is not logged. */
  startCall(options: {
    number: string;
    callId: string;
    leadId?: string;
    uploadRecording: boolean;
  }): Promise<{ tracked: boolean; directDial?: boolean }>;
  checkPermissions(): Promise<CallTrackerPermissions>;
  requestPermissions(options: { groups: PermissionGroup[] }): Promise<CallTrackerPermissions>;
  openSettings(options: { target: 'app' | 'battery' | 'dialer' | 'autostart' }): Promise<void>;
  pickRecordingFolder(): Promise<{ uri?: string; name?: string }>;
  findRecording(options: { number: string; startMs: number; endMs: number }): Promise<{ found: boolean; name?: string }>;
  setAuth(options: { apiBase: string; token: string; tenantId: string } | { clear: true }): Promise<void>;
  /** Call-ended events captured while the WebView was not listening (app killed or backgrounded). */
  drainCallEvents(): Promise<{ events: CallEndedEvent[] }>;
  addListener(eventName: 'callEnded', listener: (event: CallEndedEvent) => void): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'recordingUploaded',
    listener: (event: RecordingUploadedEvent) => void
  ): Promise<PluginListenerHandle>;
}

export const CallTracker = registerPlugin<CallTrackerPlugin>('CallTracker');
