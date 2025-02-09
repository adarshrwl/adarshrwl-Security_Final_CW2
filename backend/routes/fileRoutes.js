const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    const sanitizedFilename = path.basename(file.originalname).replace(/[^a-zA-Z0-9]/g, "_");
    const fileExtension = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}_${Date.now()}${fileExtension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// Upload endpoint
router.post("/upload", upload.single("product"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    res.json({
      success: true,
      image_url: `http://localhost:${process.env.PORT || 4005}/images/${req.file.filename}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error uploading file" });
  }
});

module.exports = router;
