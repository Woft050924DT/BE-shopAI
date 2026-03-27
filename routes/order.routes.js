const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { create, getDetail } = require("../controllers/order.controller");

const router = express.Router();

router.post("/", asyncHandler(create));
router.get("/:identifier", asyncHandler(getDetail));

module.exports = router;
