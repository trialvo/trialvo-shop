import type { MarketplaceLanguage } from "@/types/marketplace";
import type { FulfillmentStage, HostKind } from "./types";

/**
 * Every customer-facing string for the trial flows, in one place.
 *
 * Components never inline BN/EN pairs — they call `trialCopy(language)` and
 * read a key. That keeps wording consistent between the product page, the
 * home page, the wizard and the status hub, and makes copy review a one-file job.
 */

type Copy = {
  demo: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    ctaShort: string;
    noWait: string;
    fieldsHint: string;
    submit: string;
    submitting: string;
    provisioningTitle: string;
    provisioningSteps: [string, string, string];
    readyTitle: string;
    readyLead: string;
    existingTitle: string;
    existingLead: string;
    delayedTitle: string;
    delayedLead: string;
    awaitingTitle: string;
    awaitingLead: string;
    awaitingHint: string;
    awaitingAt: (email: string) => string;
    shop: string;
    shopBody: string;
    admin: string;
    adminBody: string;
    open: string;
    loginEmail: string;
    password: string;
    show: string;
    hide: string;
    copy: string;
    copied: string;
    emailedNote: string;
    sharedNote: string;
    accessDays: (days: string) => string;
    nextTitle: string;
    nextLead: (max: string) => string;
    nextCta: string;
    openAccessPage: string;
    browseShopNoLogin: string;
    paused: string;
  };
  domain: {
    eyebrow: string;
    title: string;
    lead: string;
    cta: string;
    ctaShort: string;
    bullets: [string, string, string];
    weSetUp: string;
    freeFor: (range: string) => string;
    stepHosting: string;
    stepDuration: string;
    stepContact: string;
    stepVerify: string;
    hostingQuestion: string;
    hostKindLabel: string;
    hostKindVps: string;
    hostKindVpsBody: string;
    hostKindCpanel: string;
    hostKindCpanelBody: string;
    readyCheckbox: string;
    readyHint: string;
    durationQuestion: string;
    endsOn: (date: string) => string;
    domainLabel: string;
    domainPlaceholder: string;
    contactTitle: string;
    summary: string;
    notesLabel: string;
    notesPlaceholder: string;
    back: string;
    next: string;
    submit: string;
    submitting: string;
    submittedTitle: string;
    submittedLead: string;
    slaLine: (hours: string) => string;
    existingTitle: string;
    existingLead: string;
    viewStatus: string;
    prefilledFrom: string;
    paused: string;
  };
  verify: {
    title: string;
    lead: (email: string) => string;
    codeLabel: string;
    submit: string;
    submitting: string;
    resend: string;
    resendIn: (seconds: string) => string;
    sent: string;
    attemptsLeft: (n: string) => string;
    wrongEmail: string;
  };
  picker: {
    title: string;
    lead: string;
    demoBadge: string;
    domainBadge: string;
    empty: string;
    search: string;
  };
  stages: Record<FulfillmentStage, { label: string; body: string }>;
  hostKind: Record<HostKind, string>;
  common: {
    name: string;
    email: string;
    phone: string;
    company: string;
    optional: string;
    close: string;
    retry: string;
    errorTitle: string;
    errorGeneric: string;
    honeypotLabel: string;
  };
  errors: Record<string, string>;
};

