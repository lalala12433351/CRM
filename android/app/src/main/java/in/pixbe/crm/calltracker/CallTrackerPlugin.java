package in.pixbe.crm.calltracker;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.DocumentsContract;
import android.provider.Settings;
import android.telecom.TelecomManager;

import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@CapacitorPlugin(
    name = "CallTracker",
    permissions = {
        @Permission(alias = "phone", strings = {
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_PHONE_NUMBERS
        }),
        @Permission(alias = "callLog", strings = { Manifest.permission.READ_CALL_LOG }),
        @Permission(alias = "contacts", strings = { Manifest.permission.READ_CONTACTS }),
        @Permission(alias = "audio", strings = { Manifest.permission.READ_MEDIA_AUDIO }),
        @Permission(alias = "audioLegacy", strings = { Manifest.permission.READ_EXTERNAL_STORAGE }),
        @Permission(alias = "notifications", strings = { Manifest.permission.POST_NOTIFICATIONS })
    }
)
public class CallTrackerPlugin extends Plugin {

    private static WeakReference<CallTrackerPlugin> instance = new WeakReference<>(null);

    @Override
    public void load() {
        instance = new WeakReference<>(this);
    }

    // ----- Events (called from the service and the upload worker) -----

    static void emitCallEnded(Context ctx, JSONObject event) {
        CallStore.enqueueEvent(ctx, event);
        CallTrackerPlugin plugin = instance.get();
        if (plugin == null) return;
        try {
            plugin.notifyListeners("callEnded", JSObject.fromJSONObject(event));
        } catch (Exception ignored) {
        }
    }

    static void emitRecordingStatus(String callId, String status) {
        CallTrackerPlugin plugin = instance.get();
        if (plugin == null) return;
        JSObject data = new JSObject();
        data.put("callId", callId);
        data.put("status", status);
        plugin.notifyListeners("recordingUploaded", data);
    }

    // ----- Calling -----

    @PluginMethod
    public void startCall(PluginCall call) {
        String number = call.getString("number", "").trim();
        String callId = call.getString("callId", "");
        if (number.isEmpty() || callId.isEmpty()) {
            call.reject("number and callId are required");
            return;
        }
        String leadId = call.getString("leadId");
        boolean upload = Boolean.TRUE.equals(call.getBoolean("uploadRecording", true));

        Context ctx = getContext();
        boolean canTrack = granted(Manifest.permission.READ_PHONE_STATE);
        boolean canDirectDial = granted(Manifest.permission.CALL_PHONE);

        if (canTrack) CallWatchService.start(ctx, callId, number, leadId, upload);

        Intent dial = new Intent(canDirectDial ? Intent.ACTION_CALL : Intent.ACTION_DIAL, Uri.parse("tel:" + Uri.encode(number)));
        dial.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx.startActivity(dial);
        } catch (Exception e) {
            call.reject("Could not open the phone dialer", e);
            return;
        }

