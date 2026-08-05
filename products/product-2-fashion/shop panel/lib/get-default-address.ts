export type HasId = { id: number };

export type UserAddressSource<TAddress extends HasId> = {
  addresses?: TAddress[] | null;
  default_address?: number | TAddress | null;
};

const getDefaultAddressId = <TAddress extends HasId>(
  v: number | TAddress | null | undefined,
): number | null => {
  if (typeof v === "number") return v;
  if (v && typeof v === "object" && typeof v.id === "number") return v.id;
  return null;
};

export function getDefaultAddress<TAddress extends HasId>(
  user?: UserAddressSource<TAddress> | null,
): TAddress | null {
  const defaultId = getDefaultAddressId<TAddress>(user?.default_address);
  if (defaultId == null) return null;

  const list = user?.addresses;
  if (!Array.isArray(list) || list.length === 0) {
    const d = user?.default_address;
    if (d && typeof d === "object") return d;
    return null;
  }

  return list.find((a) => a.id === defaultId) ?? null;
}
