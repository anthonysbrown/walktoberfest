import { photos, setupGallery } from './gallery.js';
import Sortable from 'sortablejs';
import { createRouteMap } from './map.js';
import './style.css';
import { initialRoute, validateRoute, moveStop, directionsUrl, fullAddress } from './route.js';

const icons = {
 grip: '<circle cx="8" cy="5" r="1"/><circle cx="16" cy="5" r="1"/><circle cx="8" cy="12" r="1"/><circle cx="16" cy="12" r="1"/><circle cx="8" cy="19" r="1"/><circle cx="16" cy="19" r="1"/>',
 leaf: '<path d="M20 4C8 2 3 8 5 15c6 5 15 1 15-11Z"/><path d="M4 21 15 10"/>',
 pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 5h2m4 0h2"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 house: '<path d="m3 10 9-7 9 7v11H3Zm6 11v-8h6v8"/>',
 glass: '<path d="M5 3h14l-2 9a5 5 0 0 1-10 0Zm7 14v5m-4 0h8M6 8h12"/>',
 walk: '<circle cx="14" cy="4" r="2"/><path d="m7 12 4-5 4 2 3 5m-7-7-1 8-5 6m5-6 5 2 1 5"/>',
 plus: '<path d="M12 5v14M5 12h14"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
 heart: '<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 8 15 8 15S25 10 20 5Z"/>',
 up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
 share: '<path d="M12 16V3m-5 5 5-5 5 5M5 13v8h14v-8"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let route = structuredClone(initialRoute), mode = 'loading', busy = false, editingId = null, dragging = false;
document.querySelector('#app').innerHTML = `
<header class="site-header"><div class="header-inner"><a class="header-logo" href="#event-title" aria-label="Walktoberfest event details"><img src="/logo/logo.png" alt="Walktoberfest — Indian Hill Social Club" width="320" height="207"></a><nav aria-label="Main navigation"><a href="#route">The stops</a><a href="#gallery">Photos</a></nav></div></header>
<main class="page">
<section class="event-details" aria-labelledby="event-title">
<h2><span>${icon('calendar')} Saturday, October 24, 2026</span><br><span>${icon('clock')} 5:00 PM</span></h2>
<p>Walktoberfest is an Indian Hill Social Club event where you can host a short stop at your home and serve drinks or appetizers. You can host a stop or simply join us for the shenanigans! <br><br>If you would like a T-shirt or have any questions, text Tony at <a href="sms:508-360-7312">508-360-7312</a>.</p>
</section>
<section id="route" aria-labelledby="route-title">
<div class="route-heading"><div><h2 id="route-title">The stops <span id="stop-count"></span></h2><p>Add your house and choose where it fits in the evening.</p></div><button class="button" data-add>${icon('plus')} Add your house</button></div>
<div class="route-grid"><div><div id="stops"></div><p class="route-tip">Drag the dotted handle to reorder, or use the arrows.</p></div>
<aside class="map-panel" aria-label="Neighborhood map"><div class="map-toolbar"><span>All stops</span><button id="show-all-stops" class="edit-link">Show all</button></div><div id="neighborhood-map" aria-label="Map with numbered neighborhood stops"></div><div class="map-caption"><span id="map-status" role="status">Loading map…</span><button id="retry-map" class="edit-link" hidden>Retry locations</button><a id="directions" target="_blank" rel="noopener">Walking directions ${icon('arrow')}</a></div></aside></div>
<p id="storage-status" class="storage-status" role="status">Loading the route…</p>
</section>
<section id="gallery" class="gallery-section" aria-labelledby="gallery-title"><div class="gallery-heading"><h2 id="gallery-title">Around the neighborhood</h2><p>A few moments from Walktoberfest.</p></div><div class="photo-grid">${photos.map((photo, index) => `<button type="button" class="photo-thumb" data-photo="${index}" aria-label="Open photo ${index + 1}: ${escape(photo.alt)}"><img src="${photo.src}" alt="${escape(photo.alt)}" loading="lazy" decoding="async" style="object-position:${photo.position || 'center'}"><span aria-hidden="true">View photo ${icon('plus')}</span></button>`).join('')}</div></section>
</main>
<dialog id="photo-viewer" aria-label="Walktoberfest photo gallery"><div class="viewer-toolbar"><span>Walktoberfest photos</span><button type="button" id="viewer-close" class="icon-button" aria-label="Close photo viewer">${icon('close')}</button></div><img id="viewer-image" alt=""><div class="viewer-footer"><button type="button" id="viewer-prev" class="icon-button" aria-label="Previous photo">${icon('arrow')}</button><p id="viewer-caption" aria-live="polite"></p><button type="button" id="viewer-next" class="icon-button" aria-label="Next photo">${icon('arrow')}</button></div></dialog>
<dialog id="house-dialog"><form id="house-form"><div class="dialog-heading"><div><div class="eyebrow">HOUSE DETAILS</div><h2 id="dialog-title">Add your house.</h2></div><button type="button" class="icon-button" id="close-dialog" aria-label="Close">${icon('close')}</button></div><p>Share a few details so your neighbors know where to go.</p><label>Host or household name<input name="host" required maxlength="160" placeholder="Family Name" autocomplete="name"></label><label>Street address<input name="address" required maxlength="160" placeholder="ex: 15 Heroult Rd" autocomplete="street-address"><small>Worcester, MA 01606 · Visible to anyone with the link.</small></label><label>What are you serving? <span>(optional)</span><input name="offering" maxlength="160" placeholder="Warm pretzels"></label><div class="form-row"><label>Stop in the route<select name="position"></select></label></div><label>A note for your neighbors <span>(optional)</span><textarea name="notes" maxlength="500" rows="2" placeholder="Come around to the backyard!"></textarea></label><p id="form-error" class="error" role="alert"></p><div class="dialog-actions"><button type="button" id="delete-house" class="text-link danger" hidden>Remove house</button><button type="submit" class="button" id="save-house">Save house ${icon('arrow')}</button></div></form></dialog><div id="toast" role="status"></div>`;

setupGallery();
const routeMap = createRouteMap();
const dialog = document.querySelector('#house-dialog');
const form = document.querySelector('#house-form');
const stopSorter = Sortable.create(document.querySelector('#stops'), {
 handle: '.drag-handle',
 draggable: '.stop',
 animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150,
 ghostClass: 'stop-placeholder',
 chosenClass: 'stop-chosen',
 dragClass: 'stop-dragging',
 delay: 100,
 delayOnTouchOnly: true,
 touchStartThreshold: 4,
 disabled: true,
 onStart() { dragging = true; },
 onEnd(event) {
  dragging = false;
  if (event.oldDraggableIndex === event.newDraggableIndex) return;
  const id = event.item.dataset.id;
  const position = event.newDraggableIndex;
  // Let Sortable finish cleaning up before rendering the saved list.
  queueMicrotask(async () => {
   try {
    await save(moveStop(route.stops, id, position));
    toast(`Stop moved to position ${position + 1}.`);
   } catch (err) { render(); toast(err.message); }
  });
 }
});
function toast(message) { const el = document.querySelector('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(window.toastTimeout); window.toastTimeout = setTimeout(() => el.classList.remove('visible'), 4500); }
function render() {
 stopSorter.option('disabled', busy || !['local', 'shared'].includes(mode) || route.stops.length < 2);
 document.querySelector('#stops').classList.toggle('sorting-disabled', busy || !['local', 'shared'].includes(mode) || route.stops.length < 2);
 document.querySelector('#stop-count').textContent = `(${route.stops.length})`;
 document.querySelector('#storage-status').textContent = mode === 'local' ? 'Local preview · Changes save only in this browser.' : mode === 'error' ? 'The shared route is unavailable. Reload to try again; editing is paused.' : 'Anyone with the link can add a house or adjust the order.';
 document.querySelector('#stops').innerHTML = route.stops.map((s, i) => `<article class="stop" data-id="${s.id}"><div class="stop-number">${i + 1}</div><div class="stop-details"><div class="stop-label">${i === 0 ? 'START · 5:00 PM' : `STOP ${i + 1}`}</div><h3>${escape(s.host)}</h3><a class="address" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress(s.address))}">${icon('pin')}${escape(s.address)}</a>${s.offering ? `<p>${escape(s.offering)}</p>` : ''}${s.notes ? `<p class="stop-note">${escape(s.notes)}</p>` : ''}<div class="stop-actions"><button class="edit-link" data-edit="${s.id}">Edit</button><button class="edit-link" data-map="${s.id}" aria-label="Show ${escape(s.host)} on the map">Show on map</button></div></div><div class="reorder"><span class="drag-handle" title="Drag to reorder" aria-hidden="true">${icon('grip')}</span><button class="icon-button" data-move="${s.id}" data-direction="-1" aria-label="Move ${escape(s.host)} earlier" ${i === 0 || busy ? 'disabled' : ''}>${icon('up')}</button><button class="icon-button" data-move="${s.id}" data-direction="1" aria-label="Move ${escape(s.host)} later" ${i === route.stops.length - 1 || busy ? 'disabled' : ''}>${icon('down')}</button></div></article>`).join('');
 routeMap.update(route.stops);
 const directions = document.querySelector('#directions'); directions.href = directionsUrl(route.stops); directions.hidden = !route.stops.length;
 document.querySelectorAll('[data-add], [data-edit]').forEach(b => { b.disabled = busy || mode === 'error' || mode === 'loading'; });
 document.querySelectorAll('[data-move]').forEach(b => { if (busy || mode === 'error' || mode === 'loading') b.disabled = true; });
}
async function load() {
 if (dragging) return;
 try {
  const response = await fetch('/api/route');
  if (dragging) return;
  const type = response.headers.get('content-type') || '';
  if ((import.meta.env.DEV && !type.includes('application/json')) || response.status === 404) { mode = 'local'; }
  else { const data = await response.json(); if (data.code === 'STORAGE_NOT_CONFIGURED') mode = 'local'; else if (!response.ok || !validateRoute(data)) throw new Error(); else { mode = 'shared'; route = data; } }
  if (mode === 'local') { try { const saved = JSON.parse(localStorage.getItem('walktoberfest-route')); if (validateRoute(saved)) route = saved; } catch {} }
 } catch { mode = 'error'; }
 render();
}
async function save(stops) {
 if (busy || !['local','shared'].includes(mode)) throw new Error('Please wait for the route to load.');
 busy = true; render();
 try {
  const candidate = { revision: route.revision, stops };
  if (!validateRoute(candidate)) throw new Error('Please check your details. The route can hold up to 30 houses.');
  if (mode === 'local') { candidate.revision++; localStorage.setItem('walktoberfest-route', JSON.stringify(candidate)); route = candidate; }
  else { const response = await fetch('/api/route', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(candidate) }); const data = await response.json(); if (!response.ok) { if (response.status === 409) await load(); throw new Error(data.error || 'Unable to save. Please try again.'); } route = data; }
 } finally { busy = false; render(); }
}
function openForm(id = null) {
 if (busy || !['local','shared'].includes(mode)) return;
 editingId = id; form.reset(); const stop = route.stops.find(s => s.id === id);
 document.querySelector('#dialog-title').textContent = stop ? 'Edit your house.' : 'Add your house.';
 document.querySelector('#delete-house').hidden = !stop;
 document.querySelector('#form-error').textContent = '';
 for (const field of ['host','address','offering','notes']) form.elements[field].value = stop?.[field] || '';
 form.elements.position.innerHTML = Array.from({ length: route.stops.length + (stop ? 0 : 1) }, (_, i) => `<option value="${i}">${i + 1}${i === 0 ? ' · The first toast' : ''}</option>`).join('');
 form.elements.position.value = stop ? route.stops.findIndex(s => s.id === id) : route.stops.length;
 dialog.showModal();
}
document.addEventListener('click', async e => {
 if (e.target.closest('[data-add]')) openForm();
 const mapStop = e.target.closest('[data-map]'); if (mapStop) { routeMap.focus(mapStop.dataset.map); document.querySelector('.map-panel').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'nearest' }); }
 const edit = e.target.closest('[data-edit]'); if (edit) openForm(edit.dataset.edit);
 const move = e.target.closest('[data-move]');
 if (move) { const index = route.stops.findIndex(s => s.id === move.dataset.move); try { await save(moveStop(route.stops, move.dataset.move, index + Number(move.dataset.direction))); toast('Route order updated.'); } catch (err) { toast(err.message); } }
});
document.querySelector('#close-dialog').onclick = () => { if (!busy) dialog.close(); };
form.onsubmit = async e => {
 e.preventDefault(); const button = document.querySelector('#save-house'); button.disabled = true;
 const data = Object.fromEntries(new FormData(form));
 const stop = { id: editingId || crypto.randomUUID(), host: data.host.trim(), address: data.address.trim(), offering: data.offering.trim(), notes: data.notes.trim() };
 const next = route.stops.filter(s => s.id !== editingId); next.splice(Number(data.position), 0, stop);
 try { await save(next); dialog.close(); toast(mode === 'local' ? 'House saved to your local preview.' : 'Your house is on the route. See you there!'); } catch (err) { document.querySelector('#form-error').textContent = err.message; } finally { button.disabled = false; }
};
document.querySelector('#delete-house').onclick = async () => { if (!confirm('Remove this house from the route?')) return; try { await save(route.stops.filter(s => s.id !== editingId)); dialog.close(); toast('House removed from the route.'); } catch (err) { document.querySelector('#form-error').textContent = err.message; } };
window.addEventListener('storage', e => { if (mode === 'local' && e.key === 'walktoberfest-route') load(); });
window.addEventListener('focus', () => { if (mode === 'shared' && !dialog.open && !busy && !dragging) load(); });
load();
