"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleHelp, TriangleAlert, X } from "lucide-react";

// A popup window built on the browser's own <dialog>, which keeps keyboard focus inside it,
// closes on Escape, and dims the page behind it.
export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      aria-label={title}
      onClose={onClose}
      // A click on the dimmed area (the dialog element itself, not its content) closes it.
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <div className="modal-panel">
          <header className="modal-head">
            <div>
              <h2>{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
              <X size={20} />
            </button>
          </header>
          <div className="modal-body">{children}</div>
        </div>
      )}
    </dialog>
  );
}

type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  // "danger" for anything that removes or cannot be undone.
  tone?: "default" | "danger";
};
const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(() =>
  Promise.resolve(false),
);
// Ask before acting:  if (await confirm({ title: "Delete this coupon?", tone: "danger" })) ...
export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(answer: boolean) => void>(null);
  const ref = useRef<HTMLDialogElement>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolver.current = resolve;
        setRequest(options);
      }),
    [],
  );
  function answer(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (request && !dialog.open) dialog.showModal();
    if (!request && dialog.open) dialog.close();
  }, [request]);
  const danger = request?.tone === "danger";
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={ref}
        className="modal modal-confirm"
        role="alertdialog"
        aria-label={request?.title}
        // Escape or a click outside counts as "no".
        onClose={() => request && answer(false)}
        onClick={(e) => e.target === ref.current && answer(false)}
      >
        {request && (
          <div className="modal-panel">
            <span className={`confirm-icon${danger ? " danger" : ""}`}>
              {danger ? <TriangleAlert size={24} /> : <CircleHelp size={24} />}
            </span>
            <h2>{request.title}</h2>
            {request.message && <div className="confirm-message">{request.message}</div>}
            <div className="confirm-actions">
              <button type="button" className="button button-outline" onClick={() => answer(false)}>
                {request.cancelLabel || "Cancel"}
              </button>
              <button
                type="button"
                className={`button${danger ? " button-danger" : ""}`}
                autoFocus
                onClick={() => answer(true)}
              >
                {request.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}
