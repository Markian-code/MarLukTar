// Globale Variablen
let cart = [];
let allProducts = [];
let appliedCoupon = null;
let discountAmount = 0;

// DOM-Referenzen
const productList      = document.getElementById('product-list');
const searchInput      = document.getElementById('search');
const cartButton       = document.getElementById('cart-button');
const cartCountEl      = document.getElementById('cart-count');
const inlineCartList   = document.getElementById('cart-list');
const inlineCartTotal  = document.getElementById('cart-total');

const cartModal        = document.getElementById('cart-modal');
const modalCloseBtn    = cartModal.querySelector('.modal-close');
const cartItemsEl      = cartModal.querySelector('.cart-items');
const modalTotalEl     = document.getElementById('cart-total-modal');
const modalCheckoutBtn = cartModal.querySelector('.checkout-button');

const extrasSection    = document.getElementById('extras');
const loginPrompt      = document.getElementById('login-prompt');
const paymentSelect    = document.getElementById('payment-method');
const couponInput      = document.getElementById('coupon-code');
const applyCouponBtn   = document.getElementById('apply-coupon-btn');
const discountInfo     = document.getElementById('discount-info');
const checkoutBtn      = document.getElementById('checkout-btn');

const userNav          = document.getElementById('user-nav');

// 1) Produkte laden und rendern
async function fetchProducts(searchTerm = '') {
    try {
        const res = await fetch(
            'http://localhost/MarLukTar/backend/logic/RequestHandler.php?route=products'
        );
        allProducts = await res.json();

        productList.innerHTML = '';
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filtered.forEach(p => {
            const div = document.createElement('div');
            div.className = 'product';
            div.innerHTML = `
        <img src="${
                p.imageUrl
                    ? 'http://localhost/MarLukTar/' + p.imageUrl.replace(/^\/+/, '')
                    : 'http://localhost/MarLukTar/frontend/img/default.png'
            }" alt="${p.name}" />
        <h2 class="product-name">${p.name}</h2>
        <p>${p.description}</p>
        <p><strong>Preis:</strong> €${p.price}</p>
        <button class="add-btn"
                data-id="${p.id}"
                data-name="${p.name}"
                data-price="${p.price}">
          In den Warenkorb
        </button>
      `;

            // Drag-&-Drop aktivieren
            div.setAttribute('draggable', 'true');
            div.addEventListener('dragstart', e => {
                const payload = { id: p.id, name: p.name, price: p.price };
                e.dataTransfer.setData('application/json', JSON.stringify(payload));
                e.dataTransfer.effectAllowed = 'copy';
            });

            productList.appendChild(div);
        });
    } catch (err) {
        console.error('Fehler beim Laden der Produkte:', err);
    }
}

// 2) Klick auf "In den Warenkorb"-Button
productList.addEventListener('click', e => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    addToCart(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.price));
});

// 3) Drag-over & Drop auf Warenkorb-Button
cartButton.addEventListener('dragover', e => {
    e.preventDefault();
    cartButton.classList.add('drag-over');
});
cartButton.addEventListener('dragleave', () => {
    cartButton.classList.remove('drag-over');
});
cartButton.addEventListener('drop', e => {
    e.preventDefault();
    cartButton.classList.remove('drag-over');
    try {
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        addToCart(data.id, data.name, data.price);
    } catch {
        console.warn('Ungültige Drag-Daten');
    }
});

// 4) Warenkorb-Logik
function addToCart(id, name, price) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) cart[idx].quantity++;
    else cart.push({ id, name, price, quantity: 1 });
    updateAllDisplays();
}

function changeQuantity(idx, delta) {
    if (!cart[idx]) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity < 1) cart.splice(idx, 1);
    updateAllDisplays();
}

function removeFromCart(idx) {
    cart.splice(idx, 1);
    updateAllDisplays();
}

// 5) Rendering
function updateAllDisplays() {
    renderInlineCart();
    renderCartModal();
    updateCartCount();
}

function renderInlineCart() {
    inlineCartList.innerHTML = '';
    let sum = 0;
    cart.forEach((item, idx) => {
        sum += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
      <div>${item.name} x${item.quantity} – €${(item.price * item.quantity).toFixed(2)}</div>
      <div>
        <button class="qty-btn"    data-idx="${idx}" data-action="+">+</button>
        <button class="qty-btn"    data-idx="${idx}" data-action="-">−</button>
        <button class="remove-btn" data-idx="${idx}">✕</button>
      </div>
    `;
        inlineCartList.appendChild(div);
    });
    inlineCartTotal.textContent = `€${(sum - discountAmount).toFixed(2)}`;
}

function renderCartModal() {
    cartItemsEl.innerHTML = '';
    let sum = 0;
    cart.forEach((item, idx) => {
        sum += item.price * item.quantity;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
      <span>${item.name} x${item.quantity}</span>
      <div>
        <button class="qty-btn"    data-idx="${idx}" data-action="+">+</button>
        <button class="qty-btn"    data-idx="${idx}" data-action="-">−</button>
        <button class="remove-btn" data-idx="${idx}">✕</button>
      </div>
      <span>€${(item.price * item.quantity).toFixed(2)}</span>
    `;
        cartItemsEl.appendChild(row);
    });
    modalTotalEl.textContent = `€${(sum - discountAmount).toFixed(2)}`;
}

