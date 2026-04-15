import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: !!localStorage.getItem('token') },
  reducers: {
    setAdmin: (state, action) => { state.user = action.payload; state.isAuthenticated = true; },
    clearAdmin: (state) => { state.user = null; state.isAuthenticated = false; },
  },
});

export const { setAdmin, clearAdmin } = authSlice.actions;

const store = configureStore({
  reducer: { auth: authSlice.reducer },
});

export default store;
