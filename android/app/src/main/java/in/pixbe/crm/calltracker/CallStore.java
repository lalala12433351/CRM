package in.pixbe.crm.calltracker;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** SharedPreferences-backed state shared by the plugin, the call watch service and the upload worker. */
public final class CallStore {
    private static final String PREFS = "pixbe_call_tracker";
    private static final String KEY_API_BASE = "apiBase";
    private static final String KEY_TOKEN = "token";
    private static final String KEY_TENANT = "tenantId";
    private static final String KEY_FOLDER_URI = "recordingFolderUri";
    private static final String KEY_FOLDER_NAME = "recordingFolderName";
    private static final String KEY_EVENTS = "pendingEvents";
    private static final int MAX_QUEUED_EVENTS = 100;

    private CallStore() {}

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void setAuth(Context ctx, String apiBase, String token, String tenantId) {
        prefs(ctx).edit()
            .putString(KEY_API_BASE, apiBase)
            .putString(KEY_TOKEN, token)
            .putString(KEY_TENANT, tenantId)
            .apply();
    }

    public static void clearAuth(Context ctx) {
        prefs(ctx).edit().remove(KEY_API_BASE).remove(KEY_TOKEN).remove(KEY_TENANT).apply();
    }

    public static String apiBase(Context ctx) {
        return prefs(ctx).getString(KEY_API_BASE, "");
    }

    public static String token(Context ctx) {
        return prefs(ctx).getString(KEY_TOKEN, "");
    }

    public static String tenantId(Context ctx) {
        return prefs(ctx).getString(KEY_TENANT, "");
    }

    public static boolean hasAuth(Context ctx) {
        return !apiBase(ctx).isEmpty() && !token(ctx).isEmpty() && !tenantId(ctx).isEmpty();
    }

    public static void setRecordingFolder(Context ctx, String uri, String name) {
        prefs(ctx).edit().putString(KEY_FOLDER_URI, uri).putString(KEY_FOLDER_NAME, name).apply();
    }

    public static String recordingFolderUri(Context ctx) {
        return prefs(ctx).getString(KEY_FOLDER_URI, "");
    }

    public static String recordingFolderName(Context ctx) {
        return prefs(ctx).getString(KEY_FOLDER_NAME, "");
    }

    public static synchronized void enqueueEvent(Context ctx, JSONObject event) {
        try {
            JSONArray current = new JSONArray(prefs(ctx).getString(KEY_EVENTS, "[]"));
            JSONArray next = new JSONArray();
            int start = Math.max(0, current.length() - (MAX_QUEUED_EVENTS - 1));
            for (int i = start; i < current.length(); i++) next.put(current.get(i));
            next.put(event);
            prefs(ctx).edit().putString(KEY_EVENTS, next.toString()).apply();
        } catch (JSONException ignored) {
            prefs(ctx).edit().putString(KEY_EVENTS, new JSONArray().put(event).toString()).apply();
        }
    }

    public static synchronized JSONArray drainEvents(Context ctx) {
        String raw = prefs(ctx).getString(KEY_EVENTS, "[]");
        prefs(ctx).edit().putString(KEY_EVENTS, "[]").apply();
        try {
            return new JSONArray(raw);
        } catch (JSONException e) {
            return new JSONArray();
        }
    }
}
