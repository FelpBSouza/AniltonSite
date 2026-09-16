export function initHome() {
  const buttons = document.querySelectorAll('#filterBar button');
  const emptyState = document.getElementById('emptyState');

  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');

      const filter = button.dataset.filter;
      const cards = document.querySelectorAll('#albumGrid .album-card');
      let visibleCount = 0;
      cards.forEach(card => {
        const matches = filter === 'todos' || card.dataset.category === filter;
        card.classList.toggle('hidden', !matches);
        if (matches) visibleCount++;
      });
      emptyState?.classList.toggle('visible', visibleCount === 0);
    });
  });

  const track = document.getElementById('albumGrid');
  const previousButton = document.getElementById('prevBtn');
  const nextButton = document.getElementById('nextBtn');
  if (!track || !previousButton || !nextButton) return;

  const scrollByCard = () => {
    const card = track.querySelector('.album-card:not(.hidden)');
    return card ? card.getBoundingClientRect().width + 20 : 300;
  };
  previousButton.addEventListener('click', () => track.scrollBy({ left: -scrollByCard(), behavior: 'smooth' }));
  nextButton.addEventListener('click', () => track.scrollBy({ left: scrollByCard(), behavior: 'smooth' }));
}
