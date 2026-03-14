// ===== PAGOS.JS =====
const Pagos = {

  init() {
    this.renderOrderSummary();
  },

  renderOrderSummary() {
    const cart = Storage.getCart();
    const el = document.getElementById('orderItems');
    const totalEl = document.getElementById('orderTotal');

    if (cart.length === 0) {
      window.location.href = getRelPath('usuario/carrito.html');
      return;
    }

    if (el) {
      el.innerHTML = cart.map(item => `
        <div class="d-flex justify-content-between align-items-center py-2" style="border-bottom:1px solid var(--border-color)">
          <div>
            <div style="font-weight:600;font-size:13px">${item.title}</div>
            <div style="font-size:12px;color:var(--text-muted)">${item.type === 'collection' ? 'Pack' : 'Juego'} × ${item.qty || 1}</div>
          </div>
          <span style="font-family:'Orbitron',monospace;color:var(--accent-orange)">${formatPrice(item.price * (item.qty || 1))}</span>
        </div>`).join('');
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const taxes = subtotal * 0.16;
    const total = subtotal + taxes;

    if (totalEl) totalEl.innerHTML = `
      <div class="d-flex justify-content-between py-1"><span style="color:var(--text-muted)">Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      <div class="d-flex justify-content-between py-1"><span style="color:var(--text-muted)">IVA (16%)</span><span>${formatPrice(taxes)}</span></div>
      <div class="divider" style="margin:8px 0"></div>
      <div class="d-flex justify-content-between py-1">
        <span style="font-weight:700">Total</span>
        <span class="cart-total-final">${formatPrice(total)}</span>
      </div>`;
  },

  processPayment() {
    const name = document.getElementById('payName').value.trim();
    const email = document.getElementById('payEmail').value.trim();
    const phone = document.getElementById('payPhone').value.trim();

    if (!name) { showToast('Ingresa tu nombre.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Correo inválido.', 'error'); return; }
    if (!phone || phone.length < 7) { showToast('Teléfono inválido.', 'error'); return; }

    const cart = Storage.getCart();
    if (cart.length === 0) { showToast('El carrito está vacío.', 'error'); return; }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const total = subtotal * 1.16;

    // Update stock
    cart.forEach(item => {
      if (item.type === 'game') {
        const game = Storage.getGameById(item.id);
        if (game) {
          const newStock = Math.max(0, game.stock - (item.qty || 1));
          Storage.updateGame(item.id, { stock: newStock });
        }
      }
    });

    const purchase = {
      id: Storage.generateId('purchase'),
      customerName: name,
      customerEmail: email,
      customerPhone: phone,
      items: cart.map(i => ({ id: i.id, type: i.type, title: i.title, price: i.price, qty: i.qty || 1 })),
      total,
      date: new Date().toISOString()
    };

    Storage.addPurchase(purchase);
    Storage.clearCart();

    // Show success
    document.getElementById('paymentForm').style.display = 'none';
    document.getElementById('paymentSuccess').style.display = 'block';

    const successEl = document.getElementById('successDetails');
    if (successEl) {
      successEl.innerHTML = `
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Total pagado:</strong> <span style="color:var(--accent-orange);font-family:'Orbitron',monospace">${formatPrice(total)}</span></p>
        <p><strong>Fecha:</strong> ${formatDate(purchase.date)}</p>
        <p style="color:var(--text-muted);font-size:13px;margin-top:8px">Recibirás tus claves de activación en tu correo.</p>`;
    }

    updateCartCount();
  }
};
