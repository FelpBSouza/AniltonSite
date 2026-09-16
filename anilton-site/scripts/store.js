function createSupabaseClient() {
  const config = window.SUPABASE_CONFIG;
  const hasConfig = config?.url && config?.anonKey && !config.anonKey.startsWith('COLE_AQUI');
  return window.supabase && hasConfig
    ? window.supabase.createClient(config.url, config.anonKey)
    : null;
}

export function initStore() {
  const storePage = document.getElementById('storePage');
  if (!storePage) return;

  const supabaseClient = createSupabaseClient();
  const accountButton = document.getElementById('accountButton');
  const accountAvatar = accountButton.querySelector('.account-avatar');
  const cartButton = document.getElementById('cartButton');
  const cartCount = document.getElementById('cartCount');
  const authModal = document.getElementById('authModal');
  const profileModal = document.getElementById('profileModal');
  const profileAvatar = document.getElementById('profileAvatar');
  const profileView = document.getElementById('profileView');
  const profileLogout = document.getElementById('profileLogout');
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

  const setAvatar = (element, user) => {
    const avatarUrl = user?.user_metadata?.avatar_url;
    element.textContent = avatarUrl ? '' : '◯';
    element.style.backgroundImage = avatarUrl ? `url("${avatarUrl}")` : '';
    element.classList.toggle('has-image', Boolean(avatarUrl));
  };

  const updateAccountButton = (user = getUser()) => {
    setAvatar(accountAvatar, user);
    accountButton.setAttribute('aria-label', user ? `Abrir conta de ${user.email}` : 'Entrar ou criar conta');
  };

  const renderProfileView = view => {
    document.querySelectorAll('[data-profile-view]').forEach(button => {
      button.classList.toggle('active', button.dataset.profileView === view);
    });
    if (view === 'settings') {
      profileView.innerHTML = '<strong>Configurações</strong><span>Preferências da conta e notificações estarão disponíveis aqui.</span>';
    } else if (view === 'purchases') {
      profileView.innerHTML = '<strong>Minhas compras</strong><span>Você ainda não tem compras confirmadas.</span>';
    } else {
      profileView.innerHTML = `<strong>${currentUser?.email || 'Conta não conectada'}</strong><span>Conta protegida pelo Supabase Auth.</span>`;
    }
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
    if (!getUser()) {
      setAuthMode('login');
      openModal(authModal);
      return;
    }
    setAvatar(profileAvatar, currentUser);
    renderProfileView('profile');
    openModal(profileModal);
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

  document.querySelectorAll('[data-profile-view]').forEach(button => {
    button.addEventListener('click', () => renderProfileView(button.dataset.profileView));
  });

  profileLogout.addEventListener('click', async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) {
      setMessage(cartMessage, 'Não foi possível sair da conta.', 'error');
      return;
    }
    currentUser = null;
    updateAccountButton(null);
    closeModal(profileModal);
    setMessage(cartMessage, 'Você saiu da sua conta.');
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
    const formData = new FormData(authForm);
    const email = formData.get('email').trim().toLowerCase();
    const password = formData.get('password');
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
    supabaseClient.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user ?? null;
      updateAccountButton(currentUser);
    });
  } else {
    updateAccountButton(null);
  }
  renderCart();
}
