import { randomUUID } from 'crypto';

const BUCKET = 'side-effects';
const SIGN_SECONDS = 60 * 60;

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Chưa cấu hình kho lưu ảnh (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).');
  }
  return { url: url.replace(/\/$/, ''), key };
}

export function validatePhoto(file: File): string | null {
  if (!EXTENSIONS[file.type]) return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.';
  if (file.size > MAX_PHOTO_BYTES) return 'Ảnh tối đa 5 MB.';
  return null;
}

export async function uploadSideEffectPhoto(patientId: string, file: File): Promise<string> {
  const { url, key } = config();
  const path = `${patientId}/${Date.now()}-${randomUUID()}.${EXTENSIONS[file.type]}`;
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!res.ok) throw new Error('Không tải được ảnh lên kho lưu trữ.');
  return path;
}

async function signedUrl(path: string): Promise<string | null> {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, apikey: key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: SIGN_SECONDS }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { signedURL?: string };
  return data.signedURL ? `${url}/storage/v1${data.signedURL}` : null;
}

/** Thêm `photoSignedUrl` (đường dẫn tạm, hết hạn sau 1 giờ) cho các báo cáo có ảnh. */
export async function withPhotoUrls<T extends { photoUrl?: string | null }>(rows: T[]) {
  return Promise.all(
    rows.map(async (r) => ({
      ...r,
      photoSignedUrl: r.photoUrl && process.env.SUPABASE_URL ? await signedUrl(r.photoUrl) : null,
    }))
  );
}
