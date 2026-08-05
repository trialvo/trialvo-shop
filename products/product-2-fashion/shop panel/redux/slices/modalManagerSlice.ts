import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ModalKey =
  | "quickAdd"
  | "quickEdit"
  | "cancelOrder"
  | "confirmDelete"
  | "multiAdd"
  | "insertPhone"
  | "verifyIdentity"
  | "customerAddress"
  | "changePassword"
  | "signIn"
  ;

export type ModalStackItem = {
  id: number;
  key: ModalKey;
  payload?: unknown;
};

type ModalManagerState = {
  seq: number;
  stack: ModalStackItem[];
};

const initialState: ModalManagerState = {
  seq: 0,
  stack: [],
};

const modalManagerSlice = createSlice({
  name: "modalManager",
  initialState,
  reducers: {
    openModal: (
      state,
      action: PayloadAction<{
        key: ModalKey;
        payload?: unknown;
        replace?: boolean;
      }>
    ) => {
      const nextId = state.seq + 1;
      state.seq = nextId;

      const item: ModalStackItem = {
        id: nextId,
        key: action.payload.key,
        payload: action.payload.payload,
      };

      if (action.payload.replace && state.stack.length > 0) {
        state.stack[state.stack.length - 1] = item;
      } else {
        state.stack.push(item);
      }
    },

    closeTopModal: (state) => {
      state.stack.pop();
    },

    closeModalById: (state, action: PayloadAction<number>) => {
      state.stack = state.stack.filter((m) => m.id !== action.payload);
    },

    closeAllModals: (state) => {
      state.stack = [];
    },
  },
});

export const { openModal, closeTopModal, closeModalById, closeAllModals } =
  modalManagerSlice.actions;

export default modalManagerSlice.reducer;
