const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" }, // Assuming Users is your user model
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: String }, // Optional: Additional details about the action
});

// Register the schema with Mongoose
module.exports = mongoose.model("AuditLog", auditLogSchema);
