import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const ACCEPTABLE_USE_DOC: LocalizedLegalDoc = {
  bn: {
    title: "গ্রহণযোগ্য ব্যবহার নীতি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "এই নীতি Trialvo Shop-এর ওয়েবসাইট, ট্রায়াল পরিবেশ, ডেলিভার করা প্রোডাক্ট এবং সাপোর্ট চ্যানেল ব্যবহারের সীমা নির্ধারণ করে। উদ্দেশ্য পরিষ্কার — সবার জন্য সেবা নিরাপদ, স্থিতিশীল ও বৈধ রাখা।",
    sections: [
      {
        id: "general",
        heading: "১. সাধারণ নীতি",
        blocks: [
          {
            type: "p",
            text: "আপনি আমাদের সেবা কেবল বৈধ ব্যবসায়িক উদ্দেশ্যে ব্যবহার করবেন এবং প্রযোজ্য আইন মেনে চলবেন। অন্য ব্যবহারকারীর সেবা ব্যবহারে বাধা সৃষ্টি করে এমন কোনো কাজ করা যাবে না।",
          },
        ],
      },
      {
        id: "prohibited-content",
        heading: "২. নিষিদ্ধ কনটেন্ট",
        blocks: [
          {
            type: "p",
            text: "আমাদের প্রোডাক্ট বা ট্রায়াল পরিবেশ ব্যবহার করে নিচের ধরনের কনটেন্ট প্রকাশ, বিক্রি বা বিতরণ করা যাবে না:",
          },
          {
            type: "list",
            items: [
              "আইনত নিষিদ্ধ পণ্য বা সেবা — মাদক, অবৈধ অস্ত্র, জাল নথি বা চোরাই পণ্য।",
              "প্রতারণামূলক অফার, ভুয়া বিনিয়োগ স্কিম বা পিরামিড/MLM ধাঁচের প্রকল্প।",
              "অন্যের কপিরাইট, ট্রেডমার্ক বা মেধাসম্পদ লঙ্ঘনকারী কনটেন্ট।",
              "শিশু নিপীড়ন, সহিংসতায় উস্কানি, ঘৃণা ছড়ানো বা হুমকিমূলক কনটেন্ট।",
              "ম্যালওয়্যার, ফিশিং পেজ বা প্রতারণামূলক লগইন ফর্ম।",
            ],
          },
        ],
      },
      {
        id: "technical-abuse",
        heading: "৩. প্রযুক্তিগত অপব্যবহার",
        blocks: [
          {
            type: "list",
            items: [
              "আমাদের সার্ভার, API বা ট্রায়াল অবকাঠামোয় অতিরিক্ত লোড তৈরি করা বা ইচ্ছাকৃতভাবে ডাউন করার চেষ্টা।",
              "অনুমতি ছাড়া নিরাপত্তা পরীক্ষা, পেনিট্রেশন টেস্ট, স্ক্যানিং বা দুর্বলতা অনুসন্ধান।",
              "অন্য ব্যবহারকারীর অ্যাকাউন্ট, ট্রায়াল ইনস্ট্যান্স বা ডেটায় অনুমতিহীন প্রবেশের চেষ্টা।",
              "স্বয়ংক্রিয় স্ক্র্যাপিং বা বাল্ক ডাউনলোড, যা সাইটের স্বাভাবিক ব্যবহারের বাইরে।",
              "লাইসেন্স যাচাইকরণ বাইপাস করা বা প্রোডাক্টের নিরাপত্তা ব্যবস্থা নিষ্ক্রিয় করা।",
            ],
          },
        ],
      },
      {
        id: "trial-abuse",
        heading: "৪. ট্রায়াল অপব্যবহার",
        blocks: [
          {
            type: "p",
            text: "ট্রায়াল দেওয়া হয় প্রোডাক্ট মূল্যায়নের জন্য। নিচের কাজগুলো ট্রায়াল অপব্যবহার হিসেবে গণ্য এবং তাৎক্ষণিকভাবে ট্রায়াল বন্ধের কারণ হতে পারে:",
          },
          {
            type: "list",
            items: [
              "একাধিক ইমেইল বা ভুয়া পরিচয় ব্যবহার করে একই প্রোডাক্টের বারবার ট্রায়াল নেওয়া।",
              "ট্রায়াল পরিবেশে প্রকৃত বাণিজ্যিক ব্যবসা পরিচালনা করা বা প্রকৃত গ্রাহকের অর্ডার নেওয়া।",
              "ট্রায়াল থেকে সোর্স কোড নিষ্কাশন, ডিকম্পাইল বা অনুলিপি করার চেষ্টা।",
              "ট্রায়াল অ্যাক্সেস অন্য কারো কাছে বিক্রি, ভাড়া বা শেয়ার করা।",
            ],
          },
        ],
      },
      {
        id: "support-conduct",
        heading: "৫. সাপোর্ট চ্যানেলে আচরণ",
        blocks: [
          {
            type: "p",
            text: "আমাদের টিমের সাথে যোগাযোগে সম্মানজনক আচরণ প্রত্যাশিত। গালিগালাজ, হুমকি বা হয়রানিমূলক বার্তার ক্ষেত্রে আমরা যোগাযোগ সীমিত করার অধিকার রাখি। একই বিষয়ে বারবার বাল্ক মেসেজ পাঠানো সাপোর্ট প্রক্রিয়াকে ধীর করে — একটি থ্রেডে বিষয়টি রাখাই ভালো।",
          },
        ],
      },
      {
        id: "enforcement",
        heading: "৬. প্রয়োগ ও ফলাফল",
        blocks: [
          {
            type: "p",
            text: "লঙ্ঘনের গুরুত্ব বিবেচনা করে আমরা ধাপে ধাপে ব্যবস্থা নিই — সতর্কতা, নির্দিষ্ট ফিচারে সীমাবদ্ধতা, ট্রায়াল বন্ধ, সাপোর্ট স্থগিত, এবং গুরুতর ক্ষেত্রে লাইসেন্স বাতিল। বেআইনি কাজের ক্ষেত্রে প্রয়োজনে উপযুক্ত কর্তৃপক্ষকে জানানো হতে পারে।",
          },
          {
            type: "note",
            text: "কোনো অপব্যবহার লক্ষ্য করলে আমাদের জানান — রিপোর্ট গোপনীয়ভাবে বিবেচনা করা হয়।",
          },
        ],
      },
    ],
  },

  en: {
    title: "Acceptable Use Policy",
    updated: LEGAL_UPDATED.en,
    intro:
      "This policy sets the limits on how the Trialvo Shop website, trial environments, delivered products, and support channels may be used. The goal is simple: keep the service safe, stable, and lawful for everyone.",
    sections: [
      {
        id: "general",
        heading: "1. General principle",
        blocks: [
          {
            type: "p",
            text: "You may use our services only for lawful business purposes and in line with applicable law. Nothing you do should interfere with another user's ability to use the service.",
          },
        ],
      },
      {
        id: "prohibited-content",
        heading: "2. Prohibited content",
        blocks: [
          {
            type: "p",
            text: "You may not use our products or trial environments to publish, sell, or distribute:",
          },
          {
            type: "list",
            items: [
              "Goods or services that are illegal — drugs, illegal weapons, forged documents, or stolen goods.",
              "Fraudulent offers, fake investment schemes, or pyramid and MLM-style programmes.",
              "Content that infringes anyone's copyright, trademark, or other intellectual property.",
              "Child abuse material, incitement to violence, hate speech, or threatening content.",
              "Malware, phishing pages, or deceptive login forms.",
            ],
          },
        ],
      },
      {
        id: "technical-abuse",
        heading: "3. Technical abuse",
        blocks: [
          {
            type: "list",
            items: [
              "Placing excessive load on our servers, API, or trial infrastructure, or deliberately trying to bring them down.",
              "Security testing, penetration testing, scanning, or vulnerability hunting without permission.",
              "Attempting to access another user's account, trial instance, or data.",
              "Automated scraping or bulk downloading beyond normal use of the site.",
              "Bypassing license verification or disabling product security controls.",
            ],
          },
        ],
      },
      {
        id: "trial-abuse",
        heading: "4. Trial abuse",
        blocks: [
          {
            type: "p",
            text: "Trials exist so you can evaluate a product. The following count as trial abuse and can end a trial immediately:",
          },
          {
            type: "list",
            items: [
              "Using multiple email addresses or false identities to repeatedly trial the same product.",
              "Running a real commercial business or taking real customer orders inside a trial environment.",
              "Attempting to extract, decompile, or copy source code from a trial.",
              "Selling, renting, or sharing trial access with someone else.",
            ],
          },
        ],
      },
      {
        id: "support-conduct",
        heading: "5. Conduct in support channels",
        blocks: [
          {
            type: "p",
            text: "We expect respectful communication with our team. We may limit contact in response to abusive, threatening, or harassing messages. Sending repeated bulk messages about the same issue slows support down — keeping one topic in one thread works better.",
          },
        ],
      },
      {
        id: "enforcement",
        heading: "6. Enforcement",
        blocks: [
          {
            type: "p",
            text: "We respond proportionately to the seriousness of a breach: a warning, restrictions on specific features, ending a trial, pausing support, and in serious cases terminating the license. Where activity is unlawful we may notify the appropriate authorities.",
          },
          {
            type: "note",
            text: "If you notice abuse, tell us — reports are treated confidentially.",
          },
        ],
      },
    ],
  },
};
