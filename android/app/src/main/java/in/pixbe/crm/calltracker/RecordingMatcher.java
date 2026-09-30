package in.pixbe.crm.calltracker;

import android.Manifest;
import android.content.ContentUris;
import android.content.Context;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import androidx.core.content.ContextCompat;
import androidx.documentfile.provider.DocumentFile;

import java.util.Locale;

/**
 * Finds the file the phone's built-in call recorder saved for a call.
 * Matches on modification time inside the call window, then scores by number / contact name
 * in the filename and by recorder-style folder names.
 */
final class RecordingMatcher {

    static final class Match {
        final Uri uri;
        final String name;
        final String mimeType;

        Match(Uri uri, String name, String mimeType) {
            this.uri = uri;
            this.name = name;
            this.mimeType = mimeType;
        }
    }

    private static final String[] AUDIO_EXTENSIONS = { ".m4a", ".amr", ".mp3", ".aac", ".wav", ".3gp", ".opus", ".ogg" };
    private static final String[] RECORDER_PATH_HINTS = {
        "call", "record", "phonerecord", "call_rec", "callrecord", "sound_recorder"
    };
    /** Some OEM recorders finish writing the file a while after hang-up. */
    private static final long LATE_WRITE_MS = 3 * 60_000L;

    private RecordingMatcher() {}

    static boolean hasAudioAccess(Context ctx) {
        String perm = Build.VERSION.SDK_INT >= 33
            ? Manifest.permission.READ_MEDIA_AUDIO
            : Manifest.permission.READ_EXTERNAL_STORAGE;
        return ContextCompat.checkSelfPermission(ctx, perm) == PackageManager.PERMISSION_GRANTED
            || !CallStore.recordingFolderUri(ctx).isEmpty();
    }

    static Match find(Context ctx, String number, long callStartMs, long callEndMs) {
        String tail = PhoneNumbers.tail(number);
        String contact = PhoneNumbers.contactName(ctx, number);
        long from = callStartMs - 10_000L;
        long to = callEndMs + LATE_WRITE_MS;

        Match best = null;
        int bestScore = 0;

        java.util.List<Candidate> audio = new java.util.ArrayList<>();
        for (Candidate c : queryMediaStore(ctx, from, to)) {
            if (!isAudio(c) || alreadyListed(audio, c)) continue;
            audio.add(c);
            int s = score(c, tail, contact);
            if (s > bestScore) {
                bestScore = s;
                best = new Match(c.uri, c.name, c.mimeType);
            }
        }

        for (Candidate c : querySafFolder(ctx, from, to)) {
            if (!isAudio(c) || alreadyListed(audio, c)) continue;
            audio.add(c);
            int s = score(c, tail, contact);
            if (s > bestScore) {
                bestScore = s;
                best = new Match(c.uri, c.name, c.mimeType);
            }
        }
        if (bestScore >= 2) return best;
        // Dialers often save "20260929_183012.m4a" with no number in the name. If exactly one
        // new audio file landed during this call, it is the recording.
        if (audio.size() == 1) {
            Candidate only = audio.get(0);
            return new Match(only.uri, only.name, only.mimeType);
        }
        return null;
    }

    private static boolean alreadyListed(java.util.List<Candidate> audio, Candidate c) {
        String name = c.name == null ? "" : c.name;
        for (Candidate existing : audio) {
            if (name.equals(existing.name)) return true;
        }
        return false;
    }

    private static boolean isAudio(Candidate c) {
        String name = c.name == null ? "" : c.name.toLowerCase(Locale.ROOT);
        if (hasAudioExtension(name)) return true;
        return c.mimeType != null && c.mimeType.toLowerCase(Locale.ROOT).startsWith("audio/");
    }

    private static final class Candidate {
        Uri uri;
        String name;
        String path;
        String mimeType;
    }

