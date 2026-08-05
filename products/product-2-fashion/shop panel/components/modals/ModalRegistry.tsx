"use client";

import ChangePasswordModalEntry from "@/components/modals/change-password/ChangePasswordModalEntry";
import type { ModalKey } from "@/redux/slices/modalManagerSlice";
import React from "react";
import CancelOrderModalEntry from "./cancel-order/CancelOrderModalEntry";
import ConfirmDeleteModalEntry from "./confirm-delete/ConfirmDeleteModalEntry";
import CustomerModalEntry from "./customer-info/CustomerModalEntry";
import InsertPhoneModalEntry from "./insert-phone/InsertPhoneModalEntry";
import MultiAddModalEntry from "./multi-add/MultiAddModalEntry";
import QuickAddModalEntry from "./quick-add/QuickAddModalEntry";
import QuickEditModalEntry from "./quick-edit/QuickEditModalEntry";
import SignInModalEntry from "./sign-in/SignInModalEntry";
import VerifyIdentityModalEntry from "./verify-identity/VerifyIdentityModalEntry";

export type ModalEntryProps = {
  modalId: number;
  isTop: boolean;
  zIndex: number;
  payload?: unknown;
};

export const MODAL_REGISTRY: Record<ModalKey, React.FC<ModalEntryProps>> = {
  quickAdd: QuickAddModalEntry,
  quickEdit: QuickEditModalEntry,
  cancelOrder: CancelOrderModalEntry,
  confirmDelete: ConfirmDeleteModalEntry,
  multiAdd: MultiAddModalEntry,
  insertPhone: InsertPhoneModalEntry,
  verifyIdentity: VerifyIdentityModalEntry,
  customerAddress: CustomerModalEntry,
  changePassword: ChangePasswordModalEntry,
  signIn: SignInModalEntry,
};