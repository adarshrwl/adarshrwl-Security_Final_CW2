const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true, minLength: 2, maxLength: 100 },
  image: { type: String, required: true, trim: true },
  category: { type: String, required: true, enum: ["women", "men", "kids"] },
  new_price: { type: Number, required: true, min: 0 },
  old_price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Products", productSchema);
