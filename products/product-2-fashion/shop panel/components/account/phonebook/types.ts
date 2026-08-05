export type PhoneCardProps = {
  id: number;
  phone_number?: string;
  is_verified: boolean;

  // backend uses 1/0
  is_default: 0 | 1;
};
