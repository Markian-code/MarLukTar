<?php
// 1. Ausgabe-Pufferung vor jeglicher Ausgabe starten
ob_start();

require_once __DIR__ . '/../config/dbaccess.php';
require_once __DIR__ . '/../lib/fpdf.php';

// 2. Bestelldaten aus der Datenbank laden
$db = getDBConnection();
$orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;
if ($orderId <= 0) {
    http_response_code(400);
    exit;
}

$stmt = $db->prepare("
    SELECT o.*, u.username, u.email
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
");
$stmt->execute([$orderId]);
$order = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$order) {
    http_response_code(404);
    exit;
}

$itemStmt = $db->prepare("
    SELECT oi.*, p.name
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
");
$itemStmt->execute([$orderId]);
$items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

// 3. PDF mit FPDF erstellen
$pdf = new FPDF();
$pdf->AddPage();
$pdf->SetFont('Arial', 'B', 16);
$pdf->Cell(0, 10, utf8_decode('Rechnung'), 0, 1, 'C');

$pdf->SetFont('Arial', '', 12);
$pdf->Ln(5);
$pdf->Cell(0, 8, utf8_decode('Bestellnummer: #') . $order['id'], 0, 1);
$pdf->Cell(0, 8, utf8_decode('Kunde: ') . utf8_decode($order['username']) . ' (' . $order['email'] . ')', 0, 1);
$pdf->Cell(0, 8, utf8_decode('Zahlungsart: ') . utf8_decode($order['payment_method']), 0, 1);
$pdf->Cell(0, 8, utf8_decode('Datum: ') . ($order['created_at'] ?? 'Unbekannt'), 0, 1);
$pdf->Ln(5);

// 4. Tabellenkopf zeichnen
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(80, 10, utf8_decode('Produkt'), 1);
$pdf->Cell(30, 10, utf8_decode('Menge'), 1);
$pdf->Cell(40, 10, utf8_decode('Preis'), 1);
$pdf->Cell(40, 10, utf8_decode('Gesamt'), 1);
$pdf->Ln();

// 5. Artikelliste ausgeben (ohne Sonderzeichen-Probleme: EUR statt €)
$pdf->SetFont('Arial', '', 12);
foreach ($items as $item) {
    $total = $item['price'] * $item['quantity'];
    $pdf->Cell(80, 10, utf8_decode($item['name']), 1);
    $pdf->Cell(30, 10, $item['quantity'], 1);
    $pdf->Cell(40, 10, number_format($item['price'], 2) . ' EUR', 1, 0, 'R');
    $pdf->Cell(40, 10, number_format($total,      2) . ' EUR', 1, 0, 'R');
    $pdf->Ln();
}

// 6. Summenbereich mit rechter Ausrichtung
$pdf->Ln(5);
$pdf->SetFont('Arial', 'B', 12);
$pdf->Cell(150, 10, utf8_decode('Zwischensumme:'), 0, 0, 'R');
$pdf->Cell(40, 10, number_format($order['total'], 2) . ' EUR', 0, 1, 'R');

if ($order['discount'] > 0) {
    $pdf->Cell(150, 10, utf8_decode('Gutschein (') . utf8_decode($order['coupon_code']) . utf8_decode('):'), 0, 0, 'R');
    $pdf->Cell(40, 10, '-' . number_format($order['discount'], 2) . ' EUR', 0, 1, 'R');
}

$pdf->Cell(150, 10, utf8_decode('Gesamtsumme:'), 0, 0, 'R');
$pdf->Cell(40, 10, number_format($order['final_total'], 2) . ' EUR', 0, 1, 'R');

// 7. HTTP-Header für PDF-Ausgabe setzen
header('Content-Type: application/pdf');
header('Content-Disposition: inline; filename="Rechnung_Bestellung_' . $order['id'] . '.pdf"');

// 8. Puffer leeren und PDF ausgeben
ob_end_clean();
$pdf->Output();
exit;
