"use client";

import { useState } from "react";
import { useLocalization } from "@/contexts/localization-context";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
}

export function FAQSection({ faqs }: FAQSectionProps) {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState("");

  // Group FAQs by category
  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));
  
  // Filter FAQs by search query
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const faqsByCategory = categories.reduce((acc, category) => {
    acc[category] = filteredFaqs.filter((faq) => faq.category === category);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("faq.title")}</h1>
        <p className="text-muted-foreground text-lg">
          Trova risposte alle domande più comuni
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.search") + " nelle FAQ..."}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Categories */}
      {categories.map((category) => {
        const categoryFaqs = faqsByCategory[category];
        if (categoryFaqs.length === 0) return null;

        return (
          <Card key={category}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-base px-3 py-1">
                  {category}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {categoryFaqs.length} domande
                </span>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {categoryFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                    <AccordionTrigger className="text-left font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}

      {filteredFaqs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p>Nessuna domanda trovata per "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}

      {/* Contact Support */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">
            Non hai trovato quello che cercavi?
          </h3>
          <p className="text-muted-foreground mb-4">
            Il nostro team di supporto è qui per aiutarti
          </p>
          <button
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            onClick={() => (window.location.href = "/contact")}
          >
            Contatta il Supporto
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
