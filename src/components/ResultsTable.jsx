export default function ResultsTable({ results }) {
  return (
    <div className="results-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Business Name</th>
            <th>Category</th>
            <th>City</th>
            <th>Alignable Profile</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.profileUrl || i}>
              <td className="num">{i + 1}</td>
              <td className="name">{r.name}</td>
              <td>{r.category || '—'}</td>
              <td>{r.city || '—'}</td>
              <td>
                {r.profileUrl ? (
                  <a href={r.profileUrl} target="_blank" rel="noreferrer">
                    View Profile ↗
                  </a>
                ) : (
                  '—'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
