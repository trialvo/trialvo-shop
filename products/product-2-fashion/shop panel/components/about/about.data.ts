import type { AboutHeroContent, FeatureItemData, TestimonialItem } from "./types";

export const ABOUT_HERO: AboutHeroContent = {
  whoWeAreKicker: "WHO WE ARE",
  whoWeAreTitle: "Vellora – Quality\nYou Can Trust",
  image: {
    src: "/about/who-we-are.png",
    alt: "Vellora showroom",
  },
  whoWeAreBody:
    "Vellora is a Bangladeshi fashion and garment brand established in 2020 with a clear mission: to deliver stylish, comfortable, and durable garments at reasonable prices. Built on trust, consistency, and customer satisfaction, we serve modern consumers who value both fashion and quality.\n\nWe operate through online platforms, physical showrooms, and export channels, reaching customers across Bangladesh and beyond. Every product reflects our commitment to craftsmanship, proper fitting, and reliable fabric quality.",

  whatWeDoKicker: "WHAT WE DO",
  whatWeDoTitle: "Designing, Producing & Delivering Quality\nGarments",
  whatWeDoBody:
    "Vellora specializes in producing everyday fashion that blends modern trends with comfort and durability. From fabric sourcing to final delivery, we maintain strict quality control at every stage.",
  operationsTitle: "Our operations include",
  operations: ["Online retail with Cash on Delivery (COD)", "Physical showroom sales", "Export-oriented garment manufacturing"],
  whatWeDoFooter:
    "We focus on delivering value for money while ensuring dependable service and long-term customer trust.",
};

export const ABOUT_FEATURES: { kicker: string; title: string; items: FeatureItemData[] } = {
  kicker: "OUR BEST FEATURE",
  title: "Why Choose Vellora",
  items: [
    {
      id: "f1",
      title: "Quality Craftsmanship",
      description: "We use carefully selected fabrics and precise tailoring to ensure durability and comfort.",
      icon: "/about/award-icon.svg",
    },
    {
      id: "f2",
      title: "Trusted Production",
      description: "Our garments go through strict quality checks to maintain consistency and reliability.",
      icon: "/about/certified-icon.svg",
    },
    {
      id: "f3",
      title: "Growing Community",
      description: "Thousands of satisfied customers trust Vellora for everyday fashion needs.",
      icon: "/about/members-icon.svg",
    },
  ],
};

export const ABOUT_TESTIMONIALS: { kicker: string; items: TestimonialItem[] } = {
  kicker: "MORE ABOUT US",
  items: [
    {
      id: "t1",
      title: "Our Vision",
      body: [
        "Our vision is to build a trusted Bangladeshi fashion brand with a strong nationwide presence. We aim to establish Vellora showrooms across the country, making quality fashion easily accessible at affordable prices.",
        "Looking ahead, we aspire to strengthen our export operations and proudly represent Bangladesh in the global fashion market.",
      ],
      image: { src: "/about/vision.png", alt: "Vision" },
      imageSide: "right",
    },
    {
      id: "t2",
      title: "Our Mission",
      bullets: [
        "To provide high-quality garments at reasonable prices",
        "To ensure customer satisfaction through transparent policies and dependable service",
        "To combine modern fashion trends with comfort and durability",
        "To grow sustainably through online, retail, and export channels",
      ],
      image: { src: "/about/mission.jpg", alt: "Mission" },
      imageSide: "left",
    },
    {
      id: "t3",
      title: "",
      name: "Sazzad Hossen",
      role: "Proprietor, Vellora",
      body: [
        "Mr. Sazzad Hossen is the Proprietor of Vellora and a dedicated entrepreneur in the garment and fashion industry. Since establishing the company in 2020, he has been actively involved in production planning, quality control, sourcing, and overall business development.",
        "With hands-on experience in garment manufacturing and fashion supply, Mr. Hossen focuses on delivering reliable quality, fair pricing, and customer-oriented service. His practical understanding of market demand and production processes plays a key role in the steady growth of Vellora.",
        "Under his leadership, Vellora continues to expand its online presence, physical showroom network, and export activities, with a long-term vision of becoming a nationwide fashion brand.",
        "Looking ahead, we aspire to strengthen our export operations and proudly represent Bangladesh in the global fashion market.",
      ],
      image: { src: "/images/categories/cat-men.jpg", alt: "Sazzad Hossen" },
      imageSide: "right",
    },
  ],
};
