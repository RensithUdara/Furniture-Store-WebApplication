import { createHash, timingSafeEqual } from "node:crypto";
const md5 = (s: string) => createHash("md5").update(s).digest("hex").toUpperCase();
export function checkoutHash(merchant: string, order: string, amount: string, secret: string) {
  return md5(merchant + order + amount + "LKR" + md5(secret));
}
export type Notification = {
  merchant_id: string;
  order_id: string;
  payment_id: string;
  payhere_amount: string;
  payhere_currency: string;
  status_code: string;
  md5sig: string;
};
export function verifyNotification(n: Notification, merchant: string, secret: string) {
  if (
    !merchant ||
    !secret ||
    n.merchant_id !== merchant ||
    n.payhere_currency !== "LKR" ||
    !["2", "0", "-1", "-2", "-3"].includes(n.status_code)
  )
    return false;
  if (
    !/^\d{1,10}\.\d{2}$/.test(n.payhere_amount) ||
    !/^[a-f\d]{32}$/i.test(n.md5sig) ||
    !n.payment_id ||
    n.payment_id.length > 100
  )
    return false;
  const expected = md5(
    n.merchant_id +
      n.order_id +
      n.payhere_amount +
      n.payhere_currency +
      n.status_code +
      md5(secret),
  );
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(n.md5sig, "hex"));
}
