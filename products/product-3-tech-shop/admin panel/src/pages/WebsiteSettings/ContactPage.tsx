import PageMeta from "@/components/common/PageMeta";
import ContactMessagesPage from "@/components/website-settings/contact-messages/ContactMessagesPage";

export default function ContactPage() {
  return (
    <>
      <PageMeta
        title="Contact Page"
        description="Admin - Contact page settings"
      />
      <ContactMessagesPage  />
    </>
  );
}
