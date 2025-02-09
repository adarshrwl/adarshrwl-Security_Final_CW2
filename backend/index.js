require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const { connectDB } = require("./config/database");

// Initialize the app
const app = express();
const PORT = process.env.PORT || 4005;

// Trust proxy for rate limiting if behind a proxy
app.set("trust proxy", 1);

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 100 requests per window
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, try again later.",
    });
  },
});

// Apply rate limiter globally
app.use(limiter);

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Enhanced MongoDB sanitization
app.use(
  mongoSanitize({
    replaceWith: "_",
    onSanitize: ({ req, key }) => {
      console.warn(`This request[${key}] is sanitized`, req.originalUrl);
    },
  })
);

// Connect to MongoDB
connectDB();

// Static file serving for uploaded images
app.use(
  "/images",
  express.static("upload/images", {
    setHeaders: (res) => {
      res.set({
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
        "Cache-Control": "public, max-age=31536000",
      });
    },
  })
);

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
    message: "Something went wrong!",
  });
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
