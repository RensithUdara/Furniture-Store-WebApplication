import { z } from "zod";
import { getOrder } from "@/services/orders";
import { getSettings } from "@/services/settings";
import { invoicePdf } from "@/lib/invoice";
import { appUrl, whatsappNumber } from "@/lib/config";
import { apiError, HttpError } from "@/lib/http";
export const runtime = "nodejs";
// The bill as a PDF file. Access follows the order itself: row-level security only returns
// it to the customer who placed it or to an admin, and everyone else gets "not found".
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder(z.uuid().parse((await params).id));
    if (!order) throw new HttpError(404, "Order not found.");
    const bytes = await invoicePdf(order, {
      whatsapp: whatsappNumber(),
      site: appUrl() || new URL(request.url).origin,
      settings: await getSettings(),
    });
    return new Response(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Forma-Invoice-${order.order_number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
