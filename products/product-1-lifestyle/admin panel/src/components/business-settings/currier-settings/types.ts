export type CourierProvider = "steadfast" | "redx" | "pathao" | "paperfly";

export type Option = { value: string; label: string };

export type ProviderFieldDef = {
  /** Form-data field key expected by backend */
  key: string;
  /** Read value from getSystemConfig() config object */
  readFromConfigKey: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  type?: "text" | "password";
};

export type CourierProviderDef = {
  provider: CourierProvider;
  title: string;
  category: "Courier";
  logoText: string;
  common: {
    base_url: string;
    description: string;
    note: string;
    image: string;
  };
  fields: ProviderFieldDef[];
};

export type CourierProviderConfigCard = {
  provider: CourierProvider;
  is_active: boolean;
  config: Record<string, any>;

  defaultProvider: CourierProvider | null;
  isDefault: boolean;

  base_url: string;
  description: string;
  note: string;
  imagePath: string;
};
