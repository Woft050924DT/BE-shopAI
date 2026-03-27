const AppError = require("../utils/appError");
const { registerUser, loginUser } = require("../services/auth.service");

async function register(req, res) {
  const { fullName, email, password } = req.body;
  const result = await registerUser({ fullName, email, password });

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  if (result.status >= 400) {
    throw new AppError(result.payload.message, result.status, result.payload.details);
  }

  return res.status(result.status).json({ success: true, ...result.payload });
}

module.exports = {
  register,
  login,
};
