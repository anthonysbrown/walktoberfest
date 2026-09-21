export const initialRoute = { revision: 0, stops: [{ id: 'heroult', host: 'The starting spot', address: '15 Heroult Rd', offering: 'Meet here for our first neighborhood toast.', notes: '' }] };
export function validateRoute(value) {
  if (!value || !Number.isInteger(value.revision) || value.revision < 0 || !Array.isArray(value.stops) || value.stops.length > 30) return false;
  const ids = new Set();
  return value.stops.every(s => {
    if (!s || typeof s.id !== 'string' || !/^[a-zA-Z0-9-]{1,64}$/.test(s.id) || ids.has(s.id)) return false;
    ids.add(s.id);
    return ['host', 'address', 'offering', 'notes'].every(k => typeof s[k] === 'string' && s[k].length <= (k === 'notes' ? 500 : 160)) && s.host.trim().length > 0 && s.address.trim().length > 0;
  });
}
export function moveStop(stops, id, position) {
  const next = stops.filter(s => s.id !== id);
  const stop = stops.find(s => s.id === id);
  if (stop) next.splice(Math.max(0, Math.min(position, next.length)), 0, stop);
  return next;
}
export const fullAddress = address => `${address}, Worcester, MA 01606`;
export function directionsUrl(stops) {
  if (!stops.length) return '';
  const params = new URLSearchParams({ api: '1', travelmode: 'walking', destination: fullAddress(stops.at(-1).address) });
  if (stops.length > 1) params.set('origin', fullAddress(stops[0].address));
  if (stops.length > 2) params.set('waypoints', stops.slice(1, -1).map(s => fullAddress(s.address)).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}
