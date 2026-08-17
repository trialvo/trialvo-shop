import type { Metadata } from "next";
import Layout from "@/components/layout/Layout";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import ContactForm from "@/components/contact/ContactForm";
import { ContactInfoAside } from "@/components/contact/ContactInfoCard";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Techshop — call, email, or WhatsApp us. We're here to help with orders, returns, and product inquiries. Located in Banani, Dhaka.",
  openGraph: {
    title: "Contact Techshop",
    description:
      "Reach us anytime — phone, email, WhatsApp, or visit us in Banani, Dhaka.",
  },
};

export default function ContactPage() {
  return (
    <Layout>
      <div className="container py-4 md:py-6 pb-10 md:pb-12">
        <Breadcrumbs items={[{ label: "Contact" }]} className="mb-3" />

        <header>
          <h1 className="font-heading text-xl font-bold md:text-2xl">
            Contact Us
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            We&apos;d love to hear from you. Send a message or reach us below —
            we typically reply within one business day.
          </p>
        </header>

        <div className="mt-5 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-3 md:gap-6 lg:gap-8">
          <section className="rounded-sm border border-border bg-card p-4 shadow-product sm:p-5 md:col-span-2 md:p-6">
            <h2 className="font-heading mb-0.5 text-base font-semibold md:text-lg">
              Send us a Message
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Fields marked with * are required. Your details stay private and
              are only used to respond to this inquiry.
            </p>
            <ContactForm />
          </section>

          <ContactInfoAside />
        </div>
      </div>
    </Layout>
  );
}
