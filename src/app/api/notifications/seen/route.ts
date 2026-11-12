import { jsonResponse, runApi } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { markNotificationsSeen } from "@/lib/services/dashboard";

/** Marks the signed-in customer's notification feed as read. */
export async function POST() {
  return runApi(async () => {
    const user = await requireUser();
    await markNotificationsSeen(user.id);
    return jsonResponse({ success: true });
  });
}
