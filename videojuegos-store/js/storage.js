// ===== STORAGE.JS =====
const Storage = {

  // LOGO URL (base64 o URL relativa)
  LOGO_URL: '../logo.png',

  // ===== KEYS =====
  KEYS: {
    ADMINS: 'gg_admins',
    USERS: 'gg_users',
    GAMES: 'gg_games',
    COLLECTIONS: 'gg_collections',
    PURCHASES: 'gg_purchases',
    CURRENT_USER: 'gg_current_user',
    CURRENT_ADMIN: 'gg_current_admin',
    CART: 'gg_cart',
  },

  // ===== GENERIC =====
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },

  // ===== ADMINS =====
  getAdmins() { return this.get(this.KEYS.ADMINS) || []; },
  saveAdmins(admins) { return this.set(this.KEYS.ADMINS, admins); },

  getAdminByEmail(email) {
    return this.getAdmins().find(a => a.email === email.toLowerCase()) || null;
  },

  addAdmin(admin) {
    const admins = this.getAdmins();
    admins.push(admin);
    return this.saveAdmins(admins);
  },

  // ===== USERS =====
  getUsers() { return this.get(this.KEYS.USERS) || []; },
  saveUsers(users) { return this.set(this.KEYS.USERS, users); },

  getUserByEmail(email) {
    return this.getUsers().find(u => u.email === email.toLowerCase()) || null;
  },

  addUser(user) {
    const users = this.getUsers();
    users.push(user);
    return this.saveUsers(users);
  },

  // ===== SESSIONS =====
  getCurrentUser() { return this.get(this.KEYS.CURRENT_USER); },
  setCurrentUser(user) { return this.set(this.KEYS.CURRENT_USER, user); },
  clearCurrentUser() { localStorage.removeItem(this.KEYS.CURRENT_USER); },

  getCurrentAdmin() { return this.get(this.KEYS.CURRENT_ADMIN); },
  setCurrentAdmin(admin) { return this.set(this.KEYS.CURRENT_ADMIN, admin); },
  clearCurrentAdmin() { localStorage.removeItem(this.KEYS.CURRENT_ADMIN); },

  logout() {
    localStorage.removeItem(this.KEYS.CURRENT_USER);
    localStorage.removeItem(this.KEYS.CURRENT_ADMIN);
    localStorage.removeItem(this.KEYS.CART);
  },

  // ===== GAMES =====
  getGames() { return this.get(this.KEYS.GAMES) || []; },
  saveGames(games) { return this.set(this.KEYS.GAMES, games); },

  getGameById(id) {
    return this.getGames().find(g => g.id === id) || null;
  },

  addGame(game) {
    const games = this.getGames();
    games.push(game);
    return this.saveGames(games);
  },

  updateGame(id, data) {
    const games = this.getGames().map(g => g.id === id ? { ...g, ...data } : g);
    return this.saveGames(games);
  },

  deleteGame(id) {
    const games = this.getGames().filter(g => g.id !== id);
    return this.saveGames(games);
  },

  // ===== COLLECTIONS =====
  getCollections() { return this.get(this.KEYS.COLLECTIONS) || []; },
  saveCollections(c) { return this.set(this.KEYS.COLLECTIONS, c); },

  getCollectionById(id) {
    return this.getCollections().find(c => c.id === id) || null;
  },

  addCollection(col) {
    const cols = this.getCollections();
    cols.push(col);
    return this.saveCollections(cols);
  },

  updateCollection(id, data) {
    const cols = this.getCollections().map(c => c.id === id ? { ...c, ...data } : c);
    return this.saveCollections(cols);
  },

  deleteCollection(id) {
    const cols = this.getCollections().filter(c => c.id !== id);
    return this.saveCollections(cols);
  },

  // ===== PURCHASES =====
  getPurchases() { return this.get(this.KEYS.PURCHASES) || []; },
  savePurchases(p) { return this.set(this.KEYS.PURCHASES, p); },

  addPurchase(purchase) {
    const purchases = this.getPurchases();
    purchases.push(purchase);
    return this.savePurchases(purchases);
  },

  // ===== CART =====
  getCart() { return this.get(this.KEYS.CART) || []; },
  saveCart(cart) { return this.set(this.KEYS.CART, cart); },

  addToCart(item, maxQty = 999) {
    const cart = this.getCart();
    const existing = cart.find(c => c.id === item.id && c.type === item.type);
    if (existing) {
      if ((existing.qty || 1) >= maxQty) return { ok: false, msg: 'Stock máximo alcanzado (' + maxQty + ' unidades)' };
      existing.qty = (existing.qty || 1) + 1;
    } else {
      if (maxQty < 1) return { ok: false, msg: 'Sin stock disponible' };
      cart.push({ ...item, qty: 1 });
    }
    this.saveCart(cart);
    return { ok: true };
  },

  removeFromCart(id, type) {
    const cart = this.getCart().filter(c => !(c.id === id && c.type === type));
    return this.saveCart(cart);
  },

  clearCart() { localStorage.removeItem(this.KEYS.CART); },

  // ===== UTILS =====
  generateId(prefix = 'id') {
    // Get the current counter for this prefix and increment
    const counterKey = 'gg_counter_' + prefix;
    let counter = parseInt(localStorage.getItem(counterKey) || '0') + 1;
    localStorage.setItem(counterKey, counter);
    return prefix + '_' + String(counter).padStart(3, '0');
  },

  // ===== SEED DATA =====
  seedIfEmpty() {
    if (this.getGames().length === 0) {
      // Reset game counter to 8 since we seed 8 games
      localStorage.setItem('gg_counter_game', '8');
      const games = [
        { id: 'game_001', title: 'Stellar Odyssey', description: 'Un épico juego de aventura espacial con mundos abiertos, planetas por explorar y combate estratégico en tiempo real.', price: 59.99, stock: 15, genre: 'Aventura', platform: 'PC', image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=400&h=300&fit=crop' },
        { id: 'game_002', title: 'Neon Fighter X', description: 'El juego de lucha más frenético del año con personajes únicos, combos épicos y modos en línea.', price: 49.99, stock: 8, genre: 'Pelea', platform: 'PlayStation', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop' },
        { id: 'game_003', title: 'Kingdom Quest', description: 'Un RPG de rol profundo con historia elaborada, cientos de misiones y un mundo lleno de misterios por descubrir.', price: 44.99, stock: 20, genre: 'RPG', platform: 'Nintendo', image: 'https://images.unsplash.com/photo-1616361984577-bce79dba1a5e?w=400&h=300&fit=crop' },
        { id: 'game_004', title: 'Zombie Apocalypse', description: 'Survival horror en un mundo post-apocalíptico lleno de zombies, recursos escasos y decisiones imposibles.', price: 39.99, stock: 3, genre: 'Terror', platform: 'Xbox', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop' },
        { id: 'game_005', title: 'Speed Racer Pro', description: 'El simulador de carreras más realista con más de 200 coches licenciados y 50 circuitos alrededor del mundo.', price: 54.99, stock: 12, genre: 'Carreras', platform: 'PC', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
        { id: 'game_006', title: 'Dungeon Crawler 3D', description: 'Explora mazmorras generadas aleatoriamente con enemigos únicos, jefes desafiantes y un sistema de loot adictivo.', price: 29.99, stock: 2, genre: 'RPG', platform: 'PlayStation', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop' },
        { id: 'game_007', title: 'Galaxy Shooter', description: 'Shooter espacial arcade clásico con oleadas de enemigos, mejoras de nave y jefes épicos de escala galáctica.', price: 19.99, stock: 25, genre: 'Acción', platform: 'Nintendo', image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=300&fit=crop' },
        { id: 'game_008', title: 'Cyber City 2077', description: 'Explora una megaciudad futurista llena de intrigas corporativas, hacking avanzado y acción en primera persona.', price: 64.99, stock: 9, genre: 'Acción', platform: 'PC', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=300&fit=crop' },
      ];
      this.saveGames(games);
    }

    if (this.getCollections().length === 0) {
      // Reset collection counter
      localStorage.setItem('gg_counter_col', '2');
      const games = this.getGames();
      const collections = [
        {
          id: 'col_001', name: 'Pack Aventura Épica', description: 'Los mejores juegos de aventura y RPG en un solo pack con descuento especial.', genre: 'Aventura',
          image: 'https://images.unsplash.com/photo-1581390072483-5031aa7c6def?w=400&h=300&fit=crop',
          games: games.filter(g => g.genre === 'Aventura' || g.genre === 'RPG').map(g => g.id),
          price: 89.99
        },
        {
          id: 'col_002', name: 'Pack Acción Total', description: 'Juegos de acción y pelea para los que buscan adrenalina pura sin parar.', genre: 'Acción',
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop',
          games: games.filter(g => g.genre === 'Acción' || g.genre === 'Pelea').map(g => g.id),
          price: 79.99
        },
      ];
      this.saveCollections(collections);
    }

    if (this.getAdmins().length === 0) {
      localStorage.setItem('gg_counter_admin', '1');
      this.addAdmin({
        id: 'admin_001', name: 'Admin GameGalaxy', email: 'admin@gamegalaxy.com',
        password: 'Admin123!', createdAt: new Date().toISOString()
      });
    }
  }
};

// Seed on load
Storage.seedIfEmpty();
