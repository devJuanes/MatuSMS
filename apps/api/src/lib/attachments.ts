import { getMatuDb } from './matudb.js';
import { uuid } from './utils.js';

export async function uploadAttachment(
  userId: string,
  filename: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const db = getMatuDb();
  const path = `matusms/${userId}/${uuid()}-${filename}`;
  const blob = new Blob([new Uint8Array(buffer)], { type: mimeType });

  const { error } = await db.storage.upload(path, blob);
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = db.storage.getPublicUrl(path);
  return data.publicUrl ?? path;
}
