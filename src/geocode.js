const normalizeStreet = value => value.toLowerCase().replace(/[.,]/g, '').replace(/\b(rd|st|ave|dr|ln|ct|blvd|ter|pl)\b/g, word => ({ rd: 'road', st: 'street', ave: 'avenue', dr: 'drive', ln: 'lane', ct: 'court', blvd: 'boulevard', ter: 'terrace', pl: 'place' })[word]).replace(/\s+/g, ' ').trim();
export function matchHouse(features, address) {
 const parts = address.trim().match(/^(\d+[a-zA-Z]?)\s+([^,]+)/);
 if (!parts) return null;
 const house = parts[1].toLowerCase(), street = normalizeStreet(parts[2]);
 const feature = features?.find(f => {
  const p = f.properties, coords = f.geometry?.coordinates;
  return f.geometry?.type === 'Point' && Array.isArray(coords) && coords.length === 2 && coords.every(Number.isFinite)
   && Math.abs(coords[1] - 42.3127033) < 0.15 && Math.abs(coords[0] + 71.8115286) < 0.15
   && p?.city?.toLowerCase() === 'worcester' && String(p.housenumber).toLowerCase() === house && normalizeStreet(p.street || '') === street;
 });
 return feature ? [...feature.geometry.coordinates].reverse() : null;
}
