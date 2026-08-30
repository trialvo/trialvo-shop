import { LEGAL_UPDATED, type LocalizedLegalDoc } from "@/lib/legal/types";

export const LICENSE_DOC: LocalizedLegalDoc = {
  bn: {
    title: "লাইসেন্স চুক্তি",
    updated: LEGAL_UPDATED.bn,
    intro:
      "Trialvo Shop থেকে কোনো প্রোডাক্ট কেনার সাথে আপনি একটি আজীবন ব্যবহারের লাইসেন্স পান। এই চুক্তিতে বলা আছে আপনি প্রোডাক্ট ও সোর্স কোড দিয়ে কী করতে পারবেন, কী করতে পারবেন না, এবং লাইসেন্স কীভাবে বহাল থাকে।",
    sections: [
      {
        id: "grant",
        heading: "১. লাইসেন্স প্রদান",
        blocks: [
          {
            type: "p",
            text: "পূর্ণ মূল্য পরিশোধের পর আমরা আপনাকে প্রোডাক্ট ব্যবহারের একটি আজীবন, অ-এক্সক্লুসিভ, অ-হস্তান্তরযোগ্য লাইসেন্স দিই। লাইসেন্সের কোনো মেয়াদ শেষ হওয়ার তারিখ নেই এবং নবায়ন ফি নেই।",
          },
          {
            type: "p",
            text: "লাইসেন্স আপনাকে ব্যবহারের অধিকার দেয় — প্রোডাক্টের মালিকানা বা মেধাসম্পদ হস্তান্তর করে না।",
          },
        ],
      },
      {
        id: "permitted",
        heading: "২. যা আপনি করতে পারবেন",
        blocks: [
          {
            type: "list",
            items: [
              "একটি লাইভ প্রোডাকশন ডোমেইনে প্রোডাক্ট চালানো, সাথে প্রয়োজনীয় স্টেজিং বা ডেভেলপমেন্ট কপি রাখা।",
              "নিজের ব্যবসায়িক প্রয়োজনে সোর্স কোড পরিবর্তন, ডিজাইন কাস্টমাইজ ও নতুন ফিচার যোগ করা।",
              "নিজের ব্র্যান্ড, লোগো, রঙ ও কনটেন্ট দিয়ে প্রোডাক্ট সম্পূর্ণ রিব্র্যান্ড করা।",
              "প্রোডাক্ট ব্যবহার করে বাণিজ্যিকভাবে পণ্য বিক্রি করা এবং আয় করা।",
              "নিজের ডেভেলপার বা এজেন্সিকে কাজের প্রয়োজনে কোড অ্যাক্সেস দেওয়া, যদি তারা এই চুক্তির শর্ত মানে।",
            ],
          },
        ],
      },
      {
        id: "prohibited",
        heading: "৩. যা আপনি করতে পারবেন না",
        blocks: [
          {
            type: "list",
            items: [
              "সোর্স কোড বা প্রোডাক্ট সম্পূর্ণ বা আংশিকভাবে পুনঃবিক্রয়, পুনর্বিতরণ বা সাবলাইসেন্স করা।",
              "একই প্রোডাক্ট নিজের একাধিক ক্লায়েন্টের জন্য বারবার ব্যবহার করা — প্রতিটি ক্লায়েন্ট প্রকল্পের জন্য আলাদা লাইসেন্স প্রয়োজন।",
              "কোড টেমপ্লেট, থিম বা স্ক্রিপ্ট হিসেবে অন্য কোনো মার্কেটপ্লেসে আপলোড বা বিক্রি করা।",
              "প্রোডাক্ট থেকে উদ্ভূত একটি প্রতিযোগী রেডিমেড প্রোডাক্ট তৈরি ও বিক্রি করা।",
              "সোর্স কোড পাবলিক রিপোজিটরিতে খোলা অবস্থায় প্রকাশ করা।",
              "লাইসেন্স যাচাইকরণ বা কপিরাইট নোটিশ সরিয়ে ফেলা বা নিষ্ক্রিয় করা।",
            ],
          },
        ],
      },
      {
        id: "domain-scope",
        heading: "৪. ডোমেইন ও ইনস্টলেশনের পরিধি",
        blocks: [
          {
            type: "p",
            text: "একটি লাইসেন্স একটি প্রোডাকশন ডোমেইনের জন্য প্রযোজ্য। উন্নয়ন ও পরীক্ষার জন্য লোকাল বা স্টেজিং কপি রাখা অনুমোদিত, যদি সেগুলো গ্রাহকদের জন্য খোলা না থাকে।",
          },
          {
            type: "p",
            text: "একাধিক লাইভ শপ চালাতে চাইলে প্রতিটির জন্য আলাদা লাইসেন্স প্রয়োজন। একাধিক লাইসেন্সের প্রয়োজন হলে আমাদের সাথে যোগাযোগ করুন।",
          },
        ],
      },
      {
        id: "modifications",
        heading: "৫. পরিবর্তন ও আপডেট",
        blocks: [
          {
            type: "p",
            text: "আপনি কোড পরিবর্তন করতে পারবেন, তবে ব্যাপক পরিবর্তনের পর ভবিষ্যৎ আপডেট প্রয়োগ করা কঠিন হতে পারে। আমরা আপডেট প্রকাশ করি মূল কোডবেসের জন্য; আপনার নিজস্ব পরিবর্তনের সাথে সেগুলো মিলিয়ে নেওয়ার দায়িত্ব আপনার।",
          },
          {
            type: "note",
            text: "পরামর্শ: কোড পরিবর্তনের আগে ভার্সন কন্ট্রোল ব্যবহার করুন এবং নিজস্ব পরিবর্তনগুলো আলাদা রাখুন — এতে আপডেট প্রয়োগ সহজ হয়।",
          },
        ],
      },
      {
        id: "third-party",
        heading: "৬. থার্ড-পার্টি ও ওপেন সোর্স উপাদান",
        blocks: [
          {
            type: "p",
            text: "প্রোডাক্টে ব্যবহৃত লাইব্রেরি, ফন্ট, আইকন ও প্যাকেজ তাদের নিজস্ব লাইসেন্সের অধীনে থাকে। সেই শর্তগুলো মেনে চলা ক্রেতার দায়িত্ব। ডেমোতে ব্যবহৃত ছবি ও নমুনা কনটেন্ট শুধু উপস্থাপনার জন্য এবং লাইভ ব্যবহারের অধিকার এতে অন্তর্ভুক্ত নাও থাকতে পারে।",
          },
        ],
      },
      {
        id: "termination",
        heading: "৭. লাইসেন্স বাতিল",
        blocks: [
          {
            type: "p",
            text: "উপরের নিষিদ্ধ কাজগুলোর গুরুতর লঙ্ঘন হলে লাইসেন্স বাতিল হতে পারে। বাতিল হলে প্রোডাক্টের ব্যবহার বন্ধ করতে হবে এবং সাপোর্ট অধিকার শেষ হয়ে যাবে। সম্ভব হলে আগে নোটিশ ও সংশোধনের সুযোগ দেওয়া হবে।",
          },
        ],
      },
      {
        id: "transfer",
        heading: "৮. হস্তান্তর",
        blocks: [
          {
            type: "p",
            text: "লাইসেন্স সাধারণত হস্তান্তরযোগ্য নয়। ব্যবসা বিক্রি বা মালিকানা পরিবর্তনের ক্ষেত্রে আমাদের লিখিত সম্মতি নিয়ে লাইসেন্স নতুন মালিকের নামে স্থানান্তর করা যেতে পারে।",
          },
        ],
      },
    ],
  },

  en: {
    title: "License Agreement",
    updated: LEGAL_UPDATED.en,
    intro:
      "Buying a product from Trialvo Shop grants you a lifetime license to use it. This agreement sets out what you may do with the product and its source code, what you may not do, and how the license stays valid.",
    sections: [
      {
        id: "grant",
        heading: "1. License grant",
        blocks: [
          {
            type: "p",
            text: "Once payment is complete we grant you a lifetime, non-exclusive, non-transferable license to use the product. The license has no expiry date and there is no renewal fee.",
          },
          {
            type: "p",
            text: "The license gives you the right to use the product — it does not transfer ownership or intellectual property.",
          },
        ],
      },
      {
        id: "permitted",
        heading: "2. What you may do",
        blocks: [
          {
            type: "list",
            items: [
              "Run the product on one live production domain, plus the staging or development copies you need.",
              "Modify the source code, customise the design, and add new features for your own business.",
              "Fully rebrand the product with your own name, logo, colours, and content.",
              "Use the product commercially to sell goods and generate revenue.",
              "Give your own developer or agency access to the code for that work, provided they follow this agreement.",
            ],
          },
        ],
      },
      {
        id: "prohibited",
        heading: "3. What you may not do",
        blocks: [
          {
            type: "list",
            items: [
              "Resell, redistribute, or sublicense the source code or product, in whole or in part.",
              "Reuse one purchase across multiple client projects — each client project needs its own license.",
              "Upload or sell the code as a template, theme, or script on any other marketplace.",
              "Build and sell a competing ready-made product derived from this one.",
              "Publish the source code in a public repository.",
              "Remove or disable license verification or copyright notices.",
            ],
          },
        ],
      },
      {
        id: "domain-scope",
        heading: "4. Domain and installation scope",
        blocks: [
          {
            type: "p",
            text: "One license covers one production domain. Local and staging copies for development and testing are allowed as long as they are not open to customers.",
          },
          {
            type: "p",
            text: "Running more than one live shop requires a separate license for each. Contact us if you need multiple licenses.",
          },
        ],
      },
      {
        id: "modifications",
        heading: "5. Modifications and updates",
        blocks: [
          {
            type: "p",
            text: "You may modify the code, but heavy modification can make future updates harder to apply. We publish updates against the original codebase, and merging them with your own changes is your responsibility.",
          },
          {
            type: "note",
            text: "Tip: use version control before modifying the code and keep your own changes isolated — it makes applying updates far easier.",
          },
        ],
      },
      {
        id: "third-party",
        heading: "6. Third-party and open source components",
        blocks: [
          {
            type: "p",
            text: "Libraries, fonts, icons, and packages used inside the product remain under their own licenses, and complying with those terms is your responsibility. Images and sample content used in demos are for presentation only and may not include rights for live use.",
          },
        ],
      },
      {
        id: "termination",
        heading: "7. License termination",
        blocks: [
          {
            type: "p",
            text: "A serious breach of the prohibitions above can end the license. If it is terminated you must stop using the product and support rights end. Where practical we will give notice and a chance to correct the problem first.",
          },
        ],
      },
      {
        id: "transfer",
        heading: "8. Transfers",
        blocks: [
          {
            type: "p",
            text: "The license is normally non-transferable. If a business is sold or changes ownership, the license may be moved to the new owner with our written consent.",
          },
        ],
      },
    ],
  },
};
