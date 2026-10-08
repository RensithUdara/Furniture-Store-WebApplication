"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { money } from "@/lib/format";
import type { AssistantEvent, ProductCard } from "@/lib/assistant";

type Turn = {
  role: "user" | "assistant";
  content: string;
  products?: ProductCard[];
  failed?: boolean;
};
const STARTERS = [
  "Help me choose a sofa",
  "What does delivery cost?",
  "Show me what’s on sale",
  "Where is my order?",
];
const KEY = "forma-assistant";

// The assistant writes plain text with two kinds of markup: [label](/path) links and **bold**.
// Anything else is shown as written. Only links into this site are made clickable.
function rich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\[([^\]\n]{1,120})\]\((\/[^\s)]{0,200})\)|\*\*([^*\n]{1,200})\*\*/g;
  let last = 0,
    match: RegExpExecArray | null;
  while ((match = pattern.exec(text))) {
    if (match.index > last) out.push(text.slice(last, match.index));
    out.push(
      match[1] ? (
        <Link key={match.index} href={match[2]}>
          {match[1]}
        </Link>
      ) : (
        <strong key={match.index}>{match[3]}</strong>
      ),
    );
    last = pattern.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Assistant() {
  const path = usePathname();
  const [open, setOpen] = useState(false),
    [turns, setTurns] = useState<Turn[]>([]),
    [draft, setDraft] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const list = useRef<HTMLDivElement>(null),
    input = useRef<HTMLTextAreaElement>(null),
    request = useRef<AbortController | null>(null);
  // The conversation lasts for the browser tab, so it survives moving between pages.
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(KEY) || "[]");
      if (Array.isArray(saved)) setTurns(saved.slice(-40));
    } catch {}
  }, []);
  useEffect(() => {
    if (busy) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-40)));
    } catch {}
  }, [turns, busy]);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [turns, status, open]);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);
  useEffect(() => () => request.current?.abort(), []);
  // Staff pages have their own tools; checkout stays free of distractions.
  if (path.startsWith("/admin") || path.startsWith("/checkout")) return null;

  async function send(text: string) {
    const question = text.trim().slice(0, 1000);
    if (!question || busy) return;
    const history: Turn[] = [
      ...turns.filter((t) => !t.failed),
      { role: "user", content: question },
    ];
    setTurns([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setBusy(true);
    setStatus("Thinking…");
    // Changes only the answer being written, the last turn.
    const update = (change: (t: Turn) => Turn) =>
      setTurns((all) => all.map((t, i) => (i === all.length - 1 ? change(t) : t)));
    const fail = (message: string) =>
      update((t) => ({ ...t, content: t.content || message, failed: !t.content }));
    const stop = new AbortController();
    request.current = stop;
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
        signal: stop.signal,
      });
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        return fail(data.error || "The assistant is not available right now.");
      }
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as AssistantEvent;
          if (event.type === "text") {
            setStatus("");
            update((t) => ({ ...t, content: t.content + event.delta }));
          } else if (event.type === "products")
            // Each product once, however many searches the answer took.
            update((t) => ({
              ...t,
              products: [
                ...(t.products || []),
                ...event.items.filter((p) => !t.products?.some((x) => x.slug === p.slug)),
              ].slice(0, 6),
            }));
          else if (event.type === "status") setStatus(event.label);
          else if (event.type === "error") fail(event.message);
        }
      }
      update((t) =>
        t.content
          ? t
          : { ...t, content: "Sorry, I didn’t get an answer. Please try again.", failed: true },
      );
    } catch {
      if (!stop.signal.aborted) fail("The connection was lost. Please try again.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }
  return (
    <>
      {!open && (
        <button
          className="assistant-fab"
          onClick={() => setOpen(true)}
          aria-label="Open the shopping assistant"
        >
          <Sparkles size={22} />
          <span>Ask us</span>
        </button>
      )}
      {open && (
        <section className="assistant" role="dialog" aria-label="Shopping assistant">
          <header>
            <span className="assistant-mark">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Forma assistant</strong>
              <small>AI helper · answers can be wrong, so check details before ordering</small>
            </div>
            {turns.length > 0 && !busy && (
              <button className="assistant-clear" onClick={() => setTurns([])}>
                New chat
              </button>
            )}
            <button aria-label="Close the assistant" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </header>
          <div className="assistant-list" ref={list} aria-live="polite">
            {!turns.length && (
              <div className="assistant-welcome">
                <p>
                  Hello! I can help you find furniture, compare pieces, and answer questions about
                  delivery, payment, returns and your order.
                </p>
                <div>
                  {STARTERS.map((s) => (
                    <button key={s} onClick={() => send(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`assistant-turn is-${t.role}${t.failed ? " is-failed" : ""}`}>
                {t.content && <p>{t.role === "assistant" ? rich(t.content) : t.content}</p>}
                {t.products && t.products.length > 0 && (
                  <ul className="assistant-products">
                    {t.products.map((p) => (
                      <li key={p.slug}>
                        <Link href={`/products/${p.slug}`}>
                          <img src={p.image} alt="" width={56} height={56} loading="lazy" />
                          <span>
                            <strong>{p.name}</strong>
                            <small>
                              {p.category}
                              {!p.inStock && " · out of stock"}
                            </small>
                          </span>
                          <b>
                            {p.was && <s>{money(p.was)}</s>}
                            {money(p.price)}
                          </b>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            {busy && status && (
              <p className="assistant-status" role="status">
                <i />
                <i />
                <i />
                {status}
              </p>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
          >
            <textarea
              ref={input}
              rows={1}
              aria-label="Your message"
              placeholder="Ask about furniture, delivery or your order…"
              maxLength={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Enter sends; Shift+Enter makes a new line.
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(draft);
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <button className="assistant-send" aria-label="Send" disabled={busy || !draft.trim()}>
              <ArrowUp size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
