// Globale Variable für den Warenkorb
let cart = [];
let allProducts = []; // Zwischenspeicherung aller Produkte für Detailansicht

// Produkte laden + Filtern nach Suchbegriff
async function fetchProducts(searchTerm = '') {
    const res = await fetch('http://localhost:3000/products');
    allProducts = await res.json();

    const list = document.getElementById('product-list');
    list.innerHTML = '';

    // Filter nach Produktname (Suche)
    const filtered = allProducts.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <h2 onclick="showDetails('${product._id}')" style="cursor: pointer; color: blue;">
              ${product.name}
            </h2>
            <p>${product.description}</p>
            <p><b>Preis:</b> €${product.price}</p>
            <button onclick="addToCart('${product._id}', '${product.name}', ${product.price})">
              🛒 In den Warenkorb
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

// Menge ändern (plus oder minus)
function changeQuantity(id, delta) {
    const item = cart.find(p => p.id === id);
    if (!item) return;

    item.quantity += delta;

    // Wenn Menge <= 0, Produkt entfernen
    if (item.quantity <= 0) {
        cart = cart.filter(p => p.id !== id);
    }

    updateCartDisplay();
}

// Produkt vollständig entfernen
function removeFromCart(id) {
    cart = cart.filter(p => p.id !== id);
    updateCartDisplay();
}

// Warenkorb anzeigen und Gesamtsumme berechnen
function updateCartDisplay() {
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    cartList.innerHTML = '';

    let sum = 0;
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.name} x${item.quantity} – €${(item.price * item.quantity).toFixed(2)}
            <button onclick="changeQuantity('${item.id}', 1)">➕</button>
            <button onclick="changeQuantity('${item.id}', -1)">➖</button>
            <button onclick="removeFromCart('${item.id}')">🗑️</button>
        `;
        cartList.appendChild(li);

        sum += item.price * item.quantity;
    });

    cartTotal.textContent = `€${sum.toFixed(2)}`;
}

// Produkt-Detailansicht im Modal anzeigen
function showDetails(id) {
    const product = allProducts.find(p => p._id === id);
    if (product) {
        document.getElementById('modal-title').textContent = product.name;
        document.getElementById('modal-description').textContent = product.description;
        document.getElementById('modal-price').textContent = product.price;
        document.getElementById('modal-category').textContent = product.category || 'Keine Angabe';

        document.getElementById('modal').classList.remove('hidden');
    }
}

// Modal schließen
document.getElementById('modal-close').addEventListener('click', () => {
    document.getElementById('modal').classList.add('hidden');
});

// Live-Suche bei Eingabe im Suchfeld
document.getElementById('search').addEventListener('input', (e) => {
    fetchProducts(e.target.value);
});

// Initiales Laden der Produkte
fetchProducts();
