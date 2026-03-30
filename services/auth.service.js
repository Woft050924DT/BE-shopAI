const bcrypt = require("bcryptjs");
const { prisma } = require("../helper/prisma");
const { normalizeRole, signAccessToken } = require("../helper/auth");
const SALT_ROUNDS = 10;
const BCRYPT_HASH_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function mapUser(user) {
  return {
    id: user.user_id,
    fullName: user.full_name,
    email: user.email,
    role: normalizeRole(user.role),
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
      role: true,
      created_at: true,
    },
  });

  const token = signAccessToken(createdUser);

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
      role: true,
      password_hash: true,
      created_at: true,
    },
  });

  if (!user) {
    return { status: 401, payload: { message: "Email hoac mat khau khong dung" } };
  }

  const storedPassword = String(user.password_hash || "");
  const isBcryptHash = BCRYPT_HASH_REGEX.test(storedPassword);
  const isMatch = isBcryptHash
    ? await bcrypt.compare(rawPassword, storedPassword)
    : rawPassword === storedPassword;

  if (!isMatch) {
    return { status: 401, payload: { message: "Email hoac mat khau khong dung" } };
  }

  if (!isBcryptHash) {
    const upgradedPasswordHash = await bcrypt.hash(rawPassword, SALT_ROUNDS);
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { password_hash: upgradedPasswordHash },
    });
  }

  const token = signAccessToken(user);

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