const BN: Copy = {
  demo: {
    eyebrow: "ইনস্ট্যান্ট লাইভ ডেমো",
    title: "এক মিনিটে আসল শপ ও অ্যাডমিন চালু",
    lead: "স্ক্রিনশট নয়। নাম আর ইমেইল দিন — সাথে সাথে স্টোরফ্রন্ট, অ্যাডমিন প্যানেল ও লগইন পাবেন। কোনো অ্যাপ্রুভাল নেই।",
    cta: "ইনস্ট্যান্ট ডেমো নিন",
    ctaShort: "ডেমো",
    noWait: "অপেক্ষা নেই",
    fieldsHint: "৩টি ফিল্ড। কার্ড লাগবে না।",
    submit: "ডেমো চালু করুন",
    submitting: "চালু হচ্ছে…",
    provisioningTitle: "আপনার ডেমো তৈরি হচ্ছে",
    provisioningSteps: ["অ্যাকাউন্ট তৈরি", "অ্যাডমিন অ্যাকসেস", "রেডি"],
    readyTitle: "ডেমো রেডি",
    readyLead: "নিচের লগইন দিয়ে এখনই ঢুকুন। সব তথ্য ইমেইলেও পাঠানো হয়েছে।",
    existingTitle: "আপনার ডেমো আগে থেকেই আছে",
    existingLead: "এই ইমেইলে এই প্রোডাক্টের ডেমো চালু। আগের লগইন নিচে।",
    delayedTitle: "একটু সময় লাগছে",
    delayedLead: "ডেমো তৈরি হচ্ছে। অ্যাকসেস পেজ নিজে থেকেই আপডেট হবে — ইমেইলেও পাবেন।",
    awaitingTitle: "অ্যাডমিন অ্যাপ্রুভালের অপেক্ষায়",
    awaitingLead: "রিকোয়েস্ট পৌঁছেছে। অ্যাডমিন অনুমোদন করলে লগইন ইমেইলে পাঠানো হবে।",
    awaitingHint: "এই পেজ খোলা রাখুন — অনুমোদনের পর এখানেও লগইন দেখাবে।",
    awaitingAt: (email) => `লগইন পাবেন ${email}`,
    shop: "স্টোরফ্রন্ট",
    shopBody: "গ্রাহক যা দেখে",
    admin: "অ্যাডমিন প্যানেল",
    adminBody: "প্রোডাক্ট, অর্ডার, রিপোর্ট",
    open: "খুলুন",
    loginEmail: "লগইন ইমেইল",
    password: "পাসওয়ার্ড",
    show: "দেখুন",
    hide: "লুকান",
    copy: "কপি",
    copied: "কপি হয়েছে",
    emailedNote: "এই তথ্য ইমেইলেও পাঠানো হয়েছে",
    sharedNote: "শেয়ার্ড ডেমো — অন্য ব্যবহারকারীও আপনার দেওয়া ডেটা দেখতে পারে; ডেটা নিয়মিত রিসেট হয়। আসল গ্রাহকের তথ্য দেবেন না।",
    accessDays: (days) => `${days} দিন অ্যাকসেস`,
    nextTitle: "ভালো লাগলে?",
    nextLead: (max) => `আপনার নিজের ডোমেইন ও হোস্টিংয়ে ${max} ফ্রি চালান। অনুমোদনের পর এক-কমান্ড ইনস্টলার পাবেন।`,
    nextCta: "নিজের ডোমেইনে ট্রায়াল নিন",
    openAccessPage: "অ্যাকসেস পেজ খুলুন",
    browseShopNoLogin: "লগইন ছাড়া স্টোরফ্রন্ট ঘুরে দেখুন",
    paused: "ইনস্ট্যান্ট ডেমো সাময়িকভাবে বন্ধ। পরে আবার চেষ্টা করুন।",
  },
  domain: {
    eyebrow: "নিজের ডোমেইনে ফ্রি ট্রায়াল",
    title: "আপনার ডোমেইন ও হোস্টিংয়ে চালিয়ে দেখুন",
    lead: "ডেমো পছন্দ হলে অনুরোধ করুন। অ্যাডমিন অনুমোদনের পর আপনার VPS বা cPanel-এ চালানোর জন্য এক-কমান্ড ইনস্টলার পাবেন — আমরা আপনার সার্ভারে লগইন করি না।",
    cta: "নিজের ডোমেইনে ট্রায়াল নিন",
    ctaShort: "ডোমেইন ট্রায়াল",
    bullets: ["আপনার ডোমেইন", "VPS বা cPanel", "এক-কমান্ড ইনস্টলার"],
    weSetUp: "ইনস্টলার আপনি চালাবেন",
    freeFor: (range) => `${range} ফ্রি`,
    stepHosting: "হোস্টিং",
    stepDuration: "মেয়াদ",
    stepContact: "যোগাযোগ",
    stepVerify: "যাচাই",
    hostingQuestion: "আপনার সার্ভার কোন ধরনের?",
    hostKindLabel: "কোন ধরনের হোস্টিং?",
    hostKindVps: "VPS",
    hostKindVpsBody: "Ubuntu/Debian সার্ভার, root/SSH অ্যাকসেস",
    hostKindCpanel: "cPanel",
    hostKindCpanelBody: "শেয়ার্ড হোস্টিং, cPanel লগইন",
    readyCheckbox: "ডোমেইন ও হোস্টিং রেডি আছে, ইনস্টলার চালাতে পারব",
    readyHint: "এটা না টিক দিলে সামনে যাওয়া যাবে না — নিজের সার্ভার ছাড়া ইনস্টলার চালানো যাবে না।",
    durationQuestion: "কত মাস ফ্রি চালাবেন?",
    endsOn: (date) => `শেষ হবে ${date}`,
    domainLabel: "ডোমেইন",
    domainPlaceholder: "myshop.com",
    contactTitle: "কোথায় জানাব?",
    summary: "সারসংক্ষেপ",
    notesLabel: "নোট (ঐচ্ছিক)",
    notesPlaceholder: "সার্ভারের বিশেষ কিছু, পছন্দের সময় ইত্যাদি",
    back: "পেছনে",
    next: "পরের ধাপ",
    submit: "ট্রায়াল রিকোয়েস্ট পাঠান",
    submitting: "পাঠানো হচ্ছে…",
    submittedTitle: "রিকোয়েস্ট পৌঁছেছে",
    submittedLead: "অ্যাডমিন অনুমোদন করলে ইনস্টলার ZIP ইমেইলে যাবে। নিজের VPS বা cPanel-এ এক কমান্ডে চালালেই ট্রায়াল লাইভ।",
    slaLine: (hours) => `সাধারণত ${hours} ঘণ্টার মধ্যে`,
    existingTitle: "রিকোয়েস্ট আগে থেকেই আছে",
    existingLead: "এই ইমেইলে এই প্রোডাক্টের ডোমেইন ট্রায়াল রিকোয়েস্ট চালু আছে।",
    viewStatus: "স্ট্যাটাস দেখুন",
    prefilledFrom: "আপনার ডেমো থেকে তথ্য নেওয়া হয়েছে",
    paused: "নিজের ডোমেইনে ট্রায়াল সাময়িকভাবে বন্ধ।",
  },
  verify: {
    title: "ইমেইল যাচাই করুন",
    lead: (email) => `${email} ঠিকানায় ৬ সংখ্যার কোড পাঠানো হয়েছে।`,
    codeLabel: "যাচাই কোড",
    submit: "কোড নিশ্চিত করুন",
    submitting: "যাচাই হচ্ছে…",
    resend: "আবার কোড পাঠান",
    resendIn: (seconds) => `${seconds} সেকেন্ড পর আবার পাঠান`,
    sent: "কোড পাঠানো হয়েছে",
    attemptsLeft: (n) => `আর ${n}বার চেষ্টা করা যাবে`,
    wrongEmail: "ইমেইল ভুল? ফিরে গিয়ে ঠিক করুন",
  },
  picker: {
    title: "কোন প্রোডাক্ট?",
    lead: "একটা বেছে নিন — পরের ধাপে এক মিনিটের মধ্যে চালু।",
    demoBadge: "ইনস্ট্যান্ট ডেমো",
    domainBadge: "ডোমেইন ট্রায়াল",
    empty: "এখন কোনো প্রোডাক্টে ট্রায়াল খোলা নেই।",
    search: "প্রোডাক্ট খুঁজুন",
  },
  stages: {
    received: { label: "রিকোয়েস্ট পেয়েছি", body: "টিম দেখছে।" },
    hosting_pending: { label: "হোস্টিং", body: "হোস্টিং নিয়ে যোগাযোগ করব।" },
    deploying: { label: "সেটআপ চলছে", body: "ইনস্টলার তৈরি হচ্ছে।" },
    live: { label: "লাইভ", body: "আপনার ডোমেইনে চালু।" },
    expiring: { label: "শেষ হচ্ছে", body: "কিনলে সব একই থাকে।" },
    expired: { label: "মেয়াদ শেষ", body: "রাখতে চাইলে এখনই কিনুন।" },
    converted: { label: "কেনা হয়েছে", body: "আপনার নিজের, চিরকাল।" },
    rejected: { label: "অনুমোদিত নয়", body: "বিস্তারিত ইমেইলে।" },
  },
  hostKind: { vps: "VPS", cpanel: "cPanel" },
  common: {
    name: "নাম",
    email: "ইমেইল",
    phone: "ফোন",
    company: "কোম্পানি",
    optional: "ঐচ্ছিক",
    close: "বন্ধ",
    retry: "আবার চেষ্টা",
    errorTitle: "সমস্যা হয়েছে",
    errorGeneric: "কিছু ভুল হয়েছে। আবার চেষ্টা করুন।",
    honeypotLabel: "ওয়েবসাইট",
  },
  errors: {
    EMAIL_DISPOSABLE: "অস্থায়ী ইমেইল নেওয়া হয় না — লগইন সেখানেই পাঠাই।",
    EMAIL_INVALID: "সঠিক ইমেইল দিন।",
    EMAIL_NOT_VERIFIED: "আগে ইমেইল যাচাই করুন।",
    VERIFY_CODE_INVALID: "কোডটি মিলছে না।",
    VERIFY_CODE_EXPIRED: "কোডের মেয়াদ শেষ। নতুন কোড চান।",
    VERIFY_TOO_MANY_ATTEMPTS: "অনেকবার ভুল কোড দেওয়া হয়েছে। নতুন কোড চান।",
    VERIFY_COOLDOWN: "এইমাত্র কোড পাঠানো হয়েছে। একটু পরে আবার চেষ্টা করুন।",
    VERIFY_RATE_LIMIT: "এই ইমেইলে অনেকবার কোড চাওয়া হয়েছে। পরে চেষ্টা করুন।",
    VERIFY_RATE_LIMIT_IP: "এই নেটওয়ার্ক থেকে অনেকবার কোড চাওয়া হয়েছে। পরে চেষ্টা করুন।",
    VERIFY_EMAIL_FAILED: "কোড পাঠানো যায়নি। পরে আবার চেষ্টা করুন।",
    RATE_LIMIT_IP: "এই নেটওয়ার্ক থেকে অনেক রিকোয়েস্ট হয়েছে। এক ঘণ্টা পরে চেষ্টা করুন।",
    RATE_LIMIT_EMAIL: "এই ইমেইলে আজকের সীমা শেষ। আগের অ্যাকসেস লিংক ব্যবহার করুন।",
    DEMO_DISABLED: "ইনস্ট্যান্ট ডেমো সাময়িকভাবে বন্ধ।",
    DOMAIN_TRIAL_DISABLED: "নিজের ডোমেইনে ট্রায়াল সাময়িকভাবে বন্ধ।",
    DEMO_UNSUPPORTED: "এই প্রোডাক্টে ইনস্ট্যান্ট ডেমো এখনো নেই।",
    DOMAIN_TRIAL_UNSUPPORTED: "এই প্রোডাক্টে ডোমেইন ট্রায়াল নেই।",
    HOSTING_SOURCE_REQUIRED: "হোস্টিং আছে কি না বলুন।",
    HOSTING_CONFIRMATION_REQUIRED: "ডোমেইন ও হোস্টিং রেডি আছে — এটা টিক দিন।",
    HOST_KIND_REQUIRED: "VPS বা cPanel বেছে নিন।",
    DOMAIN_REQUIRED: "সঠিক ডোমেইন দিন।",
    DOMAIN_INVALID: "ডোমেইন ঠিক নেই।",
    MONTHS_INVALID: "এই মেয়াদ এখন অফার করা হচ্ছে না — আবার বেছে নিন।",
    RATE_LIMITED: "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে আবার করুন।",
    DEMO_PROVISION_FAILED: "ডেমো নিজে থেকে চালু হয়নি। টিমকে জানানো হয়েছে — অ্যাকসেস পেজ কিছুক্ষণ পরে দেখুন।",
    TRIALS_DISABLED: "ট্রায়াল সাময়িকভাবে বন্ধ।",
  },
};

