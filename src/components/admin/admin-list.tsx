"use client";
import { useState, type ReactNode } from "react";
import { Pencil, Plus, Search } from "lucide-react";
import { Modal } from "@/components/dialogs";
// The shared layout for simple admin records (categories, coupons, slides, roles):
// a searchable table of what exists, an Add button, and a popup holding the form.
// Clicking a row opens the same popup to view, edit or delete that record.
export function AdminList<T>({
  items,
  rowKey,
  rowLabel,
  columns,
  noun,
  plural,
  searchText,
  size = "md",
  children,
}: {
  items: T[];
  rowKey: (item: T) => string;
  // The record's name, used for the popup title and for screen readers.
  rowLabel: (item: T) => string;
  columns: { header: string; cell: (item: T) => ReactNode }[];
  // What one record is called, e.g. "category".
  noun: string;
  plural: string;
  searchText: (item: T) => string;
  size?: "sm" | "md" | "lg";
  // The form. `item` is undefined when adding; call `close` when the work is done.
  children: (item: T | undefined, close: () => void) => ReactNode;
}) {
  const [selected, setSelected] = useState<T | "new" | null>(null);
  const [query, setQuery] = useState("");
  const close = () => setSelected(null);
  const q = query.trim().toLowerCase();
  const rows = items.filter((item) => searchText(item).toLowerCase().includes(q));
  const editing = selected && selected !== "new" ? selected : undefined;
  return (
    <>
      <div className="catalog-tools">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label={`Search ${plural}`}
            placeholder={`Search ${plural}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="button" onClick={() => setSelected("new")}>
          <Plus size={16} /> Add {noun}
        </button>
      </div>
      {rows.length ? (
        <div className="table-wrap">
          <table className="clickable-rows">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.header}>{c.header}</th>
                ))}
                <th>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={rowKey(item)} onClick={() => setSelected(item)}>
                  {columns.map((c) => (
                    <td key={c.header}>{c.cell(item)}</td>
                  ))}
                  <td>
                    <div className="row-actions">
                      {/* The row is clickable for mouse users; this button is the keyboard route. */}
                      <button
                        aria-label={`View or edit ${rowLabel(item)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(item);
                        }}
                      >
                        <Pencil size={15} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state panel">
          <h2>{items.length ? "Nothing matches your search" : `No ${plural} yet`}</h2>
          <p>
            {items.length
              ? "Try a different word."
              : `Use the Add ${noun} button to create the first one.`}
          </p>
        </div>
      )}
      <Modal
        open={selected !== null}
        onClose={close}
        size={size}
        title={editing ? rowLabel(editing) : `Add ${noun}`}
        description={editing ? `View, edit or delete this ${noun}.` : undefined}
      >
        {/* A fresh form each time, so one record's unsaved edits never leak into another. */}
        {selected !== null && (
          <div key={editing ? rowKey(editing) : "new"}>{children(editing, close)}</div>
        )}
      </Modal>
    </>
  );
}
