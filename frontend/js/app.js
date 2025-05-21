// --- Globale Variablen ---
let cart = [];
let allProducts = [];
let appliedCoupon = null;
let discountAmount = 0;

// --- DOM-Referenzen ---
const productList     = document.getElementById('product-list');
const searchInput     = document.getElementById('search');

const cartDropZone    = document.getElementById('cart-drop-zone');
const cartButton      = document.getElementById('cart-button');
const cartCountEl     = document.getElementById('cart-count');
const inlineCartList  = document.getElementById('cart-list');
const inlineCartTotal = document.getElementById('cart-total');

const cartModal       = document.getElementById('cart-modal');
const cartCloseBtn    = document.getElementById('cart-close');
const cartModalList   = document.getElementById('cart-modal-list');
const cartModalTotal  = document.getElementById('cart-total-modal');
const cartModalCheckout = document.getElementById('cart-modal-checkout');

const extrasSection   = document.getElementById('extras');
const loginPrompt     = document.getElementById('login-prompt');
const paymentSelect   = document.getElementById('payment-method');
const couponInput     = document.getElementById('coupon-code');
const applyCouponBtn  = document.getElementById('apply-coupon-btn');
const discountInfo    = document.getElementById('discount-info');
const checkoutBtn     = document.getElementById('checkout-btn');

const userNav         = document.getElementById('user-nav');

// Detail-Modal Referenzen
const detailModal     = document.getElementById('modal');
const modalCloseBtn   = document.getElementById('modal-close');
const modalImage      = document.getElementById('modal-image');
const modalTitle      = document.getElementById('modal-title');
const modalDescription= document.getElementById('modal-description');
const modalPrice      = document.getElementById('modal-price');
const modalCategory   = document.getElementById('modal-category');

// Reviews-Referenzen
const reviewsSection  = document.getElementById('reviews-section');
const reviewsListEl   = document.getElementById('reviews-list');
const reviewFormEl    = document.getElementById('review-form');
const loginToReviewEl = document.getElementById('login-to-review');
const ratingSelect    = document.getElementById('review-rating');
const commentInput    = document.getElementById('review-comment');
const submitReviewBtn = document.getElementById('submit-review');

// --- Basis-URL für Backend ---
const BASE_URL = '../backend/logic/';

// --- Hilfsfunktion zum Zählen der Warenkorbmenge ---
function updateCartCount() {
    cartCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
}

// --- 1) Produkte laden und darstellen ---
async function fetchProducts(searchTerm = '') {
    try {
        const res = await fetch(`${BASE_URL}RequestHandler.php?route=products`);
        const data = await res.text(); // Zuerst als Text holen
        try {
            allProducts = JSON.parse(data); // Dann parsen
        } catch (jsonErr) {
            console.error('❌ JSON Fehler:', jsonErr.message, 'Antwort:', data);
            return;
        }

        productList.innerHTML = '';
        allProducts
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .forEach(p => {
                const card = document.createElement('div');
                card.className = 'product';
                card.dataset.id = p.id;
                card.innerHTML = `
                    <img src="${p.imageUrl ? 'http://localhost/MarLukTar/' + p.imageUrl : 'http://localhost/MarLukTar/frontend/img/default.png'}" alt="${p.name}" />
                    <h2 class="product-name">${p.name}</h2>
                    <p>${p.description}</p>
                    <p><strong>Preis:</strong> €${parseFloat(p.price).toFixed(2)}</p>
                    <button class="add-btn" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}">
                        In den Warenkorb
                    </button>
                `;
                card.addEventListener('click', e => {
                    if (!e.target.classList.contains('add-btn') && !e.target.closest('.add-btn')) {
                        showProductDetail(p);
                    }
                });
                card.setAttribute('draggable','true');
                card.addEventListener('dragstart', e => {
                    e.dataTransfer.setData('application/json', JSON.stringify({id:p.id,name:p.name,price:p.price}));
                    e.dataTransfer.effectAllowed = 'copy';
                });
                productList.appendChild(card);
            });

    } catch (err) {
        console.error('Fehler beim Laden der Produkte:', err);
    }
}

