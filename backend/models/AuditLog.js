const mongoose = require("mongoose");

// const auditLogSchema = new mongoose.Schema({
//   adminId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   action: { type: String, required: true }, // Example: "Product Added"
//   details: { type: String }, // Extra info about the action
//   ipAddress: { type: String }, // Capturing IP for tracking
//   timestamp: { type: Date, default: Date.now },
// });

// ✅ Correctly export the model
module.exports = mongoose.model("AuditLog", auditLogSchema);
