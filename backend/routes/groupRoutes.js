
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Group = require("../models/Group");
const authMiddleware = require("../middleware/authMiddleware");

// Every group endpoint requires a valid login token.
router.use(authMiddleware);

// GET all groups owned by the logged-in user
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({ owner: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET one group owned by the logged-in user
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const group = await Group.findOne({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({ success: true, group });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CREATE a group for the logged-in user
router.post("/", async (req, res) => {
  try {
    const { name, members, createdBy } = req.body;

    if (!name?.trim() || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Group name and at least one member are required.",
      });
    }

    const cleanMembers = members
      .filter((member) => typeof member === "string")
      .map((member) => member.trim())
      .filter(Boolean);

    if (cleanMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid member names.",
      });
    }

    const group = await Group.create({
      name: name.trim(),
      members: cleanMembers,
      createdBy: createdBy?.trim() || "User",
      owner: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE a group owned by the logged-in user
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const updates = {};
    const { name, members } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Group name cannot be empty.",
        });
      }
      updates.name = name.trim();
    }

    if (members !== undefined) {
      if (
        !Array.isArray(members) ||
        members.length === 0 ||
        members.some((member) => typeof member !== "string" || !member.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid list of members.",
        });
      }
      updates.members = members.map((member) => member.trim());
    }

    const group = await Group.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE a group owned by the logged-in user
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid group ID",
      });
    }

    const group = await Group.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.userId,
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