// --- 2) Detail-Modal anzeigen ---
function showProductDetail(p) {
    console.log('🛍️ Produkt geklickt:', p.name);
    modalImage.src = p.imageUrl ? 'http://localhost/MarLukTar/' + p.imageUrl : 'http://localhost/MarLukTar/frontend/img/default.png';
    modalImage.alt = p.name;
    modalTitle.textContent = p.name;
    modalDescription.textContent = p.description;
    modalPrice.textContent = parseFloat(p.price).toFixed(2);
    modalCategory.textContent = p.category || '—';
    reviewsSection.dataset.productId = p.id;
    updateReviewSection();
    detailModal.classList.remove('hidden');
}
modalCloseBtn.addEventListener('click', () => detailModal.classList.add('hidden'));

// --- 3) Live-Suche ---
searchInput.addEventListener('input', e => fetchProducts(e.target.value));

// --- 4) Klick / Drag in den Warenkorb ---
productList.addEventListener('click', e => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    addToCart(btn.dataset.id, btn.dataset.name, parseFloat(btn.dataset.price));
});
function initCartDropZone() {
    cartDropZone.addEventListener('dragover', e => {
        e.preventDefault();
        cartDropZone.classList.add('drag-over');
    });
    cartDropZone.addEventListener('dragleave', () => {
        cartDropZone.classList.remove('drag-over');
    });
    cartDropZone.addEventListener('drop', e => {
        e.preventDefault();
        cartDropZone.classList.remove('drag-over');
        try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            addToCart(data.id, data.name, data.price);
        } catch {
            console.warn('Ungültige Drag-Daten');
        }
    });
}
cartButton.addEventListener('click', ()=> cartModal.classList.remove('hidden'));

// --- 5–6) Warenkorb-Funktionen ---
function addToCart(id, name, price) {
    const idx = cart.findIndex(i => i.id === String(id));
    if (idx > -1) cart[idx].quantity++;
    else cart.push({id:String(id),name,price,quantity:1});
    updateAllDisplays();
}
function changeQuantity(idx, delta) {
    if (!cart[idx]) return;
    cart[idx].quantity += delta;
    if (cart[idx].quantity < 1) cart.splice(idx,1);
    updateAllDisplays();
}
function removeFromCart(idx) {
    cart.splice(idx,1);
    updateAllDisplays();
}

// --- 7) Rendering aller Cart-Views ---
function updateAllDisplays() {
    renderInlineCart();
    renderCartModal();
    updateCartCount();
}
function renderInlineCart() {
    inlineCartList.innerHTML = '';
    let sum=0;
    cart.forEach((item,idx)=>{
        sum += item.price*item.quantity;
        const div = document.createElement('div');
        div.className='cart-item';
        div.innerHTML=`
            <span>${item.name} x${item.quantity} – €${(item.price*item.quantity).toFixed(2)}</span>
            <div>
                <button class="qty-btn" data-idx="${idx}" data-action="+">+</button>
                <button class="qty-btn" data-idx="${idx}" data-action="-">−</button>
                <button class="remove-btn" data-idx="${idx}">✕</button>
            </div>`;
        inlineCartList.appendChild(div);
    });
    inlineCartTotal.textContent = `€${(sum-discountAmount).toFixed(2)}`;
}
function renderCartModal() {
    cartModalList.innerHTML = '';
    let sum = 0;
    cart.forEach((item, idx) => {
        sum += item.price * item.quantity;
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <div>
                <button class="qty-btn" data-idx="${idx}" data-action="+">+</button>
                <button class="qty-btn" data-idx="${idx}" data-action="-">−</button>
                <button class="remove-btn" data-idx="${idx}">✕</button>
            </div>
            <span>€${(item.price * item.quantity).toFixed(2)}</span>`;
        cartModalList.appendChild(row);
    });
    cartModalTotal.textContent = `€${(sum - discountAmount).toFixed(2)}`;
}
inlineCartList.addEventListener('click', handlerCartButtons);
cartModalList.addEventListener('click', handlerCartButtons);
function handlerCartButtons(e){
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = +btn.dataset.idx;
    if (btn.classList.contains('qty-btn')) {
        changeQuantity(idx, btn.dataset.action === '+' ? 1 : -1);
    } else if (btn.classList.contains('remove-btn')) {
        removeFromCart(idx);
    }
}
cartCloseBtn.addEventListener('click', ()=> cartModal.classList.add('hidden'));
cartModalCheckout.addEventListener('click', ()=> {
    cartModal.classList.add('hidden');
    doCheckout();
});

// --- 8) Gutschein anwenden ---
applyCouponBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim();
    if (!code) return alert('Bitte Gutscheincode eingeben.');
    try {
        const res = await fetch(`${BASE_URL}CouponHandler.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({code})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        appliedCoupon = code;
        discountAmount = parseFloat(data.discount) || 0;
        discountInfo.style.color = 'green';
        discountInfo.textContent = `✅ -€${discountAmount.toFixed(2)}`;
    } catch (err) {
        appliedCoupon = null;
        discountAmount = 0;
        discountInfo.style.color = 'red';
        discountInfo.textContent = `❌ ${err.message}`;
    }
    updateAllDisplays();
});

