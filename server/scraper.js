import axios from 'axios';
import * as cheerio from 'cheerio';

const BASE_URL = 'https://www.alignable.com';

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Convert a free-text location like "Austin TX" or "Austin, TX"
 * to an Alignable city slug like "austin-tx".
 * Falls back to a best-effort slug if it doesn't match known patterns.
 */
function locationToSlug(location) {
  return location
    .toLowerCase()
    .replace(/,/g, '')       // remove commas
    .trim()
    .replace(/\s+/g, '-')    // spaces → dashes
    .replace(/[^a-z0-9-]/g, ''); // strip anything else
}

/**
 * Build the Alignable directory search URL.
 * Format: https://www.alignable.com/{city-slug}/directory?keyword=...&page=N
 */
function buildSearchUrl(citySlug, keyword, page) {
  const params = new URLSearchParams();
  if (keyword) params.set('keyword', keyword);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return `${BASE_URL}/${citySlug}/directory${qs ? '?' + qs : ''}`;
}

/**
 * Parse one directory page. Returns all visible businesses.
 * NOTE: Alignable gates website/phone behind login — we return all
 * businesses and mark hasWebsiteHint based on description text heuristics.
 */
function parseDirectoryPage(html, citySlug) {
  const $ = cheerio.load(html);
  const businesses = [];

  // Each business card is a div.js-business-row
  $('.js-business-row').each((_i, el) => {
    // Profile link — first .js-hover-card anchor
    const profileHref = $(el).find('a.js-hover-card').first().attr('href') || '';
    // Strip query string from profile href
    const cleanHref = profileHref.split('?')[0];
    const profileUrl = cleanHref ? `${BASE_URL}${cleanHref}` : null;

    // Business name + category come from the purple link text
    // Format is usually "Business Name – Category" or just "Business Name"
    const nameAndCategory = $(el).find('a.text-purple-400').first().text().trim();
    let name = nameAndCategory;
    let category = null;
    if (nameAndCategory.includes('–')) {
      const parts = nameAndCategory.split('–');
      name = parts[0].trim();
      category = parts.slice(1).join('–').trim();
    } else if (nameAndCategory.includes('-')) {
      // Some use a plain dash
      const dashIdx = nameAndCategory.lastIndexOf(' - ');
      if (dashIdx !== -1) {
        name = nameAndCategory.substring(0, dashIdx).trim();
        category = nameAndCategory.substring(dashIdx + 3).trim();
      }
    }

    // City text
    const city = $(el).find('.text-grey-500').first().text().trim();

    // Description text — used as heuristic for website mention
    const description = $(el).find('.text-caption-medium').text().trim();

    // Heuristic: does the description mention a website URL?
    const websitePattern = /\b(www\.|https?:\/\/|\.com|\.net|\.org|\.io)\b/i;
    const descMentionsWebsite = websitePattern.test(description);

    if (name) {
      businesses.push({
        name,
        category: category || null,
        city: city || null,
        profileUrl,
        description: description.substring(0, 200) || null,
        descMentionsWebsite,
        source: 'alignable',
      });
    }
  });

  return businesses;
}

/**
 * Try to find the correct city slug by following Alignable's own redirect.
 * Alignable redirects /search?location=... to the right city slug.
 * If that fails, we fall back to our manual slug converter.
 */
async function resolveCitySlug(location) {
  // First try: Alignable's search redirect
  try {
    const searchUrl = `${BASE_URL}/search?location=${encodeURIComponent(location)}`;
    const res = await axios.get(searchUrl, {
      headers: HEADERS,
      timeout: 10000,
      maxRedirects: 5,
    });
    // Check the final URL after redirects
    const finalUrl = res.request?.res?.responseUrl || res.config?.url || '';
    const match = finalUrl.match(/alignable\.com\/([a-z0-9-]+)\/directory/);
    if (match) return match[1];
  } catch (_e) {
    // ignore, fall through to manual slug
  }

  // Fallback: manual conversion
  return locationToSlug(location);
}

/**
 * Main scraper entry point.
 * @param {{ keyword: string, location: string, pages: number }}
 * @returns {Promise<{ businesses: Array, citySlug: string, warning: string|null }>}
 */
export async function scrapeAlignableLeads({ keyword, location, pages = 1 }) {
  const citySlug = await resolveCitySlug(location);
  console.log(`[scraper] City slug resolved: "${citySlug}"`);

  const allBusinesses = [];
  let warning = null;

  for (let page = 1; page <= pages; page++) {
    const url = buildSearchUrl(citySlug, keyword, page);
    console.log(`[scraper] Fetching page ${page}: ${url}`);

    try {
      const { data: html } = await axios.get(url, {
        headers: HEADERS,
        timeout: 15000,
      });

      // Check for redirect to login page
      if (html.includes('sign_in') && html.includes('Please sign in')) {
        warning = 'Alignable is requiring a login for this search. Results may be incomplete.';
        console.warn('[scraper] Login wall detected');
        break;
      }

      const pageBusinesses = parseDirectoryPage(html, citySlug);
      console.log(`[scraper] Page ${page}: parsed ${pageBusinesses.length} businesses`);

      if (pageBusinesses.length === 0) {
        console.log(`[scraper] No results on page ${page}, stopping.`);
        break;
      }

      allBusinesses.push(...pageBusinesses);

      // Polite delay between pages
      if (page < pages) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.error(`[scraper] Failed to fetch page ${page}:`, err.message);
      warning = `Fetch error on page ${page}: ${err.message}`;
      break;
    }
  }

  // Deduplicate by profileUrl
  const seen = new Set();
  const unique = allBusinesses.filter((b) => {
    const key = b.profileUrl || b.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { businesses: unique, citySlug, warning };
}
