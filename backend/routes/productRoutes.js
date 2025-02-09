const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// Add product
router.post("/addproduct", async (req, res) => {
  try {
    const { name, image, category, new_price, old_price } = req.body;

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

    const validCategories = ["women", "men", "kids"];
    if (!validCategories.includes(category.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const lastProduct = await Product.findOne().sort({ id: -1 }).lean();
    const id = (lastProduct?.id || 0) + 1;

    const imageUrl = image.startsWith("http")
      ? image
      : `http://localhost:${process.env.PORT || 4005}/images/${image}`;

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
    res.json({ success: true, message: "Product added successfully", product });
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ success: false, message: "Error adding product" });
  }
});

// Remove product
router.post("/removeproduct", async (req, res) => {
  try {
    const { id } = req.body;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const deletedProduct = await Product.findOneAndDelete({
      id: productId,
    }).lean();
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
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, message: "Error removing product" });
  }
});

// Fetch all products
router.get("/allproducts", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const products = await Product.find({ available: true })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(products);
  } catch (error) {
    console.error("Error fetching all products:", error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching products" });
  }
});
router.get("/popularinwomen", async (req, res) => {
  try {
    const products = await Product.find({
      category: "women",
      available: true,
    })
      .sort({ date: -1 }) // Sort by newest products
      .lean();

    res.json(products);
  } catch (error) {
    console.error("Error fetching popular products:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching popular products",
    });
  }
});

router.get("/newcollections", async (req, res) => {
  try {
    const products = await Product.find({ available: true })
      .sort({ date: -1 }) // Sort by the newest first
      .limit(10) // Limit to 10 items for new collections
      .lean();

    res.json(products);
  } catch (error) {
    console.error("Error fetching new collections:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching new collections",
    });
  }
});

module.exports = router;
