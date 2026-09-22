export const photos = [
 { src: '/DSC_3574.JPG', alt: 'Neighbors gathered outside a house decorated for Halloween', position: 'center 65%' },
 { src: '/20251023_202907.jpg', alt: 'A stack of Walktoberfest T-shirts' },
 { src: '/DSC_3542.JPG', alt: 'A decorated pumpkin with a drink dispenser tap' },
 { src: '/DSC_3661.JPG', alt: 'A tray of nachos with cheese, jalapeños, and red onion' },
 { src: '/DSC_3745.JPG', alt: 'A roast being sliced to share' },
 { src: '/DSC_3620.JPG', alt: 'A cooler strapped into a crate on a skateboard among fallen leaves' }
];

export function setupGallery() {
 const viewer = document.querySelector('#photo-viewer');
 const image = document.querySelector('#viewer-image');
 const caption = document.querySelector('#viewer-caption');
 let current = 0;
 function show(index) {
  current = (index + photos.length) % photos.length;
  image.src = photos[current].src;
  image.alt = photos[current].alt;
  caption.textContent = `${current + 1} / ${photos.length} · ${photos[current].alt}`;
 }
 document.querySelectorAll('[data-photo]').forEach(button => {
  button.addEventListener('click', () => { show(Number(button.dataset.photo)); viewer.showModal(); });
 });
 document.querySelector('#viewer-close').onclick = () => viewer.close();
 document.querySelector('#viewer-prev').onclick = () => show(current - 1);
 document.querySelector('#viewer-next').onclick = () => show(current + 1);
 viewer.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
   event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1));
  }
 });
 viewer.addEventListener('click', event => {
  if (event.target !== viewer) return;
  const bounds = viewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
 });
}
