import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, isAuthenticated: !!localStorage.getItem('token') },
  reducers: {
    setOwner: (state, action) => { state.user = action.payload; state.isAuthenticated = true; },
    clearOwner: (state) => { state.user = null; state.isAuthenticated = false; },
  },
});

export const { setOwner, clearOwner } = authSlice.actions;

const store = configureStore({
  reducer: { auth: authSlice.reducer },
});

export default store;
