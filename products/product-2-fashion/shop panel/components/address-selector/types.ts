export type AddressType = "Home" | "Office" | "Other"

export type Address = {
  id: string
  label: string;
  type?: AddressType
  name: string
  phone?: string;
  address: string
  isDefault?: boolean
}
