import React, { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import {
  BatteryCharging,
  Bell,
  ArrowLeft,
  CheckCircle2,
  Circle,
  FolderOpen,
  Loader2,
  Mic,
  Phone,
  PhoneCall,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { CallTracker, type CallTrackerPermissions, type PermissionGroup } from '../lib/callTracker';
import { TEST_CALL_PREFIX } from '../hooks/useCallTracker';
import { nativePlatform } from '../lib/platform';

interface PermissionsSetupPageProps {
  onClose: () => void;
}

const OEM_RECORDING_STEPS: Array<{ match: RegExp; label: string; steps: string[] }> = [
  {
    match: /samsung/,
    label: 'Samsung',
    steps: ['Open the Phone app', 'Tap the 3 dots, then Settings', 'Record calls', 'Turn on "Auto record calls" for all calls'],
  },
  {
    match: /xiaomi|redmi|poco/,
    label: 'Xiaomi / Redmi / POCO',
    steps: ['Open the Phone app', 'Tap the 3 dots or gear, then Settings', 'Call recording', 'Turn on "Record calls automatically"'],
  },
  {
    match: /oneplus|oppo|realme/,
    label: 'OnePlus / Oppo / Realme',
    steps: ['Open the Phone app', 'Tap the 3 dots, then Settings', 'Call recording', 'Turn on "Auto record calls" for all numbers'],
  },
  {
    match: /vivo|iqoo/,
    label: 'Vivo / iQOO',
    steps: ['Open the Phone app', 'Settings, then Call recording', 'Turn on "Auto record all calls"'],
  },
  {
    match: /google/,
    label: 'Google Pixel',
    steps: [
      'Pixel phones keep call recordings private to the Phone app, so the CRM cannot upload them.',
      'Calls and talk time are still logged automatically.',
    ],
  },
];

const AUTOSTART_BRANDS = /xiaomi|redmi|poco|oppo|realme|vivo|iqoo|oneplus|huawei|honor/;

const granted = (s?: string) => s === 'granted';

export const PermissionsSetupPage: React.FC<PermissionsSetupPageProps> = ({ onClose }) => {
  const [perms, setPerms] = useState<CallTrackerPermissions | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [testNumber, setTestNumber] = useState('');
  const [testState, setTestState] = useState<'idle' | 'calling' | 'searching' | 'done'>('idle');
  const [testResult, setTestResult] = useState<{ durationSec: number; source: string; recording?: string } | null>(null);
  const testCallId = useRef('');

  const refresh = useCallback(async () => {
    try {
      setPerms(await CallTracker.checkPermissions());
    } catch {
      setPerms(null);
    }
  }, []);

  useEffect(() => {
    refresh();
    const sub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) refresh();
    });
    return () => {
      sub.then((s) => s.remove()).catch(() => {});
    };
  }, [refresh]);

  useEffect(() => {
    const sub = CallTracker.addListener('callEnded', async (event) => {
      if (!testCallId.current || event.callId !== testCallId.current) return;
      testCallId.current = '';
      setTestState('searching');
      const startMs = new Date(event.startedAt).getTime();
      const endMs = new Date(event.endedAt).getTime();
      let recording: string | undefined;
      for (let i = 0; i < 8 && !recording && event.durationSec > 0; i++) {
        const res = await CallTracker.findRecording({ number: event.number, startMs, endMs }).catch(() => ({ found: false }));
        if (res.found) recording = (res as { name?: string }).name || 'recording file';
        else await new Promise((r) => setTimeout(r, 10_000));
      }
      setTestResult({ durationSec: event.durationSec, source: event.source, recording });
      setTestState('done');
    });
    return () => {
      sub.then((s) => s.remove()).catch(() => {});
    };
  }, []);

  const request = async (key: string, groups: PermissionGroup[]) => {
    setBusy(key);
    try {
      setPerms(await CallTracker.requestPermissions({ groups }));
    } finally {
      setBusy('');
    }
  };

  const openSettings = async (target: 'app' | 'battery' | 'dialer' | 'autostart') => {
    await CallTracker.openSettings({ target }).catch(() => {});
  };

  const pickFolder = async () => {
    setBusy('folder');
    try {
      await CallTracker.pickRecordingFolder();
      await refresh();
    } finally {
      setBusy('');
    }
  };

  const startTestCall = async () => {
    if (!testNumber.trim()) return;
    testCallId.current = `${TEST_CALL_PREFIX}${Date.now()}`;
    setTestResult(null);
    setTestState('calling');
    try {
      const { tracked } = await CallTracker.startCall({
        number: testNumber.trim(),
        callId: testCallId.current,
        uploadRecording: false,
      });
      if (!tracked) {
        setTestState('idle');
        testCallId.current = '';
      }
    } catch {
      setTestState('idle');
      testCallId.current = '';
    }
  };

  const finish = () => {
    onClose();
  };

  if (nativePlatform === 'ios') {
    return (
      <Shell onClose={finish}>
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Calling on iPhone</p>
          <p>Tap Call on any lead to dial it. The CRM logs the call and its talk time automatically when you return to the app.</p>
          <p className="text-slate-500 text-xs">
            iPhone does not allow apps to record phone calls or read the call history, so recordings are only available on Android phones.
          </p>
        </div>
        <button onClick={finish} className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold">
          Continue
        </button>
      </Shell>
    );
  }

  const manufacturer = perms?.manufacturer || '';
  const oem = OEM_RECORDING_STEPS.find((o) => o.match.test(manufacturer));
  const phoneReady = granted(perms?.phone) && granted(perms?.callLog);
  const recordingsReady = granted(perms?.audio) || Boolean(perms?.recordingFolder);
  const readyCount = [phoneReady, granted(perms?.notifications), recordingsReady].filter(Boolean).length;

  return (
    <Shell onClose={finish}>
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">Device readiness</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {readyCount === 3 ? 'This phone is ready for CRM calling' : `${readyCount} of 3 essentials ready`}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Manage Android access here. Initial requests always use Android&apos;s standard permission dialogs.
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-bold text-indigo-700 shadow-sm ring-1 ring-indigo-100">
            {readyCount}/3
          </div>
        </div>
      </div>

      <Step
        icon={<Phone className="w-4 h-4" />}
        title="Phone and call history"
        description="Place calls from the CRM, detect when they end, and read the real talk time."
        done={phoneReady}
      >
        {!phoneReady && (
          <div className="flex gap-2">
            <ActionButton loading={busy === 'phone'} onClick={() => request('phone', ['phone', 'callLog'])}>
              Allow
            </ActionButton>
            {(perms?.phone === 'denied' || perms?.callLog === 'denied') && (
              <ActionButton variant="secondary" onClick={() => openSettings('app')}>
                Open settings
              </ActionButton>
            )}
          </div>
        )}
      </Step>

      <Step
        icon={<Bell className="w-4 h-4" />}
        title="Notifications"
        description='Shows a small "Logging call" notice while a CRM call is being logged.'
        done={granted(perms?.notifications)}
      >
        {!granted(perms?.notifications) && (
          perms?.notifications === 'denied' ? (
            <ActionButton variant="secondary" onClick={() => openSettings('app')}>Open settings</ActionButton>
          ) : (
            <ActionButton loading={busy === 'notifications'} onClick={() => request('notifications', ['notifications'])}>
              Allow
            </ActionButton>
          )
        )}
      </Step>

      <Step
        icon={<Mic className="w-4 h-4" />}
        title="Call recordings"
        description="Lets the CRM find the recording your phone saves after each call and attach it to the lead."
        done={recordingsReady}
      >
        <div className="flex flex-wrap gap-2">
          {!granted(perms?.audio) && (
            perms?.audio === 'denied' ? (
              <ActionButton variant="secondary" onClick={() => openSettings('app')}>Open settings</ActionButton>
            ) : (
              <ActionButton loading={busy === 'audio'} onClick={() => request('audio', ['audio'])}>
                Allow audio access
              </ActionButton>
            )
          )}
          <ActionButton variant="secondary" loading={busy === 'folder'} onClick={pickFolder}>
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{perms?.recordingFolder ? `Folder: ${perms.recordingFolderName}` : 'Select recordings folder'}</span>
          </ActionButton>
        </div>
        <p className="text-[11px] text-slate-500">
          If recordings are not detected after a test call, pick the folder where your phone saves call recordings.
        </p>
      </Step>

      <Step
        icon={<Settings2 className="w-4 h-4" />}
        title="Turn on automatic call recording"
        description={oem ? `On ${oem.label}:` : 'In your phone dialer settings, turn on automatic recording for all calls.'}
        done={false}
        optional
      >
        {oem && (
          <ol className="list-decimal pl-5 text-xs text-slate-600 space-y-0.5">
            {oem.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        <ActionButton variant="secondary" onClick={() => openSettings('dialer')}>
          Open dialer settings
        </ActionButton>
      </Step>

      <Step
        icon={<BatteryCharging className="w-4 h-4" />}
        title="Battery and background"
        description="Stops the phone from closing the CRM in the middle of logging a call."
        done={Boolean(perms?.batteryUnrestricted)}
        optional
      >
        <div className="flex flex-wrap gap-2">
          {!perms?.batteryUnrestricted && (
            <ActionButton variant="secondary" onClick={() => openSettings('battery')}>
              Battery settings
            </ActionButton>
          )}
          {AUTOSTART_BRANDS.test(manufacturer) && (
            <ActionButton variant="secondary" onClick={() => openSettings('autostart')}>
              Allow autostart
            </ActionButton>
          )}
        </div>
      </Step>

      <Step
        icon={<PhoneCall className="w-4 h-4" />}
        title="Test call"
        description="Call your own second number or a colleague. Test calls are not saved to the CRM."
        done={testState === 'done' && Boolean(testResult?.recording)}
        optional
      >
        <div className="flex gap-2">
          <input
            type="tel"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            placeholder="Phone number"
            className="flex-1 min-w-0 border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <ActionButton loading={testState === 'calling' || testState === 'searching'} onClick={startTestCall} disabled={!phoneReady}>
            Call
          </ActionButton>
        </div>
        {testState === 'searching' && <p className="text-xs text-slate-500">Call ended. Looking for the recording...</p>}
        {testState === 'done' && testResult && (
          <div className="text-xs space-y-0.5">
            <p className="text-emerald-700">
              Call detected: {testResult.durationSec}s talk time ({testResult.source === 'call_log' ? 'from call history' : 'estimated'}).
            </p>
            {testResult.recording ? (
              <p className="text-emerald-700">Recording found: {testResult.recording}</p>
            ) : testResult.durationSec > 0 ? (
              <p className="text-amber-700">
                No recording found. Check that automatic call recording is on, or select the recordings folder above.
              </p>
            ) : (
              <p className="text-amber-700">The call was not answered, so there is nothing to record. Try again with a longer call.</p>
            )}
          </div>
        )}
      </Step>

      <button onClick={finish} className="min-h-11 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 active:bg-indigo-800">
        Back to CRM
      </button>
    </Shell>
  );
};

const Shell: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="mx-auto w-full max-w-3xl px-3 py-3 sm:px-2 sm:py-0">
    <div className="space-y-3 pb-3 sm:space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
        <button onClick={onClose} aria-label="Back to CRM" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">Device Permissions</h1>
            <p className="text-xs text-slate-500">Calling, notifications and recordings</p>
          </div>
        </div>
      </div>
      {children}
    </div>
  </div>
);

const Step: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  done: boolean;
  optional?: boolean;
  children?: React.ReactNode;
}> = ({ icon, title, description, done, optional, children }) => (
  <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {done ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : optional ? (
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">Recommended</span>
          ) : (
            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
          )}
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
    {children && <div className="space-y-2.5 sm:pl-11">{children}</div>}
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}> = ({ onClick, loading, disabled, variant = 'primary', children }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`inline-flex min-h-11 items-center justify-center space-x-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold disabled:opacity-50 ${
      variant === 'primary'
        ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
    }`}
  >
    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
    {children}
  </button>
);
