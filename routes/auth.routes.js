const express = require("express");
const { loginUser, registerUser } = require("../services/auth.service");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const result = await registerUser({ fullName, email, password });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser({ email, password });
    return res.status(result.status).json(result.payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi máy chủ" });
  }
});

module.exports = router;
