// ===== TIENDA.JS =====
const Tienda = {

  currentFilter: { platform: 'all', genre: 'all', search: '' },

  init() {
    this.renderGames();
    this.renderCollections();
    this.renderRecommendations();
    this.buildFilters();
    updateCartCount();
  },

  buildFilters() {
    const games = Storage.getGames();
    const genres = [...new Set(games.map(g => g.genre))].sort();
    const platforms = ['PlayStation', 'Nintendo', 'Xbox', 'PC'];

    const genreEl = document.getElementById('genreFilters');
    if (genreEl) {
      genreEl.innerHTML =
        `<button class="filter-chip active" onclick="Tienda.filterByGenre('all', this)">Todos</button>` +
        genres.map(g => `<button class="filter-chip" onclick="Tienda.filterByGenre('${g}', this)">${g}</button>`).join('');
    }

    const platformEl = document.getElementById('platformFilters');
    if (platformEl) {
      platformEl.innerHTML =
        `<button class="filter-chip active" onclick="Tienda.filterByPlatform('all', this)">Todas</button>` +
        platforms.map(p => `<button class="filter-chip" onclick="Tienda.filterByPlatform('${p}', this)">${p}</button>`).join('');
    }
  },

  filterByGenre(genre, btn) {
    this.currentFilter.genre = genre;
    document.querySelectorAll('#genreFilters .filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderGames();
  },

  filterByPlatform(platform, btn) {
    this.currentFilter.platform = platform;
    document.querySelectorAll('#platformFilters .filter-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.renderGames();
  },

  search(term) {
    this.currentFilter.search = term;
    this.renderGames();
  },

  getFilteredGames() {
    let games = Storage.getGames();
    const { platform, genre, search } = this.currentFilter;
    if (platform !== 'all') games = games.filter(g => g.platform === platform);
    if (genre !== 'all') games = games.filter(g => g.genre === genre);
    if (search) games = games.filter(g =>
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()) ||
      g.genre.toLowerCase().includes(search.toLowerCase())
    );
    return games;
  },

  renderGames() {
    const games = this.getFilteredGames();
    const el = document.getElementById('gamesGrid');
    if (!el) return;

    if (games.length === 0) {
      el.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <i class="bi bi-search"></i>
            <h4>Sin resultados</h4>
            <p>Prueba con otro filtro o busqueda</p>
          </div>
        </div>`;
      return;
    }

    const cart = Storage.getCart();

    el.innerHTML = games.map(g => {
      const inCart = cart.find(c => c.id === g.id && c.type === 'game');
      const qtyInCart = inCart ? (inCart.qty || 1) : 0;
      const remaining = g.stock - qtyInCart;
      const shortId = g.id.split('_')[1] || g.id;

      return `
        <div class="col-xl-3 col-lg-4 col-md-6 col-sm-6">
          <div class="card-gg h-100" style="display:flex;flex-direction:column;cursor:pointer" onclick="Tienda.openDetail('${g.id}')">
            <div style="position:relative;overflow:hidden">
              <img src="${g.image}" class="card-img-top" alt="${g.title}"
                   onerror="this.parentElement.innerHTML='<div class=\'img-placeholder\'><i class=\'bi bi-controller\'></i></div>'"
                   style="pointer-events:none">
              <div style="position:absolute;top:8px;left:8px">${getPlatformBadge(g.platform)}</div>
              <div style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.75);border-radius:6px;
                          padding:3px 8px;font-size:11px;font-weight:700;font-family:'Orbitron',monospace;color:var(--accent-blue)">
                #${shortId}
              </div>
              <div style="position:absolute;bottom:0;left:0;right:0;height:40px;
                          background:linear-gradient(transparent,rgba(0,0,0,0.7));pointer-events:none"></div>
            </div>
            <div class="card-body" style="flex:1;display:flex;flex-direction:column">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <span class="badge-genre">${g.genre}</span>
                <span class="${getStockClass(g.stock)}" style="font-size:11px;font-weight:700">
                  ${g.stock <= 3 && g.stock > 0 ? '⚠️ ' : ''}${g.stock} und.
                </span>
              </div>
              <h5 class="card-title">${g.title}</h5>
              <p class="card-text" style="font-size:12px;flex:1;color:var(--text-secondary)">${g.description.substring(0, 75)}...</p>
              <div class="mt-2" style="font-size:11px;color:var(--accent-blue);opacity:0.8">
                <i class="bi bi-zoom-in me-1"></i> Clic para ver detalles
              </div>
              <div class="d-flex justify-content-between align-items-center mt-2" onclick="event.stopPropagation()">
                <span class="game-price">${formatPrice(g.price)}</span>
                ${g.stock <= 0
                  ? `<span style="color:var(--danger);font-weight:700;font-size:12px">AGOTADO</span>`
                  : remaining <= 0
                  ? `<span style="color:var(--warning);font-weight:700;font-size:11px">Máx. alcanzado</span>`
                  : `<button class="btn-gg-primary" onclick="Tienda.addGame('${g.id}')" style="padding:7px 14px;font-size:12px">
                       <i class="bi bi-cart-plus"></i>
                     </button>`
                }
              </div>
              ${qtyInCart > 0 ? `<div style="font-size:11px;color:var(--accent-blue);margin-top:4px;text-align:right">🛒 ${qtyInCart} en carrito</div>` : ''}
            </div>
          </div>
        </div>`;
    }).join('');
  },

  renderCollections() {
    const cols = Storage.getCollections();
    const el = document.getElementById('collectionsGrid');
    if (!el) return;

    if (cols.length === 0) {
      el.innerHTML = `<div class="col-12"><p class="text-center" style="color:var(--text-muted)">No hay colecciones disponibles.</p></div>`;
      return;
    }

    el.innerHTML = cols.map(c => {
      const gameCount = (c.games || []).length;
      const shortId = c.id.split('_')[1] || c.id;

      return `
        <div class="col-xl-4 col-lg-6 col-md-6">
          <div class="collection-card h-100" style="display:flex;flex-direction:column;cursor:pointer" onclick="Tienda.openCollectionDetail('${c.id}')">
            <img src="${c.image}" alt="${c.name}"
                 onerror="this.src='https://via.placeholder.com/400x180/0d0d1a/555?text=Coleccion'"
                 style="width:100%;height:180px;object-fit:cover;pointer-events:none">
            <div style="padding:20px;flex:1;display:flex;flex-direction:column">
              <div class="d-flex gap-2 mb-2 flex-wrap">
                <span class="badge-genre">${c.genre}</span>
                <span style="background:rgba(0,0,0,0.4);border:1px solid var(--border-accent);color:var(--accent-blue);
                             padding:3px 8px;border-radius:20px;font-size:11px;font-weight:700;font-family:'Orbitron',monospace">
                  #${shortId}
                </span>
              </div>
              <h5 style="font-family:'Orbitron',monospace;font-size:14px;margin-bottom:8px">${c.name}</h5>
              <p style="font-size:13px;color:var(--text-secondary);flex:1">${c.description}</p>
              <div style="font-size:12px;color:var(--text-muted);margin:8px 0">
                <i class="bi bi-collection me-1"></i> ${gameCount} juego(s) · <i class="bi bi-zoom-in ms-1 me-1"></i> Clic para ver
              </div>
              <div class="d-flex justify-content-between align-items-center" onclick="event.stopPropagation()">
                <span class="game-price">${formatPrice(c.price)}</span>
                <button class="btn-gg-orange" onclick="Tienda.addCollection('${c.id}')" style="padding:7px 14px;font-size:12px">
                  <i class="bi bi-bag-plus"></i> Pack
                </button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  renderRecommendations() {
    const games = Storage.getGames();
    if (games.length === 0) return;

    const genreCount = {};
    games.forEach(g => { genreCount[g.genre] = (genreCount[g.genre] || 0) + 1; });
    const topGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const recommendations = games.filter(g => g.genre === topGenre && g.stock > 0).slice(0, 4);

    const el = document.getElementById('recommendationsGrid');
    const titleEl = document.getElementById('recommendationTitle');
    if (titleEl) titleEl.textContent = `Si te gustan los juegos de ${topGenre}, te recomendamos:`;
    if (!el) return;

    el.innerHTML = recommendations.map(g => `
      <div class="col-xl-3 col-lg-4 col-md-6">
        <div class="card-gg" style="cursor:pointer" onclick="Tienda.openDetail('${g.id}')">
          <img src="${g.image}" class="card-img-top" alt="${g.title}"
               onerror="this.parentElement.innerHTML='<div class=\'img-placeholder\'><i class=\'bi bi-controller\'></i></div>'"
               style="pointer-events:none">
          <div class="card-body">
            <h6 class="card-title" style="font-size:13px">${g.title}</h6>
            <div class="d-flex justify-content-between align-items-center mt-2" onclick="event.stopPropagation()">
              <span class="game-price" style="font-size:16px">${formatPrice(g.price)}</span>
              <button class="btn-gg-primary" onclick="Tienda.addGame('${g.id}')" style="padding:6px 12px;font-size:11px">
                <i class="bi bi-cart-plus"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`).join('');
  },

  // ===== GAME DETAIL MODAL =====
  openDetail(id) {
    const g = Storage.getGameById(id);
    if (!g) return;

    const cart = Storage.getCart();
    const inCart = cart.find(c => c.id === g.id && c.type === 'game');
    const qtyInCart = inCart ? (inCart.qty || 1) : 0;
    const remaining = g.stock - qtyInCart;
    const shortId = g.id.split('_')[1] || g.id;

    // Fill modal
    const imgEl = document.getElementById('modalGameImg');
    imgEl.src = g.image || '';
    imgEl.onerror = function() {
      this.style.display = 'none';
    };
    document.getElementById('modalGameTitle').textContent = g.title;
    document.getElementById('modalGameId').textContent = 'ID #' + shortId;
    document.getElementById('modalGameDescription').textContent = g.description;
    document.getElementById('modalGamePrice').textContent = formatPrice(g.price);
    document.getElementById('modalGameGenre').innerHTML = `<span class="badge-genre">${g.genre}</span>`;
    document.getElementById('modalGamePlatform').innerHTML = getPlatformBadge(g.platform);
    document.getElementById('modalGameStock').innerHTML =
      `<span class="${getStockClass(g.stock)}" style="font-weight:700">
        ${g.stock <= 3 && g.stock > 0 ? '⚠️ ' : g.stock === 0 ? '❌ ' : '✅ '}
        ${g.stock} unidades disponibles
      </span>`;

    const qtyWrapper = document.getElementById('modalQtyWrapper');
    const addBtn = document.getElementById('modalAddBtn');
    const cartInfo = document.getElementById('modalCartInfo');
    const qtyInput = document.getElementById('modalQty');

    if (cartInfo) cartInfo.textContent = qtyInCart > 0 ? `Ya tienes ${qtyInCart} en tu carrito.` : '';

    if (g.stock <= 0) {
      qtyWrapper.style.display = 'none';
      addBtn.disabled = true;
      addBtn.innerHTML = '❌ Sin stock';
      addBtn.style.opacity = '0.5';
    } else if (remaining <= 0) {
      qtyWrapper.style.display = 'none';
      addBtn.disabled = true;
      addBtn.innerHTML = '⚠️ Límite de stock alcanzado';
      addBtn.style.opacity = '0.6';
      if (cartInfo) cartInfo.textContent = `Tienes el máximo disponible (${qtyInCart}) en tu carrito.`;
    } else {
      qtyWrapper.style.display = 'flex';
      addBtn.disabled = false;
      addBtn.innerHTML = '<i class="bi bi-cart-plus me-2"></i> Añadir al carrito';
      addBtn.style.opacity = '1';
      qtyInput.max = remaining;
      qtyInput.min = 1;
      qtyInput.value = 1;
      document.getElementById('modalQtyMax').textContent = '/ ' + remaining + ' disponibles';

      addBtn.onclick = () => {
        const qty = Math.min(parseInt(qtyInput.value) || 1, remaining);
        Tienda.addGameWithQty(id, qty);
        bootstrap.Modal.getInstance(document.getElementById('gameDetailModal')).hide();
      };
    }

    new bootstrap.Modal(document.getElementById('gameDetailModal')).show();
  },

  // ===== COLLECTION DETAIL MODAL =====
  openCollectionDetail(id) {
    const col = Storage.getCollectionById(id);
    if (!col) return;

    const shortId = col.id.split('_')[1] || col.id;
    document.getElementById('modalColImg').src = col.image || '';
    document.getElementById('modalColImg').onerror = function() { this.style.display = 'none'; };
    document.getElementById('modalColTitle').textContent = col.name;
    document.getElementById('modalColId').textContent = 'ID #' + shortId;
    document.getElementById('modalColDescription').textContent = col.description;
    document.getElementById('modalColPrice').textContent = formatPrice(col.price);
    document.getElementById('modalColGenre').innerHTML = `<span class="badge-genre">${col.genre}</span>`;

    const gamesList = (col.games || []).map(gid => {
      const g = Storage.getGameById(gid);
      if (!g) return null;
      return `
        <div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid var(--border-color)">
          <img src="${g.image}" onerror="this.style.display='none'"
               style="width:48px;height:48px;object-fit:cover;border-radius:8px;flex-shrink:0">
          <div class="flex-1">
            <div style="font-weight:600;font-size:13px">${g.title}</div>
            <div style="font-size:11px;color:var(--text-muted)">${g.genre} · ${g.platform}</div>
          </div>
          <div style="text-align:right">
            <div style="font-family:'Orbitron',monospace;font-size:13px;color:var(--accent-orange)">${formatPrice(g.price)}</div>
            <div style="font-size:10px;color:var(--text-muted)">${g.stock > 0 ? g.stock + ' stock' : 'Agotado'}</div>
          </div>
        </div>`;
    }).filter(Boolean).join('');

    document.getElementById('modalColGames').innerHTML = gamesList ||
      '<p style="color:var(--text-muted);font-size:13px;padding:12px 0">Sin juegos en esta coleccion</p>';

    document.getElementById('modalColAddBtn').onclick = () => {
      Tienda.addCollection(id);
      bootstrap.Modal.getInstance(document.getElementById('colDetailModal')).hide();
    };

    new bootstrap.Modal(document.getElementById('colDetailModal')).show();
  },

  // ===== CART ACTIONS =====
  addGame(id) {
    const game = Storage.getGameById(id);
    if (!game) return;
    if (game.stock <= 0) { showToast('Este juego esta agotado.', 'error'); return; }

    const result = Storage.addToCart(
      { id: game.id, type: 'game', title: game.title, price: game.price, image: game.image },
      game.stock
    );

    if (!result.ok) {
      showToast(result.msg, 'warning');
    } else {
      updateCartCount();
      showToast(`"${game.title}" añadido al carrito 🎮`, 'success');
      this.renderGames();
    }
  },

  addGameWithQty(id, qty) {
    const game = Storage.getGameById(id);
    if (!game) return;

    const cart = Storage.getCart();
    const inCart = cart.find(c => c.id === game.id && c.type === 'game');
    const currentQty = inCart ? (inCart.qty || 1) : 0;
    const maxAdd = game.stock - currentQty;

    if (qty > maxAdd) qty = maxAdd;
    if (qty <= 0) { showToast('No puedes agregar mas de lo disponible.', 'warning'); return; }

    for (let i = 0; i < qty; i++) {
      Storage.addToCart(
        { id: game.id, type: 'game', title: game.title, price: game.price, image: game.image },
        game.stock
      );
    }

    updateCartCount();
    showToast(`${qty}x "${game.title}" añadido(s) 🎮`, 'success');
    this.renderGames();
  },

  addCollection(id) {
    const col = Storage.getCollectionById(id);
    if (!col) return;
    const result = Storage.addToCart(
      { id: col.id, type: 'collection', title: col.name, price: col.price, image: col.image },
      1
    );
    if (!result.ok) {
      showToast('Este pack ya esta en tu carrito.', 'warning');
    } else {
      updateCartCount();
      showToast(`Pack "${col.name}" añadido 🎯`, 'success');
    }
  }
};
