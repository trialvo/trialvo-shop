export type PaymentMethodItem = {
  id: string;
  brandIconSrc: string;
  brandAlt: string;
  maskedNumber: string;
  expiry?: string | null;
};
