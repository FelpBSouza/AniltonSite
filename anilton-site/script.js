import { initTheme } from './scripts/theme.js';
import { initHome } from './scripts/home.js';
import { initStore } from './scripts/store.js';
import { initSanityContent } from './scripts/sanity-content.js';
import { initSupabaseContent } from './scripts/supabase-content.js';

initTheme();
initHome();
initStore();
initSupabaseContent().then(hasAlbums => {
	if (!hasAlbums) initSanityContent();
});