function updateCartCount() {
    cartCountEl.textContent = cart.reduce((a, i) => a + i.quantity, 0);
}

// 6) Delegierung für +, −, ✕ in beiden Bereichen
inlineCartList.addEventListener('click', handlerCartButtons);
cartItemsEl.addEventListener('click', handlerCartButtons);

function handlerCartButtons(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = +btn.dataset.idx;
    if (btn.classList.contains('qty-btn')) {
        changeQuantity(idx, btn.dataset.action === '+' ? 1 : -1);
    } else if (btn.classList.contains('remove-btn')) {
        removeFromCart(idx);
    }
}

// 7) Modal öffnen/schließen
cartButton.addEventListener('click', () => cartModal.classList.remove('hidden'));
modalCloseBtn.addEventListener('click', () => cartModal.classList.add('hidden'));
modalCheckoutBtn.addEventListener('click', () => {
    cartModal.classList.add('hidden');
    doCheckout();
});

// 8) Gutscheincode
applyCouponBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim();
    if (!code) return alert('Bitte Gutscheincode eingeben.');
    try {
        const res  = await fetch(
            'http://localhost/MarLukTar/backend/logic/CouponHandler.php',
            {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ code })
            }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        appliedCoupon  = code;
        discountAmount = parseFloat(data.discount) || 0;
        discountInfo.style.color = 'green';
        discountInfo.textContent = `✅ -€${discountAmount.toFixed(2)}`;
    } catch (err) {
        appliedCoupon  = null;
        discountAmount = 0;
        discountInfo.style.color = 'red';
        discountInfo.textContent = `❌ ${err.message}`;
    }
    updateAllDisplays();
});

// 9) Checkout
async function doCheckout() {
    if (!cart.length) { alert('Ihr Warenkorb ist leer.'); return; }
    const userId = localStorage.getItem('userId');
    if (!userId) { alert('Bitte zuerst einloggen.'); return; }
    const pay = paymentSelect.value;
    if (extrasSection.style.display !== 'none' && !pay) {
        alert('Bitte Zahlungsart wählen.'); return;
    }
    const payload = {
        user_id:        userId,
        cart,
        total:          cart.reduce((s,i)=>s+i.price*i.quantity,0),
        payment_method: pay,
        coupon_code:    appliedCoupon,
        discount:       discountAmount,
        final_total:    cart.reduce((s,i)=>s+i.price*i.quantity,0) - discountAmount
    };
    try {
        const res  = await fetch(
            'http://localhost/MarLukTar/backend/logic/OrderHandler.php',
            {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(payload)
            }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert('Bestellung erfolgreich abgeschickt!');
        cart = []; appliedCoupon = null; discountAmount = 0; discountInfo.textContent = '';
        updateAllDisplays();
    } catch (e) {
        alert('Fehler bei der Bestellung: ' + e.message);
    }
}
checkoutBtn.addEventListener('click', doCheckout);

// 10) Live-Suche
searchInput.addEventListener('input', e => fetchProducts(e.target.value));

// 11) User-Status & Extras
function updateUserNavigation() {
    const userId = localStorage.getItem('userId');
    const role   = localStorage.getItem('userRole');
    userNav.innerHTML = userId
        ? (role === 'admin'
            ? `<a href="admin.html">🛠 Adminbereich</a><a href="#" id="logout-link">🔓 Logout</a>`
            : `<a href="profile.html">👤 Mein Profil</a><a href="#" id="logout-link">🔓 Logout</a>`)
        : `<a href="login.html">🔐 Einloggen</a><a href="register.html">📝 Registrieren</a>`;
    const lo = document.getElementById('logout-link');
    if (lo) lo.addEventListener('click', ev => {
        ev.preventDefault();
        localStorage.clear();
        updateUserNavigation();
    });
    toggleExtras();
}
function toggleExtras() {
    const u = localStorage.getItem('userId');
    extrasSection.style.display = u ? 'block' : 'none';
    loginPrompt.style.display   = u ? 'none'  : 'block';
}

// 12) Initialisierung
window.addEventListener('DOMContentLoaded', () => {
    updateUserNavigation();
    fetchProducts();
    updateAllDisplays();
});
