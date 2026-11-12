import { Binary } from "mongodb";
import { userAvatarsCollection } from "@/lib/db/collections";
import {
  validateAvatarBytes,
  type AvatarContentType,
} from "@/lib/avatar-validation";

/**
 * Stores a validated avatar for one user, replacing any previous photo.
 * Returns the version (millisecond timestamp) used to bust browser caches.
 */
export async function storeAvatar(
  userId: string,
  bytes: Uint8Array,
  declaredType: string,
): Promise<{ contentType: AvatarContentType; version: number; size: number }> {
  const contentType = validateAvatarBytes(bytes, declaredType);
  const updatedAt = new Date();

  await userAvatarsCollection.updateOne(
    { _id: userId },
    {
      $set: {
        contentType,
        data: new Binary(Buffer.from(bytes)),
        size: bytes.length,
        updatedAt,
      },
    },
    { upsert: true },
  );

  return { contentType, version: updatedAt.getTime(), size: bytes.length };
}

export async function deleteAvatar(userId: string) {
  const result = await userAvatarsCollection.deleteOne({ _id: userId });
  return result.deletedCount > 0;
}

export async function readAvatar(userId: string) {
  const doc = await userAvatarsCollection.findOne({ _id: userId });

  if (!doc) {
    return null;
  }

  return {
    contentType: doc.contentType,
    bytes: Buffer.from(doc.data.buffer),
    size: doc.size,
    updatedAt: doc.updatedAt,
  };
}
