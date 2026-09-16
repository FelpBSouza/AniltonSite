import { fetchPublishedAlbums, sanityIsConfigured } from './sanity.js';

function formatDate(value) {
  if (!value) return '';
  return new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR');
}

function renderHomeAlbums(albums) {
  const grid = document.getElementById('albumGrid');
  if (!grid || !albums.length) return;
  grid.innerHTML = albums.map(album => `
    <article class="album-card" data-category="${album.category || ''}">
      <div class="album-photo">
        <img src="${album.coverUrl}" alt="${album.title}">
        <span class="album-tag tag-${album.category}">${album.category || 'Álbum'}</span>
      </div>
      <div class="album-info">
        <h3>${album.title}</h3>
        <div class="album-loc">${album.location || ''}</div>
        <div class="album-date">${formatDate(album.eventDate)}</div>
      </div>
    </article>
  `).join('');
}

export async function initSanityContent() {
  if (!sanityIsConfigured()) return;
  try {
    const albums = await fetchPublishedAlbums();
    renderHomeAlbums(albums);
    document.dispatchEvent(new CustomEvent('sanity:albums-loaded', { detail: albums }));
  } catch (error) {
    console.warn(error.message);
  }
}
