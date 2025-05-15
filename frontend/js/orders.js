// === Bestellungen abrufen und anzeigen ===

// Benutzer-ID
const userId = localStorage.getItem('userId');

// Bestellungen vom Server abrufen und anzeigen
async function fetchOrders() {
    try {
        const response = await fetch(`http://localhost/MarLukTar/backend/logic/RequestHandler.php?route=orders&user_id=${userId}`);
        const data = await response.json();

        const list = document.getElementById('orders-list');
        list.innerHTML = '';

        if (!data.length) {
            list.innerHTML = '<p>Keine Bestellungen gefunden.</p>';
            return;
        }

        // Für jede Bestellung eine Box anzeigen
        data.forEach(order => {
            const orderDiv = document.createElement('div');
            orderDiv.classList.add('order');

            let itemsHtml = '';
            order.items.forEach(item => {
                itemsHtml += `<li>${item.name} x${item.quantity} – €${(item.price * item.quantity).toFixed(2)}</li>`;
            });

            orderDiv.innerHTML = `
        <h3>🧾 Bestellung #${order.order_id} – ${order.date}</h3>
        <ul>${itemsHtml}</ul>
        <p><strong>Gesamtsumme:</strong> €${order.total}</p>
      `;

            list.appendChild(orderDiv);
        });
    } catch (err) {
        console.error('Fehler beim Laden der Bestellungen:', err);
        document.getElementById('orders-list').innerHTML = '<p>Fehler beim Laden.</p>';
    }
}

fetchOrders();
