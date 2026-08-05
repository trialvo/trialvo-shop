import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
  searchOpen: boolean;
}

const initialState: UIState = {
  isLoading: false,
  error: null,
  success: null,
  searchOpen: false,
};

const uiSlice = createSlice({
  name: "ui",
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
    setSearchOpen: (state, action: PayloadAction<boolean>) => {
      state.searchOpen = action.payload;
    },
    toggleSearchOpen: (state) => {
      state.searchOpen = !state.searchOpen;
    },
    resetAuthUi: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setSuccess,
  clearMessages,
  setSearchOpen,
  toggleSearchOpen,
  resetAuthUi,
} = uiSlice.actions;

export default uiSlice.reducer;
