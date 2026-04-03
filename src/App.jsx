import { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import StatusBar from './components/StatusBar';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [searched, setSearched] = useState(false);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);

  const handleSearch = async ({ keyword, location, pages }) => {
    setLoading(true);
    setError(null);
    setWarning(null);
    setResults([]);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location, pages }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || 'Server error');
      }

      const data = await res.json();
      setResults(data.results);
      if (data.warning) setWarning(data.warning);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayResults = filterNoWebsite
    ? results.filter((r) => !r.descMentionsWebsite)
    : results;

  const exportCSV = () => {
    if (!displayResults.length) return;
    const headers = ['Name', 'Category', 'City', 'Description', 'Website Mentioned in Desc', 'Profile URL'];
    const rows = displayResults.map((r) => [
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      `"${(r.city || '').replace(/"/g, '""')}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      r.descMentionsWebsite ? 'Yes' : 'No',
      `"${r.profileUrl || ''}"`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alignable-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔍 Alignable Leads Finder</h1>
        <p className="subtitle">Find businesses on Alignable that don&apos;t have a website yet</p>
      </header>

      <main>
        <SearchForm onSearch={handleSearch} loading={loading} />

        {warning && (
          <div className="status-bar status--warning">
            ⚠️ {warning}
          </div>
        )}

        <StatusBar
          loading={loading}
          searched={searched}
          count={displayResults.length}
          total={results.length}
          filtered={filterNoWebsite}
          error={error}
          onExport={exportCSV}
          onToggleFilter={() => setFilterNoWebsite((v) => !v)}
        />

        {displayResults.length > 0 && <ResultsTable results={displayResults} />}
      </main>
    </div>
  );
}

export default App;
