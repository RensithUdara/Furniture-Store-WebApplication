import { NextResponse } from "next/server";
import { getOrder } from "@/services/orders";
import { apiError, HttpError } from "@/lib/http";
import { z } from "zod";
export async function GET(_r: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const order = await getOrder(z.uuid().parse((await params).id));
    if (!order) throw new HttpError(404, "Order not found.");
    return NextResponse.json(order);
  } catch (e) {
    return apiError(e);
  }
}
