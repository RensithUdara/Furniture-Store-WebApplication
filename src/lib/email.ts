import "server-only";
// Outgoing email for staff alerts, sent through Resend's HTTP API. It is switched on by three
// settings: RESEND_API_KEY, EMAIL_FROM (a sender on a domain verified with Resend), and
// ALERT_EMAIL_TO (who receives the alerts; several addresses separated by commas).
// Without them nothing is sent and nothing fails.
export const alertRecipients = () =>
  (process.env.ALERT_EMAIL_TO || "")
    .split(",")
    .map((a) => a.trim())
    .filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
export const emailReady = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM && alertRecipients().length);
export async function sendEmail(message: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !message.to.length) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      console.error("Email was not accepted:", response.status, await response.text());
    return response.ok;
  } catch (e) {
    console.error("Email could not be sent:", e);
    return false;
  }
}