// --- 9) Checkout ---
async function doCheckout(){
    if (!cart.length) return alert('Ihr Warenkorb ist leer.');
    const userId = localStorage.getItem('userId');
    if (!userId) return alert('Bitte zuerst einloggen.');
    const pay = paymentSelect.value;
    if (extrasSection.style.display !== 'none' && !pay) return alert('Bitte Zahlungsart wählen.');

    const payload = {
        action: "create", 
        user_id: userId,
        cart,
        total: cart.reduce((s,i)=>s+i.price*i.quantity,0),
        payment_method: pay,
        coupon_code: appliedCoupon,
        discount: discountAmount,
        final_total: cart.reduce((s,i)=>s+i.price*i.quantity,0) - discountAmount
    };

    try {
        const res = await fetch(`${BASE_URL}OrderHandler.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        alert('🛒 Bestellung erfolgreich abgeschickt!');
        cart = []; appliedCoupon = null; discountAmount = 0; discountInfo.textContent = '';
        updateAllDisplays();
    } catch (e) {
        alert('Fehler bei der Bestellung: ❌ ' + e.message);
    }
}

checkoutBtn.addEventListener('click', doCheckout);

// --- 10) Reviews laden & senden ---
async function loadReviews(){
    const pid = reviewsSection.dataset.productId;
    if (!pid) return;
    try {
        const res = await fetch(`${BASE_URL}ReviewHandler.php?product_id=${pid}`);
        const reviews = await res.json();
        reviewsListEl.innerHTML = reviews.map(r => `
            <div class="review">
                <div class="review-header">
                    <span class="reviewer">${r.username}</span>
                    <span class="rating">${'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}</span>
                    <span class="date">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div class="review-body">${r.comment}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Fehler beim Laden der Reviews:', err);
    }
}

function updateReviewSection(){
    const uid = localStorage.getItem('userId');
    reviewFormEl.style.display = uid ? 'block' : 'none';
    loginToReviewEl.style.display = uid ? 'none' : 'block';
    loadReviews();
}
submitReviewBtn.addEventListener('click', async () => {
    const pid = reviewsSection.dataset.productId;
    const uid = localStorage.getItem('userId');
    const rating = parseInt(ratingSelect.value, 10);
    const comment = commentInput.value.trim();
    if (!pid || !uid || !rating || !comment) return alert('Bitte alle Felder ausfüllen.');
    try {
        const res = await fetch(`${BASE_URL}ReviewHandler.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({product_id: pid, user_id: uid, rating, comment})
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        commentInput.value = '';
        loadReviews();
    } catch (err) {
        alert('Fehler beim Speichern der Bewertung: ' + err.message);
    }
});

// --- 11) User-Navi & Extras ---
function updateUserNavigation(){
    const uid = localStorage.getItem('userId');
    const role = localStorage.getItem('userRole');
    userNav.innerHTML = uid
        ? (role === 'admin'
            ? `<a href="admin.html">🛠 Adminbereich</a><a href="#" id="logout-link">🔓 Logout</a>`
            : `<a href="profile.html">👤 Mein Profil</a><a href="#" id="logout-link">🔓 Logout</a>`)
        : `<a href="login.html">🔐 Einloggen</a><a href="register.html">📝 Registrieren</a>`;
    const lo = document.getElementById('logout-link');
    if (lo) lo.addEventListener('click', ev => {
        ev.preventDefault();
        localStorage.clear();
        updateUserNavigation();
        updateReviewSection();
    });
    toggleExtras();
}
function toggleExtras(){
    const u = localStorage.getItem('userId');
    extrasSection.style.display = u ? 'block' : 'none';
    loginPrompt.style.display   = u ? 'none' : 'block';
}

// --- 12) Initialisierung ---
window.addEventListener('DOMContentLoaded', () => {
    initCartDropZone();
    updateUserNavigation();
    fetchProducts();
    updateAllDisplays();
});
