export default function StatusBar({ loading, searched, count, total, filtered, error, onExport, onToggleFilter }) {
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
            ✅ Showing <strong>{count}</strong>
            {filtered && total !== count ? ` of ${total}` : ''} businesses
            {filtered ? ' (no-website hint filter ON)' : ''}.

            <button
              className="btn-filter"
              onClick={onToggleFilter}
              title="Filter to businesses whose description doesn't mention a website"
            >
              {filtered ? '🔓 Show All' : '🔍 Filter: No Website Hint'}
            </button>

            <button className="btn-export" onClick={onExport}>
              ⬇ Export CSV
            </button>
          </>
        ) : (
          <>
            🔎 No businesses found.{' '}
            {filtered && total > 0
              ? `${total} total — try turning off the filter.`
              : 'Try a different keyword or location.'}
            {total > 0 && (
              <button className="btn-filter" onClick={onToggleFilter}>
                🔓 Show All ({total})
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
