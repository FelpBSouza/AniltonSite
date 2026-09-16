  const supabaseConfig = window.SUPABASE_CONFIG;
  const supabaseClient = window.supabase && supabaseConfig?.url && supabaseConfig?.anonKey && !supabaseConfig.anonKey.startsWith('COLE_AQUI')
    ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
    : null;

  const buttons = document.querySelectorAll('#filterBar button');
  const cards = document.querySelectorAll('#albumGrid .album-card');
  const emptyState = document.getElementById('emptyState');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      let visibleCount = 0;

      cards.forEach(card => {
        const match = filter === 'todos' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
        if (match) visibleCount++;
      });

      emptyState.classList.toggle('visible', visibleCount === 0);
    });
  });

  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');

  const setTheme = (isLight) => {
    document.body.classList.toggle('light-theme', isLight);
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.setAttribute('aria-label', isLight ? 'Ativar tema escuro' : 'Ativar tema claro');
  };

  setTheme(savedTheme === 'light');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = !document.body.classList.contains('light-theme');
      setTheme(isLight);
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
  }

  const track = document.getElementById('albumGrid');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (track && prevBtn && nextBtn) {
    const scrollByCard = () => {
      const card = track.querySelector('.album-card:not(.hidden)');
      return card ? card.getBoundingClientRect().width + 20 : 300;
    };
    prevBtn.addEventListener('click', () => track.scrollBy({ left: -scrollByCard(), behavior: 'smooth' }));
    nextBtn.addEventListener('click', () => track.scrollBy({ left: scrollByCard(), behavior: 'smooth' }));
  }

  const storePage = document.getElementById('storePage');
  if (storePage) {
    const accountButton = document.getElementById('accountButton');
    const cartButton = document.getElementById('cartButton');
    const cartCount = document.getElementById('cartCount');
    const authModal = document.getElementById('authModal');
    const cartModal = document.getElementById('cartModal');
    const authForm = document.getElementById('authForm');
    const authSubmit = document.getElementById('authSubmit');
    const googleButton = document.getElementById('googleButton');
    const authMessage = document.getElementById('authMessage');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartMessage = document.getElementById('cartMessage');
    const checkoutButton = document.getElementById('checkoutButton');
    let authMode = 'login';
    let currentUser = null;
    let pendingProduct = null;

    const getUser = () => currentUser;
    const getCart = () => JSON.parse(localStorage.getItem('aniltonCart') || '[]');
    const saveCart = cart => localStorage.setItem('aniltonCart', JSON.stringify(cart));
    const formatPrice = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const setMessage = (element, message, type = '') => {
      element.textContent = message;
      element.className = `form-message ${type}`;
    };

    const openModal = modal => {
      modal.hidden = false;
      document.body.classList.add('modal-open');
    };

    const closeModal = modal => {
      modal.hidden = true;
      if (!document.querySelector('.modal-backdrop:not([hidden])')) document.body.classList.remove('modal-open');
    };

    const updateAccountButton = (user = getUser()) => {
      accountButton.textContent = user ? 'Sair' : 'Entrar';
      accountButton.setAttribute('aria-label', user ? `Sair de ${user.email}` : 'Entrar ou criar conta');
    };

    const finishAuthentication = user => {
      currentUser = user;
      updateAccountButton(user);
      authForm.reset();
      closeModal(authModal);
      if (pendingProduct) {
        addToCart(pendingProduct);
        pendingProduct = null;
      }
    };

    const restoreAuthentication = async () => {
      if (!supabaseClient) {
        updateAccountButton(null);
        return;
      }
      const { data } = await supabaseClient.auth.getSession();
      currentUser = data.session?.user ?? null;
      updateAccountButton(currentUser);
    };

    const renderCart = () => {
      const cart = getCart();
      cartCount.textContent = cart.length;
      cartItems.innerHTML = '';
      if (!cart.length) {
        cartItems.innerHTML = '<p class="cart-empty">Sua sacola está vazia.</p>';
      } else {
        cart.forEach(item => {
          const row = document.createElement('div');
          row.className = 'cart-item';
          row.innerHTML = `<span>${item.title}</span><span>${formatPrice(item.price)} <button type="button" data-remove-id="${item.id}">Remover</button></span>`;
          cartItems.appendChild(row);
        });
      }
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      cartTotal.textContent = formatPrice(total);
      checkoutButton.disabled = !cart.length;
      checkoutButton.style.opacity = cart.length ? '1' : '0.5';
    };

    const addToCart = product => {
      const cart = getCart();
      if (!cart.some(item => item.id === product.id)) {
        cart.push(product);
        saveCart(cart);
      }
      renderCart();
      setMessage(cartMessage, 'Foto adicionada à sua sacola.', 'success');
      openModal(cartModal);
    };

    const setAuthMode = mode => {
      authMode = mode;
      document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.authMode === mode));
      authSubmit.textContent = mode === 'login' ? 'Entrar' : 'Criar conta';
      authMessage.textContent = '';
    };

    document.querySelectorAll('.store-card').forEach((card, index) => {
      const title = card.querySelector('h3').textContent.trim();
      const price = 29.9;
      const purchase = document.createElement('div');
      purchase.className = 'store-purchase';
      purchase.innerHTML = `<span class="store-price">${formatPrice(price)}</span><button class="buy-button" type="button">Comprar foto</button>`;
      card.querySelector('.album-info').appendChild(purchase);
      purchase.querySelector('.buy-button').addEventListener('click', () => {
        const product = { id: String(index), title, price };
        if (!getUser()) {
          pendingProduct = product;
          setMessage(authMessage, 'Entre ou crie uma conta para continuar.');
          openModal(authModal);
          return;
        }
        addToCart(product);
      });
    });

    accountButton.addEventListener('click', () => {
      if (getUser()) {
        supabaseClient.auth.signOut().then(({ error }) => {
          if (error) {
            setMessage(cartMessage, 'Não foi possível sair da conta.', 'error');
            return;
          }
          currentUser = null;
          updateAccountButton(null);
          setMessage(cartMessage, 'Você saiu da sua conta.');
        });
        return;
      }
      setAuthMode('login');
      openModal(authModal);
    });

    cartButton.addEventListener('click', () => {
      renderCart();
      openModal(cartModal);
    });

    document.querySelectorAll('[data-close-modal]').forEach(button => {
      button.addEventListener('click', () => closeModal(document.getElementById(button.dataset.closeModal)));
    });

    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.addEventListener('click', event => {
        if (event.target === modal) closeModal(modal);
      });
    });

    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => setAuthMode(tab.dataset.authMode));
    });

    googleButton.addEventListener('click', async () => {
      if (!supabaseClient) {
        setMessage(authMessage, 'Configure a chave pública do Supabase antes de entrar.', 'error');
        return;
      }

      googleButton.disabled = true;
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.href }
      });
      if (error) {
        googleButton.disabled = false;
        setMessage(authMessage, error.message, 'error');
      }
    });

    authForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!supabaseClient) {
        setMessage(authMessage, 'Configure a chave pública do Supabase antes de entrar.', 'error');
        return;
      }

      const email = new FormData(authForm).get('email').trim().toLowerCase();
      const password = new FormData(authForm).get('password');
      const result = authMode === 'register'
        ? await supabaseClient.auth.signUp({ email, password })
        : await supabaseClient.auth.signInWithPassword({ email, password });

      if (result.error) {
        setMessage(authMessage, result.error.message, 'error');
        return;
      }

      if (authMode === 'register' && !result.data.session) {
        setMessage(authMessage, 'Conta criada. Confirme seu e-mail para entrar.', 'success');
        return;
      }

      setMessage(authMessage, authMode === 'register' ? 'Conta criada.' : 'Login realizado com sucesso.', 'success');
      finishAuthentication(result.data.user);
    });

    cartItems.addEventListener('click', event => {
      const removeButton = event.target.closest('[data-remove-id]');
      if (!removeButton) return;
      saveCart(getCart().filter(item => item.id !== removeButton.dataset.removeId));
      renderCart();
    });

    checkoutButton.addEventListener('click', () => {
      if (!getUser()) {
        setMessage(cartMessage, 'Entre na sua conta para continuar.');
        closeModal(cartModal);
        openModal(authModal);
        return;
      }
      setMessage(cartMessage, 'Checkout pronto. Conecte um provedor de pagamento para finalizar pedidos reais.', 'success');
    });

    if (supabaseClient) {
      supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        updateAccountButton(currentUser);
      });
    }
    restoreAuthentication();
    renderCart();
  }