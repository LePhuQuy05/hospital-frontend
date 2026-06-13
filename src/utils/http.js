export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  const status = error?.response?.status;

  if (data instanceof Blob) {
    if (status === 401) return 'Chưa đăng nhập';
    if (status === 403) return 'Không có quyền truy cập';
    return fallback;
  }

  return data?.message || error?.message || fallback;
};

export const getFieldErrors = (error) => {
  const data = error?.response?.data?.data;
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return {};
  }
  return data;
};
