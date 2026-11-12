import { ValidationError } from "@/lib/errors";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AvatarContentType = (typeof AVATAR_ALLOWED_TYPES)[number];

/**
 * Identifies an image by its leading bytes. The browser-supplied MIME type and
 * file name are never trusted: SVG and anything that is not a raster image the
 * app expects is rejected, so an uploaded avatar can never carry script.
 */
export function sniffAvatarType(bytes: Uint8Array): AvatarContentType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/** Throws a ValidationError unless the bytes are an acceptable avatar. */
export function validateAvatarBytes(
  bytes: Uint8Array,
  declaredType: string,
): AvatarContentType {
  if (bytes.length === 0) {
    throw new ValidationError("The selected file is empty.");
  }

  if (bytes.length > AVATAR_MAX_BYTES) {
    throw new ValidationError(
      `Profile photos must be ${AVATAR_MAX_BYTES / (1024 * 1024)} MB or smaller.`,
    );
  }

  const sniffed = sniffAvatarType(bytes);

  if (!sniffed) {
    throw new ValidationError("Upload a JPEG, PNG, or WebP image.");
  }

  if (declaredType && declaredType !== sniffed) {
    throw new ValidationError(
      "The file contents do not match its declared image type.",
    );
  }

  return sniffed;
}

export function avatarUrlFor(userId: string, version: number) {
  return `/api/profile/avatar/${encodeURIComponent(userId)}?v=${version}`;
}
