// ─── Globale Variablen ───────────────────────────────
let products = [];
let editIndex = null;

// ─── Funktionen ──────────────────────────────────────

// Produktformular anzeigen
function showAddProductForm() {
    editIndex = null;
    document.getElementById('add-product-form').classList.remove('hidden');
}

// Produkte laden
function loadProducts() {
    fetch('/MarLukTar/backend/logic/ProductHandler.php')
        .then(res => res.json())
        .then(data => {
            products = data;
            updateProductList();
        })
        .catch(err => {
            console.error('❌ Fehler beim Laden der Produkte:', err);
        });
}

// Produktliste anzeigen
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

// Produkt hinzufügen oder bearbeiten
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
    if (imageFile) formData.append('image', imageFile);

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
        .then(response => response.text()) // 👈 читаємо як текст
        .then(text => {
            try {
                const data = JSON.parse(text); // 👈 парсимо вручну
                if (data.message.includes('erfolgreich')) {
                    loadProducts();
                    clearForm();
                } else {
                    alert(data.message);
                }
            } catch (e) {
                console.error('❌ Fehler beim Parsen der Antwort:', text);
                alert('❌ Ungültige Serverantwort.');
            }
        })
        .catch(error => {
            console.error('❌ Netzwerkfehler:', error);
            alert('❌ Netzwerkfehler beim Speichern.');
        });
}

// Produkt löschen
function deleteProduct(index) {
    const product = products[index];
    if (!product?.id) return;

    if (confirm(`Möchtest du das Produkt "${product.name}" löschen?`)) {
        fetch('/MarLukTar/backend/logic/ProductHandler.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: product.id })
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                loadProducts();
            })
            .catch(err => alert("❌ Fehler beim Löschen: " + err));
    }
}

// Produkt bearbeiten
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

// Drag & Drop aktivieren
function enableDragAndDrop() {
    const productItems = document.querySelectorAll('.product-item');
    productItems.forEach((item, index) => {
        item.setAttribute('draggable', true);

        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));
        item.addEventListener('dragover', e => {
            e.preventDefault();
            item.classList.add('drag-over');
        });
        item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
        item.addEventListener('drop', e => {
            e.preventDefault();
            const draggedIndex = e.dataTransfer.getData('text/plain');
            const draggedProduct = products[draggedIndex];
            products.splice(draggedIndex, 1);
            products.splice(index, 0, draggedProduct);
            updateProductList();
        });
    });
}

// Neue Reihenfolge speichern (optional)
function saveNewProductOrder() {
    const order = [];
    document.querySelectorAll('.product-item').forEach((item, index) => {
        order.push({ id: item.getAttribute('data-id'), position: index });
    });

    fetch('/MarLukTar/backend/logic/ProductHandler.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateOrder', order })
    })
        .then(res => res.json())
        .then(data => console.log("🔃 Reihenfolge gespeichert:", data.message))
        .catch(err => console.error("❌ Fehler beim Speichern:", err));
}

// ─── Kundenverwaltung ──────────────────────────────

function loadCustomers() {
    fetch("../backend/logic/UserHandler.php?action=all")
        .then(res => res.json())
        .then(users => {
            const container = document.getElementById("customer-list");
            container.innerHTML = "";
            users.forEach(user => {
                const userCard = document.createElement("div");
                userCard.className = "user-card";
                userCard.innerHTML = `
                    <h4>${user.firstname ?? ''} ${user.lastname ?? ''} (${user.email})</h4>
                    <p>Status: <strong>${user.active == 1 ? "Aktiv" : "Inaktiv"}</strong></p>
                    <button onclick="umschaltenStatus(${user.id})">
                        ${user.active == 1 ? "Deaktivieren" : "Aktivieren"}
                    </button>
                    <button onclick="zeigeBestellungen(${user.id})">📦 Bestellungen</button>
                    <div id="orders-${user.id}" class="orders-list"></div>
                `;
                container.appendChild(userCard);
            });
        });
}

function umschaltenStatus(userId) {
    fetch("../backend/logic/UserHandler.php?action=toggle&id=" + userId)
        .then(res => res.json())
        .then(data => {
            alert(data.message);
            loadCustomers();
        });
}

function zeigeBestellungen(userId) {
    const zielElement = document.getElementById(`orders-${userId}`);
    fetch(`../backend/logic/OrderHandler.php?action=listOrdersByUser&id=${userId}`)
        .then(res => res.json())
        .then(bestellungen => {
            zielElement.innerHTML = "<h4>📦 Bestellungen des Kunden:</h4>";
            bestellungen.forEach(b => {
                const div = document.createElement("div");
                div.classList.add("bestellungs-eintrag");
                div.innerHTML = `
                    <p><strong>ID:</strong> ${b.id}</p>
                    <p><strong>Datum:</strong> ${b.date}</p>
                    <p><strong>Summe:</strong> €${b.total}</p>
                    <p><strong>Status:</strong></p>
                `;
                const select = document.createElement("select");
                ['offen', 'bezahlt', 'versendet', 'storniert'].forEach(status => {
                    const option = document.createElement("option");
                    option.value = status;
                    option.textContent = status;
                    if (b.status === status) option.selected = true;
                    select.appendChild(option);
                });
                const button = document.createElement("button");
                button.textContent = "💾 Speichern";
                button.onclick = () => bestellungSpeichern(b.id, select.value);
                div.appendChild(select);
                div.appendChild(button);
                zielElement.appendChild(div);
            });
        });
}

function bestellungSpeichern(id, status) {
    fetch("../backend/logic/OrderHandler.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", id, status })
    })
        .then(res => res.json())
        .then(data => alert(data.message || "✅ Bestellung aktualisiert."))
        .catch(err => alert("❌ Fehler: " + err));
}

// ─── Event Listener Setup ───────────────────────────
window.onload = function () {
    loadProducts();

    document.getElementById('add-product-button')?.addEventListener('click', showAddProductForm);
    document.getElementById('save-product-btn')?.addEventListener('click', addProduct);
    document.getElementById('home-btn')?.addEventListener('click', goToHomepage);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    document.getElementById('load-customers-btn')?.addEventListener('click', loadCustomers);
};

function goToHomepage() {
    window.location.href = 'index.html';
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
