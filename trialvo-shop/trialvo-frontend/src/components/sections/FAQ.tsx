import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: { bn: string; en: string };
  answer: { bn: string; en: string };
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  className?: string;
}

const FAQ: React.FC<FAQProps> = ({ items, title, className = '' }) => {
  const { language, t } = useLanguage();

  if (items.length === 0) return null;

  // Generate FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question[language],
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer[language],
      },
    })),
  };

  return (
    <section className={className} itemScope itemType="https://schema.org/FAQPage">
      {title && (
        <h2 className="text-2xl font-semibold mb-6">{title || t('product.faq')}</h2>
      )}
      
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border-b border-border"
            itemScope
            itemProp="mainEntity"
            itemType="https://schema.org/Question"
          >
            <AccordionTrigger className="text-left hover:no-underline py-4">
              <span itemProp="name">{item.question[language]}</span>
            </AccordionTrigger>
            <AccordionContent
              className="text-muted-foreground pb-4"
              itemScope
              itemProp="acceptedAnswer"
              itemType="https://schema.org/Answer"
            >
              <span itemProp="text">{item.answer[language]}</span>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
    </section>
  );
};

export default FAQ;
