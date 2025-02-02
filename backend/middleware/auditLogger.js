// middleware/auditLogger.js

const mongoose = require("mongoose");

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  ipAddress: {
    type: String,
    required: true,
    trim: true,
  },
  userAgent: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    type: Object,
    default: {},
  },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

const logAdminAction = async (
  userId,
  action,
  description,
  req,
  metadata = {}
) => {
  try {
    const auditLog = new AuditLog({
      userId,
      action,
      description,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      metadata,
    });

    await auditLog.save();
    // console.log(`Audit log created: ${action}`);
  } catch (error) {
    console.error("Error creating audit log:", error);
    // Don't throw the error - we don't want to break the main operation if logging fails
  }
};

module.exports = logAdminAction;
