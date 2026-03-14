// ===== CARRITO.JS =====
const Carrito = {

  init() {
    this.render();
    updateCartCount();
  },

  render() {
    const cart = Storage.getCart();
    const el = document.getElementById('cartItems');
    const emptyEl = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummary');

    if (!el) return;

    if (cart.length === 0) {
      el.innerHTML = '';
      if (emptyEl) emptyEl.style.display = 'block';
      if (summaryEl) summaryEl.style.display = 'none';
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (summaryEl) summaryEl.style.display = 'block';

    el.innerHTML = cart.map(item => {
      // Get max qty (stock for games, 1 for collections)
      const maxQty = item.type === 'game'
        ? (Storage.getGameById(item.id)?.stock || 1)
        : 1;
      const qty = item.qty || 1;
      const shortId = item.id.split('_')[1] || item.id;
      const subtotal = item.price * qty;

      return `
        <div class="cart-item">
          <img src="${item.image || ''}" class="cart-item-img" alt="${item.title}"
               onerror="this.src='https://via.placeholder.com/70x70/0d0d1a/555?text=?'">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.title}</div>
            <div style="display:flex;gap:8px;align-items:center;margin-top:4px;flex-wrap:wrap">
              <span class="tag" style="font-size:11px">${item.type === 'collection' ? '📦 Pack' : '🎮 Juego'}</span>
              <span style="font-size:11px;color:var(--accent-blue);font-family:'Orbitron',monospace">#${shortId}</span>
              <span style="font-size:12px;color:var(--text-muted)">${formatPrice(item.price)} c/u</span>
            </div>
            ${item.type === 'game' ? `
            <div style="display:flex;align-items:center;gap:8px;margin-top:10px">
              <button onclick="Carrito.decreaseQty('${item.id}', '${item.type}')"
                      style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border-accent);
                             background:rgba(255,255,255,0.04);color:var(--text-primary);cursor:pointer;
                             display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;
                             transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent-blue)'" onmouseout="this.style.borderColor='var(--border-accent)'">−</button>
              <span style="font-family:'Orbitron',monospace;font-size:14px;font-weight:700;min-width:24px;text-align:center">${qty}</span>
              <button onclick="Carrito.increaseQty('${item.id}', '${item.type}', ${maxQty})"
                      style="width:28px;height:28px;border-radius:6px;border:1px solid var(--border-accent);
                             background:rgba(255,255,255,0.04);color:var(--text-primary);cursor:pointer;
                             display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1;
                             transition:all 0.2s;${qty >= maxQty ? 'opacity:0.35;cursor:not-allowed' : ''}"
                      ${qty >= maxQty ? 'disabled' : ''}
                      onmouseover="if(!this.disabled) this.style.borderColor='var(--accent-blue)'" onmouseout="this.style.borderColor='var(--border-accent)'">+</button>
              <span style="font-size:11px;color:var(--text-muted)">Máx: ${maxQty}</span>
            </div>` : ''}
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div class="game-price" style="font-size:17px">${formatPrice(subtotal)}</div>
            <button class="btn-gg-danger mt-2" onclick="Carrito.remove('${item.id}', '${item.type}')"
                    style="padding:5px 12px;font-size:11px;margin-top:8px;display:inline-flex;align-items:center;gap:4px">
              <i class="bi bi-trash"></i> Quitar
            </button>
          </div>
        </div>`;
    }).join('');

    this.updateTotals();
  },

  increaseQty(id, type, maxQty) {
    const cart = Storage.getCart();
    const item = cart.find(c => c.id === id && c.type === type);
    if (!item) return;
    if ((item.qty || 1) >= maxQty) {
      showToast('Has alcanzado el límite de stock disponible.', 'warning');
      return;
    }
    item.qty = (item.qty || 1) + 1;
    Storage.saveCart(cart);
    this.render();
    updateCartCount();
  },

  decreaseQty(id, type) {
    const cart = Storage.getCart();
    const item = cart.find(c => c.id === id && c.type === type);
    if (!item) return;
    if ((item.qty || 1) <= 1) {
      // Remove if qty would go to 0
      this.remove(id, type);
      return;
    }
    item.qty = (item.qty || 1) - 1;
    Storage.saveCart(cart);
    this.render();
    updateCartCount();
  },

  remove(id, type) {
    Storage.removeFromCart(id, type);
    this.render();
    updateCartCount();
    showToast('Producto eliminado del carrito.', 'info');
  },

  updateTotals() {
    const cart = Storage.getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const taxes = subtotal * 0.16;
    const total = subtotal + taxes;
    const itemCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

    setInner('cartSubtotal', formatPrice(subtotal));
    setInner('cartTaxes', formatPrice(taxes));
    setInner('cartTotal', formatPrice(total));
    setInner('cartItemCount', itemCount + ' producto(s)');
  },

  clear() {
    if (!confirm('¿Vaciar el carrito?')) return;
    Storage.clearCart();
    this.render();
    updateCartCount();
    showToast('Carrito vaciado.', 'info');
  }
};

function setInner(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}
