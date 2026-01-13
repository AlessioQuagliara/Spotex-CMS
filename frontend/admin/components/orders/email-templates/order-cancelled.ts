/**
 * Order Cancelled Email Template
 * Template email cancellazione ordine
 */

interface OrderCancelledProps {
  orderNumber: string
  customerName: string
  cancellationReason: string
  refundIssued: boolean
  refundAmount?: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
}

export function generateOrderCancelledEmail(props: OrderCancelledProps): string {
  const {
    orderNumber,
    customerName,
    cancellationReason,
    refundIssued,
    refundAmount,
    items,
  } = props

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled - ${orderNumber}</title>
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
      background: #f3f4f6;
      color: #374151;
      padding: 40px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      border-bottom: 3px solid #ef4444;
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
    .alert-box {
      background: #fee2e2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .refund-box {
      background: #d1fae5;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .item {
      padding: 10px 0;
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
    <div style="font-size: 60px; margin-bottom: 10px;">❌</div>
    <h1 style="margin: 0 0 10px 0;">Ordine Cancellato</h1>
    <p style="margin: 0; opacity: 0.7;">Ordine ${orderNumber}</p>
  </div>
  
  <div class="content">
    <div class="card">
      <p>Ciao <strong>${customerName}</strong>,</p>
      <p>
        Il tuo ordine <strong>${orderNumber}</strong> è stato cancellato.
      </p>
      
      <div class="alert-box">
        <strong style="font-size: 18px;">Motivo della Cancellazione</strong>
        <p style="margin: 10px 0 0 0; font-size: 16px;">
          ${cancellationReason}
        </p>
      </div>

      ${
        refundIssued && refundAmount
          ? `
      <div class="refund-box">
        <strong style="font-size: 18px; color: #059669;">✓ Rimborso Emesso</strong>
        <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: 700; color: #059669;">
          €${refundAmount.toFixed(2)}
        </p>
        <p style="margin: 10px 0 0 0; color: #065f46;">
          Il rimborso sarà accreditato sul tuo metodo di pagamento originale entro 5-10 giorni lavorativi.
        </p>
      </div>
      `
          : '<p style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">Nessun addebito è stato effettuato per questo ordine.</p>'
      }
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Articoli Cancellati</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 6px;">
        ${items
          .map(
            (item) => `
          <div class="item">
            <div style="display: flex; justify-between;">
              <div>
                <strong>${item.name}</strong>
                <div style="font-size: 14px; color: #6b7280;">Qtà: ${item.quantity}</div>
              </div>
              <div style="font-weight: 600;">
                €${item.price.toFixed(2)}
              </div>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Cosa succede ora?</h3>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">
          L'ordine è stato completamente cancellato dal nostro sistema
        </li>
        ${
          refundIssued
            ? '<li style="margin-bottom: 10px;">Il rimborso è stato processato e apparirà sul tuo conto a breve</li>'
            : '<li style="margin-bottom: 10px;">Non è stato effettuato alcun addebito</li>'
        }
        <li style="margin-bottom: 10px;">
          Tutti gli articoli sono stati restockati nel nostro inventario
        </li>
      </ul>
    </div>

    <div class="card" style="background: #dbeafe; border: 1px solid #3b82f6;">
      <p style="margin: 0;"><strong>💙 Ci Dispiace</strong></p>
      <p style="margin: 10px 0 0 0;">
        Ci dispiace per l'inconveniente. Se hai domande o vuoi effettuare un nuovo ordine,
        siamo qui per aiutarti.
      </p>
      <p style="margin: 15px 0 0 0;">
        <a href="https://yourstore.com" style="color: #3b82f6; text-decoration: none; font-weight: 600;">
          Continua lo Shopping →
        </a>
      </p>
    </div>
  </div>

  <div class="footer">
    <p>Hai domande? <a href="mailto:support@example.com">Contattaci</a></p>
    <p style="margin-top: 20px;">
      © 2026 Your Company Name. Tutti i diritti riservati.
    </p>
  </div>
</body>
</html>
  `.trim()
}

export const orderCancelledSubject = (orderNumber: string) =>
  `❌ Ordine Cancellato - ${orderNumber}`
