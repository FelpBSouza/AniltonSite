import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const config = window.SUPABASE_CONFIG;
const supabase = config?.url && config?.anonKey ? createClient(config.url, config.anonKey) : null;
const $ = selector => document.querySelector(selector);
const loginPanel = $('#loginPanel');
const dashboard = $('#dashboard');
const loginForm = $('#loginForm');
const albumForm = $('#albumForm');
const albumList = $('#albumList');
const logoutButton = $('#logoutButton');
const setMessage = (element, message, type = '') => {
  element.textContent = message;
  element.className = `admin-message ${type}`;
};

const slugify = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const safeName = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-');
const formatDate = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : 'Sem data';

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  logoutButton.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  dashboard.hidden = true;
  logoutButton.hidden = true;
}

async function isAdmin(user) {
  if (!user) return false;
  const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (error) throw error;
  return data?.role === 'admin';
}

async function loadAlbums() {
  const { data, error } = await supabase.from('albums').select('id,title,category,event_date,is_published,photos(count)').order('created_at', { ascending: false });
  if (error) throw error;
  albumList.innerHTML = '';
  if (!data?.length) {
    albumList.innerHTML = '<p class="admin-empty">Nenhum album criado ainda.</p>';
    return;
  }
  data.forEach(album => {
    const item = document.createElement('article');
    item.className = 'album-list-item';
    const photoCount = album.photos?.[0]?.count ?? 0;
    item.innerHTML = `<div><h3>${album.title}</h3><p>${album.category} · ${formatDate(album.event_date)} · ${photoCount} foto(s)</p></div>`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = album.is_published ? 'Despublicar' : 'Publicar';
    button.addEventListener('click', () => togglePublished(album));
    item.appendChild(button);
    albumList.appendChild(item);
  });
}

async function togglePublished(album) {
  const { error } = await supabase.from('albums').update({ is_published: !album.is_published }).eq('id', album.id);
  if (error) {
    setMessage($('#albumMessage'), `Nao foi possivel atualizar: ${error.message}`, 'error');
    return;
  }
  setMessage($('#albumMessage'), album.is_published ? 'Album retirado do site.' : 'Album publicado no site.', 'success');
  await loadAlbums();
}

async function uploadPhoto(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
}

function createPreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1400 / image.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0, 0, 0, 0.42)';
        context.font = `700 ${Math.max(18, canvas.width / 32)}px Nunito Sans, sans-serif`;
        context.textAlign = 'right';
        context.fillText('ANILTON BATISTA', canvas.width - 24, canvas.height - 24);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Nao foi possivel gerar a previa.')), 'image/jpeg', 0.82);
      };
      image.onerror = () => reject(new Error('Nao foi possivel ler uma das imagens.'));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Nao foi possivel ler uma das imagens.'));
    reader.readAsDataURL(file);
  });
}

async function createAlbum(event) {
  event.preventDefault();
  const submit = albumForm.querySelector('button[type="submit"]');
  const message = $('#albumMessage');
  const formData = new FormData(albumForm);
  const files = [...$('#albumPhotos').files];
  submit.disabled = true;
  setMessage(message, 'Salvando album e enviando fotos...');
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user.id;
    const title = formData.get('title').trim();
    const { data: album, error: albumError } = await supabase.from('albums').insert({
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      category: formData.get('category'),
      location: formData.get('location').trim() || null,
      description: formData.get('description').trim() || null,
      event_date: formData.get('eventDate') || null,
      is_published: formData.get('published') === 'on'
    }).select('id').single();
    if (albumError) throw albumError;

    const price = Number(formData.get('price'));
    for (const [index, file] of files.entries()) {
      const path = `${userId}/${album.id}/${crypto.randomUUID()}-${safeName(file.name)}`;
      await uploadPhoto('photo-originals', path, file);
      const previewPath = `${path}.preview.jpg`;
      const preview = await createPreview(file);
      await uploadPhoto('photo-previews', previewPath, preview);
      const { error: photoError } = await supabase.from('photos').insert({
        album_id: album.id,
        title: file.name.replace(/\.[^.]+$/, ''),
        storage_path: path,
        preview_path: previewPath,
        price,
        is_published: true
      });
      if (photoError) throw photoError;
      if (index === 0) {
        const { error: coverError } = await supabase.from('albums').update({ cover_path: previewPath }).eq('id', album.id);
        if (coverError) throw coverError;
      }
    }
    albumForm.reset();
    $('#photoPrice').value = '29.90';
    setMessage(message, 'Album salvo com sucesso.', 'success');
    await loadAlbums();
  } catch (error) {
    setMessage(message, `Nao foi possivel salvar: ${error.message}`, 'error');
  } finally {
    submit.disabled = false;
  }
}

async function start() {
  if (!supabase) {
    setMessage($('#loginMessage'), 'Configure o Supabase antes de usar o painel.', 'error');
    return;
  }
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = loginForm.querySelector('button');
    button.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email: $('#loginEmail').value.trim(), password: $('#loginPassword').value });
    if (error) setMessage($('#loginMessage'), error.message, 'error');
    button.disabled = false;
  });
  albumForm.addEventListener('submit', createAlbum);
  $('#refreshButton').addEventListener('click', loadAlbums);
  logoutButton.addEventListener('click', () => supabase.auth.signOut());
  supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session?.user) {
      showLogin();
      return;
    }
    try {
      if (!(await isAdmin(session.user))) {
        await supabase.auth.signOut();
        setMessage($('#loginMessage'), 'Esta conta nao tem permissao de administrador.', 'error');
        return;
      }
      showDashboard();
      await loadAlbums();
    } catch (error) {
      setMessage($('#loginMessage'), `Nao foi possivel validar o acesso: ${error.message}`, 'error');
    }
  });
  const { data } = await supabase.auth.getSession();
  if (!data.session) showLogin();
}

start();
