import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/api';

export const checkAuth = createAsyncThunk('auth/check', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('accessToken');
  if (!token) return rejectWithValue('No token');
  try {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  } catch {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return rejectWithValue('Invalid token');
  }
});

export const sendOtp = createAsyncThunk('auth/sendOtp', async (phone, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/send-otp', { phone });
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to send OTP');
  }
});

export const verifyOtp = createAsyncThunk('auth/verifyOtp', async ({ phone, otp }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/verify-otp', { phone, otp });
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid OTP');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    await api.post('/auth/logout', { refreshToken });
  } catch { /* ignore */ }
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
});

export const loginWithEmail = createAsyncThunk('auth/loginWithEmail', async ({ email, password }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Invalid email or password');
  }
});

export const loginWithGoogle = createAsyncThunk('auth/loginWithGoogle', async (idToken, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', { idToken });
    localStorage.setItem('accessToken', data.data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.data.tokens.refreshToken);
    return data.data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Google authentication failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    otpSent: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    setOtpSent: (state, action) => { state.otpSent = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => { state.isLoading = true; })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(verifyOtp.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.otpSent = false;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(sendOtp.fulfilled, (state) => { state.otpSent = true; })
      .addCase(sendOtp.rejected, (state, action) => { state.error = action.payload; })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(loginWithEmail.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginWithEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginWithEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(loginWithGoogle.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setOtpSent } = authSlice.actions;
export default authSlice.reducer;
