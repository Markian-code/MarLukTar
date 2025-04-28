// Initialisierung der Produktliste und Bearbeitungsindex
let products = [];
let editIndex = null;

// Event-Listener einrichten
window.onload = function() {
    loadProducts();

    document.getElementById('add-product-button').addEventListener('click', showAddProductForm);
    document.getElementById('save-product-btn').addEventListener('click', addProduct);
    document.getElementById('home-btn').addEventListener('click', goToHomepage);
    document.getElementById('logout-btn').addEventListener('click', logout);
};

// Funktion zum Hinzufügen oder Bearbeiten eines Produkts
function addProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const price = document.getElementById('new-product-price').value.trim();
    const description = document.getElementById('new-product-description').value.trim();
    const imageFile = document.getElementById('new-product-image').files[0];

    if (!name || !price || !description || (!imageFile && editIndex === null)) {
        alert("Bitte alle Felder ausfüllen!");
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('description', description);

    if (imageFile) {
        formData.append('image', imageFile);
    }

    if (editIndex !== null && products[editIndex]?.id) {
        formData.append('id', products[editIndex].id);
        formData.append('action', 'update');
    } else {
        formData.append('action', 'create');
    }

    fetch('/MarLukTar/backend/logic/ProductHandler.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkfehler');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);
            if (data.message.includes('erfolgreich')) {
                loadProducts();
                clearForm();
            } else {
                alert('❌ Fehler beim Speichern des Produkts.');
            }
        })
        .catch(error => {
            console.error('Fehler beim Speichern:', error);
            alert('❌ Unerwarteter Fehler beim Speichern.');
        });
}

// Funktion zum Aktualisieren der Produktliste
function updateProductList() {
    const list = document.getElementById('product-list');
    list.innerHTML = '';

    products.forEach((product, index) => {
        const div = document.createElement('div');
        div.classList.add('product-item');

        div.innerHTML = `
            <img src="${product.imageUrl ? 'http://localhost/MarLukTar/' + product.imageUrl.replace(/^\/+/, '') : 'http://localhost/MarLukTar/frontend/img/default.png'}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p><strong>Preis:</strong> €${parseFloat(product.price).toFixed(2)}</p>
            <p><strong>Beschreibung:</strong> ${product.description}</p>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct(${index})">✏️ Bearbeiten</button>
                <button class="delete-btn" onclick="deleteProduct(${index})">🗑️ Löschen</button>
            </div>
        `;

        list.appendChild(div);
    });
}

// Funktion zum Löschen eines Produkts
function deleteProduct(index) {
    const product = products[index];

    if (!product?.id) {
        alert("❗ Produkt hat keine ID (vielleicht nur lokal?)");
        return;
    }

    if (confirm(`Möchtest du das Produkt "${product.name}" wirklich löschen?`)) {
        fetch('/MarLukTar/backend/logic/ProductHandler.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: product.id })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netzwerkfehler beim Löschen');
                }
                return response.json();
            })
            .then(data => {
                console.log(data.message);
                if (data.message.includes('erfolgreich')) {
                    products.splice(index, 1);
                    updateProductList();
                } else {
                    alert('❌ Fehler beim Löschen des Produkts.');
                }
            })
            .catch(error => {
                console.error('Fehler beim Löschen:', error);
                alert('❌ Unerwarteter Fehler beim Löschen.');
            });
    }
}

// Formular anzeigen
function showAddProductForm() {
    editIndex = null;
    document.getElementById('add-product-form').classList.remove('hidden');
}

// Produkt zum Bearbeiten auswählen
function editProduct(index) {
    const product = products[index];
    document.getElementById('new-product-name').value = product.name;
    document.getElementById('new-product-price').value = product.price;
    document.getElementById('new-product-description').value = product.description;
    editIndex = index;
    document.getElementById('add-product-form').classList.remove('hidden');
}

// Formular zurücksetzen
function clearForm() {
    document.getElementById('new-product-name').value = '';
    document.getElementById('new-product-price').value = '';
    document.getElementById('new-product-description').value = '';
    document.getElementById('new-product-image').value = '';
    document.getElementById('add-product-form').classList.add('hidden');
}

// Produkte vom Server laden
function loadProducts() {
    fetch('/MarLukTar/backend/logic/ProductHandler.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkfehler beim Laden der Produkte');
            }
            return response.json();
        })
        .then(data => {
            products = data;
            updateProductList();
        })
        .catch(error => {
            console.error('Fehler beim Laden der Produkte:', error);
            alert('❌ Unerwarteter Fehler beim Laden der Produkte.');
        });
}

// Startseite öffnen
function goToHomepage() {
    window.location.href = 'index.html';
}

// Logout-Funktion
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
