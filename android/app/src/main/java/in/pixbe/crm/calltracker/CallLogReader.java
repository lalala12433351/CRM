package in.pixbe.crm.calltracker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.provider.CallLog;
import android.telecom.PhoneAccountHandle;
import android.telecom.TelecomManager;

import androidx.core.content.ContextCompat;

import java.util.List;

/** Reads the system call log entry for a call the app just placed. */
final class CallLogReader {

    static final class Entry {
        long durationSec;
        long dateMs;
        String type;
        Integer simSlot;
    }

    private CallLogReader() {}

    static boolean isAvailable(Context ctx) {
        return ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CALL_LOG) == PackageManager.PERMISSION_GRANTED;
    }

    static Entry find(Context ctx, String number, long dialedAtMs) {
        if (!isAvailable(ctx)) return null;
        String tail = PhoneNumbers.tail(number);
        if (tail.isEmpty()) return null;

        String[] projection = {
            CallLog.Calls.NUMBER,
            CallLog.Calls.DURATION,
            CallLog.Calls.TYPE,
            CallLog.Calls.DATE,
            CallLog.Calls.PHONE_ACCOUNT_ID,
        };
        String selection = CallLog.Calls.DATE + " >= ?";
        String[] args = { String.valueOf(dialedAtMs - 60_000L) };

        try (Cursor c = ctx.getContentResolver().query(
            CallLog.Calls.CONTENT_URI, projection, selection, args, CallLog.Calls.DATE + " DESC")) {
            if (c == null) return null;
            while (c.moveToNext()) {
                if (!PhoneNumbers.tail(c.getString(0)).equals(tail)) continue;
                Entry e = new Entry();
                e.durationSec = c.getLong(1);
                e.type = mapType(c.getInt(2), e.durationSec);
                e.dateMs = c.getLong(3);
                e.simSlot = simSlotFor(ctx, c.getString(4));
                return e;
            }
        } catch (SecurityException ignored) {
        }
        return null;
    }

    private static String mapType(int type, long durationSec) {
        switch (type) {
            case CallLog.Calls.OUTGOING_TYPE:
                return durationSec > 0 ? "outgoing" : "unanswered";
            case CallLog.Calls.INCOMING_TYPE:
                return "incoming";
            case CallLog.Calls.MISSED_TYPE:
                return "missed";
            case CallLog.Calls.REJECTED_TYPE:
                return "rejected";
            default:
                return "unknown";
        }
    }

    private static Integer simSlotFor(Context ctx, String accountId) {
        if (accountId == null) return null;
        try {
            TelecomManager telecom = (TelecomManager) ctx.getSystemService(Context.TELECOM_SERVICE);
            if (telecom == null) return null;
            List<PhoneAccountHandle> handles = telecom.getCallCapablePhoneAccounts();
            for (int i = 0; i < handles.size(); i++) {
                if (accountId.equals(handles.get(i).getId())) return i + 1;
            }
        } catch (SecurityException ignored) {
        }
        return null;
    }
}
