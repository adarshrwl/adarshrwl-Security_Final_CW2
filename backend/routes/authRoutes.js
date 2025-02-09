const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const router = express.Router();

// Signup route
// Signup route
router.post(
  "/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Username must be between 2 and 50 characters.")
      .escape(),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please provide a valid email address.")
      .normalizeEmail(),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
      .withMessage(
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character."
      ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Send detailed validation errors to the frontend
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: errors.array(),
      });
    }

    try {
      const { username, email, password } = req.body;

      // Check if user already exists
      const existingUser = await Users.findOne({
        email: email.toLowerCase(),
      }).lean();
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message:
            "A user with this email already exists. Please log in or use a different email.",
        });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new Users({
        name: username,
        email: email.toLowerCase(),
        password: hashedPassword,
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      // Send success response
      res.status(201).json({
        success: true,
        message: "User created successfully. Welcome!",
        token,
      });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({
        success: false,
        message:
          "An error occurred while creating the account. Please try again later.",
      });
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
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error during login" });
    }
  }
);

module.exports = router;
