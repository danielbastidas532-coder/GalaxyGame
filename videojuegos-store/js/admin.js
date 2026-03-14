// ===== ADMIN.JS =====
const Admin = {

  // ===== DASHBOARD =====
  loadDashboard() {
    const games = Storage.getGames();
    const collections = Storage.getCollections();
    const purchases = Storage.getPurchases();
    const users = Storage.getUsers();

    // Stat cards
    setTxt('statGames', games.length);
    setTxt('statCollections', collections.length);
    setTxt('statUsers', users.length);
    setTxt('statSales', purchases.length);

    // Revenue
    const revenue = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
    setTxt('statRevenue', formatPrice(revenue));

    // Top selling games
    this.renderTopGames();
    // Low stock
    this.renderLowStock();
    // Recent sales
    this.renderRecentSales();
  },

  renderTopGames() {
    const purchases = Storage.getPurchases();
    const games = Storage.getGames();
    const salesMap = {};

    purchases.forEach(p => {
      p.items.forEach(item => {
        if (item.type === 'game') {
          salesMap[item.id] = (salesMap[item.id] || 0) + (item.qty || 1);
        }
      });
    });

    const sorted = games
      .map(g => ({ ...g, sold: salesMap[g.id] || 0 }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const el = document.getElementById('topGames');
    if (!el) return;

    if (sorted.length === 0 || sorted.every(g => g.sold === 0)) {
      el.innerHTML = '<p class="text-muted text-center py-3" style="font-size:13px">Sin ventas aún</p>';
      return;
    }

    el.innerHTML = sorted.map(g => `
      <div class="d-flex align-items-center gap-3 py-2" style="border-bottom: 1px solid var(--border-color)">
        <img src="${g.image || ''}" onerror="this.style.display='none'" style="width:40px;height:40px;object-fit:cover;border-radius:6px">
        <div class="flex-1">
          <div style="font-weight:600;font-size:13px">${g.title}</div>
          <div style="font-size:12px;color:var(--text-muted)">${g.genre}</div>
        </div>
        <div style="font-family:'Orbitron',monospace;font-size:13px;color:var(--accent-orange)">${g.sold} vendidos</div>
      </div>`).join('');
  },

  renderLowStock() {
    const games = Storage.getGames().filter(g => g.stock <= 5);
    const el = document.getElementById('lowStock');
    if (!el) return;

    if (games.length === 0) {
      el.innerHTML = '<p class="text-center py-3" style="color:var(--success);font-size:13px">✅ Todo el stock es suficiente</p>';
      return;
    }

    el.innerHTML = games.map(g => `
      <div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid var(--border-color)">
        <div class="flex-1">
          <div style="font-weight:600;font-size:13px">${g.title}</div>
          <div style="font-size:12px;color:var(--text-muted)">${g.platform}</div>
        </div>
        <span class="stock-low" style="font-family:'Orbitron',monospace;font-size:14px">⚠️ ${g.stock}</span>
      </div>`).join('');
  },

  renderRecentSales() {
    const purchases = Storage.getPurchases().slice(-5).reverse();
    const el = document.getElementById('recentSales');
    if (!el) return;

    if (purchases.length === 0) {
      el.innerHTML = '<tr><td colspan="4" class="text-center py-4" style="color:var(--text-muted)">Sin ventas aún</td></tr>';
      return;
    }

    el.innerHTML = purchases.map(p => `
      <tr>
        <td>${p.customerName}</td>
        <td>${p.items.length} ítem(s)</td>
        <td><span style="font-family:'Orbitron',monospace;color:var(--accent-orange)">${formatPrice(p.total)}</span></td>
        <td style="color:var(--text-muted);font-size:12px">${formatDate(p.date)}</td>
      </tr>`).join('');
  },

  // ===== GAMES CRUD =====
  loadGames() {
    this.renderGamesTable();
  },

  renderGamesTable(filter = '') {
    let games = Storage.getGames();
    if (filter) games = games.filter(g =>
      g.title.toLowerCase().includes(filter.toLowerCase()) ||
      g.genre.toLowerCase().includes(filter.toLowerCase()) ||
      g.platform.toLowerCase().includes(filter.toLowerCase())
    );

    const el = document.getElementById('gamesTableBody');
    if (!el) return;

    if (games.length === 0) {
      el.innerHTML = `<tr><td colspan="7" class="text-center py-5" style="color:var(--text-muted)">
        <i class="bi bi-controller" style="font-size:40px;display:block;margin-bottom:8px;opacity:0.3"></i>
        No hay videojuegos registrados</td></tr>`;
      return;
    }

    el.innerHTML = games.map(g => `
      <tr>
        <td><span style="font-family:'Orbitron',monospace;font-size:13px;color:var(--accent-blue);font-weight:700">#${g.id.split('_')[1] || g.id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${g.image}" onerror="this.src='https://via.placeholder.com/40x40/0d0d1a/555?text=?'" 
                 style="width:40px;height:40px;object-fit:cover;border-radius:6px">
            <span style="font-weight:600">${g.title}</span>
          </div>
        </td>
        <td><span class="badge-genre">${g.genre}</span></td>
        <td>${getPlatformBadge(g.platform)}</td>
        <td><span style="font-family:'Orbitron',monospace;color:var(--accent-orange)">${formatPrice(g.price)}</span></td>
        <td><span class="${getStockClass(g.stock)}" style="font-weight:700">${g.stock}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn-gg-secondary btn-sm" onclick="Admin.openEditGame('${g.id}')" style="padding:5px 12px;font-size:12px">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-gg-danger" onclick="Admin.deleteGame('${g.id}')" style="padding:5px 12px;font-size:12px">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');
  },

  openAddGame() {
    document.getElementById('gameModalTitle').textContent = 'Agregar Videojuego';
    document.getElementById('gameForm').reset();
    document.getElementById('gameIdField').value = '';
    document.getElementById('gamePreviewImg').src = '';
    document.getElementById('gamePreviewImg').style.display = 'none';
    const modal = new bootstrap.Modal(document.getElementById('gameModal'));
    modal.show();
  },

  openEditGame(id) {
    const game = Storage.getGameById(id);
    if (!game) return;

    document.getElementById('gameModalTitle').textContent = 'Editar Videojuego';
    document.getElementById('gameIdField').value = game.id;
    document.getElementById('gameTitle').value = game.title;
    document.getElementById('gameDescription').value = game.description;
    document.getElementById('gamePrice').value = game.price;
    document.getElementById('gameStock').value = game.stock;
    document.getElementById('gameGenre').value = game.genre;
    document.getElementById('gamePlatform').value = game.platform;
    document.getElementById('gameImage').value = game.image || '';

    const preview = document.getElementById('gamePreviewImg');
    if (game.image) {
      preview.src = game.image;
      preview.style.display = 'block';
    }

    const modal = new bootstrap.Modal(document.getElementById('gameModal'));
    modal.show();
  },

  saveGame() {
    const id = document.getElementById('gameIdField').value;
    const title = document.getElementById('gameTitle').value.trim();
    const description = document.getElementById('gameDescription').value.trim();
    const price = parseFloat(document.getElementById('gamePrice').value);
    const stock = parseInt(document.getElementById('gameStock').value);
    const genre = document.getElementById('gameGenre').value.trim();
    const platform = document.getElementById('gamePlatform').value;
    const image = document.getElementById('gameImage').value.trim();

    if (!title || !description || isNaN(price) || isNaN(stock) || !genre || !platform) {
      showToast('Por favor completa todos los campos obligatorios.', 'error');
      return;
    }

    const data = { title, description, price, stock, genre, platform, image };

    if (id) {
      Storage.updateGame(id, data);
      showToast('Videojuego actualizado.', 'success');
    } else {
      Storage.addGame({ id: Storage.generateId('game'), ...data });
      showToast('Videojuego agregado.', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('gameModal')).hide();
    this.renderGamesTable();
    this.loadDashboard && this.loadDashboard();
  },

  deleteGame(id) {
    if (!confirm('¿Eliminar este videojuego?')) return;
    Storage.deleteGame(id);
    showToast('Videojuego eliminado.', 'success');
    this.renderGamesTable();
  },

  previewImage(inputId, previewId) {
    const url = document.getElementById(inputId).value;
    const img = document.getElementById(previewId);
    if (url) {
      img.src = url;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }
  },

  // ===== COLLECTIONS CRUD =====
  loadCollections() {
    this.renderCollectionsTable();
    this.populateGameSelects();
  },

  populateGameSelects() {
    const games = Storage.getGames();
    const el = document.getElementById('colGamesSelect');
    if (!el) return;
    el.innerHTML = games.map(g =>
      `<option value="${g.id}">${g.title} (${g.platform}) - ${formatPrice(g.price)}</option>`
    ).join('');
  },

  renderCollectionsTable() {
    const cols = Storage.getCollections();
    const el = document.getElementById('collectionsTableBody');
    if (!el) return;

    if (cols.length === 0) {
      el.innerHTML = `<tr><td colspan="6" class="text-center py-5" style="color:var(--text-muted)">
        <i class="bi bi-collection" style="font-size:40px;display:block;margin-bottom:8px;opacity:0.3"></i>
        No hay colecciones registradas</td></tr>`;
      return;
    }

    el.innerHTML = cols.map(c => `
      <tr>
        <td><span style="font-family:'Orbitron',monospace;font-size:13px;color:var(--accent-orange);font-weight:700">#${c.id.split('_')[1] || c.id}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <img src="${c.image}" onerror="this.src='https://via.placeholder.com/40x40/0d0d1a/555?text=?'" 
                 style="width:40px;height:40px;object-fit:cover;border-radius:6px">
            <span style="font-weight:600">${c.name}</span>
          </div>
        </td>
        <td><span class="badge-genre">${c.genre}</span></td>
        <td>${(c.games || []).length} juegos</td>
        <td><span style="font-family:'Orbitron',monospace;color:var(--accent-orange)">${formatPrice(c.price)}</span></td>
        <td>
          <div class="d-flex gap-2">
            <button class="btn-gg-secondary btn-sm" onclick="Admin.openEditCollection('${c.id}')" style="padding:5px 12px;font-size:12px">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-gg-danger" onclick="Admin.deleteCollection('${c.id}')" style="padding:5px 12px;font-size:12px">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>`).join('');
  },

  openAddCollection() {
    document.getElementById('colModalTitle').textContent = 'Crear Colección';
    document.getElementById('colForm').reset();
    document.getElementById('colIdField').value = '';
    const modal = new bootstrap.Modal(document.getElementById('colModal'));
    modal.show();
  },

  openEditCollection(id) {
    const col = Storage.getCollectionById(id);
    if (!col) return;

    document.getElementById('colModalTitle').textContent = 'Editar Colección';
    document.getElementById('colIdField').value = col.id;
    document.getElementById('colName').value = col.name;
    document.getElementById('colDescription').value = col.description;
    document.getElementById('colGenre').value = col.genre;
    document.getElementById('colImage').value = col.image || '';
    document.getElementById('colPrice').value = col.price || 0;

    const select = document.getElementById('colGamesSelect');
    if (select && col.games) {
      Array.from(select.options).forEach(opt => {
        opt.selected = col.games.includes(opt.value);
      });
    }

    const modal = new bootstrap.Modal(document.getElementById('colModal'));
    modal.show();
  },

  saveCollection() {
    const id = document.getElementById('colIdField').value;
    const name = document.getElementById('colName').value.trim();
    const description = document.getElementById('colDescription').value.trim();
    const genre = document.getElementById('colGenre').value.trim();
    const image = document.getElementById('colImage').value.trim();
    const price = parseFloat(document.getElementById('colPrice').value);

    const select = document.getElementById('colGamesSelect');
    const games = select ? Array.from(select.selectedOptions).map(o => o.value) : [];

    if (!name || !description || !genre || isNaN(price)) {
      showToast('Completa todos los campos obligatorios.', 'error');
      return;
    }

    const data = { name, description, genre, image, price, games };

    if (id) {
      Storage.updateCollection(id, data);
      showToast('Colección actualizada.', 'success');
    } else {
      Storage.addCollection({ id: Storage.generateId('col'), ...data });
      showToast('Colección creada.', 'success');
    }

    bootstrap.Modal.getInstance(document.getElementById('colModal')).hide();
    this.renderCollectionsTable();
  },

  deleteCollection(id) {
    if (!confirm('¿Eliminar esta colección?')) return;
    Storage.deleteCollection(id);
    showToast('Colección eliminada.', 'success');
    this.renderCollectionsTable();
  },

  // ===== VENTAS =====
  loadVentas() {
    this.renderVentasTable();
    this.renderStats();
  },

  renderVentasTable(filter = '') {
    let purchases = Storage.getPurchases().slice().reverse();
    if (filter) purchases = purchases.filter(p =>
      p.customerName.toLowerCase().includes(filter.toLowerCase()) ||
      p.customerEmail.toLowerCase().includes(filter.toLowerCase())
    );

    const el = document.getElementById('ventasTableBody');
    if (!el) return;

    if (purchases.length === 0) {
      el.innerHTML = `<tr><td colspan="5" class="text-center py-5" style="color:var(--text-muted)">Sin ventas registradas</td></tr>`;
      return;
    }

    el.innerHTML = purchases.map(p => `
      <tr>
        <td>
          <div style="font-weight:600">${p.customerName}</div>
          <div style="font-size:12px;color:var(--text-muted)">${p.customerEmail}</div>
        </td>
        <td>
          <div style="font-size:13px">${p.items.map(i => `<span class="tag">${i.title}</span>`).join(' ')}</div>
        </td>
        <td style="color:var(--text-muted);font-size:13px">${formatDate(p.date)}</td>
        <td><span style="font-family:'Orbitron',monospace;font-size:15px;color:var(--accent-orange)">${formatPrice(p.total)}</span></td>
        <td><span style="background:rgba(0,230,118,0.1);color:var(--success);padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700">COMPLETADA</span></td>
      </tr>`).join('');
  },

  renderStats() {
    const purchases = Storage.getPurchases();
    const games = Storage.getGames();
    const collections = Storage.getCollections();

    // Game sales count
    const gameSales = {};
    const colSales = {};

    purchases.forEach(p => {
      p.items.forEach(item => {
        if (item.type === 'game') {
          gameSales[item.id] = (gameSales[item.id] || 0) + (item.qty || 1);
        } else if (item.type === 'collection') {
          colSales[item.id] = (colSales[item.id] || 0) + (item.qty || 1);
        }
      });
    });

    // Top games
    const topGamesEl = document.getElementById('statsTopGames');
    if (topGamesEl) {
      const topG = games.map(g => ({ ...g, sold: gameSales[g.id] || 0 }))
        .sort((a, b) => b.sold - a.sold).slice(0, 5);

      topGamesEl.innerHTML = topG.map((g, i) => `
        <div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid var(--border-color)">
          <span style="font-family:'Orbitron',monospace;color:var(--accent-orange);min-width:24px">#${i + 1}</span>
          <div class="flex-1">
            <div style="font-weight:600;font-size:13px">${g.title}</div>
            <div style="font-size:11px;color:var(--text-muted)">${g.genre} · ${g.platform}</div>
          </div>
          <span style="font-weight:700">${g.sold} uds</span>
        </div>`).join('');
    }

    // Top collections
    const topColsEl = document.getElementById('statsTopCollections');
    if (topColsEl) {
      const topC = collections.map(c => ({ ...c, sold: colSales[c.id] || 0 }))
        .sort((a, b) => b.sold - a.sold).slice(0, 5);

      topColsEl.innerHTML = topC.map((c, i) => `
        <div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid var(--border-color)">
          <span style="font-family:'Orbitron',monospace;color:var(--accent-orange);min-width:24px">#${i + 1}</span>
          <div class="flex-1">
            <div style="font-weight:600;font-size:13px">${c.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${c.genre}</div>
          </div>
          <span style="font-weight:700">${c.sold} uds</span>
        </div>`).join('');
    }

    // Low stock games
    const lowStockEl = document.getElementById('statsLowStock');
    if (lowStockEl) {
      const low = games.filter(g => g.stock <= 5).sort((a, b) => a.stock - b.stock);
      if (low.length === 0) {
        lowStockEl.innerHTML = '<p class="text-center py-3" style="color:var(--success)">✅ Stock suficiente en todos los juegos</p>';
      } else {
        lowStockEl.innerHTML = low.map(g => `
          <div class="d-flex align-items-center gap-3 py-2" style="border-bottom:1px solid var(--border-color)">
            <div class="flex-1">
              <div style="font-weight:600;font-size:13px">${g.title}</div>
              <div style="font-size:11px;color:var(--text-muted)">${g.platform}</div>
            </div>
            <span class="stock-low" style="font-family:'Orbitron',monospace">⚠️ ${g.stock} restantes</span>
          </div>`).join('');
      }
    }
  }
};

function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
