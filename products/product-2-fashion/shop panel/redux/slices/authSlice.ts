import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthUIState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

const initialState: AuthUIState = {
  isLoading: false,
  error: null,
  success: null,
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
    resetAuthUi: () => initialState,
  },
});

export const { setLoading, setError, setSuccess, clearMessages, resetAuthUi } =
  authSlice.actions;

export default authSlice.reducer;
