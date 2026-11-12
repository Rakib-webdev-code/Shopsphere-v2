"use client";

import { Camera, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/avatar";
import {
  Alert,
  dangerButtonClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui";
import {
  AVATAR_ALLOWED_TYPES,
  AVATAR_MAX_BYTES,
} from "@/lib/avatar-validation";
import { apiRequest } from "@/lib/api-client";

// Source photos from phones are often large; we downscale in the browser
// before upload, so accept a generous original size.
const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const OUTPUT_SIZE = 512;

/**
 * Centre-crops to a square, downsizes to 512px and re-encodes as JPEG. This
 * keeps uploads small and drops EXIF metadata (including GPS location).
 */
async function prepareImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Your browser cannot process images.");
  }

  // Flatten transparent PNG/WebP onto white so the JPEG has no black corners.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.88),
  );

  if (!blob) {
    throw new Error("Could not prepare that image.");
  }

  return blob;
}

export function AvatarUploader({
  name,
  currentImage,
}: {
  name: string;
  currentImage: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"processing" | "saving" | "removing" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function reset() {
    setBlob(null);
    setPreview(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function handleSelect(file: File | undefined) {
    setMessage(null);
    setError(null);

    if (!file) {
      return;
    }

    if (!(AVATAR_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      reset();
      return;
    }

    if (file.size > MAX_SOURCE_BYTES) {
      setError("That photo is too large. Choose one under 12 MB.");
      reset();
      return;
    }

    setBusy("processing");

    try {
      const prepared = await prepareImage(file);

      if (prepared.size > AVATAR_MAX_BYTES) {
        throw new Error("The processed photo is still too large.");
      }

      setBlob(prepared);
      setPreview(URL.createObjectURL(prepared));
    } catch (processError) {
      setError(
        processError instanceof Error
          ? processError.message
          : "We could not read that image.",
      );
      reset();
    } finally {
      setBusy(null);
    }
  }

  async function handleSave() {
    if (!blob) {
      return;
    }

    setBusy("saving");
    setError(null);
    setMessage(null);

    try {
      const form = new FormData();
      form.append("file", new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      await apiRequest("/api/profile/avatar", { method: "POST", body: form });
      setMessage("Profile photo updated.");
      reset();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to upload your photo.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    setBusy("removing");
    setError(null);
    setMessage(null);

    try {
      await apiRequest("/api/profile/avatar", { method: "DELETE" });
      setMessage("Profile photo removed.");
      reset();
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to remove your photo.",
      );
    } finally {
      setBusy(null);
    }
  }

  const shownImage = preview ?? currentImage;

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative">
        <UserAvatar
          name={name}
          image={shownImage}
          className="h-24 w-24 text-2xl"
        />
        {preview ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-accent-solid px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            Preview
          </span>
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">Profile photo</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-soft">
          JPEG, PNG or WebP. Photos are cropped to a square and resized in your
          browser before upload (stored size is limited to 2 MB).
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => handleSelect(event.target.files?.[0])}
          />
          <label
            htmlFor="avatar-file"
            className={`${secondaryButtonClass} cursor-pointer gap-2 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Camera aria-hidden="true" className="h-4 w-4" />
            {busy === "processing" ? "Preparing..." : "Choose photo"}
          </label>

          {blob ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={busy !== null}
                className={`${primaryButtonClass} gap-2`}
              >
                <Upload aria-hidden="true" className="h-4 w-4" />
                {busy === "saving" ? "Uploading..." : "Save photo"}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={busy !== null}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </>
          ) : currentImage ? (
            <button
              type="button"
              onClick={handleRemove}
              disabled={busy !== null}
              className={`${dangerButtonClass} gap-2`}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              {busy === "removing" ? "Removing..." : "Remove photo"}
            </button>
          ) : null}
        </div>

        <div className="mt-3 space-y-2" aria-live="polite">
          {message ? <Alert tone="success">{message}</Alert> : null}
          {error ? <Alert tone="error">{error}</Alert> : null}
        </div>
      </div>
    </div>
  );
}
