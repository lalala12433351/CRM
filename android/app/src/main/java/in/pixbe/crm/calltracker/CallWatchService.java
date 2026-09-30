package in.pixbe.crm.calltracker;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyCallback;
import android.telephony.TelephonyManager;

import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

/**
 * Short-lived foreground service: runs from the moment the agent dials from the CRM until the call
 * has ended and its recording has been matched (or given up on). Never runs outside a CRM call.
 */
public class CallWatchService extends Service {
    static final String EXTRA_CALL_ID = "callId";
    static final String EXTRA_NUMBER = "number";
    static final String EXTRA_LEAD_ID = "leadId";
    static final String EXTRA_UPLOAD = "uploadRecording";

    private static final String CHANNEL_ID = "pixbe_call_logging";
    private static final int NOTIFICATION_ID = 4107;
    /** Stop waiting if the dialer never goes off-hook (agent cancelled before dialing). */
    private static final long DIAL_TIMEOUT_MS = 2 * 60_000L;
    /** Hard cap so the service can never outlive a real call by much. */
    private static final long MAX_CALL_MS = 3 * 60 * 60_000L;
    private static final long RECORDING_RETRY_MS = 15_000L;
    private static final int RECORDING_MAX_TRIES = 9;

    private final Handler main = new Handler(Looper.getMainLooper());
    private HandlerThread workerThread;
    private Handler worker;

    private TelephonyManager telephony;
    private Object callStateListener;

    private String callId;
    private String number;
    private String leadId;
    private boolean uploadRecording;
    private long dialedAt;
    private long offhookAt;
    private boolean finished;
    /** Bumped for every watched call so a finished call's late work cannot stop a newer one. */
    private volatile int generation;

    public static void start(Context ctx, String callId, String number, String leadId, boolean upload) {
        Intent intent = new Intent(ctx, CallWatchService.class)
            .putExtra(EXTRA_CALL_ID, callId)
            .putExtra(EXTRA_NUMBER, number)
            .putExtra(EXTRA_LEAD_ID, leadId)
            .putExtra(EXTRA_UPLOAD, upload);
        ContextCompat.startForegroundService(ctx, intent);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        workerThread = new HandlerThread("pixbe-call-watch");
        workerThread.start();
        worker = new Handler(workerThread.getLooper());
        telephony = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        startInForeground("Logging call to CRM...");
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        // A new CRM call replaces any call still being watched.
        if (callId != null && !finished) finishCall();
        resetState();

        callId = intent.getStringExtra(EXTRA_CALL_ID);
        number = intent.getStringExtra(EXTRA_NUMBER);
        leadId = intent.getStringExtra(EXTRA_LEAD_ID);
        uploadRecording = intent.getBooleanExtra(EXTRA_UPLOAD, true);
        dialedAt = System.currentTimeMillis();

        if (!registerCallStateListener()) {
            stopSelf();
            return START_NOT_STICKY;
        }
        // The dialer may already be off-hook before the listener is registered, and some phones
        // only deliver state changes, not the current state. Read it once so the call is not missed.
        captureCurrentCallState();
        main.postDelayed(dialTimeout, DIAL_TIMEOUT_MS);
        main.postDelayed(maxCallTimeout, MAX_CALL_MS);
        return START_NOT_STICKY;
    }

    private void resetState() {
        main.removeCallbacksAndMessages(null);
        offhookAt = 0;
        finished = false;
        generation++;
    }

    private final Runnable dialTimeout = () -> {
        if (offhookAt == 0) finishCall();
    };

    private final Runnable maxCallTimeout = this::finishCall;

    private void onCallState(int state) {
        if (finished) return;
        if (state == TelephonyManager.CALL_STATE_OFFHOOK && offhookAt == 0) {
            offhookAt = System.currentTimeMillis();
            main.removeCallbacks(dialTimeout);
            updateNotification("Call in progress, logging to CRM");
        } else if (state == TelephonyManager.CALL_STATE_IDLE && offhookAt > 0) {
            // Give the dialer a moment to write the call log entry.
            main.postDelayed(this::finishCall, 2500);
        }
    }

    private void finishCall() {
        if (finished) return;
        finished = true;
        main.removeCallbacksAndMessages(null);
        unregisterCallStateListener();

        final String id = callId;
        final String num = number;
        final String lead = leadId;
        final boolean upload = uploadRecording;
        final long dialed = dialedAt;
        final long offhook = offhookAt;
        final long ended = System.currentTimeMillis();
        final int gen = generation;

        worker.post(() -> {
            JSONObject event = buildEvent(id, num, lead, dialed, offhook, ended, upload);
            CallTrackerPlugin.emitCallEnded(getApplicationContext(), event);

            boolean searching = event.optBoolean("recordingFound", false);
            if (searching) {
                if (gen == generation) updateNotification("Attaching call recording...");
                long start = offhook > 0 ? offhook : dialed;
                searchRecording(id, num, start, ended, 0, gen);
            } else {
                stopIfIdle(gen);
            }
        });
    }

    private void stopIfIdle(int gen) {
        main.post(() -> {
            if (gen == generation && finished) stopService();
        });
    }

