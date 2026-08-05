import type { ContactPageSettings } from "./types";

export const INITIAL_CONTACT_SETTINGS: ContactPageSettings = {
  contactInfo: {
    heading: "Get in Touch",
    subHeading:
      "We'd love to hear from you! Whether you have questions about our products, need help with an order, or just want to say hello.",

    addressTitle: "Shop & Display Center Address",
    addressText: "House 29, Road 05, Sector 11, Uttara, Dhaka 1230",
    addressNote: "(10am-10pm, Open Everyday)",

    callTitle: "Call Us",
    phones: ["+8801970680283"],
    callNote: "(10am-10pm, Open Everyday)",

    mailTitle: "Mail Us",
    emails: ["graduatefashion2020@gmail.com"],

    businessTitle: "Business Hours",
    businessRows: [
      {
        id: "bh-1",
        label: "Online Operations",
        time: "10:00 AM - 11:00 PM",
        enabled: true,
      },
      {
        id: "bh-2",
        label: "Everyday (7 Days a Week)",
        time: "",
        enabled: true,
      },
      {
        id: "bh-3",
        label: "24/7 Online Shopping Available",
        time: "",
        enabled: true,
      },
    ],
    businessFooterNote: "",

    mapTitle: "Find Us",
    mapSubTitle: "Visit our shop & display center at Uttara, Dhaka",
    mapEmbedUrl:
      "https://www.google.com/maps?q=Uttara%20Dhaka&output=embed",
  },

  contactForm: {
    title: "Send us a Message",
    description: "",
    fields: {
      firstName: {
        enabled: true,
        required: true,
        label: "First Name",
        placeholder: "Enter your full name",
      },
      lastName: {
        enabled: true,
        required: false,
        label: "Last Name",
        placeholder: "Enter your full name",
      },
      mobile: {
        enabled: true,
        required: false,
        label: "Mobile Number",
        placeholder: "01XXXXXXXXX",
      },
      email: {
        enabled: true,
        required: true,
        label: "Email",
        placeholder: "Enter Email",
      },
      subject: {
        enabled: true,
        required: true,
        label: "Subject",
        placeholder: "Write message subject",
      },
      message: {
        enabled: true,
        required: true,
        label: "Message",
        placeholder: "Tell us how we can help you...",
      },
    },
    recipientEmails: ["support@yourshop.com"],
    successMessage:
      "Thanks! Your message has been received. We will contact you shortly.",
  },

  socialLinks: [
    {
      key: "facebook",
      label: "Facebook",
      url: "https://facebook.com/",
      enabled: true,
    },
    {
      key: "instagram",
      label: "Instagram",
      url: "https://instagram.com/",
      enabled: true,
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: "https://wa.me/8801970680283",
      enabled: true,
    },
    {
      key: "tiktok",
      label: "Tiktok",
      url: "https://www.tiktok.com/",
      enabled: true,
    },
    {
      key: "youtube",
      label: "YouTube",
      url: "https://youtube.com/",
      enabled: false,
    },
    {
      key: "x",
      label: "X (Twitter)",
      url: "https://x.com/",
      enabled: false,
    },
  ],
};
