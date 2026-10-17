
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Record a settlement payment
router.post("/", async (req, res) => {
  try {
    const { groupId, paidBy, paidTo, amount } = req.body;

    if (
      !mongoose.isValidObjectId(groupId) ||
      !paidBy?.trim() ||
      !paidTo?.trim() ||
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid settlement details.",
      });
    }

    if (paidBy.trim() === paidTo.trim()) {
      return res.status(400).json({
        success: false,
        message: "A member cannot pay themselves.",
      });
    }

    const group = await Group.findOne({
      _id: groupId,
      owner: req.user.userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    if (
      !group.members.includes(paidBy.trim()) ||
      !group.members.includes(paidTo.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Both members must belong to this group.",
      });
    }

    const settlement = await Settlement.create({
      groupId,
      paidBy: paidBy.trim(),
      paidTo: paidTo.trim(),
      amount: Number(amount),
    });

    return res.status(201).json({
      success: true,
      message: "Settlement recorded successfully.",
      settlement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to record settlement.",
    });
  }
});

// Get settlements for an owned group
router.get("/group/:groupId", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.groupId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID.",
      });
    }

    const group = await Group.findOne({
      _id: req.params.groupId,
      owner: req.user.userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const settlements = await Settlement.find({
      groupId: group._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: settlements.length,
      settlements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch settlements.",
    });
  }
});

// Mark a settlement as completed
router.patch("/:id/complete", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid settlement ID.",
      });
    }

    const settlement = await Settlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found.",
      });
    }

    const group = await Group.findOne({
      _id: settlement.groupId,
      owner: req.user.userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found.",
      });
    }

    if (settlement.status === "completed") {
      return res.json({
        success: true,
        message: "Settlement is already completed.",
        settlement,
      });
    }

    settlement.status = "completed";
    await settlement.save();

    return res.json({
      success: true,
      message: "Settlement marked as completed.",
      settlement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update settlement.",
    });
  }
});

module.exports = router;
