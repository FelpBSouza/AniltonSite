const config = window.SUPABASE_CONFIG;
const client = window.supabase && config?.url && config?.anonKey
  ? window.supabase.createClient(config.url, config.anonKey)
  : null;

function publicPreview(path) {
  if (!path || !client) return '';
  return client.storage.from('photo-previews').getPublicUrl(path).data.publicUrl;
}

function renderAlbums(albums) {
  const grid = document.getElementById('albumGrid');
  if (!grid) return;
  grid.innerHTML = albums.map(album => `
    <article class="album-card" data-category="${album.category || ''}">
      <div class="album-photo">
        <img src="${publicPreview(album.cover_path)}" alt="${album.title}">
        <span class="album-tag tag-${album.category}">${album.category || 'Album'}</span>
      </div>
      <div class="album-info">
        <h3>${album.title}</h3>
        <div class="album-loc">${album.location || ''}</div>
        <div class="album-date">${album.event_date ? new Date(`${album.event_date}T00:00:00`).toLocaleDateString('pt-BR') : ''}</div>
      </div>
    </article>
  `).join('');
}

export async function initSupabaseContent() {
  if (!client || !document.getElementById('albumGrid')) return false;
  const { data, error } = await client
    .from('albums')
    .select('id,title,category,location,event_date,cover_path,photos(title,preview_path)')
    .eq('is_published', true)
    .not('cover_path', 'is', null)
    .order('event_date', { ascending: false });
  if (error) {
    console.warn(`Supabase: ${error.message}`);
    return false;
  }
  if (!data?.length) return false;
  renderAlbums(data);
  return true;
}
