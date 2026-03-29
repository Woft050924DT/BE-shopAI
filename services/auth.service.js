const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../helper/prisma");

const JWT_SECRET =
  process.env.JWT_SECRET_KEY ||
  process.env.JWT_SECRET ||
  "jwt_dev_secret_please_change";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS = 10;

function mapUser(user) {
  return {
    id: user.user_id,
    fullName: user.full_name,
    email: user.email,
    createdAt: user.created_at,
  };
}

async function registerUser({ fullName, email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedName = String(fullName || "").trim();
  const rawPassword = String(password || "");

  if (!normalizedName || !normalizedEmail || !rawPassword) {
    return { status: 400, payload: { message: "Thieu thong tin dang ky" } };
  }

  const existingUser = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: { user_id: true },
  });

  if (existingUser) {
    return { status: 409, payload: { message: "Email da duoc su dung" } };
  }

  const passwordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
  const createdUser = await prisma.users.create({
    data: {
      full_name: normalizedName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: "customer",
      status: "active",
    },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      created_at: true,
    },
  });

  const token = jwt.sign(
    { sub: createdUser.user_id, email: createdUser.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    status: 201,
    payload: {
      message: "Dang ky thanh cong",
      token,
      user: mapUser(createdUser),
    },
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (!normalizedEmail || !rawPassword) {
    return { status: 400, payload: { message: "Thieu email hoac mat khau" } };
  }

  const user = await prisma.users.findUnique({
    where: { email: normalizedEmail },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      password_hash: true,
      created_at: true,
    },
  });

  if (!user) {
    return { status: 401, payload: { message: "Email hoac mat khau khong dung" } };
  }

  const isMatch = await bcrypt.compare(rawPassword, user.password_hash);

  if (!isMatch) {
    return { status: 401, payload: { message: "Email hoac mat khau khong dung" } };
  }

  const token = jwt.sign({ sub: user.user_id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    status: 200,
    payload: {
      message: "Dang nhap thanh cong",
      token,
      user: mapUser(user),
    },
  };
}

module.exports = {
  registerUser,
  loginUser,
};
