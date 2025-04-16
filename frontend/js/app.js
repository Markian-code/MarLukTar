// Globale Variablen
let cart = [];
let allProducts = [];

// Produkte vom Server laden und nach Suchbegriff filtern
async function fetchProducts(searchTerm = '') {
    const res = await fetch('http://localhost/MarLukTar/backend/logic/RequestHandler.php?route=products');
    allProducts = await res.json();

    const list = document.getElementById('product-list');
    list.innerHTML = '';

    // Produktsuche nach Namen
    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <h2 onclick="showDetails('${product.id}')" style="cursor: pointer; color: blue;">
              ${product.name}
            </h2>
            <p>${product.description}</p>
            <p><b>Preis:</b> €${product.price}</p>
            <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})">
              In den Warenkorb
            </button>
        `;
        list.appendChild(div);
    });
}

// Produkt dem Warenkorb hinzufügen
function addToCart(id, name, price) {
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    updateCartDisplay();
}

// Menge im Warenkorb ändern
function changeQuantity(id, delta) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        cart = cart.filter(p => p.id !== id);
    }

    updateCartDisplay();
}

// Produkt aus dem Warenkorb entfernen
function removeFromCart(id) {
    cart = cart.filter(p => p.id !== id);
    updateCartDisplay();
}

// Warenkorb anzeigen und aktualisieren
function updateCartDisplay() {
    const cartList = document.getElementById("cart-list");
    const cartTotal = document.getElementById("cart-total");
    cartList.innerHTML = "";

    let sum = 0;

    cart.forEach(item => {
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("cart-item");

        itemDiv.innerHTML = `
            <div class="cart-item-info">
                ${item.name} x${item.quantity} – €${(item.price * item.quantity).toFixed(2)}
            </div>
            <div class="cart-item-controls">
                <button onclick="changeQuantity('${item.id}', 1)">+</button>
                <button onclick="changeQuantity('${item.id}', -1)">-</button>
                <button onclick="removeFromCart('${item.id}')">Entfernen</button>
            </div>
        `;

        cartList.appendChild(itemDiv);
        sum += item.price * item.quantity;
    });

    cartTotal.textContent = `€${sum.toFixed(2)}`;
}

// Detailansicht im Modal anzeigen
function showDetails(id) {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-price').textContent = product.price;
        document.getElementById('modal-category').textContent = product.category || 'Keine Angabe';

        document.getElementById('modal').classList.remove('hidden');
    }
}

// Modal schließen
const closeBtn = document.getElementById('modal-close');
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        document.getElementById('modal').classList.add('hidden');
    });
}

// Produktsuche live filtern
const searchInput = document.getElementById('search');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        fetchProducts(e.target.value);
    });
}

// Checkout-Button aktivieren
const checkoutButton = document.getElementById('checkout-btn');
if (checkoutButton) {
    checkoutButton.addEventListener('click', checkout);
}

// Bestellung absenden
async function checkout() {
    if (cart.length === 0) {
        alert('Ihr Warenkorb ist leer.');
        return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Bitte zuerst einloggen.');
        return;
    }

    try {
        const res = await fetch('http://localhost/MarLukTar/backend/logic/OrderHandler.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: userId,
                cart: cart,
                total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
            })
        });

        const data = await res.json();

        if (res.ok) {
            alert('Bestellung erfolgreich abgeschickt!');
            cart = [];
            updateCartDisplay();
        } else {
            alert('Fehler bei der Bestellung: ' + data.message);
        }
    } catch (error) {
        console.error('Fehler beim Checkout:', error);
        alert('Unbekannter Fehler beim Checkout.');
    }
}

// Benutzerstatus prüfen und Navigation aktualisieren
function updateUserNavigation() {
    const userId = localStorage.getItem('userId');
    const nav = document.getElementById('user-nav');

    if (nav) {
        if (userId) {
            nav.innerHTML = `
                <a href="profile.html">Mein Profil</a>
                <a href="#" onclick="logout()">Logout</a>
            `;
        } else {
            nav.innerHTML = `
                <a href="login.html" class="btn-login">🔐 Einloggen</a>
                <a href="register.html" class="btn-register">📝 Registrieren</a>
            `;
        }
    }
}

// Logout-Funktion
function logout() {
    localStorage.clear();
    updateUserNavigation(); // Navigation sofort updaten
}

// Beim Laden der Seite Aktionen ausführen
window.addEventListener('DOMContentLoaded', () => {
    updateUserNavigation();
    fetchProducts();
});
