import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { assistantReady, runAssistant, type AssistantEvent } from "@/lib/assistant";
import { apiError, checkOrigin, HttpError, readJson } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
export const runtime = "nodejs";

const body = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        // A shopper's message is short; the assistant's own earlier answers can be longer.
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40)
    .refine((m) => m[m.length - 1].role === "user", "The last message must be from the shopper")
    .refine((m) => m.filter((t) => t.role === "user").every((t) => t.content.length <= 1000), {
      message: "Please keep your message under 1000 characters",
    }),
});

// The shopping assistant. Answers arrive as a stream of JSON lines (one AssistantEvent per
// line) so the chat window can show the text as it is written.
export async function POST(request: Request) {
  try {
    // Read-only: asking a question changes nothing in the store.
    checkOrigin(request, false);
    if (!assistantReady()) throw new HttpError(503, "The assistant is not available right now.");
    const ip = clientIp(request);
    // Every message costs money to answer, so each visitor gets a fair but bounded share.
    await rateLimit("assistant-ip", ip, 15, 600);
    await rateLimit("assistant-ip-day", ip, 120, 86400);
    const { messages } = body.parse(await readJson(request));
    // Only the recent part of a long chat is sent on; it must still start with the shopper.
    let history = messages.slice(-16);
    while (history.length && history[0].role !== "user") history = history.slice(1);

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let open = true;
        const emit = (event: AssistantEvent) => {
          if (open) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        };
        try {
          await runAssistant(history, emit, ip, request.signal);
          emit({ type: "done" });
        } catch (e) {
          // The visitor closed the chat or left the page: nothing to report.
          if (!request.signal.aborted) {
            console.error("Assistant error:", e);
            emit({
              type: "error",
              message:
                e instanceof Anthropic.RateLimitError || (e instanceof Anthropic.APIError && Number(e.status) >= 500)
                  ? "The assistant is busy right now. Please try again in a moment."
                  : "Sorry, something went wrong. Please try again.",
            });
          }
        } finally {
          open = false;
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-store, no-transform",
        // Ask proxies not to hold the answer back until it is complete.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
