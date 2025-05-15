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
        div.setAttribute('data-id', product.id);

        div.innerHTML = `
            <img src="${product.imageUrl ? 'http://localhost/MarLukTar/' + product.imageUrl.replace(/^\/+/, '') : 'http://localhost/MarLukTar/frontend/img/default.png'}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p><strong>Preis:</strong> €${product.price}</p>
            <p><strong>Beschreibung:</strong> ${product.description}</p>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct(${index})">✏️ Bearbeiten</button>
                <button class="delete-btn" onclick="deleteProduct(${index})">🗑️ Löschen</button>
            </div>
        `;

        list.appendChild(div);
    });

    enableDragAndDrop();
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

// Drag-and-Drop für Produktliste
function enableDragAndDrop() {
    const productItems = document.querySelectorAll('.product-item');

    productItems.forEach((item, index) => {
        item.setAttribute('draggable', true);

        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });

        item.addEventListener('dragend', (e) => {
            item.classList.remove('dragging');
            saveNewProductOrder(); // ➔ Зберігаємо після закінчення перетягування
        });

        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            item.classList.add('drag-over');
        });

        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });

        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const draggedIndex = e.dataTransfer.getData('text/plain');
            const targetIndex = index;

            if (draggedIndex !== targetIndex.toString()) {
                const draggedProduct = products[draggedIndex];
                products.splice(draggedIndex, 1);
                products.splice(targetIndex, 0, draggedProduct);

                updateProductList();
            }
        });
    });
}

// Neue Produktreihenfolge speichern
function saveNewProductOrder() {
    const productItems = document.querySelectorAll('.product-item');
    const newOrder = [];

    productItems.forEach((item, index) => {
        const productId = item.getAttribute('data-id');
        if (productId) {
            newOrder.push({ id: productId, position: index });
        }
    });

    fetch('/MarLukTar/backend/logic/ProductHandler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'updateOrder',
            order: newOrder
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log('✅ Neue Reihenfolge gespeichert:', data.message);
        })
        .catch(error => {
            console.error('❌ Fehler beim Speichern der Reihenfolge:', error);
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
