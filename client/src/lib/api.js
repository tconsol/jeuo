import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Refresh token queue (prevents race condition) ───────────────────────────
let isRefreshing = false;
let pendingQueue = []; // [{ resolve, reject }]

function processQueue(err, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  pendingQueue = [];
}

// ─── Rate limit retry queue ────────────────────────────────────────────────────
// GET requests are deduplicated by URL — only the latest is kept.
// POST/mutation requests are kept in order and staggered on retry.
const retryGetMap = new Map(); // url → { config, resolve, reject }
const retryMutations = [];     // [{ config, resolve, reject }]
let isWaitingForRateLimit = false;

async function processRetryQueue() {
  if (isWaitingForRateLimit) return;
  isWaitingForRateLimit = true;

  // Wait 30 seconds before retrying
  await new Promise(resolve => setTimeout(resolve, 30000));
  isWaitingForRateLimit = false;

  // Drain GET queue (deduplicated)
  const getEntries = [...retryGetMap.values()];
  retryGetMap.clear();

  // Drain mutation queue (ordered)
  const mutations = [...retryMutations];
  retryMutations.length = 0;

  // Fire GET requests with a small stagger to avoid bursting
  for (let i = 0; i < getEntries.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 150));
    const { config, resolve, reject } = getEntries[i];
    try { resolve(await api(config)); } catch (err) { reject(err); }
  }

  // Fire mutations with a larger stagger (preserve ordering)
  for (let i = 0; i < mutations.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 300));
    const { config, resolve, reject } = mutations[i];
    try { resolve(await api(config)); } catch (err) { reject(err); }
  }
}

function queueRetryRequest(config) {
  const method = (config.method || 'get').toLowerCase();
  const isGet = method === 'get';

  return new Promise((resolve, reject) => {
    if (isGet) {
      // Deduplicate: cancel the previous pending GET for the same URL
      const existing = retryGetMap.get(config.url);
      if (existing) existing.reject(new Error('Request superseded by newer request'));
      retryGetMap.set(config.url, { config, resolve, reject });
    } else {
      retryMutations.push({ config, resolve, reject });
    }
    processRetryQueue();
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// Response interceptor: handle token refresh and rate limits
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 (Too Many Requests) - rate limiting
    if (error.response?.status === 429 && !originalRequest._rateLimitRetry) {
      originalRequest._rateLimitRetry = true;
      console.warn('Rate limited (429). Queueing request for retry...');
      return queueRetryRequest(originalRequest);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
