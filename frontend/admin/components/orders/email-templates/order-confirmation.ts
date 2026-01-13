/**
 * Order Confirmation Email Template
 * Template email conferma ordine
 */

interface OrderConfirmationProps {
  orderNumber: string
  orderDate: Date
  customerName: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
    image?: string
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
  totals: {
    subtotal: number
    shipping: number
    tax: number
    total: number
  }
  trackingUrl?: string
}

export function generateOrderConfirmationEmail(props: OrderConfirmationProps): string {
  const {
    orderNumber,
    orderDate,
    customerName,
    items,
    shippingAddress,
    totals,
    trackingUrl,
  } = props

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${orderNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9fafb;
      padding: 30px 20px;
    }
    .card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .item {
      display: flex;
      gap: 15px;
      padding: 15px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .item:last-child {
      border-bottom: none;
    }
    .item-image {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
      background: #f3f4f6;
    }
    .item-details {
      flex: 1;
    }
    .item-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    .item-price {
      color: #6b7280;
      font-size: 14px;
    }
    .totals {
      border-top: 2px solid #e5e7eb;
      padding-top: 15px;
      margin-top: 15px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .total-row.grand {
      font-size: 18px;
      font-weight: 700;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      padding: 20px;
    }
    .address {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 6px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0 0 10px 0;">✓ Ordine Confermato!</h1>
    <p style="margin: 0; opacity: 0.9;">Grazie per il tuo acquisto</p>
  </div>
  
  <div class="content">
    <div class="card">
      <p>Ciao <strong>${customerName}</strong>,</p>
      <p>Abbiamo ricevuto il tuo ordine e lo stiamo preparando per la spedizione.</p>
      
      <div style="background: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <strong>Numero Ordine:</strong> ${orderNumber}<br>
        <strong>Data:</strong> ${orderDate.toLocaleDateString('it-IT', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </div>
      
      ${
        trackingUrl
          ? `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${trackingUrl}" class="button">Traccia il tuo ordine</a>
      </div>
      `
          : ''
      }
    </div>

    <div class="card">
      <h2 style="margin-top: 0;">Articoli Ordinati</h2>
      ${items
        .map(
          (item) => `
        <div class="item">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" class="item-image">`
              : '<div class="item-image"></div>'
          }
          <div class="item-details">
            <div class="item-name">${item.name}</div>
            <div class="item-price">
              Quantità: ${item.quantity} × €${item.price.toFixed(2)}
            </div>
          </div>
          <div style="font-weight: 600;">
            €${item.total.toFixed(2)}
          </div>
        </div>
      `
        )
        .join('')}
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotale</span>
          <span>€${totals.subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>Spedizione</span>
          <span>€${totals.shipping.toFixed(2)}</span>
        </div>
        <div class="total-row">
          <span>IVA (22%)</span>
          <span>€${totals.tax.toFixed(2)}</span>
        </div>
        <div class="total-row grand">
          <span>Totale</span>
          <span>€${totals.total.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Indirizzo di Spedizione</h3>
      <div class="address">
        <strong>${shippingAddress.name}</strong><br>
        ${shippingAddress.address}<br>
        ${shippingAddress.postalCode} ${shippingAddress.city}<br>
        ${shippingAddress.country}
      </div>
    </div>

    <div class="card" style="background: #fef3c7; border: 1px solid #f59e0b;">
      <p style="margin: 0;"><strong>📦 Cosa succede ora?</strong></p>
      <p style="margin: 10px 0 0 0;">
        Stiamo preparando il tuo ordine. Riceverai un'email con i dettagli di spedizione
        non appena il pacco sarà in viaggio.
      </p>
    </div>
  </div>

  <div class="footer">
    <p>Hai domande? Contattaci a <a href="mailto:support@example.com">support@example.com</a></p>
    <p style="margin-top: 20px;">
      © 2026 Your Company Name. Tutti i diritti riservati.
    </p>
  </div>
</body>
</html>
  `.trim()
}

export const orderConfirmationSubject = (orderNumber: string) =>
  `✓ Ordine Confermato - ${orderNumber}`
