import { money } from "@/lib/format";
// A column chart drawn with plain elements: one column per period, scaled to the tallest.
// Each column carries its exact figure as a tooltip and for screen readers, and the same
// numbers are always available as a table on the Reports page.
export function ColumnChart({
  data,
  label,
}: {
  data: { label: string; value: number }[];
  // What the columns measure, e.g. "Sales".
  label: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!max) return <p className="muted">No sales in this period yet.</p>;
  // Label every column when there are few; otherwise about eight evenly spaced ones.
  const every = Math.ceil(data.length / 8);
  return (
    <figure className="col-chart" aria-label={`${label} by period`}>
      <div className="col-chart-scale" aria-hidden>
        <span>{money(max)}</span>
        <span>{money(max / 2)}</span>
        <span>0</span>
      </div>
      <ol>
        {data.map((d, i) => (
          <li key={d.label + i} title={`${d.label}: ${money(d.value)}`}>
            <div>
              <i style={{ height: `${(d.value / max) * 100}%` }} />
            </div>
            <span className={i % every === 0 ? "" : "is-hidden"}>{d.label}</span>
            <b className="sr-only">
              {d.label}: {money(d.value)}
            </b>
          </li>
        ))}
      </ol>
    </figure>
  );
}
// Horizontal bars for a ranked list, e.g. revenue by category.
export function RankBars({ data }: { data: { name: string; value: number; note?: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 0);
  if (!max) return <p className="muted">Nothing sold in this period yet.</p>;
  return (
    <ul className="bar-list rank-bars">
      {data.map((d) => (
        <li key={d.name}>
          <span title={d.name}>{d.name}</span>
          <div>
            <i className="method-payhere" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <b>{money(d.value)}</b>
        </li>
      ))}
    </ul>
  );
}
