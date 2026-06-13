const getFilenameFromHeaders = (headers = {}, fallbackFileName) => {
  const disposition = headers['content-disposition'] || headers['Content-Disposition'];
  if (!disposition) return fallbackFileName;

  const match = disposition.match(/filename\*=(?:UTF-8'')?([^;]+)|filename="?([^"]+)"?/i);
  const filename = match?.[1] || match?.[2];
  return filename ? decodeURIComponent(filename.replace(/"/g, '')) : fallbackFileName;
};

export const downloadBlob = (response, fallbackFileName) => {
  const blob =
    response.data instanceof Blob
      ? response.data
      : new Blob([response.data], { type: response.headers?.['content-type'] });

  if (!blob || blob.size === 0) {
    throw new Error('File tải về rỗng. Vui lòng thử lại hoặc kiểm tra backend.');
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getFilenameFromHeaders(response.headers || {}, fallbackFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
