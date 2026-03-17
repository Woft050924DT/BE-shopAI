const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../helper/connectDB");

const JWT_SECRET = process.env.JWT_SECRET || "jwt_dev_secret_please_change";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;
const USERS_TABLE = "auth_users";



async function registerUser({ fullName, email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();
  const rawPassword = String(password || "");

  if (!normalizedName || !normalizedEmail || !rawPassword) {
    return { status: 400, payload: { message: "Thiếu thông tin đăng ký" } };
  }

  const existingUser = await pool.query(`SELECT id FROM ${USERS_TABLE} WHERE email = $1`, [normalizedEmail]);

  if (existingUser.rows.length > 0) {
    return { status: 409, payload: { message: "Email đã được sử dụng" } };
  }

  const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
  const createdUser = await pool.query(
    `INSERT INTO ${USERS_TABLE} (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email, created_at`,
    [normalizedName, normalizedEmail, passwordHash]
  );

  const user = createdUser.rows[0];
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    status: 201,
    payload: {
      message: "Đăng ký thành công",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    },
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (!normalizedEmail || !rawPassword) {
    return { status: 400, payload: { message: "Thiếu email hoặc mật khẩu" } };
  }

  const result = await pool.query(
    `SELECT id, full_name, email, password_hash, created_at FROM ${USERS_TABLE} WHERE email = $1`,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    return { status: 401, payload: { message: "Email hoặc mật khẩu không đúng" } };
  }

  const user = result.rows[0];
  const isMatch = await bcrypt.compare(rawPassword, user.password_hash);

  if (!isMatch) {
    return { status: 401, payload: { message: "Email hoặc mật khẩu không đúng" } };
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    status: 200,
    payload: {
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        createdAt: user.created_at,
      },
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
};
