import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type DrawerKey =
  | "cart"
  | "menu"
  | "filters"
  | "accountMenu";

export type DrawerStackItem = {
  id: number;
  key: DrawerKey;
  payload?: unknown;
};

type DrawerManagerState = {
  seq: number;
  stack: DrawerStackItem[];
};

const initialState: DrawerManagerState = {
  seq: 0,
  stack: [],
};

const drawerManagerSlice = createSlice({
  name: "drawerManager",
  initialState,
  reducers: {
    openDrawer: (
      state,
      action: PayloadAction<{
        key: DrawerKey;
        payload?: unknown;
        replace?: boolean;
      }>
    ) => {
      const nextId = state.seq + 1;
      state.seq = nextId;

      const item: DrawerStackItem = {
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

    closeTopDrawer: (state) => {
      state.stack.pop();
    },

    closeDrawerById: (state, action: PayloadAction<number>) => {
      state.stack = state.stack.filter((d) => d.id !== action.payload);
    },

    closeAllDrawers: (state) => {
      state.stack = [];
    },
  },
});

export const { openDrawer, closeTopDrawer, closeDrawerById, closeAllDrawers } =
  drawerManagerSlice.actions;

export default drawerManagerSlice.reducer;
