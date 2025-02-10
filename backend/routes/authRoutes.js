const express = require("express");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../models/Users");

const router = express.Router();

// Generate Access Token
const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  if (!process.env.REFRESH_SECRET) {
    throw new Error("REFRESH_SECRET is not defined");
  }
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Store refresh tokens securely (e.g., in a database or in-memory)
let refreshTokens = [];

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

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store the refresh token
      refreshTokens.push(refreshToken);

      // Send tokens
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.status(201).json({
        success: true,
        message: "User created successfully. Welcome!",
        accessToken,
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
    body("email").trim().isEmail().withMessage("Valid email is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
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

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store the refresh token
      refreshTokens.push(refreshToken);

      // Send tokens
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
      res.json({ success: true, accessToken });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ success: false, message: "Error during login" });
    }
  }
);

// Refresh Token route
router.get("/refresh-token", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is missing. Please log in again.",
    });
  }

  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).json({
      success: false,
      message: "Invalid refresh token. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
    const newAccessToken = generateAccessToken({ id: decoded.id });
    res.json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    console.error("Error during token refresh:", error);
    res.status(403).json({
      success: false,
      message: "Invalid or expired refresh token. Please log in again.",
    });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res
      .status(400)
      .json({ success: false, message: "No token to log out." });
  }

  // Remove refresh token
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);

  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully." });
});

module.exports = router;
