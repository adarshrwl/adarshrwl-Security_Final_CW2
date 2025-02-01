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

// 🚀 Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*", // Allow all origins (Change to frontend URL if needed)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(mongoSanitize());

// 🚀 **Rate Limiting**
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res
      .status(400)
      .json({ success: false, message: "Too many requests, try again later." });
  },
});
app.use(limiter);

// 🚀 **Database Connection**
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// 🚀 **User Schema**
const Users = mongoose.model("Users", {
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  cartData: { type: Object },
  date: { type: Date, default: Date.now },
});

// 🚀 **Product Schema**
const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: { type: Number, required: true },
  old_price: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

// 🚀 **User Authentication**
app.post(
  "/signup",
  [
    body("username")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Username is required"),
    body("email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .trim()
      .isLength({ min: 8 })
      .escape()
      .withMessage("Password must be at least 8 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let existingUser = await Users.findOne({ email: req.body.email }).lean();
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, errors: "User already exists" });
      }

      let cart = Array(300).fill(0);
      const hashedPassword = await bcrypt.hash(req.body.password, SALT_ROUNDS);
      const user = new Users({
        name: req.body.username,
        email: req.body.email,
        password: hashedPassword,
        cartData: cart,
      });
      await user.save();

      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// 🚀 **User Login**
app.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      let user = await Users.findOne({ email: req.body.email })
        .select("name email password")
        .lean();
      if (!user) {
        return res
          .status(401)
          .json({ success: false, errors: "Invalid Credentials" });
      }

      const isMatch = await bcrypt.compare(req.body.password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, errors: "Invalid Credentials" });
      }

      const token = jwt.sign({ id: user.id }, JWT_SECRET);
      res.json({ success: true, token });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);
app.post("/addproduct", async (req, res) => {
  try {
    const { name, image, category, new_price, old_price } = req.body;

    if (
      !name ||
      !category ||
      new_price == null ||
      old_price == null ||
      !image
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    let lastProduct = await Product.findOne().sort({ id: -1 }).lean();
    let id = (lastProduct?.id ?? 0) + 1; // ✅ Fix: Ensures ID is always valid

    // ✅ Fix: Ensure image URL is absolute
    const imageUrl = image.startsWith("http")
      ? image
      : `http://localhost:${PORT}/images/${image}`;

    const product = new Product({
      id,
      name,
      image: imageUrl, // ✅ Store full image URL
      category,
      new_price,
      old_price,
      available: true,
    });

    await product.save();
    res.json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 **Remove Product**
app.post("/removeproduct", async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({
      id: Number(req.body.id),
    }).lean();
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, name: deletedProduct.name });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/popularinwomen", async (req, res) => {
  try {
    let products = await Product.find({ category: "women" }).lean();
    res.json(Array.isArray(products) ? products : []); // ✅ Always return an array
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 **Get All Products**
app.get("/allproducts", async (req, res) => {
  try {
    let products = await Product.find({}).lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🚀 **Image Upload**
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    return cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage: storage });

// 🚀 **Static File Serving with CORS Fix**
app.use(
  "/images",
  express.static("upload/images", {
    setHeaders: (res, path, stat) => {
      res.set("Access-Control-Allow-Origin", "*"); // ✅ Allow all origins
      res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.set("Content-Type", "image/png"); // Ensure correct MIME type
    },
  })
);

app.post("/upload", upload.single("product"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }

  res.json({
    success: 1,
    image_url: `http://localhost:${PORT}/images/${req.file.filename}`, // ✅ Full URL returned
  });
});

// 🚀 **Start Server**
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
