import { jsonResponse, runApi } from "@/lib/api";
import { requireUser } from "@/lib/auth/session";
import { createCheckoutSessionForOrder } from "@/lib/services/payments";
import { resolveAppUrl } from "@/lib/stripe";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteParams) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await context.params;
    const session = await createCheckoutSessionForOrder(
      user.id,
      id,
      resolveAppUrl(request),
    );
    return jsonResponse(session);
  });
}