const EN: Copy = {
  demo: {
    eyebrow: "Instant live demo",
    title: "A real shop and admin, running in one minute",
    lead: "Not screenshots. Give us a name and email — you get the storefront, the admin panel and a login right away. No approval step.",
    cta: "Get instant demo",
    ctaShort: "Demo",
    noWait: "No waiting",
    fieldsHint: "3 fields. No card.",
    submit: "Start my demo",
    submitting: "Starting…",
    provisioningTitle: "Setting up your demo",
    provisioningSteps: ["Creating account", "Granting admin", "Ready"],
    readyTitle: "Your demo is ready",
    readyLead: "Log in right now with the details below. We also emailed everything to you.",
    existingTitle: "You already have this demo",
    existingLead: "A demo for this product is active on this email. Here is your existing login.",
    delayedTitle: "Taking a moment",
    delayedLead: "Your demo is being prepared. The access page updates on its own — the login will also arrive by email.",
    awaitingTitle: "Waiting for approval",
    awaitingLead: "Your request is in. An admin will approve the demo and email you the login.",
    awaitingHint: "Keep this page open — the login will appear here after approval.",
    awaitingAt: (email) => `Login will arrive at ${email}`,
    shop: "Storefront",
    shopBody: "What your customers see",
    admin: "Admin panel",
    adminBody: "Products, orders, reports",
    open: "Open",
    loginEmail: "Login email",
    password: "Password",
    show: "Show",
    hide: "Hide",
    copy: "Copy",
    copied: "Copied",
    emailedNote: "Also sent to your email",
    sharedNote: "Shared demo — other evaluators can see data you enter and it resets regularly. Do not enter real customer data.",
    accessDays: (days) => `${days} days of access`,
    nextTitle: "Like what you see?",
    nextLead: (max) => `Run it on your own domain and hosting for ${max}, free. After approval you get a one-command installer.`,
    nextCta: "Request own-domain trial",
    openAccessPage: "Open access page",
    browseShopNoLogin: "Browse the storefront without logging in",
    paused: "Instant demo is paused right now. Please try again later.",
  },
  domain: {
    eyebrow: "Free trial on your own domain",
    title: "Run it on your domain and hosting",
    lead: "Liked the demo? Request a trial. After an admin approves, you download a one-command installer for your VPS or cPanel — we do not log into your server.",
    cta: "Request own-domain trial",
    ctaShort: "Domain trial",
    bullets: ["Your domain", "VPS or cPanel", "One-command installer"],
    weSetUp: "You run the installer",
    freeFor: (range) => `${range} free`,
    stepHosting: "Hosting",
    stepDuration: "Duration",
    stepContact: "Contact",
    stepVerify: "Verify",
    hostingQuestion: "What kind of server do you have?",
    hostKindLabel: "What kind of hosting?",
    hostKindVps: "VPS",
    hostKindVpsBody: "Ubuntu/Debian server with root/SSH",
    hostKindCpanel: "cPanel",
    hostKindCpanelBody: "Shared hosting with a cPanel login",
    readyCheckbox: "My domain and hosting are ready and I can run the installer",
    readyHint: "Required — without your own server there is nowhere to run the installer.",
    durationQuestion: "How many months free?",
    endsOn: (date) => `Ends ${date}`,
    domainLabel: "Domain",
    domainPlaceholder: "myshop.com",
    contactTitle: "Where should we reach you?",
    summary: "Summary",
    notesLabel: "Notes (optional)",
    notesPlaceholder: "Anything special about your server, preferred time, etc.",
    back: "Back",
    next: "Next",
    submit: "Send trial request",
    submitting: "Sending…",
    submittedTitle: "Request received",
    submittedLead: "Once an admin approves, the installer ZIP arrives by email. Run one command on your VPS or cPanel and the trial is live.",
    slaLine: (hours) => `Usually within ${hours} hours`,
    existingTitle: "Request already on file",
    existingLead: "An own-domain trial request for this product is already open on this email.",
    viewStatus: "View status",
    prefilledFrom: "Details carried over from your demo",
    paused: "Own-domain trials are paused right now.",
  },
  verify: {
    title: "Check your email",
    lead: (email) => `We sent a 6-digit code to ${email}.`,
    codeLabel: "Verification code",
    submit: "Confirm code",
    submitting: "Checking…",
    resend: "Resend code",
    resendIn: (seconds) => `Resend in ${seconds}s`,
    sent: "Code sent",
    attemptsLeft: (n) => `${n} attempts left`,
    wrongEmail: "Wrong email? Go back and fix it",
  },
  picker: {
    title: "Which product?",
    lead: "Pick one — it will be running within a minute on the next step.",
    demoBadge: "Instant demo",
    domainBadge: "Domain trial",
    empty: "No products are open for trial right now.",
    search: "Search products",
  },
  stages: {
    received: { label: "Request received", body: "Our team is on it." },
    hosting_pending: { label: "Hosting", body: "We will contact you about hosting." },
    deploying: { label: "Setting up", body: "Preparing your installer." },
    live: { label: "Live", body: "Running on your domain." },
    expiring: { label: "Ending soon", body: "Buy to keep everything as is." },
    expired: { label: "Trial ended", body: "Buy now to keep it." },
    converted: { label: "Purchased", body: "Yours, for good." },
    rejected: { label: "Not approved", body: "Details in your email." },
  },
  hostKind: { vps: "VPS", cpanel: "cPanel" },
  common: {
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    optional: "optional",
    close: "Close",
    retry: "Try again",
    errorTitle: "Something went wrong",
    errorGeneric: "Something went wrong. Please try again.",
    honeypotLabel: "Website",
  },
  errors: {
    EMAIL_DISPOSABLE: "Temporary email addresses are not accepted — we send your login there.",
    EMAIL_INVALID: "Enter a valid email address.",
    EMAIL_NOT_VERIFIED: "Verify your email first.",
    VERIFY_CODE_INVALID: "That code is not correct.",
    VERIFY_CODE_EXPIRED: "That code has expired. Request a new one.",
    VERIFY_TOO_MANY_ATTEMPTS: "Too many incorrect codes. Request a new one.",
    VERIFY_COOLDOWN: "A code was just sent. Please wait a moment.",
    VERIFY_RATE_LIMIT: "Too many codes sent to this email. Try again later.",
    VERIFY_RATE_LIMIT_IP: "Too many codes requested from this network. Try again later.",
    VERIFY_EMAIL_FAILED: "We could not send the code. Please try again.",
    RATE_LIMIT_IP: "Too many requests from this network. Try again in an hour.",
    RATE_LIMIT_EMAIL: "This email has reached today's limit. Use your existing access link.",
    DEMO_DISABLED: "Instant demo is paused right now.",
    DOMAIN_TRIAL_DISABLED: "Own-domain trials are paused right now.",
    DEMO_UNSUPPORTED: "Instant demo is not available for this product yet.",
    DOMAIN_TRIAL_UNSUPPORTED: "Own-domain trial is not available for this product.",
    HOSTING_SOURCE_REQUIRED: "Tell us whether you have hosting.",
    HOSTING_CONFIRMATION_REQUIRED: "Please confirm your domain and hosting are ready.",
    HOST_KIND_REQUIRED: "Select VPS or cPanel.",
    DOMAIN_REQUIRED: "Enter a valid domain.",
    DOMAIN_INVALID: "That domain does not look right.",
    MONTHS_INVALID: "That trial length is not offered right now — pick again.",
    RATE_LIMITED: "Too many attempts. Please try again in a little while.",
    DEMO_PROVISION_FAILED: "We could not start the demo automatically. Our team has been notified — check the access page shortly.",
    TRIALS_DISABLED: "Trials are paused right now.",
  },
};

export function trialCopy(language: MarketplaceLanguage): Copy {
  return language === "bn" ? BN : EN;
}

/** Map a backend error code (or raw message) to a localized string. */
export function trialErrorMessage(
  language: MarketplaceLanguage,
  code: string | undefined,
  fallback?: string,
): string {
  const c = trialCopy(language);
  if (code && c.errors[code]) return c.errors[code];
  return fallback || c.common.errorGeneric;
}

export type TrialCopy = Copy;
