import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let pendingQueue = [];

function processQueue(err, token = null) {
  pendingQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  pendingQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status === 401 && !orig._retry) {
      const rt = localStorage.getItem('admin_refreshToken');
      if (!rt) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
        return Promise.reject(err);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          orig.headers.Authorization = `Bearer ${newToken}`;
          return api(orig);
        });
      }
      orig._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, { refreshToken: rt });
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;
        localStorage.setItem('admin_token', newAccess);
        localStorage.setItem('admin_refreshToken', newRefresh);
        processQueue(null, newAccess);
        orig.headers.Authorization = `Bearer ${newAccess}`;
        return api(orig);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
