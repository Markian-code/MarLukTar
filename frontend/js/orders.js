// === Bestellungen abrufen und anzeigen ===

const userId = localStorage.getItem('userId');

async function fetchOrders() {
    try {
        const response = await fetch(`../backend/logic/OrderHandler.php?action=listOrdersByUser&id=${userId}`);
        const data = await response.json();

        const list = document.getElementById('orders-list');
        list.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            list.innerHTML = '<p>Keine Bestellungen gefunden.</p>';
            return;
        }

        data.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order');

            // Berechne Betrag aus final_total oder fallback auf total
            const betrag = parseFloat(order.final_total ?? order.total).toFixed(2);

            // Bestellübersicht
            orderDiv.innerHTML = `
                <h3>🧾 Bestellung #${order.id} – ${order.date}</h3>
                <p><strong>Gesamtbetrag:</strong> €${betrag}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <button class="pdf-btn" data-id="${order.id}">📄 Rechnung (PDF)</button>
                <hr />
            `;

            list.appendChild(orderDiv);
        });

    } catch (err) {
        console.error('Fehler beim Laden der Bestellungen:', err);
        document.getElementById('orders-list').innerHTML = '<p>Fehler beim Laden.</p>';
    }
}

// PDF-Button-Handler (Rechnung öffnen)
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pdf-btn');
    if (!btn) return;

    const orderId = btn.dataset.id;
    if (!orderId) return;

    // PDF öffnen
    window.open(`../backend/logic/PDFHandler.php?order_id=${orderId}`, '_blank');
});

fetchOrders();
