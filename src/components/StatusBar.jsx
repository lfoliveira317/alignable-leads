export default function StatusBar({ loading, searched, count, error, onExport }) {
  if (loading) {
    return (
      <div className="status-bar status--loading">
        <span className="spinner" /> Scraping Alignable — please wait…
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-bar status--error">
        ⚠️ {error}
      </div>
    );
  }

  if (searched) {
    return (
      <div className="status-bar status--success">
        {count > 0 ? (
          <>
            ✅ Found <strong>{count}</strong> businesses without a website.
            <button className="btn-export" onClick={onExport}>
              ⬇ Export CSV
            </button>
          </>
        ) : (
          '🔎 No businesses without websites found. Try a different keyword or location.'
        )}
      </div>
    );
  }

  return null;
}
