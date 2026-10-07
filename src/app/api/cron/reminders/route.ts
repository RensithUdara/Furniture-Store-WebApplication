import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendCartReminders } from "@/services/marketing";
// For a scheduler (Hostinger cron job, cron-job.org, ...) to call every 15 minutes or so:
//   GET /api/cron/reminders   with the header   Authorization: Bearer <CRON_SECRET>
// The store also sends reminders by itself whenever someone visits; this endpoint only makes
// the timing independent of traffic. Without CRON_SECRET set it always refuses.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const given = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  const a = Buffer.from(given),
    b = Buffer.from(secret);
  if (secret.length < 16 || a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  return NextResponse.json({ sent: await sendCartReminders(true) });
}
