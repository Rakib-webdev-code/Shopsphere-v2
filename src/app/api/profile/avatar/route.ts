import { jsonResponse, runApi } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-validation";
import { ApiError, ValidationError } from "@/lib/errors";
import { createRateLimiter } from "@/lib/rate-limit";
import {
  removeProfileAvatar,
  uploadProfileAvatar,
} from "@/lib/services/profile";

// Ten photo changes per user every ten minutes. Best-effort, in-process.
const avatarLimiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 });

// Multipart framing adds a little to the file itself.
const MAX_BODY_BYTES = AVATAR_MAX_BYTES + 64 * 1024;

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    const limit = avatarLimiter.check(user.id);

    if (!limit.allowed) {
      throw new ApiError(
        429,
        "Too many photo changes. Please wait a few minutes and try again.",
        "RATE_LIMITED",
      );
    }

    const declaredLength = Number(request.headers.get("content-length"));

    if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
      throw new ApiError(
        413,
        `Profile photos must be ${AVATAR_MAX_BYTES / (1024 * 1024)} MB or smaller.`,
        "PAYLOAD_TOO_LARGE",
      );
    }

    let form: FormData;

    try {
      form = await request.formData();
    } catch {
      throw new ValidationError("Upload the photo as multipart form data.");
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("Choose an image file to upload.");
    }

    if (file.size > AVATAR_MAX_BYTES) {
      throw new ApiError(
        413,
        `Profile photos must be ${AVATAR_MAX_BYTES / (1024 * 1024)} MB or smaller.`,
        "PAYLOAD_TOO_LARGE",
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const profile = await uploadProfileAvatar(user.id, bytes, file.type);

    return jsonResponse({ profile });
  });
}

export async function DELETE() {
  return runApi(async () => {
    const user = await requireUser();
    const profile = await removeProfileAvatar(user.id);
    return jsonResponse({ profile });
  });
}
