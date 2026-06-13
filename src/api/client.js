import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getAccessToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');
const clearAuthStorage = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('username');
  localStorage.removeItem('roles');
};

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

const setTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

client.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAuthToken = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }

  const response = await refreshClient.post('/api/auth/refresh', { refreshToken });
  const responseData = response.data?.data;
  if (!responseData?.accessToken) {
    throw new Error('Invalid refresh response');
  }

  setTokens(responseData);
  return responseData.accessToken;
};

const dispatchToast = (message, type = 'info') => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
};

// Đọc message từ error response, kể cả khi responseType là 'blob'
const getErrorMessageFromResponse = async (error) => {
  const data = error.response?.data;
  if (!data) return null;

  // Nếu response là Blob (do responseType: 'blob'), parse sang JSON để lấy message
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const json = JSON.parse(text);
      return json?.message || null;
    } catch {
      return null;
    }
  }

  return data?.message || null;
};

client.interceptors.response.use(
  (response) => {
    // Bỏ qua success-check với blob response (binary data không có field 'success')
    if (
      response.data &&
      !(response.data instanceof Blob) &&
      response.data.success === false
    ) {
      const error = new Error(response.data.message || 'Request failed');
      error.response = { data: response.data, status: response.status };
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Chỉ coi là auth-request thuần (login/refresh/logout) - KHÔNG bao gồm /api/auth/me
    // vì /me là protected endpoint cần token refresh như các endpoint khác
    const isLoginOrRefresh =
      originalRequest?.url?.includes('/api/auth/login') ||
      originalRequest?.url?.includes('/api/auth/refresh') ||
      originalRequest?.url?.includes('/api/auth/logout');

    // Thử refresh token với mọi 401 (kể cả /api/auth/me), trừ login/refresh/logout
    if (status === 401 && !originalRequest?._retry && !isLoginOrRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const accessToken = await refreshAuthToken();
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Login / refresh endpoint bị 401 → xóa session và về login
    if (status === 401 && isLoginOrRefresh) {
      clearAuthStorage();
      window.location.href = '/login';
    }

    if (status === 403) {
      dispatchToast('Không có quyền truy cập', 'warning');
    }

    if (status === 404) {
      dispatchToast('Không tìm thấy', 'warning');
    }

    if (status === 500) {
      dispatchToast('Lỗi máy chủ, thử lại sau', 'error');
    }

    return Promise.reject(error);
  }
);

export default client;
