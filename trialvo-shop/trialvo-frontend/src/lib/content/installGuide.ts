import type { LocalizedString } from "@/types/marketplace";

export type InstallGuideSection = {
  id: string;
  title: LocalizedString;
  lead: LocalizedString;
  steps: LocalizedString[];
};

export type InstallGuideContent = {
  eyebrow: LocalizedString;
  title: LocalizedString;
  lead: LocalizedString;
  sections: InstallGuideSection[];
};

export const INSTALL_GUIDE: InstallGuideContent = {
  eyebrow: {
    bn: "কাস্টমার ডক",
    en: "Customer docs",
  },
  title: {
    bn: "নিজের হোস্টে ইনস্টলার চালানো",
    en: "Install the Option-2 pack on your host",
  },
  lead: {
    bn: "স্ট্যাটাস পেজ বা ইমেইল থেকে ZIP নামিয়ে আপনার VPS বা cPanel-এ চালান — আমরা সার্ভারে লগইন করি না। নিচের ধাপগুলো Docker VPS-এর জন্য; cPanel প্যাক পেলে শেষের নোট দেখুন। ZIP-এর ভিতরে INSTALL.md আরও বিস্তারিত।",
    en: "Download the ZIP from your status page or email and run it on your VPS or cPanel — we never log into your server. The steps below are for a Docker VPS; if you received a cPanel pack, use the short note at the end. The ZIP also contains INSTALL.md with the same detail.",
  },
  sections: [
    {
      id: "prerequisites",
      title: {
        bn: "শুরুর আগে যা লাগবে",
        en: "Prerequisites",
      },
      lead: {
        bn: "সার্ভার রেডি না থাকলে ইনস্টলার আটকে যাবে — আগে এই চারটি জিনিস গুছিয়ে নিন।",
        en: "Setup stalls if the server is not ready. Sort these four things first.",
      },
      steps: [
        {
          bn: "Ubuntu বা Debian VPS-এ Docker ও Docker Compose (v2: docker compose) ইনস্টল থাকতে হবে।",
          en: "Docker and Docker Compose (v2: docker compose) on an Ubuntu or Debian VPS.",
        },
        {
          bn: "ডোমেইনের DNS A রেকর্ড এই সার্ভারের পাবলিক IP-তে পয়েন্ট করুন। আগে .env এডিট করে পরে DNS দিলেও চলবে — পাবলিক লিংক তখনই খুলবে যখন DNS মিলে যাবে।",
          en: "Point the domain DNS A record at this server’s public IP. You can edit .env first and point DNS later — public links work once DNS has propagated.",
        },
        {
          bn: "ফায়ারওয়ালে ৮০ ও ৪৪৩ খুলুন। রিভার্স প্রক্সি না থাকলে .env-এর API / অ্যাডমিন / শপ পোর্টও খুলতে হবে।",
          en: "Open ports 80 and 443 on the firewall. If you are not using a reverse proxy, also open the API, admin, and shop ports from .env.",
        },
        {
          bn: "Windows-এ Docker Desktop চালু রেখে setup.ps1 ব্যবহার করতে পারেন।",
          en: "On Windows you can use Docker Desktop and setup.ps1 instead of setup.sh.",
        },
      ],
    },
    {
      id: "vps",
      title: {
        bn: "VPS-এ ধাপে ধাপে",
        en: "VPS steps",
      },
      lead: {
        bn: "প্রতিটি কমান্ড আপনি চালাবেন। ইনস্টলার লিংক একবার ব্যবহার হয় এবং সময়সীমা আছে।",
        en: "You run every command. Installer links are single-use and time-limited.",
      },
      steps: [
        {
          bn: "স্ট্যাটাস পেজ বা ইমেইল থেকে ZIP নামিয়ে সার্ভারে আপলোড করুন, আনজিপ করে সেই ফোল্ডারে ঢুকুন।",
          en: "Download the ZIP from the status page or email, upload it to the server, unzip it, and cd into the folder.",
        },
        {
          bn: ".env.example কপি করে .env বানান। DOMAIN, DB পাসওয়ার্ড, JWTSECRET, PUBLIC_API_ORIGIN, PUBLIC_SHOP_ORIGIN, আর স্ট্যাটাস ইমেইলের অ্যাডমিন ইমেইল/পাসওয়ার্ড বসান।",
          en: "Copy .env.example to .env. Set DOMAIN, database password, JWTSECRET, PUBLIC_API_ORIGIN, PUBLIC_SHOP_ORIGIN, and the admin email/password from the Trialvo status email.",
        },
        {
          bn: "agent.env যেমন আছে তেমন রাখুন — শেয়ার করবেন না, অন্য ডোমেইনে কপি করবেন না। CONTROL_PLANE_URL VPS থেকে পৌঁছাতে হবে।",
          en: "Leave agent.env as shipped — do not share it or copy it to another domain. CONTROL_PLANE_URL must be reachable from the VPS.",
        },
        {
          bn: "chmod +x setup.sh && ./setup.sh চালান। Windows-এ ./setup.ps1।",
          en: "Run chmod +x setup.sh && ./setup.sh (or ./setup.ps1 on Windows).",
        },
        {
          bn: "প্রথমবার শুধু .env তৈরি হয়ে স্ক্রিপ্ট বেরিয়ে যেতে পারে — এডিট করে আবার চালান, তারপর কম্পোজ কন্টেইনার তুলবে।",
          en: "The first run may only create .env and exit. Edit it, then run setup again so Compose starts the containers.",
        },
        {
          bn: "DNS মিলিয়ে docker compose ps দিয়ে কন্টেইনার চালু দেখুন, তারপর শপ ও অ্যাডমিন URL খুলুন।",
          en: "Point DNS, wait until docker compose ps shows the stack running, then open the shop and admin URLs.",
        },
      ],
    },
    {
      id: "after",
      title: {
        bn: "ইনস্টলের পর",
        en: "After install",
      },
      lead: {
        bn: "এজেন্ট নিজে থেকে Trialvo-তে রেজিস্টার করে — আপনাকে আলাদা কিছু পাঠাতে হয় না।",
        en: "The agent registers with Trialvo on its own — you do not submit anything extra.",
      },
      steps: [
        {
          bn: "প্রথম বুটে ডেমো ক্যাটালগ সিড হয়। অ্যাডমিনে ঢুকুন স্ট্যাটাস ইমেইলের লগইন দিয়ে।",
          en: "First boot seeds the demo catalog. Sign into admin with the login from the status email.",
        },
        {
          bn: "লাইসেন্স এজেন্ট agent.env-এর সিক্রেট দিয়ে Trialvo-তে চেক-ইন করে। স্ট্যাটাস পেজে ট্রায়াল Active হয়ে যায়।",
          en: "The license agent checks in with the secrets in agent.env. The trial on your status page becomes Active.",
        },
        {
          bn: "কিনলে একই ইনস্ট্যান্স পারমানেন্ট হয় — ডেটা, ডোমেইন, সেটআপ একই থাকে।",
          en: "When you buy, this same instance becomes permanent — data, domain, and setup stay as they are.",
        },
      ],
    },
    {
      id: "troubleshooting",
      title: {
        bn: "সমস্যা হলে",
        en: "Troubleshooting",
      },
      lead: {
        bn: "বেশিরভাগ আটকে যাওয়া DNS, ফায়ারওয়াল, বা কন্ট্রোল প্লেনে পৌঁছাতে না পারা — এই তিনটিতেই।",
        en: "Most stalls are DNS, firewall, or the VPS not reaching the control plane.",
      },
      steps: [
        {
          bn: "docker compose ps এবং docker compose logs দেখুন — license-agent বা api লগেই সাধারণত কারণ থাকে।",
          en: "Run docker compose ps and docker compose logs. The license-agent or api log usually shows the cause.",
        },
        {
          bn: "ইনবাউন্ড ৮০/৪৪৩ খুলুন। VPS থেকে আউটবাউন্ড HTTPS-এ CONTROL_PLANE_URL পৌঁছাতে হবে — curl দিয়ে যাচাই করুন।",
          en: "Allow inbound 80/443. The VPS must reach CONTROL_PLANE_URL over outbound HTTPS — confirm with curl.",
        },
        {
          bn: "ইমেজ টানতে না পারলে setup আবার চালান; agent.env মুছবেন না। পাবলিক ইনস্টলার লিংক একবারই কাজ করে — নতুন ZIP স্ট্যাটাস পেজ থেকে নিন।",
          en: "If images will not pull, re-run setup and keep agent.env. Public installer links work once — get a fresh ZIP from the status page.",
        },
        {
          bn: "এখনও আটকে থাকলে যোগাযোগ করুন — পুরো agent.env না পাঠিয়ে শুধু TRIAL_INSTALL_ID দিন।",
          en: "If you are still stuck, contact us with TRIAL_INSTALL_ID only — not the full agent.env file.",
        },
      ],
    },
    {
      id: "cpanel",
      title: {
        bn: "cPanel / Node প্যাক",
        en: "cPanel / Node pack",
      },
      lead: {
        bn: "ZIP-এ docker-compose.yml না থাকলে এই পথ। license.env API-র পাশে রেখে বুটে লোড করুন।",
        en: "Use this path when the ZIP has no docker-compose.yml. Load license.env next to the API at boot.",
      },
      steps: [
        {
          bn: "প্রোডাক্ট API cPanel Node অ্যাপ (বা নিজের Node প্রসেস) হিসেবে ডিপ্লয় করুন।",
          en: "Deploy the product API as a cPanel Node app (or your own Node process).",
        },
        {
          bn: "license.env পাশে রাখুন; license_public.pem API-র config/-এ কপি করুন যদি বিল্ড চায়।",
          en: "Keep license.env beside the API; copy license_public.pem into the API config/ folder if the build expects it.",
        },
        {
          bn: "TRIAL_DOMAIN সেট করুন ঠিক যে হোস্টনেম গ্রাহক ব্যবহার করবে — অন্য ডোমেইনে কপি করলে লাইসেন্স ফ্রিজ হতে পারে।",
          en: "Set TRIAL_DOMAIN to the exact hostname customers will use. Copying the file to another domain can freeze the license.",
        },
        {
          bn: "অ্যাডমিন ও শপ বিল্ড করে API origin এই API-তে পয়েন্ট করুন, তারপর অ্যাপ রিস্টার্ট করুন — এটি সরাসরি Trialvo-তে রেজিস্টার করে।",
          en: "Build admin and shop against this API origin, then restart the app — it registers with Trialvo directly.",
        },
      ],
    },
  ],
};

export function installGuide(): InstallGuideContent {
  return INSTALL_GUIDE;
}
