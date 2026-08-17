import type { Metadata } from 'next';
import Layout from '@/components/layout/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description: 'Find answers to common questions about Techshop — delivery times, payment methods, return policy, warranty, and more.',
  openGraph: {
    title: 'FAQ — Techshop',
    description: 'Answers to common questions about delivery, returns, payments, and warranty.',
  },
};

const faqs = [
  { q: 'How long does delivery take?', a: 'Inside Dhaka: 1-2 business days. Outside Dhaka: 3-5 business days. Remote areas may take 5-7 business days.' },
  { q: 'Do you support Cash on Delivery?', a: 'Yes! Cash on Delivery (COD) is available across Bangladesh. You can pay when you receive your product.' },
  { q: 'Are all products original?', a: 'Yes, we sell 100% authentic products sourced from authorized distributors. All products come with official brand warranty.' },
  { q: 'What is your return policy?', a: 'We offer a 7-day return policy for manufacturing defects. Products must be in original packaging and unused condition.' },
  { q: 'Do you offer warranty?', a: 'Yes, all products come with manufacturer warranty. Warranty period varies by product and brand (typically 6 months to 2 years).' },
  { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery, bKash, Nagad, and online card payments (Visa/Mastercard).' },
  { q: 'Can I exchange a product?', a: 'Yes, exchanges are possible within 7 days for the same product in a different color or variant, subject to availability.' },
  { q: 'How can I track my order?', a: 'Use our Order Tracking page with your Order ID to check real-time delivery status.' },
];

export default function FAQPage() {
  return (
    <Layout>
      <div className="container py-12 max-w-3xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-center">Frequently Asked Questions</h1>
        <p className="text-muted-foreground text-center mt-2">Find answers to common questions about our service</p>
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
}
