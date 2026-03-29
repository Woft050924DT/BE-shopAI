const AppError = require("../utils/appError");
const { registerUser, loginUser } = require("../services/auth.service");
const { AUTH_COOKIE_NAME, getCookieOptions } = require("../helper/auth");

async function register(req, res) {
  const { fullName, email, password } = req.body;
  const result = await registerUser({ fullName, email, password });

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  res.cookie(AUTH_COOKIE_NAME, result.payload.token, getCookieOptions());
  return res.status(result.status).json({ success: true, ...result.payload });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  res.cookie(AUTH_COOKIE_NAME, result.payload.token, getCookieOptions());
  return res.status(result.status).json({ success: true, ...result.payload });
}

function me(req, res) {
  return res.status(200).json({
    success: true,
    message: "Lay thong tin tai khoan thanh cong",
    user: req.auth,
  });
}

function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    ...getCookieOptions(),
    maxAge: undefined,
  });

  return res.status(200).json({
    success: true,
    message: "Dang xuat thanh cong",
  });
}

function adminDashboard(req, res) {
  return res.status(200).json({
    success: true,
    message: "Truy cap admin thanh cong",
    user: req.auth,
  });
}

function userDashboard(req, res) {
  return res.status(200).json({
    success: true,
    message: "Truy cap user thanh cong",
    user: req.auth,
  });
}

module.exports = {
  register,
  login,
  me,
  logout,
  adminDashboard,
  userDashboard,
};
