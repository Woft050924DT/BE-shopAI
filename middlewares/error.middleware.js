const AppError = require("../utils/appError");

function notFoundHandler(req, _res, next) {
  next(new AppError(`Khong tim thay ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Loi may chu";

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    details: error.details || null,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
