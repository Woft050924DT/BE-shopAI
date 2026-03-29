const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  process.env.JWT_SECRET ||
  "jwt_dev_secret_please_change";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "access_token";

function normalizeRole(role) {
  return role === "admin" ? "admin" : "user";
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.user_id || user.id,
      email: user.email,
      role: normalizeRole(user.role),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

module.exports = {
  AUTH_COOKIE_NAME,
  normalizeRole,
  signAccessToken,
  verifyAccessToken,
  getCookieOptions,
};
