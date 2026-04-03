import { useState } from 'react';

export default function SearchForm({ onSearch, loading }) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [pages, setPages] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ keyword, location, pages: Number(pages) });
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="keyword">Business Type / Keyword</label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. plumber, restaurant, salon"
          />
        </div>

        <div className="field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin TX, 78701"
          />
        </div>

        <div className="field field--small">
          <label htmlFor="pages">Pages to Scan</label>
          <input
            id="pages"
            type="number"
            min={1}
            max={20}
            value={pages}
            onChange={(e) => setPages(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="btn-search" disabled={loading}>
        {loading ? 'Searching…' : 'Search Alignable'}
      </button>
    </form>
  );
}
