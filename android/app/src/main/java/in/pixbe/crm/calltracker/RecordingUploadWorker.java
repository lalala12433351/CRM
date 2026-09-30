package in.pixbe.crm.calltracker;

import android.content.Context;
import android.net.Uri;

import androidx.annotation.NonNull;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Uploads a matched recording (or reports that none was found) to
 * {@code /api/calls/:id/recording}. Retries while the call record has not reached the server yet.
 */
public class RecordingUploadWorker extends Worker {
    private static final String KEY_CALL_ID = "callId";
    private static final String KEY_URI = "uri";
    private static final String KEY_NAME = "name";
    private static final String KEY_MIME = "mime";
    private static final String KEY_MODE = "mode";
    private static final String MODE_UPLOAD = "upload";
    private static final String MODE_NOT_FOUND = "not_found";
    private static final int MAX_ATTEMPTS = 12;

    public RecordingUploadWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    static void enqueueUpload(Context ctx, String callId, RecordingMatcher.Match match) {
        enqueue(ctx, callId, new Data.Builder()
            .putString(KEY_CALL_ID, callId)
            .putString(KEY_URI, match.uri.toString())
            .putString(KEY_NAME, match.name)
            .putString(KEY_MIME, match.mimeType)
            .putString(KEY_MODE, MODE_UPLOAD)
            .build());
    }

    static void enqueueNotFound(Context ctx, String callId) {
        enqueue(ctx, callId, new Data.Builder()
            .putString(KEY_CALL_ID, callId)
            .putString(KEY_MODE, MODE_NOT_FOUND)
            .build());
    }

    private static void enqueue(Context ctx, String callId, Data data) {
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(RecordingUploadWorker.class)
            .setInputData(data)
            .setInitialDelay(5, TimeUnit.SECONDS)
            .setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
            .build();
        WorkManager.getInstance(ctx).enqueueUniqueWork("recording-" + callId, ExistingWorkPolicy.REPLACE, request);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context ctx = getApplicationContext();
        String callId = getInputData().getString(KEY_CALL_ID);
        String mode = getInputData().getString(KEY_MODE);
        if (callId == null) return Result.failure();
        if (!CallStore.hasAuth(ctx)) return retryOrFail(ctx, callId);

        try {
            int status = MODE_UPLOAD.equals(mode) ? upload(ctx, callId) : reportNotFound(ctx, callId);
            if (status >= 200 && status < 300) {
                CallTrackerPlugin.emitRecordingStatus(callId, MODE_UPLOAD.equals(mode) ? "uploaded" : "not_found");
                return Result.success();
            }
            if (status == 409) {
                CallTrackerPlugin.emitRecordingStatus(callId, "disabled");
                return Result.success();
            }
            if (status == 400 || status == 403 || status == 413) {
                reportFailedBestEffort(ctx, callId);
                CallTrackerPlugin.emitRecordingStatus(callId, "failed");
                return Result.failure();
            }
            // 401 (token refreshes when the app is next opened), 404 (call not saved yet), 5xx.
            return retryOrFail(ctx, callId);
        } catch (Exception e) {
            return retryOrFail(ctx, callId);
        }
    }

    private Result retryOrFail(Context ctx, String callId) {
        if (getRunAttemptCount() + 1 >= MAX_ATTEMPTS) {
            reportFailedBestEffort(ctx, callId);
            CallTrackerPlugin.emitRecordingStatus(callId, "failed");
            return Result.failure();
        }
        return Result.retry();
    }

    private void reportFailedBestEffort(Context ctx, String callId) {
        if (!CallStore.hasAuth(ctx)) return;
        try {
            reportStatus(ctx, callId, "failed");
        } catch (Exception ignored) {
            // The local failed event still informs the WebView when it resumes.
        }
    }

    private static String endpoint(Context ctx, String callId, String suffix) throws Exception {
        return CallStore.apiBase(ctx) + "/api/calls/" + URLEncoder.encode(callId, "UTF-8") + suffix;
    }

    private static HttpURLConnection open(Context ctx, String url) throws Exception {
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setConnectTimeout(20_000);
        conn.setReadTimeout(120_000);
        conn.setDoOutput(true);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Authorization", "Bearer " + CallStore.token(ctx));
        conn.setRequestProperty("x-tenant-id", CallStore.tenantId(ctx));
        return conn;
    }

    private int reportNotFound(Context ctx, String callId) throws Exception {
        return reportStatus(ctx, callId, "not_found");
    }

    private int reportStatus(Context ctx, String callId, String status) throws Exception {
        HttpURLConnection conn = open(ctx, endpoint(ctx, callId, "/recording-status"));
        try {
            conn.setRequestProperty("Content-Type", "application/json");
            byte[] body = ("{\"status\":\"" + status + "\"}").getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body);
            }
            return conn.getResponseCode();
        } finally {
            conn.disconnect();
        }
    }

    private int upload(Context ctx, String callId) throws Exception {
        Uri uri = Uri.parse(getInputData().getString(KEY_URI));
        String name = getInputData().getString(KEY_NAME);
        String mime = getInputData().getString(KEY_MIME);
        if (name == null || name.isEmpty()) name = callId + ".m4a";
        if (mime == null || mime.isEmpty()) mime = "application/octet-stream";

        String boundary = "----PixbeBoundary" + UUID.randomUUID().toString().replace("-", "");
        HttpURLConnection conn = open(ctx, endpoint(ctx, callId, "/recording"));
        try {
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setChunkedStreamingMode(64 * 1024);

            try (InputStream in = ctx.getContentResolver().openInputStream(uri);
                 DataOutputStream out = new DataOutputStream(conn.getOutputStream())) {
                if (in == null) return 400;
                out.writeBytes("--" + boundary + "\r\n");
                out.writeBytes("Content-Disposition: form-data; name=\"file\"; filename=\"" + name.replace("\"", "") + "\"\r\n");
                out.writeBytes("Content-Type: " + mime + "\r\n\r\n");
                byte[] buf = new byte[64 * 1024];
                int n;
                while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
                out.writeBytes("\r\n--" + boundary + "--\r\n");
            }
            return conn.getResponseCode();
        } finally {
            conn.disconnect();
        }
    }
}
