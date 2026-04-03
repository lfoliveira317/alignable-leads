import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.alignable.com';
const SEARCH_URL = `${BASE_URL}/local_businesses`;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Build the Alignable search URL
 * @param {string} keyword
 * @param {string} location
 * @param {number} page
 */
function buildSearchUrl(keyword, location, page) {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (location) params.set('location', location);
  if (page > 1) params.set('page', String(page));
  return `${SEARCH_URL}?${params.toString()}`;
}

/**
 * Parse a single search results page HTML and return companies
 * that have NO website listed.
 * @param {string} html
 * @returns {Array}
 */
function parseResults(html) {
  const $ = cheerio.load(html);
  const companies = [];

  // Alignable business cards selector (may need updates if site changes)
  $('div[class*="business-card"], div[class*="business_card"], .profile-card, .biz-card, [data-testid="business-card"]').each((_i, el) => {
    const name = $(el).find('[class*="business-name"], [class*="biz-name"], h2, h3').first().text().trim();
    const profileLink = $(el).find('a[href*="/biz/"]').first().attr('href');
    const category = $(el).find('[class*="category"], [class*="industry"]').first().text().trim();
    const city = $(el).find('[class*="location"], [class*="city"]').first().text().trim();

    // Detect if a website link is present on the card
    const websiteEl = $(el).find('a[href*="http"]:not([href*="alignable.com"])');
    const hasWebsite = websiteEl.length > 0;

    if (!hasWebsite && name) {
      companies.push({
        name,
        category: category || null,
        city: city || null,
        profileUrl: profileLink ? `${BASE_URL}${profileLink}` : null,
        website: null,
        source: 'alignable',
      });
    }
  });

  return companies;
}

/**
 * Main scraper entry point.
 * @param {{ keyword: string, location: string, pages: number }}
 * @returns {Promise<Array>}
 */
export async function scrapeAlignableLeads({ keyword, location, pages = 1 }) {
  const allResults = [];

  for (let page = 1; page <= pages; page++) {
    const url = buildSearchUrl(keyword, location, page);
    console.log(`[scraper] Fetching page ${page}: ${url}`);

    try {
      const { data: html } = await axios.get(url, {
        headers: HEADERS,
        timeout: 15000,
      });

      const pageResults = parseResults(html);
      console.log(`[scraper] Page ${page}: found ${pageResults.length} companies without websites`);
      allResults.push(...pageResults);

      // Polite delay between pages
      if (page < pages) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`[scraper] Failed to fetch page ${page}:`, err.message);
      // Continue to next page instead of crashing
    }
  }

  // Deduplicate by profileUrl
  const seen = new Set();
  return allResults.filter((c) => {
    const key = c.profileUrl || c.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
