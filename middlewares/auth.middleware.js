const AppError = require("../utils/appError");
const { AUTH_COOKIE_NAME, normalizeRole, verifyAccessToken } = require("../helper/auth");
const { prisma } = require("../helper/prisma");

function parseCookies(cookieHeader) {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce((cookies, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return cookies;
  }, {});
}

function extractToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  return cookies[AUTH_COOKIE_NAME] || bearerToken || null;
}

async function requireAuth(req, _res, next) {
  const token = extractToken(req);

  if (!token) {
    return next(new AppError("Chua dang nhap", 401));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.users.findUnique({
      where: { user_id: payload.sub },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    if (!user || user.status !== "active") {
      return next(new AppError("Tai khoan khong hop le", 401));
    }

    req.auth = {
      id: user.user_id,
      email: user.email,
      fullName: user.full_name,
      role: normalizeRole(user.role),
      createdAt: user.created_at,
    };

    return next();
  } catch (_error) {
    return next(new AppError("Token khong hop le hoac da het han", 401));
  }
}

function authorizeRoles(...roles) {
  const allowedRoles = new Set(roles);

  return function authorize(req, _res, next) {
    if (!req.auth) {
      return next(new AppError("Chua dang nhap", 401));
    }

    if (!allowedRoles.has(req.auth.role)) {
      return next(new AppError("Ban khong co quyen truy cap", 403));
    }

    return next();
  };
}

module.exports = {
  requireAuth,
  authorizeRoles,
};
