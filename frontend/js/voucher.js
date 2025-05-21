// voucher.js – Verwaltung der Gutscheine über MySQL

document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generate-voucher-btn");
    const voucherList = document.getElementById("voucher-list");
    const codeInput = document.getElementById("voucher-code");
    const valueInput = document.getElementById("voucher-value");
    const expiryInput = document.getElementById("voucher-expiry");

    // Richtiger Pfad
    const handlerUrl = "../backend/logic/voucherhandler.php";

    // Gutscheine laden
    const fetchVouchers = () => {
        fetch(`${handlerUrl}?action=list`)
            .then(res => res.json())
            .then(data => {
                voucherList.innerHTML = "";
                data.forEach(v => {
                    const item = document.createElement("li");
                    item.classList.add("list-group-item");
                    item.textContent = `Code: ${v.code}, Wert: ${v.discount}€, Ablauf: ${v.expiry_date}`;
                    voucherList.appendChild(item);
                });
            })
            .catch(err => {
                alert("❌ Fehler beim Laden der Gutscheine: " + err);
            });
    };

    // Gutschein erstellen
    generateBtn.addEventListener("click", () => {
        const voucherData = {
            code: codeInput.value.trim(),
            value: parseFloat(valueInput.value),
            expiry: expiryInput.value
        };

        if (!voucherData.code || isNaN(voucherData.value) || !voucherData.expiry) {
            alert("Bitte alle Felder korrekt ausfüllen!");
            return;
        }

        fetch(handlerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(voucherData)
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "✅ Gutschein gespeichert.");
                fetchVouchers();
                codeInput.value = "";
                valueInput.value = "";
                expiryInput.value = "";
            })
            .catch(err => {
                alert("❌ Fehler beim Speichern des Gutscheins: " + err);
            });
    });

    fetchVouchers();
});
