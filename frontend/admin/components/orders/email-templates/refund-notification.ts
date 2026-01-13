/**
 * Refund Notification Email Template
 * Template email notifica rimborso
 */

interface RefundNotificationProps {
  orderNumber: string
  customerName: string
  refundAmount: number
  refundReason: string
  items: Array<{
    name: string
    quantity: number
    amount: number
  }>
  paymentMethod: string
  estimatedProcessingDays: number
}

export function generateRefundNotificationEmail(props: RefundNotificationProps): string {
  const {
    orderNumber,
    customerName,
    refundAmount,
    refundReason,
    items,
    paymentMethod,
    estimatedProcessingDays,
  } = props

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Processed - ${orderNumber}</title>
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
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 40px 20px;
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
    .refund-amount {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 25px;
      text-align: center;
      margin: 20px 0;
    }
    .amount {
      font-size: 36px;
      font-weight: 700;
      color: #059669;
      margin: 10px 0;
    }
    .item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .item:last-child {
      border-bottom: none;
    }
    .info-box {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      border-radius: 4px;
      margin: 15px 0;
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
    <div style="font-size: 60px; margin-bottom: 10px;">💰</div>
    <h1 style="margin: 0 0 10px 0;">Rimborso Elaborato</h1>
    <p style="margin: 0; opacity: 0.9;">Il tuo rimborso è stato processato</p>
  </div>
  
  <div class="content">
    <div class="card">
      <p>Ciao <strong>${customerName}</strong>,</p>
      <p>
        Abbiamo elaborato il rimborso per il tuo ordine <strong>${orderNumber}</strong>.
      </p>
      
      <div class="refund-amount">
        <p style="margin: 0 0 10px 0; color: #059669; font-weight: 600;">
          Importo Rimborsato
        </p>
        <div class="amount">€${refundAmount.toFixed(2)}</div>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
          Metodo di pagamento: <strong>${paymentMethod}</strong>
        </p>
      </div>

      <div class="info-box">
        <strong>⏱️ Tempi di Accredito</strong><br>
        <p style="margin: 10px 0 0 0;">
          Il rimborso apparirà sul tuo conto entro <strong>${estimatedProcessingDays} giorni lavorativi</strong>,
          a seconda della tua banca o del circuito della carta.
        </p>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">📋 Dettagli Rimborso</h3>
      
      <div style="margin: 15px 0;">
        <strong>Motivo del rimborso:</strong>
        <p style="margin: 5px 0 0 0; color: #6b7280;">${refundReason}</p>
      </div>

      <div style="margin: 20px 0;">
        <strong>Articoli rimborsati:</strong>
        <div style="background: #f9fafb; padding: 15px; border-radius: 6px; margin-top: 10px;">
          ${items
            .map(
              (item) => `
            <div class="item">
              <div>
                <strong>${item.name}</strong>
                <div style="font-size: 14px; color: #6b7280;">Qtà: ${item.quantity}</div>
              </div>
              <div style="font-weight: 600;">
                €${item.amount.toFixed(2)}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    </div>

    <div class="card" style="background: #fef3c7; border: 1px solid #f59e0b;">
      <p style="margin: 0;"><strong>📝 Nota Importante</strong></p>
      <p style="margin: 10px 0 0 0;">
        Se non vedi l'accredito entro ${estimatedProcessingDays} giorni lavorativi,
        controlla con la tua banca o contattaci per assistenza.
      </p>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">Cosa succede ora?</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 10px;">
          <strong>Elaborazione Rimborso:</strong> Completata ✓
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Trasferimento Fondi:</strong> In corso (${estimatedProcessingDays} giorni)
        </li>
        <li style="margin-bottom: 10px;">
          <strong>Accredito sul Conto:</strong> Verifica con la tua banca
        </li>
      </ol>
    </div>

    <div class="card" style="text-align: center;">
      <p>Ci dispiace che tu abbia dovuto richiedere un rimborso.</p>
      <p>Se c'è qualcosa che possiamo fare per migliorare la tua esperienza, faccelo sapere!</p>
      <a href="mailto:support@example.com" style="color: #6366f1; text-decoration: none; font-weight: 600;">
        Contatta il Supporto
      </a>
    </div>
  </div>

  <div class="footer">
    <p>Hai domande sul rimborso? <a href="mailto:support@example.com">Contattaci</a></p>
    <p style="margin-top: 20px;">
      © 2026 Your Company Name. Tutti i diritti riservati.
    </p>
  </div>
</body>
</html>
  `.trim()
}

export const refundNotificationSubject = (orderNumber: string, amount: number) =>
  `💰 Rimborso Elaborato €${amount.toFixed(2)} - ${orderNumber}`
