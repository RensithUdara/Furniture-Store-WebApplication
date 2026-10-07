// Shown while a page's data is loading: a progress bar across the top and a centred spinner.
export default function Loading() {
  return (
    <div className="loader" aria-busy="true">
      <div className="loader-bar" />
      <svg className="loader-rings" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" pathLength="100" strokeDasharray="78 22" />
        <circle cx="50" cy="50" r="33" pathLength="100" strokeDasharray="62 38" />
        <circle cx="50" cy="50" r="22" pathLength="100" strokeDasharray="45 55" />
      </svg>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
