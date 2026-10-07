import { requirePermission } from "@/lib/auth";
import { getOrders } from "@/services/orders";
import { getProducts } from "@/services/catalog";
import { addDays, PERIODS, reportSheets, salesReport, today, type Period } from "@/lib/reports";
import { toCsv, toXlsx } from "@/lib/spreadsheet";
import { apiError } from "@/lib/http";
const date = (value: string | null, fallback: string) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : fallback;
// Downloads the sales report. ?format=xlsx gives one workbook with every table;
// ?format=csv&sheet=sales|products|orders gives one table as CSV.
export async function GET(request: Request) {
  try {
    await requirePermission("dashboard");
    const q = new URL(request.url).searchParams;
    const to = date(q.get("to"), today()),
      from = date(q.get("from"), addDays(to, -29));
    const period = (PERIODS.includes(q.get("group") as Period) ? q.get("group") : "day") as Period;
    const [orders, products] = await Promise.all([getOrders(true), getProducts(true)]);
    const sheets = reportSheets(salesReport(orders, products, from, to, period));
    const name = `forma-sales-${from}-to-${to}`;
    if (q.get("format") === "xlsx")
      return new Response(toXlsx(sheets), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${name}.xlsx"`,
          "Cache-Control": "no-store",
        },
      });
    const index = { sales: 0, products: 1, orders: 2 }[q.get("sheet") || "sales"] ?? 0;
    return new Response(toCsv(sheets[index].rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}-${["sales", "best-sellers", "orders"][index]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
