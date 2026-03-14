// ===== AUTH.JS =====
const Auth = {

  // ===== VALIDATION =====
  validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
    if (!/[0-9]/.test(password)) errors.push('Al menos un número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Al menos un carácter especial');
    return errors;
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  // ===== REGISTER ADMIN =====
  registerAdmin(name, email, password) {
    email = email.toLowerCase().trim();

    if (!name.trim()) return { ok: false, msg: 'El nombre es requerido.' };
    if (!this.validateEmail(email)) return { ok: false, msg: 'Correo inválido.' };

    const pwErrors = this.validatePassword(password);
    if (pwErrors.length > 0) return { ok: false, msg: 'Contraseña insegura: ' + pwErrors.join(', ') + '.' };

    if (Storage.getAdminByEmail(email)) return { ok: false, msg: 'Ya existe un administrador con ese correo.' };
    if (Storage.getUserByEmail(email)) return { ok: false, msg: 'Ese correo ya está registrado como usuario.' };

    const admin = {
      id: Storage.generateId('admin'),
      name: name.trim(),
      email,
      password,
      createdAt: new Date().toISOString()
    };

    Storage.addAdmin(admin);
    return { ok: true, msg: 'Administrador registrado exitosamente.' };
  },

  // ===== LOGIN ADMIN =====
  loginAdmin(email, password) {
    email = email.toLowerCase().trim();
    const admin = Storage.getAdminByEmail(email);
    if (!admin) return { ok: false, msg: 'Correo no encontrado.' };
    if (admin.password !== password) return { ok: false, msg: 'Contraseña incorrecta.' };

    Storage.setCurrentAdmin({ id: admin.id, name: admin.name, email: admin.email });
    return { ok: true, msg: 'Bienvenido, ' + admin.name };
  },

  // ===== REGISTER USER =====
  registerUser(name, email, password) {
    email = email.toLowerCase().trim();

    if (!name.trim()) return { ok: false, msg: 'El nombre es requerido.' };
    if (!this.validateEmail(email)) return { ok: false, msg: 'Correo inválido.' };

    const pwErrors = this.validatePassword(password);
    if (pwErrors.length > 0) return { ok: false, msg: 'Contraseña insegura: ' + pwErrors.join(', ') + '.' };

    if (Storage.getUserByEmail(email)) return { ok: false, msg: 'Ya existe una cuenta con ese correo.' };
    if (Storage.getAdminByEmail(email)) return { ok: false, msg: 'Ese correo pertenece a un administrador.' };

    const user = {
      id: Storage.generateId('user'),
      name: name.trim(),
      email,
      password,
      createdAt: new Date().toISOString()
    };

    Storage.addUser(user);
    return { ok: true, msg: 'Cuenta creada exitosamente.' };
  },

  // ===== LOGIN USER =====
  loginUser(email, password) {
    email = email.toLowerCase().trim();
    const user = Storage.getUserByEmail(email);
    if (!user) return { ok: false, msg: 'Correo no encontrado.' };
    if (user.password !== password) return { ok: false, msg: 'Contraseña incorrecta.' };

    Storage.setCurrentUser({ id: user.id, name: user.name, email: user.email });
    return { ok: true, msg: 'Bienvenido, ' + user.name };
  },

  // ===== GUARDS =====
  requireAdmin() {
    const admin = Storage.getCurrentAdmin();
    if (!admin) {
      window.location.href = getRelPath('login-admin.html');
      return null;
    }
    return admin;
  },

  requireUser() {
    const user = Storage.getCurrentUser();
    if (!user) {
      window.location.href = getRelPath('login-user.html');
      return null;
    }
    return user;
  },

  requireGuest() {
    if (Storage.getCurrentAdmin()) {
      window.location.href = getRelPath('admin/dashboard.html');
    }
    if (Storage.getCurrentUser()) {
      window.location.href = getRelPath('usuario/tienda.html');
    }
  },

  logout() {
    Storage.logout();
    window.location.href = getRelPath('index.html');
  }
};

// ===== PATH HELPER =====
function getRelPath(path) {
  const depth = (window.location.pathname.match(/\//g) || []).length - 1;
  let prefix = '';
  for (let i = 0; i < depth; i++) prefix += '../';
  if (!prefix && !window.location.pathname.endsWith('/')) prefix = './';
  return prefix + path;
}

// ===== UI HELPERS =====
function showToast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast-gg ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showFormError(elementId, msg) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = msg;
    el.style.display = 'block';
  }
}

function hideFormError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.style.display = 'none';
}

function formatPrice(price) {
  return '$' + parseFloat(price).toFixed(2);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getPlatformBadge(platform) {
  const map = { 'PlayStation': 'ps', 'Xbox': 'xbox', 'Nintendo': 'nintendo', 'PC': 'pc' };
  const cls = map[platform] || 'pc';
  return `<span class="badge-platform badge-${cls}">${platform}</span>`;
}

function getStockClass(stock) {
  if (stock <= 3) return 'stock-low';
  if (stock <= 8) return 'stock-medium';
  return 'stock-ok';
}

function getLogoPath() {
  return getRelPath('logo.png');
}

function updateCartCount() {
  const cart = Storage.getCart();
  const total = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = total;
}
