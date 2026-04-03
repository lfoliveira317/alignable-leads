import { useState } from 'react';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import StatusBar from './components/StatusBar';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async ({ keyword, location, pages }) => {
    setLoading(true);
    setError(null);
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
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Name', 'Category', 'City', 'Profile URL'];
    const rows = results.map((r) => [
      `"${r.name}"`,
      `"${r.category || ''}"`,
      `"${r.city || ''}"`,
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

        <StatusBar
          loading={loading}
          searched={searched}
          count={results.length}
          error={error}
          onExport={exportCSV}
        />

        {results.length > 0 && <ResultsTable results={results} />}
      </main>
    </div>
  );
}

export default App;