    private static int score(Candidate c, String tail, String contact) {
        String name = c.name == null ? "" : c.name.toLowerCase(Locale.ROOT);
        String path = c.path == null ? "" : c.path.toLowerCase(Locale.ROOT);
        if (!hasAudioExtension(name)) return 0;
        int s = 0;
        String nameDigits = name.replaceAll("\\D", "");
        if (!tail.isEmpty() && nameDigits.contains(tail)) s += 4;
        if (contact != null && !contact.isEmpty()) {
            String normalizedContact = contact.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");
            if (!normalizedContact.isEmpty() && name.replaceAll("[^a-z0-9]", "").contains(normalizedContact)) s += 3;
        }
        for (String hint : RECORDER_PATH_HINTS) {
            if (path.contains(hint) || name.contains(hint)) {
                s += 2;
                break;
            }
        }
        return s;
    }

    private static boolean hasAudioExtension(String name) {
        for (String ext : AUDIO_EXTENSIONS) if (name.endsWith(ext)) return true;
        return false;
    }

    private static Candidate[] queryMediaStore(Context ctx, long fromMs, long toMs) {
        String perm = Build.VERSION.SDK_INT >= 33
            ? Manifest.permission.READ_MEDIA_AUDIO
            : Manifest.permission.READ_EXTERNAL_STORAGE;
        if (ContextCompat.checkSelfPermission(ctx, perm) != PackageManager.PERMISSION_GRANTED) return new Candidate[0];

        Uri collection = Build.VERSION.SDK_INT >= 29
            ? MediaStore.Audio.Media.getContentUri(MediaStore.VOLUME_EXTERNAL)
            : MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;
        String pathColumn = Build.VERSION.SDK_INT >= 29 ? MediaStore.MediaColumns.RELATIVE_PATH : MediaStore.MediaColumns.DATA;
        String[] projection = {
            MediaStore.MediaColumns._ID,
            MediaStore.MediaColumns.DISPLAY_NAME,
            pathColumn,
            MediaStore.MediaColumns.MIME_TYPE,
        };
        String fromSec = String.valueOf(fromMs / 1000L);
        String toSec = String.valueOf(toMs / 1000L);
        String selection = "(" + MediaStore.MediaColumns.DATE_MODIFIED + " >= ? AND " + MediaStore.MediaColumns.DATE_MODIFIED + " <= ?)"
            + " OR (" + MediaStore.MediaColumns.DATE_ADDED + " >= ? AND " + MediaStore.MediaColumns.DATE_ADDED + " <= ?)";
        String[] args = { fromSec, toSec, fromSec, toSec };

        java.util.List<Candidate> out = new java.util.ArrayList<>();
        try (Cursor c = ctx.getContentResolver().query(collection, projection, selection, args,
            MediaStore.MediaColumns.DATE_MODIFIED + " DESC")) {
            if (c == null) return new Candidate[0];
            while (c.moveToNext()) {
                Candidate cand = new Candidate();
                cand.uri = ContentUris.withAppendedId(collection, c.getLong(0));
                cand.name = c.getString(1);
                cand.path = c.getString(2);
                cand.mimeType = c.getString(3);
                out.add(cand);
            }
        } catch (Exception ignored) {
        }
        return out.toArray(new Candidate[0]);
    }

    private static java.util.List<Candidate> querySafFolder(Context ctx, long fromMs, long toMs) {
        java.util.List<Candidate> out = new java.util.ArrayList<>();
        String treeUri = CallStore.recordingFolderUri(ctx);
        if (treeUri.isEmpty()) return out;
        try {
            DocumentFile root = DocumentFile.fromTreeUri(ctx, Uri.parse(treeUri));
            if (root == null || !root.canRead()) return out;
            collect(root, fromMs, toMs, out, 0);
        } catch (Exception ignored) {
        }
        return out;
    }

    private static void collect(DocumentFile dir, long fromMs, long toMs, java.util.List<Candidate> out, int depth) {
        for (DocumentFile f : dir.listFiles()) {
            if (f.isDirectory()) {
                if (depth < 2) collect(f, fromMs, toMs, out, depth + 1);
                continue;
            }
            long modified = f.lastModified();
            if (modified < fromMs || modified > toMs) continue;
            Candidate cand = new Candidate();
            cand.uri = f.getUri();
            cand.name = f.getName();
            cand.path = "call_recordings_folder";
            cand.mimeType = f.getType();
            out.add(cand);
        }
    }
}
