const AuditLog = require("../models/AuditLog");

/**
 * @desc    Fetch all audit logs
 * @route   GET /api/audit
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate("adminId", "name email") // Fetching admin details
      .sort({ timestamp: -1 }); // Sort logs in descending order

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Error fetching logs" });
  }
};

/**
 * @desc    Create a new audit log entry
 */
exports.createAuditLog = async (adminId, action, details, ipAddress) => {
  try {
    const log = new AuditLog({
      adminId,
      action,
      details,
      ipAddress: ipAddress || "Unknown",
      timestamp: new Date(),
    });

    await log.save();
    console.log("Audit log stored:", log);
  } catch (error) {
    console.error("Error creating audit log:", error);
  }
};

/**
 * @desc    Delete all audit logs
 * @route   DELETE /api/audit
 */
exports.clearAuditLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.status(200).json({ success: true, message: "All audit logs cleared" });
  } catch (error) {
    console.error("Error clearing audit logs:", error);
    res.status(500).json({ success: false, message: "Error clearing logs" });
  }
};
