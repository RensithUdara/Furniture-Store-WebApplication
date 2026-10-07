import { PAYHERE_URLS } from "@/lib/config";
export async function api<T = Record<string, unknown>>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers:
      body instanceof FormData
        ? undefined
        : body
          ? { "Content-Type": "application/json" }
          : undefined,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await response
    .json()
    .catch(() => ({ error: "The server could not be reached. Please try again." }));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}
export async function startPayment(id: string) {
  const result = await api<{ action: string; fields: Record<string, string> }>(
    "/api/payments/payhere",
    "POST",
    { id },
  );
  // Card details are only ever posted to PayHere's own checkout pages.
  if (!(Object.values(PAYHERE_URLS) as string[]).includes(result.action))
    throw new Error("Unexpected payment destination.");
  const form = document.createElement("form");
  form.method = "POST";
  form.action = result.action;
  for (const [name, value] of Object.entries(result.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}
