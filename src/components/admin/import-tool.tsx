"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { api } from "@/lib/client-api";
import { csvRecords } from "@/lib/spreadsheet";
import {
  MAX_IMPORT_ROWS,
  PRODUCT_COLUMNS,
  type ImportResult,
  type ProductRow,
} from "@/lib/product-sheet";
// Bulk add and edit: download the catalogue as a spreadsheet, change it in Excel or Google
// Sheets, save it as CSV, and upload it here. Nothing is saved until "Import" is pressed.
export function ImportTool({ slugs }: { slugs: string[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<ProductRow[]>([]),
    [file, setFile] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [results, setResults] = useState<ImportResult[] | null>(null);
  const found = [...new Set(rows.map((r) => (r.slug || "").toLowerCase()).filter(Boolean))];
  const fresh = found.filter((s) => !slugs.includes(s)).length;
  async function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    setRows([]);
    setResults(null);
    setError("");
    setFile(picked?.name || "");
    if (!picked) return;
    if (picked.size > 3_000_000) return setError("That file is larger than 3 MB.");
    const records = csvRecords(await picked.text());
    if (!records.length) return setError("The file has no rows under its header line.");
    const columns = Object.keys(records[0]);
    if (!columns.includes("slug") || !columns.includes("sku"))
      return setError(
        "The file needs at least the columns slug and sku. Download the current products to get the right layout, and save from Excel as “CSV UTF-8”.",
      );
    if (records.length > MAX_IMPORT_ROWS)
      return setError(
        `A file can hold up to ${MAX_IMPORT_ROWS} rows. Split it and import each part.`,
      );
    // Only the known columns are sent; anything else in the file is ignored.
    setRows(
      records.map((r) =>
        Object.fromEntries(PRODUCT_COLUMNS.flatMap((c) => (r[c] ? [[c, r[c]]] : []))),
      ),
    );
  }
  async function run() {
    setBusy(true);
    setError("");
    try {
      const { results } = await api<{ results: ImportResult[] }>("/api/products/import", "POST", {
        rows,
      });
      setResults(results);
      setRows([]);
      setFile("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The import could not be completed.");
    } finally {
      setBusy(false);
    }
  }
  const failed = results?.filter((r) => r.status === "error").length || 0;
  return (
    <>
      <section className="form-card">
        <h2>1. Get the spreadsheet</h2>
        <p>
          Download every product as a CSV file. It has one row per finish; rows with the same slug
          belong to one product. Open it in Excel or Google Sheets.
        </p>
        <a className="button button-outline" href="/api/products/export">
          <Download size={16} /> Download current products
        </a>
      </section>
      <section className="form-card">
        <h2>2. Edit it</h2>
        <ul className="plain-list">
          <li>
            <strong>To change products,</strong> edit the cells. An empty cell leaves that detail as
            it is. Keep the <code>slug</code> and <code>sku</code> columns unchanged so each row
            finds its product and finish.
          </li>
          <li>
            <strong>To add a product,</strong> add rows with a new slug (lower-case letters, numbers
            and dashes). It needs a name, category, description, material, dimensions, and for each
            finish a SKU, colour and price.
          </li>
          <li>
            <strong>To add a finish,</strong> add a row with the product’s slug and a new SKU.
          </li>
          <li>
            <code>category</code> is the category’s slug or name. <code>images</code> are links
            separated by <code>|</code>. <code>visible</code>, <code>featured</code> and{" "}
            <code>finish_active</code> take yes or no. In <code>was_price</code>, 0 removes a sale
            price.
          </li>
          <li>Rows left out of the file are not touched; nothing is ever deleted by an import.</li>
        </ul>
      </section>
      <section className="form-card">
        <h2>3. Upload it</h2>
        <p>
          Save the sheet as <strong>CSV UTF-8</strong>, then choose the file. You will see what it
          contains before anything is saved.
        </p>
        <label className="button button-outline file-button">
          <Upload size={16} /> {file || "Choose a CSV file"}
          <input type="file" accept=".csv,text/csv" onChange={choose} hidden />
        </label>
        {rows.length > 0 && (
          <>
            <p className="info-message">
              {rows.length} {rows.length === 1 ? "row" : "rows"} for {found.length}{" "}
              {found.length === 1 ? "product" : "products"}: {fresh} new, {found.length - fresh} to
              update.
            </p>
            <div className="order-actions">
              <button className="button" disabled={busy} onClick={run}>
                {busy
                  ? "Importing…"
                  : `Import ${found.length} ${found.length === 1 ? "product" : "products"}`}
              </button>
            </div>
          </>
        )}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>
      {results && (
        <section className="form-card" aria-live="polite">
          <h2>Result</h2>
          <p className={failed ? "error-message" : "success-message"}>
            {results.length - failed} saved
            {failed
              ? `, ${failed} not saved. Fix those rows and import the file again; saved products are simply updated again.`
              : "."}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Result</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {/* Problems first, so they are not lost under a long list of successes. */}
                {[...results]
                  .sort((a, b) => Number(b.status === "error") - Number(a.status === "error"))
                  .map((r) => (
                    <tr key={r.slug}>
                      <td>
                        <strong>{r.name || r.slug}</strong>
                        <small>{r.slug}</small>
                      </td>
                      <td>
                        <span
                          className={`status ${r.status === "error" ? "status-cancelled" : "status-paid"}`}
                        >
                          {r.status === "error"
                            ? "Not saved"
                            : r.status === "created"
                              ? "Created"
                              : "Updated"}
                        </span>
                      </td>
                      <td>{r.message}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
