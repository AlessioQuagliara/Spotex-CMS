"use client";

import { LocalizationProvider } from "@/contexts/localization-context";
import { FAQSection } from "@/components/faq/faq-section";
import { LocaleSwitcher } from "@/components/localization/locale-switcher";

const sampleFaqs = [
  {
    id: 1,
    question: "Come posso tracciare il mio ordine?",
    answer: "Puoi tracciare il tuo ordine accedendo al tuo account e visitando la sezione 'I miei ordini'. Troverai un link di tracking per ogni spedizione. Riceverai anche email di aggiornamento con il numero di tracking.",
    category: "Spedizioni",
  },
  {
    id: 2,
    question: "Quali sono i tempi di consegna?",
    answer: "I tempi di consegna standard sono di 3-5 giorni lavorativi per l'Italia. Per le spedizioni internazionali, i tempi variano da 7 a 15 giorni lavorativi a seconda della destinazione.",
    category: "Spedizioni",
  },
  {
    id: 3,
    question: "Posso restituire un prodotto?",
    answer: "Sì, accettiamo resi entro 30 giorni dall'acquisto. Il prodotto deve essere nelle condizioni originali con etichette e imballaggio intatti. Le spese di reso sono a carico del cliente.",
    category: "Resi e Rimborsi",
  },
  {
    id: 4,
    question: "Come funziona il rimborso?",
    answer: "Una volta ricevuto e ispezionato il reso, elaboreremo il rimborso entro 5-7 giorni lavorativi. Il rimborso verrà accreditato sul metodo di pagamento originale.",
    category: "Resi e Rimborsi",
  },
  {
    id: 5,
    question: "Quali metodi di pagamento accettate?",
    answer: "Accettiamo carte di credito/debito (Visa, Mastercard, American Express), PayPal, bonifico bancario e contrassegno (per ordini entro €100).",
    category: "Pagamenti",
  },
  {
    id: 6,
    question: "I miei dati di pagamento sono sicuri?",
    answer: "Sì, utilizziamo la crittografia SSL per proteggere tutti i dati sensibili. Non memorizziamo i dati completi della carta di credito sui nostri server. Tutti i pagamenti sono elaborati tramite gateway sicuri certificati PCI-DSS.",
    category: "Pagamenti",
  },
  {
    id: 7,
    question: "Come posso modificare il mio ordine?",
    answer: "Se l'ordine non è ancora stato spedito, puoi modificarlo contattando il nostro servizio clienti entro 24 ore dall'acquisto. Una volta spedito, non sarà più possibile modificare l'ordine.",
    category: "Ordini",
  },
  {
    id: 8,
    question: "Posso annullare il mio ordine?",
    answer: "Sì, puoi annullare l'ordine gratuitamente entro 24 ore dall'acquisto, prima che venga spedito. Dopo la spedizione, dovrai seguire la procedura di reso standard.",
    category: "Ordini",
  },
  {
    id: 9,
    question: "Offrite la garanzia sui prodotti?",
    answer: "Tutti i nostri prodotti sono coperti dalla garanzia legale di 2 anni per difetti di conformità. Alcuni prodotti includono anche garanzie aggiuntive del produttore.",
    category: "Prodotti",
  },
  {
    id: 10,
    question: "Come posso contattare il servizio clienti?",
    answer: "Puoi contattarci via email a support@store.com, tramite chat live sul sito (Lun-Ven 9-18), o telefonicamente al numero +39 02 1234567.",
    category: "Supporto",
  },
];

export default function FAQPage() {
  return (
    <LocalizationProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b p-4">
          <div className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Store</h1>
            <LocaleSwitcher />
          </div>
        </header>
        <main className="container mx-auto p-8">
          <FAQSection faqs={sampleFaqs} />
        </main>
      </div>
    </LocalizationProvider>
  );
}
