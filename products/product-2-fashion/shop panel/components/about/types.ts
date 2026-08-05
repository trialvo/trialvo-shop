export type AboutImage = {
  src: string;
  alt: string;
};

export type AboutHeroContent = {
  // Left column
  whoWeAreKicker: string;
  whoWeAreTitle: string;
  image: AboutImage;

  // Right column
  whoWeAreBody: string;

  whatWeDoKicker: string;
  whatWeDoTitle: string;
  whatWeDoBody: string;

  operationsTitle?: string;
  operations?: string[];

  whatWeDoFooter?: string;
};

export type FeatureItemData = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export type TestimonialItem = {
  id: string;
  title: string;

  // paragraph(s)
  body?: string | string[];

  // bullet list (like "Our Mission")
  bullets?: string[];

  image: AboutImage;

  // control left/right image position
  imageSide?: "left" | "right";

  // optional small labels
  name?: string; // e.g. "Sazzad Hossen"
  role?: string; // e.g. "Proprietor, Graduate Fashion"
};
