import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { readAvatar } from "@/lib/services/avatar";

/**
 * Serves a stored profile photo. Only the owner and administrators may read
 * it, and the response is `private` so shared caches never keep it.
 */
export async function GET(
  request: Request,
  context: RouteContext<"/api/profile/avatar/[userId]">,
) {
  await connection();

  const [{ userId }, viewer] = await Promise.all([
    context.params,
    getCurrentUser(),
  ]);

  if (!viewer) {
    return new Response(null, { status: 401 });
  }

  if (viewer.id !== userId && viewer.role !== "admin") {
    return new Response(null, { status: 404 });
  }

  const avatar = await readAvatar(userId);

  if (!avatar) {
    return new Response(null, { status: 404 });
  }

  const etag = `"${avatar.updatedAt.getTime()}-${avatar.size}"`;
  const headers = new Headers({
    "Content-Type": avatar.contentType,
    "Cache-Control": "private, max-age=86400",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    ETag: etag,
  });

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(new Uint8Array(avatar.bytes), { headers });
}
