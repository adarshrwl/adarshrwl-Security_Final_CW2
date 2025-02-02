require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");
const mongoSanitize = require("express-mongo-sanitize");

const app = express();
const PORT = process.env.PORT || 4005;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*", // Better to specify exact frontend URL
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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, try again later.",
    });
  },
});
app.use(limiter);

// Database Connection with Security Options
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: true, // Build indexes
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// User Schema with Enhanced Validation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      "Please enter a valid email",
    ],
  },
  password: {
    type: String,
    required: true,
    minLength: 8,
  },
  cartData: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Users = mongoose.model("Users", userSchema);

// Product Schema with Enhanced Validation
const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: ["women", "men", "kids"], // Restrict to valid categories
  },
  new_price: {
    type: Number,
    required: true,
    min: 0,
  },
  old_price: {
    type: Number,
    required: true,
    min: 0,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const Product = mongoose.model("Product", productSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: "Invalid token." });
  }
};

// Signup Route with Enhanced Validation
app.post(
  "/signup",
  [
    body("username")
      .trim()
      .isLength({ min: 2, max: 50 })
      .escape()
      .withMessage("Username must be between 2 and 50 characters"),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/)
      .withMessage(
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      ),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existingUser = await Users.findOne({
        email: req.body.email.toLowerCase(),
      }).lean();

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);

      const user = new Users({
        name: req.body.username,
        email: req.body.email.toLowerCase(),
        password: hashedPassword,
        cartData: new Map(),
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating user",
      });
    }
  }
);

// Login Route with Enhanced Security
app.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password").trim().notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await Users.findOne({
        email: req.body.email.toLowerCase(),
      })
        .select("_id email password")
        .lean();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, {
        expiresIn: "24h",
      });

      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error during login",
      });
    }
  }
);

// Product Routes with Enhanced Security
app.post("/addproduct", authenticateToken, async (req, res) => {
  try {
    const { name, image, category, new_price, old_price } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !category?.trim() ||
      !image?.trim() ||
      typeof new_price !== "number" ||
      typeof old_price !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid required fields",
      });
    }

    // Get next ID safely
    const lastProduct = await Product.findOne().sort({ id: -1 }).lean();
    const id = (lastProduct?.id || 0) + 1;

    // Validate and construct image URL
    const imageUrl = image.startsWith("http")
      ? image
      : `http://localhost:${PORT}/images/${image}`;

    const product = new Product({
      id,
      name: name.trim(),
      image: imageUrl,
      category: category.trim().toLowerCase(),
      new_price: Math.max(0, new_price),
      old_price: Math.max(0, old_price),
      available: true,
    });

    await product.save();
    res.json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error adding product",
    });
  }
});

app.post("/removeproduct", authenticateToken, async (req, res) => {
  try {
    const { id } = req.body;

    if (typeof id !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deletedProduct = await Product.findOneAndDelete({ id }).lean();

    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product removed successfully",
      name: deletedProduct.name,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error removing product",
    });
  }
});

// Get Products with Pagination and Filtering
app.get("/popularinwomen", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit))) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      category: "women",
      available: true,
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
});

app.get("/allproducts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit))) || 10;
    const skip = (page - 1) * limit;

    const products = await Product.find({ available: true })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(products);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching products",
    });
  }
});

// Secure File Upload
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    // Sanitize filename
    const sanitizedFilename = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9]/g, "_");
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Only allow specific file types
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif"];
    if (!allowedExtensions.includes(fileExtension)) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, `${file.fieldname}_${Date.now()}${fileExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check mime type
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Secure Static File Serving
app.use(
  "/images",
  express.static("upload/images", {
    setHeaders: (res, path, stat) => {
      res.set({
        "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "image/jpeg", // Set appropriate content type
        "X-Content-Type-Options": "nosniff", // Prevent MIME-type sniffing
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      });
    },
  })
);

// Secure File Upload Endpoint
app.post("/upload", authenticateToken, upload.single("product"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    res.json({
      success: true,
      image_url: `http://localhost:${PORT}/images/${req.file.filename}`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error uploading file",
    });
  }
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
  });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
