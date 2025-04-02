let products = [];

async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    products = await res.json();  // зберігаємо в глобальну змінну
    renderProducts(products);
}

function renderProducts(productArray) {
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    productArray.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
      <h2>${product.name}</h2>
      <p>${product.description}</p>
      <p><b>Preis:</b> €${product.price}</p>
      <button onclick="addToCart('${product._id}')">🛒 In den Warenkorb</button>
    `;
        list.appendChild(div);
    });
}

function addToCart(id) {
    alert(`Produkt ${id} zum Warenkorb hinzugefügt.`);
    // Тут буде повна реалізація SCRUM-22
}

// Реакція на введення в пошук
document.getElementById('search').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(query)
    );
    renderProducts(filtered);
});

fetchProducts();
