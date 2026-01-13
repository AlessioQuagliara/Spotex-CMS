/**
 * Shipping Notification Email Template
 * Template email notifica spedizione
 */

interface ShippingNotificationProps {
  orderNumber: string
  customerName: string
  carrier: string
  trackingNumber: string
  trackingUrl: string
  estimatedDelivery: Date
  items: Array<{
    name: string
    quantity: number
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
  }
}

export function generateShippingNotificationEmail(
  props: ShippingNotificationProps
): string {
  const {
    orderNumber,
    customerName,
    carrier,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    items,
    shippingAddress,
  } = props

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped - ${orderNumber}</title>
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
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .truck-icon {
      font-size: 60px;
      margin-bottom: 10px;
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
    .tracking-box {
      background: #eff6ff;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
    }
    .tracking-number {
      font-size: 24px;
      font-weight: 700;
      color: #1e40af;
      letter-spacing: 2px;
      margin: 10px 0;
      font-family: monospace;
    }
    .button {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 15px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 15px 0;
      font-size: 16px;
    }
    .timeline {
      position: relative;
      padding-left: 40px;
      margin: 20px 0;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 30px;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -32px;
      top: 8px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #d1d5db;
      border: 3px solid white;
      box-shadow: 0 0 0 2px #d1d5db;
    }
    .timeline-item.active::before {
      background: #10b981;
      box-shadow: 0 0 0 2px #10b981;
    }
    .timeline-item::after {
      content: '';
      position: absolute;
      left: -24px;
      top: 24px;
      width: 2px;
      height: calc(100% - 8px);
      background: #e5e7eb;
    }
    .timeline-item:last-child::after {
      display: none;
    }
    .item-list {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
    }
    .item {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .item:last-child {
      border-bottom: none;
    }
    .footer {
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="truck-icon">🚚</div>
    <h1 style="margin: 0 0 10px 0;">Il tuo ordine è in viaggio!</h1>
    <p style="margin: 0; opacity: 0.9;">Presto sarà da te</p>
  </div>
  
  <div class="content">
    <div class="card">
      <p>Ciao <strong>${customerName}</strong>,</p>
      <p>
        Ottima notizia! Il tuo ordine <strong>${orderNumber}</strong> è stato spedito
        e sta arrivando da te.
      </p>
      
      <div class="tracking-box">
        <p style="margin: 0 0 10px 0; color: #1e40af; font-weight: 600;">
          📦 Numero di Tracciamento
        </p>
        <div class="tracking-number">${trackingNumber}</div>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
          Corriere: <strong>${carrier}</strong>
        </p>
        <a href="${trackingUrl}" class="button">Traccia la Spedizione</a>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
        <strong>🕒 Consegna Prevista</strong><br>
        <span style="font-size: 18px; font-weight: 600;">
          ${estimatedDelivery.toLocaleDateString('it-IT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">📍 Indirizzo di Consegna</h3>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 6px;">
        <strong>${shippingAddress.name}</strong><br>
        ${shippingAddress.address}<br>
        ${shippingAddress.postalCode} ${shippingAddress.city}<br>
        ${shippingAddress.country}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">📦 Articoli Spediti</h3>
      <div class="item-list">
        ${items
          .map(
            (item) => `
          <div class="item">
            <strong>${item.name}</strong>
            <span style="float: right; color: #6b7280;">Qtà: ${item.quantity}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">🔔 Stato Spedizione</h3>
      <div class="timeline">
        <div class="timeline-item active">
          <strong>Ordine Ricevuto</strong>
          <div style="font-size: 14px; color: #6b7280;">Il tuo ordine è stato confermato</div>
        </div>
        <div class="timeline-item active">
          <strong>In Preparazione</strong>
          <div style="font-size: 14px; color: #6b7280;">Ordine preparato per la spedizione</div>
        </div>
        <div class="timeline-item active">
          <strong>Spedito</strong>
          <div style="font-size: 14px; color: #6b7280;">Il pacco è stato consegnato al corriere</div>
        </div>
        <div class="timeline-item">
          <strong>In Transito</strong>
          <div style="font-size: 14px; color: #6b7280;">Il pacco è in viaggio verso di te</div>
        </div>
        <div class="timeline-item">
          <strong>Consegnato</strong>
          <div style="font-size: 14px; color: #6b7280;">Il pacco è stato consegnato</div>
        </div>
      </div>
    </div>

    <div class="card" style="background: #dbeafe; border: 1px solid #3b82f6;">
      <p style="margin: 0;"><strong>💡 Consiglio</strong></p>
      <p style="margin: 10px 0 0 0;">
        Usa il link di tracciamento per seguire in tempo reale il percorso del tuo pacco.
        Riceverai una notifica quando sarà in consegna nella tua zona.
      </p>
    </div>
  </div>

  <div class="footer">
    <p>Hai domande sulla spedizione? <a href="mailto:support@example.com">Contattaci</a></p>
    <p style="margin-top: 20px;">
      © 2026 Your Company Name. Tutti i diritti riservati.
    </p>
  </div>
</body>
</html>
  `.trim()
}

export const shippingNotificationSubject = (orderNumber: string) =>
  `🚚 Il tuo ordine è stato spedito - ${orderNumber}`
