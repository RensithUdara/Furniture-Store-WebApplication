import "server-only";
import { payhere } from "@/lib/config";
import { HttpError } from "@/lib/http";
// PayHere's Refund API. It is separate from checkout and has its own credentials: an App ID
// and App Secret, created in the PayHere merchant portal under Settings > API Keys (with the
// "Refund API" permission ticked). They are read from PAYHERE_APP_ID and PAYHERE_APP_SECRET.
// The same sandbox/live switch as checkout (PAYHERE_MODE) decides which PayHere it talks to.
const base = () =>
  payhere().mode === "live" ? "https://www.payhere.lk" : "https://sandbox.payhere.lk";
export const payhereRefundReady = () =>
  Boolean(process.env.PAYHERE_APP_ID && process.env.PAYHERE_APP_SECRET);

// Refunds a whole PayHere payment back to the customer's card. Returns PayHere's message.
// Throws with PayHere's own explanation when it refuses.
export async function payhereRefund(paymentId: string, description: string) {
  if (!payhereRefundReady())
    throw new HttpError(503, "PayHere refunds are not set up. Record the refund manually instead.");
  const basic = Buffer.from(
    `${process.env.PAYHERE_APP_ID}:${process.env.PAYHERE_APP_SECRET}`,
  ).toString("base64");
  let token: string;
  try {
    const auth = await fetch(`${base()}/merchant/v1/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(15000),
    });
    const data = await auth.json().catch(() => ({}));
    if (!auth.ok || !data.access_token)
      throw new HttpError(
        502,
        "PayHere did not accept the App ID and App Secret. Check them in the PayHere portal.",
      );
    token = data.access_token;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, "PayHere could not be reached. Nothing was refunded; try again.");
  }
  let result: { status?: number; msg?: string };
  try {
    const response = await fetch(`${base()}/merchant/v1/payment/refund`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ payment_id: paymentId, description: description.slice(0, 200) }),
      signal: AbortSignal.timeout(20000),
    });
    result = await response.json().catch(() => ({}));
  } catch {
    // The request may or may not have reached PayHere, so staff must look before retrying.
    throw new HttpError(
      502,
      "PayHere did not answer. Check the payment in the PayHere portal before trying again, in case the refund went through.",
    );
  }
  if (result.status !== 1)
    throw new HttpError(502, `PayHere refused the refund: ${result.msg || "no reason given"}`);
  return result.msg || "Refunded";
}
