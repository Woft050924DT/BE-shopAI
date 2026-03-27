const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const {
  getProducts,
  getProductByIdentifier,
} = require("../controllers/product.controller");

const router = express.Router();

router.get("/", asyncHandler(getProducts));
router.get("/:identifier", asyncHandler(getProductByIdentifier));

module.exports = router;
