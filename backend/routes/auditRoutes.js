const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog"); // Import the AuditLog model

// Get audit logs with pagination and filtering
router.get("/logs", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page)) || 1;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit))) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Add filters if provided
    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.action) query.action = new RegExp(req.query.action, "i");
    if (req.query.startDate)
      query.timestamp = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) {
      query.timestamp = {
        ...query.timestamp,
        $lte: new Date(req.query.endDate),
      };
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email") // Populate userId field with user name and email
      .lean();

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "Error fetching audit logs",
    });
  }
});

module.exports = router;
