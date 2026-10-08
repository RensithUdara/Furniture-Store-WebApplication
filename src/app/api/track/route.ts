import { NextResponse } from "next/server";
import { lookupOrder } from "@/services/tracking";
import { trackSchema } from "@/lib/validation";
import { apiError, checkOrigin, HttpError, readJson } from "@/lib/http";
import { serviceKey } from "@/lib/config";
import { clientIp, rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";

// Order tracking without signing in. The caller must know the order number AND the phone
// number or email used on that order; see services/tracking.ts for what is returned.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    if (!serviceKey()) throw new HttpError(503, "Order tracking is not available right now.");
    await rateLimit("track-ip", clientIp(request), 12, 600);
    const { order_number, contact } = trackSchema.parse(await readJson(request));
    // Per order number as well: guessing the contact detail for one known order is the real risk.
    await rateLimit("track-order", order_number.toUpperCase(), 6, 600);
    const order = await lookupOrder(order_number, contact);
    // One answer for "no such order" and "wrong contact", so order numbers cannot be probed.
    if (!order)
      throw new HttpError(
        404,
        "We could not find an order with that number and contact detail. Check both and try again.",
      );
    return NextResponse.json(order);
  } catch (e) {
    return apiError(e);
  }
}
