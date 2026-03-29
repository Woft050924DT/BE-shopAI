const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  register,
  login,
  me,
  logout,
  adminDashboard,
  userDashboard,
} = require("../controllers/auth.controller");
const { requireAuth, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", asyncHandler(requireAuth), asyncHandler(me));
router.get("/user", asyncHandler(requireAuth), asyncHandler(authorizeRoles("user", "admin")), asyncHandler(userDashboard));
router.get("/admin", asyncHandler(requireAuth), asyncHandler(authorizeRoles("admin")), asyncHandler(adminDashboard));

module.exports = router;
