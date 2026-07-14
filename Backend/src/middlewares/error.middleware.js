export const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Endpoint bulunamadı: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  console.error("Genel sunucu hatası:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || "Sunucuda beklenmeyen bir hata oluştu.",
  });
};