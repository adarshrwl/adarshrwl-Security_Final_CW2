const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const router = express.Router();

// Signup route
router.post(
  "/signup",
  [
    body("username").trim().isLength({ min: 2, max: 50 }).escape(),
    body("email").trim().isEmail().normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { username, email, password } = req.body;
      const existingUser = await Users.findOne({ email: email.toLowerCase() }).lean();
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new Users({
        name: username,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error creating user" });
    }
  }
);

// Login route
router.post(
  "/login",
  [
    body("email").trim().isEmail().normalizeEmail(),
    body("password").trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ email: email.toLowerCase() })
        .select("_id email password")
        .lean();

      if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error during login" });
    }
  }
);

module.exports = router;
