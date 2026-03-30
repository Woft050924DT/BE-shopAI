const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  create,
  getCategories,
  getCategoryByIdentifier,
} = require("../controllers/category.controller");
const { requireAuth, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", asyncHandler(requireAuth), asyncHandler(authorizeRoles("admin")), asyncHandler(create));
router.get("/", asyncHandler(getCategories));
router.get("/:identifier", asyncHandler(getCategoryByIdentifier));

module.exports = router;
