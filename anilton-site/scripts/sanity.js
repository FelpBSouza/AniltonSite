const config = window.SANITY_CONFIG;
const isConfigured = config?.projectId && !config.projectId.startsWith('COLE_AQUI');

function imageUrl(source, width = 900) {
  if (!source) return '';
  const ref = source.asset?._ref || source._ref;
  if (!ref) return '';
  const [, id, dimensions, format] = ref.split('-');
  return `https://cdn.sanity.io/images/${config.projectId}/${config.dataset}/${id}-${dimensions}.${format}?w=${width}&auto=format`;
}

export async function fetchPublishedAlbums() {
  if (!isConfigured) return [];
  const query = encodeURIComponent(`*[_type == "album" && published == true] | order(eventDate desc) {
    _id, title, slug, category, location, eventDate, description,
    cover { asset },
    photos[] { _key, title, supabasePhotoId, preview { asset } }
  }`);
  const response = await fetch(`https://${config.projectId}.apicdn.sanity.io/v${config.apiVersion}/data/query/${config.dataset}?query=${query}`);
  if (!response.ok) throw new Error('Não foi possível carregar os álbuns do Sanity.');
  const result = await response.json();
  return result.result.map(album => ({
    ...album,
    coverUrl: imageUrl(album.cover),
    photos: (album.photos || []).map(photo => ({ ...photo, previewUrl: imageUrl(photo.preview, 1200) }))
  }));
}

export function sanityIsConfigured() {
  return isConfigured;
}
