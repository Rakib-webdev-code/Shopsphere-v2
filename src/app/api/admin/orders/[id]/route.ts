import { jsonResponse, runApi } from "@/lib/api";
import { requireAdmin } from "@/lib/auth/session";
import {
  getOrderForAdmin,
  resolveOrderReconciliation,
  updateOrderStatus,
} from "@/lib/services/orders";
import { refundOrderIfPaid } from "@/lib/services/payments";
import { asRecord, parseObjectId, readJsonBody } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteParams) {
  return runApi(async () => {
    await requireAdmin();
    const { id } = await context.params;
    const order = await getOrderForAdmin(id);
    return jsonResponse({ order });
  });
}

export async function PATCH(request: Request, context: RouteParams) {
  return runApi(async () => {
    const admin = await requireAdmin();
    const { id } = await context.params;
    const body = asRecord(await readJsonBody(request));

    if (
      body.reconciliationAction === "retry" ||
      body.reconciliationAction === "force-release"
    ) {
      const order = await resolveOrderReconciliation(
        id,
        admin,
        body.reconciliationAction,
      );
      return jsonResponse({ order });
    }

    let order = await updateOrderStatus(id, body.status, admin.id);

    // Cancelling a paid card order returns the money to the customer.
    if (order.status === "cancelled" && order.paymentStatus === "paid") {
      const refunded = await refundOrderIfPaid({
        _id: parseObjectId(id, "Order ID"),
      });

      if (refunded) {
        order = await getOrderForAdmin(id);
      }
    }

    return jsonResponse({ order });
  });
}
