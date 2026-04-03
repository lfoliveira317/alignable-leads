import express from 'express';
import cors from 'cors';
import { scrapeAlignableLeads } from './scraper.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * POST /api/search
 * Body: { keyword: string, location: string, pages: number }
 * Returns: array of company profiles without websites
 */
app.post('/api/search', async (req, res) => {
  const { keyword = '', location = '', pages = 1 } = req.body;

  if (!keyword && !location) {
    return res.status(400).json({ error: 'Provide at least a keyword or location.' });
  }

  try {
    const results = await scrapeAlignableLeads({ keyword, location, pages });
    res.json({ results, total: results.length });
  } catch (err) {
    console.error('[scraper error]', err.message);
    res.status(500).json({ error: err.message || 'Scraping failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`Alignable Leads API running on http://localhost:${PORT}`);
});
