import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { User as ApiUser, UserAddress } from "@/lib/api/auth/types";
import { toUiAddress } from "@/lib/settings/address-adapter";
import type { ProfileFormData } from "@/lib/validation/profile";
import type { Address, User as UiUser } from "@/types/auth";

export type AuthState = {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  apiUser: ApiUser | null;
  user: UiUser | null;
};

type InitAuthPayload = {
  isAuthenticated?: boolean;
  user?: ApiUser | null;
};

const initialState: AuthState = {
  isLoading: false,
  error: null,
  success: null,
  isAuthenticated: false,
  isInitialized: false,
  apiUser: null,
  user: null,
};

const getFullName = (user: ApiUser): string => {
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return fullName || user.email;
};

const getPrimaryPhone = (user: ApiUser): string | undefined => {
  if (typeof user.default_phone === "string") {
    return user.default_phone || undefined;
  }

  if (typeof user.default_phone === "number") {
    return user.phones?.find((phone) => phone.id === user.default_phone)
      ?.phone_number;
  }

  if (user.default_phone?.phone_number) {
    return user.default_phone.phone_number;
  }

  return user.phones?.[0]?.phone_number || undefined;
};

const getDefaultAddress = (user: ApiUser): Address | null | undefined => {
  if (typeof user.default_address !== "number") {
    return toUiUserAddress(user.default_address);
  }

  const defaultAddress = user.addresses?.find(
    (address) => Number(address.id) === user.default_address,
  );

  return toUiUserAddress(defaultAddress);
};

const getAddressLine = (address: Address | null | undefined): string | undefined => {
  if (!address) return undefined;
  return [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean)
    .join(", ");
};

const getAddresses = (user: ApiUser): Address[] =>
  (user.addresses ?? [])
    .map(toUiUserAddress)
    .filter((address): address is Address => Boolean(address));

const toUiUserAddress = (
  address: UserAddress | null | undefined,
): Address | null | undefined => {
  if (!address) return address;
  if (isUiAddress(address)) return address;
  return toUiAddress(address);
};

const isUiAddress = (address: UserAddress): address is Address =>
  "usage" in address && "street" in address && "fullName" in address;

export const mapApiUserToUiUser = (user: ApiUser): UiUser => ({
  id: String(user.id),
  name: getFullName(user),
  email: user.email,
  avatar: user.img_path ?? undefined,
  phone: getPrimaryPhone(user),
  address: getAddressLine(getDefaultAddress(user)),
  addresses: getAddresses(user),
});

const replaceDefaultAddress = (addresses: Address[], next: Address): Address[] =>
  addresses.map((address) =>
    next.isDefault && address.id !== next.id
      ? { ...address, isDefault: false }
      : address,
  );

const updateApiUserFromUiUser = (apiUser: ApiUser | null, uiUser: UiUser | null) => {
  if (!apiUser || !uiUser) return apiUser;

  const [firstName = "", ...lastNameParts] = uiUser.name.trim().split(/\s+/);

  return {
    ...apiUser,
    first_name: firstName || apiUser.first_name,
    last_name: lastNameParts.join(" ") || apiUser.last_name,
    email: uiUser.email,
    img_path: uiUser.avatar ?? apiUser.img_path,
    addresses: uiUser.addresses ?? [],
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccess: (state, action: PayloadAction<string | null>) => {
      state.success = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.success = null;
    },
    initAuth: (state, action: PayloadAction<InitAuthPayload | undefined>) => {
      state.isInitialized = true;

      if (!action.payload) return;

      if (action.payload?.user) {
        state.apiUser = action.payload.user;
        state.user = mapApiUserToUiUser(action.payload.user);
        state.isAuthenticated = true;
        state.isLoading = false;
        return;
      }

      state.isAuthenticated = Boolean(action.payload?.isAuthenticated);
      if (!state.isAuthenticated) {
        state.apiUser = null;
        state.user = null;
        state.isLoading = false;
        return;
      }

      if (!state.user) state.isLoading = true;
    },
    setAuthUser: (state, action: PayloadAction<ApiUser>) => {
      state.apiUser = action.payload;
      state.user = mapApiUserToUiUser(action.payload);
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.isLoading = false;
      state.error = null;
    },
    updateProfile: (state, action: PayloadAction<Partial<ProfileFormData>>) => {
      if (!state.user) return;

      state.user = {
        ...state.user,
        name: action.payload.name ?? state.user.name,
        email: action.payload.email ?? state.user.email,
        phone: action.payload.phone ?? state.user.phone,
        address: action.payload.address ?? state.user.address,
      };
      state.apiUser = updateApiUserFromUiUser(state.apiUser, state.user);
    },
    addAddress: (state, action: PayloadAction<Address>) => {
      if (!state.user) return;

      const existing = state.user.addresses ?? [];
      const addresses = action.payload.isDefault
        ? replaceDefaultAddress(existing, action.payload)
        : existing;

      state.user.addresses = [...addresses, action.payload];
      state.apiUser = updateApiUserFromUiUser(state.apiUser, state.user);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      if (!state.user) return;

      state.user.addresses = replaceDefaultAddress(
        state.user.addresses ?? [],
        action.payload,
      ).map((address) =>
        address.id === action.payload.id ? action.payload : address,
      );
      state.apiUser = updateApiUserFromUiUser(state.apiUser, state.user);
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      if (!state.user) return;

      state.user.addresses = (state.user.addresses ?? []).filter(
        (address) => address.id !== action.payload,
      );
      state.apiUser = updateApiUserFromUiUser(state.apiUser, state.user);
    },
    logout: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.apiUser = null;
      state.user = null;
    },
    resetAuthUi: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setSuccess,
  clearMessages,
  initAuth,
  setAuthUser,
  updateProfile,
  addAddress,
  updateAddress,
  removeAddress,
  logout,
  resetAuthUi,
} = authSlice.actions;

export default authSlice.reducer;
