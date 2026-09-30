package in.pixbe.crm.calltracker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.provider.ContactsContract;

import androidx.core.content.ContextCompat;

final class PhoneNumbers {
    private PhoneNumbers() {}

    /** Last 10 digits, which is how Indian numbers appear in call logs and recorder filenames. */
    static String tail(String number) {
        String digits = number == null ? "" : number.replaceAll("\\D", "");
        return digits.length() > 10 ? digits.substring(digits.length() - 10) : digits;
    }

    static String contactName(Context ctx, String number) {
        if (number == null || number.isEmpty()) return null;
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            return null;
        }
        Uri uri = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(number));
        try (Cursor c = ctx.getContentResolver().query(uri, new String[] { ContactsContract.PhoneLookup.DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception ignored) {
        }
        return null;
    }
}