        JSObject ret = new JSObject();
        ret.put("tracked", canTrack);
        ret.put("directDial", canDirectDial);
        call.resolve(ret);
    }

    /** Used by the setup screen's test call: checks whether a recording can be matched, without uploading. */
    @PluginMethod
    public void findRecording(PluginCall call) {
        String number = call.getString("number", "");
        Long startMs = call.getLong("startMs");
        Long endMs = call.getLong("endMs");
        if (startMs == null || endMs == null) {
            call.reject("startMs and endMs are required");
            return;
        }
        getBridge().execute(() -> {
            RecordingMatcher.Match match = RecordingMatcher.find(getContext(), number, startMs, endMs);
            JSObject ret = new JSObject();
            ret.put("found", match != null);
            if (match != null) ret.put("name", match.name);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void drainCallEvents(PluginCall call) {
        JSONArray events = CallStore.drainEvents(getContext());
        JSObject ret = new JSObject();
        try {
            ret.put("events", new JSArray(events.toString()));
        } catch (Exception e) {
            ret.put("events", new JSArray());
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void setAuth(PluginCall call) {
        if (Boolean.TRUE.equals(call.getBoolean("clear", false))) {
            CallStore.clearAuth(getContext());
        } else {
            String apiBase = call.getString("apiBase", "").replaceAll("/+$", "");
            CallStore.setAuth(getContext(), apiBase, call.getString("token", ""), call.getString("tenantId", ""));
        }
        call.resolve();
    }

    // ----- Permissions -----

    @Override
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(permissionStatus());
    }

    @Override
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        JSArray groups = call.getArray("groups", new JSArray());
        List<String> aliases = new ArrayList<>();
        try {
            for (Object g : groups.toList()) {
                String group = String.valueOf(g);
                switch (group) {
                    case "audio":
                        aliases.add(Build.VERSION.SDK_INT >= 33 ? "audio" : "audioLegacy");
                        break;
                    case "notifications":
                        if (Build.VERSION.SDK_INT >= 33) aliases.add("notifications");
                        break;
                    case "phone":
                    case "callLog":
                    case "contacts":
                        aliases.add(group);
                        break;
                    default:
                        break;
                }
            }
        } catch (Exception ignored) {
        }
        if (aliases.isEmpty()) {
            call.resolve(permissionStatus());
            return;
        }
        requestPermissionForAliases(aliases.toArray(new String[0]), call, "permissionsCallback");
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        call.resolve(permissionStatus());
    }

    private JSObject permissionStatus() {
        Context ctx = getContext();
        JSObject ret = new JSObject();
        ret.put("phone", state("phone"));
        ret.put("callLog", state("callLog"));
        ret.put("contacts", state("contacts"));
        ret.put("audio", state(Build.VERSION.SDK_INT >= 33 ? "audio" : "audioLegacy"));
        ret.put("notifications", Build.VERSION.SDK_INT >= 33 ? state("notifications") : "granted");

        String folderUri = CallStore.recordingFolderUri(ctx);
        boolean folderOk = false;
        if (!folderUri.isEmpty()) {
            try {
                DocumentFile root = DocumentFile.fromTreeUri(ctx, Uri.parse(folderUri));
                folderOk = root != null && root.canRead();
            } catch (Exception ignored) {
            }
        }
        ret.put("recordingFolder", folderOk);
        if (folderOk) ret.put("recordingFolderName", CallStore.recordingFolderName(ctx));

        PowerManager pm = (PowerManager) ctx.getSystemService(Context.POWER_SERVICE);
        ret.put("batteryUnrestricted", pm != null && pm.isIgnoringBatteryOptimizations(ctx.getPackageName()));
        ret.put("manufacturer", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase(Locale.ROOT));
        ret.put("sdkInt", Build.VERSION.SDK_INT);
        return ret;
    }

    private String state(String alias) {
        PermissionState s = getPermissionState(alias);
        return s == null ? "prompt" : s.toString();
    }

    private boolean granted(String permission) {
        return ContextCompat.checkSelfPermission(getContext(), permission) == PackageManager.PERMISSION_GRANTED;
    }

    // ----- Recording folder (Storage Access Framework) -----

    @PluginMethod
    public void pickRecordingFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        Uri hint = recorderFolderHint();
        if (hint != null) intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, hint);
        try {
            startActivityForResult(call, intent, "folderPicked");
        } catch (ActivityNotFoundException e) {
            call.reject("No folder picker available on this device");
        }
    }

    @ActivityCallback
    private void folderPicked(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (uri == null) {
            call.resolve(new JSObject());
            return;
        }
        try {
            getContext().getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } catch (SecurityException e) {
            call.reject("Could not keep access to that folder", e);
            return;
        }
        DocumentFile root = DocumentFile.fromTreeUri(getContext(), uri);
        String name = root != null && root.getName() != null ? root.getName() : "Selected folder";
        CallStore.setRecordingFolder(getContext(), uri.toString(), name);
        JSObject ret = new JSObject();
        ret.put("uri", uri.toString());
        ret.put("name", name);
        call.resolve(ret);
    }

    /** Opens the picker near the folder this phone brand's dialer usually records into. */
    private Uri recorderFolderHint() {
        String m = Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase(Locale.ROOT);
        String path;
        if (m.contains("xiaomi") || m.contains("redmi") || m.contains("poco")) path = "MIUI/sound_recorder/call_rec";
        else if (m.contains("samsung")) path = "Recordings/Call";
        else if (m.contains("oneplus") || m.contains("oppo") || m.contains("realme")) path = "Music/Recordings/Call Recordings";
        else if (m.contains("vivo") || m.contains("iqoo")) path = "Record/Call";
        else path = "Recordings";
        return Uri.parse("content://com.android.externalstorage.documents/document/primary%3A" + Uri.encode(path));
    }

    // ----- System settings shortcuts -----

    @PluginMethod
    public void openSettings(PluginCall call) {
        String target = call.getString("target", "app");
        Context ctx = getContext();
        List<Intent> candidates = new ArrayList<>();
        switch (target) {
            case "battery":
                candidates.add(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                break;
            case "dialer":
                candidates.add(new Intent(TelecomManager.ACTION_SHOW_CALL_SETTINGS));
                candidates.add(new Intent(Intent.ACTION_DIAL));
                break;
            case "autostart":
                candidates.add(component("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
                candidates.add(component("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"));
                candidates.add(component("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity"));
                candidates.add(component("com.oplus.safecenter", "com.oplus.safecenter.permission.startup.StartupAppListActivity"));
                candidates.add(component("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"));
                candidates.add(component("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"));
                candidates.add(component("com.huawei.systemmanager", "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity"));
                candidates.add(component("com.oneplus.security", "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"));
                break;
            default:
                break;
        }
        candidates.add(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + ctx.getPackageName())));

        for (Intent intent : candidates) {
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                ctx.startActivity(intent);
                call.resolve();
                return;
            } catch (Exception ignored) {
            }
        }
        call.reject("Could not open settings");
    }

    private static Intent component(String pkg, String cls) {
        return new Intent().setComponent(new ComponentName(pkg, cls));
    }
}
