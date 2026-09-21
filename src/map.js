import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { fullAddress } from './route.js';
import { matchHouse } from './geocode.js';

const center = [42.3127033, -71.8115286];
const cacheKey = 'walktoberfest-map-locations-v1';
const endpoint = import.meta.env.VITE_GEOCODER_URL || 'https://photon.komoot.io/api/';
let cached = {};
try { cached = JSON.parse(localStorage.getItem(cacheKey)) || {}; } catch {}
const pending = new Map();
let queue = Promise.resolve();
const validPoint = point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && Math.abs(point[0] - center[0]) < 0.15 && Math.abs(point[1] - center[1]) < 0.15;

function locate(address) {
 const key = fullAddress(address).trim().toLowerCase();
 if (validPoint(cached[key])) return Promise.resolve(cached[key]);
 if (pending.has(key)) return pending.get(key);
 const task = queue.then(async () => {
  try {
   const url = new URL(endpoint);
   url.search = new URLSearchParams({ q: fullAddress(address), limit: '5', lat: String(center[0]), lon: String(center[1]) });
   const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
   if (!response.ok) throw new Error('Address lookup unavailable');
   const data = await response.json();
   const point = matchHouse(data.features, address);
   if (!point) return null;
   cached[key] = point;
   try { localStorage.setItem(cacheKey, JSON.stringify(cached)); } catch {}
   return point;
  } catch { return null; }
 });
 // Serialize and cache address requests, including in-flight requests during edits.
 queue = task.then(() => new Promise(resolve => setTimeout(resolve, 1100)));
 pending.set(key, task);
 return task;
}

export function createRouteMap() {
 const map = L.map('neighborhood-map', { scrollWheelZoom: false }).setView(center, 16);
 const status = document.querySelector('#map-status');
 const tiles = L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · <a href="https://photon.komoot.io">Photon</a>'
 }).addTo(map);
 tiles.on('tileerror', () => { status.textContent = 'Map tiles could not load. Check your connection; walking directions are still available.'; });
 const layer = L.featureGroup().addTo(map);
 const markers = new Map();
 let version = 0, signature = '', current = [], focused = null;
 function showAll() { if (layer.getLayers().length) map.fitBounds(layer.getBounds(), { padding: [35, 45], maxZoom: 17, animate: false }); else map.setView(center, 16); }
 function draw(locations) {
  layer.clearLayers(); markers.clear();
  current.forEach((stop, index) => {
   const point = locations[index]; if (!point) return;
   const pin = L.divIcon({ className: 'numbered-marker', html: `<span class="map-pin"><span>${index + 1}</span></span>`, iconSize: [34, 42], iconAnchor: [17, 42], popupAnchor: [0, -39] });
   const popup = document.createElement('div');
   const title = document.createElement('strong'); title.textContent = `${index + 1}. ${stop.host}`;
   const address = document.createElement('p'); address.textContent = stop.address;
   popup.append(title, address);
   if (stop.offering) { const offering = document.createElement('p'); offering.textContent = stop.offering; popup.append(offering); }
   const marker = L.marker(point, { icon: pin, title: `Stop ${index + 1}: ${stop.host}`, alt: `Stop ${index + 1}: ${stop.host}, ${stop.address}` }).bindPopup(popup).addTo(layer);
   markers.set(stop.id, marker);
  });
  if (focused && markers.has(focused)) focus(focused); else showAll();
 }
 function focus(id) {
  focused = id;
  const marker = markers.get(id);
  if (marker) { map.setView(marker.getLatLng(), 17, { animate: false }); marker.openPopup(); }
  else status.textContent = 'This house is not located yet. Check its street address if it does not appear.';
 }
 document.querySelector('#show-all-stops').onclick = () => { focused = null; map.closePopup(); showAll(); };
 document.querySelector('#retry-map').onclick = () => { pending.clear(); signature = ''; update(current); };
 async function update(stops) {
  const nextSignature = JSON.stringify(stops);
  if (nextSignature === signature) return;
  signature = nextSignature; current = stops; focused = null;
  const run = ++version;
  document.querySelector('#retry-map').hidden = true;
  const locations = stops.map(stop => cached[fullAddress(stop.address).trim().toLowerCase()]).map(point => validPoint(point) ? point : null);
  draw(locations);
  status.textContent = stops.length ? 'Locating houses…' : 'Add a house to place the first pin.';
  await Promise.all(stops.map(async (stop, index) => {
   locations[index] = await locate(stop.address);
   if (run === version) draw(locations);
  }));
  if (run !== version) return;
  const missing = stops.filter((_, index) => !locations[index]);
  status.textContent = missing.length ? `Could not locate: ${missing.map(s => s.address).join('; ')}. Check the addresses or retry.` : stops.length ? `${stops.length} ${stops.length === 1 ? 'stop' : 'stops'} · Pin numbers match the list.` : 'Add a house to place the first pin.';
  document.querySelector('#retry-map').hidden = !missing.length;
 }
 new ResizeObserver(() => map.invalidateSize()).observe(document.querySelector('#neighborhood-map'));
 return { update, focus };
}
