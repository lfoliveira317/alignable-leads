# 🔍 Alignable Leads Finder

A Node.js + Vite + React tool to search **Alignable** for local businesses that **don't have a website yet** — potential leads for web design / digital services.

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Frontend | React 19 + Vite               |
| Backend  | Node.js + Express             |
| Scraping | Axios + Cheerio               |
| Export   | CSV download (client-side)    |

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the Express API server (terminal 1)
```bash
npm run server
# → http://localhost:3001
```

### 3. Start the Vite dev server (terminal 2)
```bash
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to the Express server automatically.

## How It Works

1. Enter a **keyword** (e.g. `plumber`) and/or a **location** (e.g. `Austin TX`)
2. Choose how many pages to scan (1–20)
3. The Express backend scrapes Alignable's `/local_businesses` endpoint
4. Only companies **without a website link** on their profile card are returned
5. Export results to **CSV** with one click

## Project Structure

```
alignable-leads/
├── server/
│   ├── index.js        # Express API server
│   └── scraper.js      # Axios + Cheerio scraper logic
├── src/
│   ├── components/
│   │   ├── SearchForm.jsx
│   │   ├── ResultsTable.jsx
│   │   └── StatusBar.jsx
│   ├── App.jsx
│   └── App.css
├── vite.config.js      # Vite + /api proxy config
└── .env                # PORT=3001
```

## Notes

- Alignable may require a login for full profile data. The scraper targets the public search pages.
- Be respectful of rate limits — the scraper adds a 1.5s delay between pages.
- CSS selectors in `server/scraper.js` may need updating if Alignable changes their markup.
