export type HeaderSearchCategory = {
  value: string;
  label: string;
  image?: string | null;
};

export type HeaderSearchSubmitPayload = {
  query: string;
  category: string;
};