    private JSONObject buildEvent(String id, String num, String lead, long dialed, long offhook, long ended, boolean upload) {
        JSONObject event = new JSONObject();
        try {
            CallLogReader.Entry entry = null;
            for (int i = 0; i < 4 && entry == null; i++) {
                entry = CallLogReader.find(this, num, dialed);
                if (entry == null) sleep(1000);
            }

            long durationSec;
            long startedAt;
            String type;
            String source;
            if (entry != null) {
                durationSec = entry.durationSec;
                startedAt = entry.dateMs;
                type = entry.type;
                source = "call_log";
                if (entry.simSlot != null) event.put("simSlot", entry.simSlot);
            } else {
                durationSec = offhook > 0 ? Math.max(0, (ended - offhook) / 1000L) : 0;
                startedAt = offhook > 0 ? offhook : dialed;
                type = offhook > 0 ? "outgoing" : "unanswered";
                source = "phone_state";
            }

            boolean canSearch = upload && durationSec > 0 && RecordingMatcher.hasAudioAccess(this) && CallStore.hasAuth(this);

            event.put("callId", id);
            if (lead != null) event.put("leadId", lead);
            event.put("number", num);
            event.put("type", type);
            event.put("durationSec", durationSec);
            event.put("startedAt", iso(startedAt));
            event.put("endedAt", iso(startedAt + durationSec * 1000L));
            event.put("recordingFound", canSearch);
            event.put("source", source);
        } catch (Exception ignored) {
        }
        return event;
    }

    private void searchRecording(String id, String num, long startMs, long endMs, int attempt, int gen) {
        RecordingMatcher.Match match = RecordingMatcher.find(this, num, startMs, endMs);
        if (match != null) {
            RecordingUploadWorker.enqueueUpload(this, id, match);
            stopIfIdle(gen);
            return;
        }
        if (attempt + 1 >= RECORDING_MAX_TRIES) {
            RecordingUploadWorker.enqueueNotFound(this, id);
            stopIfIdle(gen);
            return;
        }
        worker.postDelayed(() -> searchRecording(id, num, startMs, endMs, attempt + 1, gen), RECORDING_RETRY_MS);
    }

    @SuppressWarnings("deprecation")
    private void captureCurrentCallState() {
        if (telephony == null) return;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        try {
            if (telephony.getCallState() == TelephonyManager.CALL_STATE_OFFHOOK) {
                onCallState(TelephonyManager.CALL_STATE_OFFHOOK);
            }
        } catch (Exception ignored) {
        }
    }

    private boolean registerCallStateListener() {
        if (telephony == null) return false;
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            return false;
        }
        if (Build.VERSION.SDK_INT >= 31) {
            CallStateCallback cb = new CallStateCallback();
            telephony.registerTelephonyCallback(ContextCompat.getMainExecutor(this), cb);
            callStateListener = cb;
        } else {
            LegacyListener l = new LegacyListener();
            telephony.listen(l, PhoneStateListener.LISTEN_CALL_STATE);
            callStateListener = l;
        }
        return true;
    }

    private void unregisterCallStateListener() {
        if (telephony == null || callStateListener == null) return;
        if (Build.VERSION.SDK_INT >= 31 && callStateListener instanceof TelephonyCallback) {
            telephony.unregisterTelephonyCallback((TelephonyCallback) callStateListener);
        } else if (callStateListener instanceof PhoneStateListener) {
            telephony.listen((PhoneStateListener) callStateListener, PhoneStateListener.LISTEN_NONE);
        }
        callStateListener = null;
    }

    @RequiresApi(31)
    private final class CallStateCallback extends TelephonyCallback implements TelephonyCallback.CallStateListener {
        @Override
        public void onCallStateChanged(int state) {
            onCallState(state);
        }
    }

    @SuppressWarnings("deprecation")
    private final class LegacyListener extends PhoneStateListener {
        @Override
        public void onCallStateChanged(int state, String phoneNumber) {
            onCallState(state);
        }
    }

    private void startInForeground(String text) {
        ensureChannel();
        int type = Build.VERSION.SDK_INT >= 34 ? ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE : 0;
        ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(text), type);
    }

    private void updateNotification(String text) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.notify(NOTIFICATION_ID, buildNotification(text));
    }

    private Notification buildNotification(String text) {
        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        android.app.PendingIntent pi = launch == null ? null : android.app.PendingIntent.getActivity(
            this, 0, launch, android.app.PendingIntent.FLAG_IMMUTABLE | android.app.PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentTitle("Pixbe CRM")
            .setContentText(text)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .setContentIntent(pi)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build();
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Call logging", NotificationManager.IMPORTANCE_LOW);
        channel.setDescription("Shown while a call placed from the CRM is being logged");
        nm.createNotificationChannel(channel);
    }

    private void stopService() {
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        unregisterCallStateListener();
        main.removeCallbacksAndMessages(null);
        if (workerThread != null) workerThread.quitSafely();
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private static String iso(long ms) {
        SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        f.setTimeZone(TimeZone.getTimeZone("UTC"));
        return f.format(new Date(ms));
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
