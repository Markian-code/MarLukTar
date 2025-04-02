async function fetchProducts() {
    const res = await fetch('http://localhost:3000/products');
    const products = await res.json();
  
    const list = document.getElementById('product-list');
    list.innerHTML = '';
  
    products.forEach(product => {
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
    // Далі додамо функціонал кошика (SCRUM-22)
  }
  
  fetchProducts();
  