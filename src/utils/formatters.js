export const formatCurrency = (amount) => {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
};

const normalizeDate = (date) => {
  const value = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(value.getTime())) return null;
  return value;
};

const pad2 = (value) => String(value).padStart(2, '0');

export const formatDate = (date) => {
  const value = normalizeDate(date);
  if (!value) return '';
  return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`;
};

export const formatDateTime = (date) => {
  const value = normalizeDate(date);
  if (!value) return '';
  return `${formatDate(value)} ${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
};
