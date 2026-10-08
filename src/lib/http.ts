import { bumpCatalog } from "@/lib/catalog-cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { appUrl } from "@/lib/config";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function apiError(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      { error: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 400 },
    );
  if (error instanceof HttpError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof SyntaxError)
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  console.error(
    "Request failed",
    error instanceof Error ? error.message : "Database or service error",
  );
  return NextResponse.json(
    { error: "We could not complete that request. Please try again." },
    { status: 500 },
  );
}
export function checkOrigin(request: Request) {
  // A change is about to be made: the shared copy of the catalogue is no longer current.
  bumpCatalog();
  const expected = new URL(appUrl() || request.url).origin;
  if (request.headers.get("origin") !== expected)
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function readJson(request: Request) {
  const raw = await request.text();
  if (raw.length > 100000) throw new HttpError(413, "Request is too large.");
  return JSON.parse(raw);
}
export function dbError(error: { code?: string; message: string }) {
  if (error.code === "23505") throw new HttpError(409, "That slug or SKU is already in use.");
  if (error.code === "P0001") throw new HttpError(409, error.message);
  throw error;
}
