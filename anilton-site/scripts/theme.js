export function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');

  const setTheme = isLight => {
    document.body.classList.toggle('light-theme', isLight);
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Ativar tema escuro' : 'Ativar tema claro');
  };

  setTheme(savedTheme === 'light');
  themeToggle?.addEventListener('click', () => {
    const isLight = !document.body.classList.contains('light-theme');
    setTheme(isLight);
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}
