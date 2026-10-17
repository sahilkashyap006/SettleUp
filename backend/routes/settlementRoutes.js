const express = require("express");
const router = express.Router();
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");

// Record a new settlement payment
router.post("/", async (req, res) => {
  try {
    const { groupId, paidBy, paidTo, amount } = req.body;

    if (!groupId || !paidBy || !paidTo || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid settlement details.",
      });
    }

    if (paidBy === paidTo) {
      return res.status(400).json({
        success: false,
        message: "A member cannot pay themselves.",
      });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    if (!group.members.includes(paidBy) || !group.members.includes(paidTo)) {
      return res.status(400).json({
        success: false,
        message: "Both members must belong to this group.",
      });
    }

    const settlement = await Settlement.create({
      groupId,
      paidBy,
      paidTo,
      amount: Number(amount),
    });

    res.status(201).json({
      success: true,
      message: "Settlement recorded successfully.",
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get all settlements for a group
router.get("/group/:groupId", async (req, res) => {
  try {
    const settlements = await Settlement.find({
      groupId: req.params.groupId,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Mark a settlement as completed
router.patch("/:id/complete", async (req, res) => {
  try {
    const settlement = await Settlement.findByIdAndUpdate(
      req.params.id,
      { status: "completed" },
      { new: true, runValidators: true }
    );

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found.",
      });
    }

    res.json({
      success: true,
      message: "Settlement marked as completed.",
      settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;