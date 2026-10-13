// Region check for paid modes.
// Behind Cloudflare the country (and with a transform rule, the region) arrive as headers.
// PAID_BLOCKED is a comma list set by counsel, e.g. "XX,US-AB" (country or country-region).
const BLOCKED = new Set((process.env.PAID_BLOCKED || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean));
function geoOf(req) {
  const country = String(req.headers['cf-ipcountry'] || req.headers['x-country'] || '').toUpperCase() || null;
  const region = String(req.headers['cf-region-code'] || req.headers['x-region'] || '').toUpperCase() || null;
  const key = country && region ? country + '-' + region : null;
  const paid = !(country && BLOCKED.has(country)) && !(key && BLOCKED.has(key)) && country !== 'T1';
  return { country, region, paid };
}
module.exports = { geoOf, BLOCKED };
