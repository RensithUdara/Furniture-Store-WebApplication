import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission } from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { supabase } from "@/lib/supabase/server";
import { getSubscribers } from "@/services/marketing";
import { toCsv } from "@/lib/spreadsheet";
import { apiError, checkOrigin, dbError, HttpError, readJson } from "@/lib/http";
// Staff: the subscriber list as a CSV file, for use in an email tool.
export async function GET() {
  try {
    await requirePermission("orders");
    const list = (await getSubscribers()) || [];
    return new Response(
      toCsv([
        ["Email", "Subscribed on", "Status"],
        ...list.map((s) => [
          s.email,
          s.created_at.slice(0, 10),
          s.unsubscribed_at ? "Unsubscribed" : "Subscribed",
        ]),
      ]),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="forma-newsletter.csv"',
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (e) {
    return apiError(e);
  }
}
// Anyone: subscribe an address. Limited per visitor so the form cannot be used to flood the list.
export async function POST(request: Request) {
  try {
    checkOrigin(request);
    const { email } = z.object({ email: z.email().max(254) }).parse(await readJson(request));
    await rateLimit("newsletter-ip", clientIp(request), 5, 3600);
    const db = await supabase();
    const { error } = await db.rpc("subscribe_newsletter", { p_email: email });
    if (error?.code === "PGRST202")
      throw new HttpError(503, "The newsletter is not available yet.");
    if (error) dbError(error);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    checkOrigin(request);
    await requirePermission("orders");
    const { id } = z.object({ id: z.uuid() }).parse(await readJson(request));
    const db = await supabase();
    const { error } = await db.from("newsletter_subscribers").delete().eq("id", id);
    if (error) dbError(error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
