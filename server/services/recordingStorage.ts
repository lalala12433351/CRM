import fs from 'fs';
import path from 'path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MIME_EXT: Record<string, string> = {
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/amr': 'amr',
  'audio/3gpp': '3gp',
  'audio/ogg': 'ogg',
  'audio/opus': 'opus',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
};

export const ALLOWED_RECORDING_EXTENSIONS = new Set(Object.values(MIME_EXT));

let s3: S3Client | null = null;

function bucket(): string {
  // AWS_S3_BUCKET is the deployment-wide name used by Docker/ECS. Keep the
  // older variable as an explicit recordings-only override.
  return String(process.env.RECORDINGS_BUCKET || process.env.AWS_S3_BUCKET || '').trim();
}

function client(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'ap-south-1'
    });
  }
  return s3;
}

function localRoot(): string {
  const base =
    process.env.PIXBE_DATA_DIR ||
    path.join(process.env.LOCALAPPDATA || process.env.HOME || process.cwd(), 'PixbeCrm', 'data');
  return path.join(base, 'recordings');
}

function safeSegment(value: string): string {
  return String(value).replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function extensionFor(mimeType: string, originalName: string): string {
  const fromName = path.extname(originalName || '').replace('.', '').toLowerCase();
  if (ALLOWED_RECORDING_EXTENSIONS.has(fromName)) return fromName;
  return MIME_EXT[String(mimeType || '').toLowerCase()] || 'm4a';
}

export function contentTypeFor(ext: string): string {
  const match = Object.entries(MIME_EXT).find(([, e]) => e === ext);
  return match ? match[0] : 'application/octet-stream';
}

export function recordingKey(tenantId: string, callId: string, ext: string): string {
  return `recordings/${safeSegment(tenantId)}/${safeSegment(callId)}.${ext}`;
}

export async function saveRecording(key: string, body: Buffer, contentType: string): Promise<void> {
  if (bucket()) {
    await client().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      })
    );
    return;
  }
  const filePath = path.join(localRoot(), key);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, body);
}

/** Short-lived playback URL for S3, or null when recordings are stored on local disk. */
export async function presignedRecordingUrl(key: string, ttlSeconds = 600): Promise<string | null> {
  if (!bucket()) return null;
  return getSignedUrl(client(), new GetObjectCommand({ Bucket: bucket(), Key: key }), {
    expiresIn: ttlSeconds,
  });
}

export function localRecordingPath(key: string): string | null {
  if (bucket()) return null;
  const root = localRoot();
  const filePath = path.resolve(root, key);
  if (!filePath.startsWith(path.resolve(root))) return null;
  return fs.existsSync(filePath) ? filePath : null;
}
