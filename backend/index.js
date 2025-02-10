require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { connectDB } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 4005;

app.set("trust proxy", 1);

// Global CORS Middleware for APIs (Excluding `/images`)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://localhost:5173", // Admin Panel
];

app.use((req, res, next) => {
  if (req.path.startsWith("/images")) {
    // Disable CORS for the `/images` route
    next();
  } else {
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS policy error: This origin is not allowed."));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true, // Allow cookies
      allowedHeaders: ["Content-Type", "Authorization"],
    })(req, res, next);
  }
});

// Enhanced MongoDB sanitization
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`Sanitized key: ${key} in request from ${req.originalUrl}`);
    },
  })
);

// Parse JSON and cookies
app.use(express.json());
app.use(cookieParser());

// Static file serving for `/images` (No CORS restrictions)
app.use(
  "/images",
  express.static("upload/images", {
    setHeaders: (res) => {
      res.set({
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });
    },
  })
);

// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/files", require("./routes/fileRoutes"));
app.use("/api/audit-logs", require("./routes/auditRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error. Please try again later.",
  });
});

// Start the server
app.listen(PORT, () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
