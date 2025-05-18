// === Bestellungen abrufen und anzeigen ===

const userId = localStorage.getItem('userId');

async function fetchOrders() {
    try {
        const response = await fetch(`http://localhost/MarLukTar/backend/logic/RequestHandler.php?route=orders&user_id=${userId}`);
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

            // Produkte anzeigen
            const itemsHtml = order.items.map(item => {
                const itemTotal = item.price * item.quantity;
                return `<li>${item.name} x${item.quantity} – €${itemTotal.toFixed(2)}</li>`;
            }).join('');

            // Rabatt anzeigen (nur wenn > 0)
            const discount = parseFloat(order.discount || 0);
            const discountHtml = discount > 0
                ? `<p><strong>Gutschein:</strong> ${order.coupon_code || 'Unbekannt'} (−€${discount.toFixed(2)})</p>`
                : '';

            // PDF-Link erstellen
            const pdfLink = `
                <p>
                    <a href="http://localhost/MarLukTar/backend/logic/PDFHandler.php?order_id=${order.order_id}" 
                       target="_blank" 
                       style="text-decoration: none; font-weight: bold; color: darkblue;">
                       📄 Rechnung anzeigen
                    </a>
                </p>
            `;

            // HTML zusammenbauen
            orderDiv.innerHTML = `
                <h3>🧾 Bestellung #${order.order_id} – ${order.date}</h3>
                <ul>${itemsHtml}</ul>
                <p><strong>Zahlungsart:</strong> ${order.payment_method || 'Keine Angabe'}</p>
                ${discountHtml}
                <p><strong>Endsumme:</strong> <span style="color: darkgreen;">€${parseFloat(order.final_total).toFixed(2)}</span></p>
                ${pdfLink}
            `;

            list.appendChild(orderDiv);
        });

    } catch (err) {
        console.error('Fehler beim Laden der Bestellungen:', err);
        document.getElementById('orders-list').innerHTML = '<p>Fehler beim Laden.</p>';
    }
}

fetchOrders();
