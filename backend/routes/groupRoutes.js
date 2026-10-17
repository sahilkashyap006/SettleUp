const express = require("express");
const router = express.Router();
const Group = require("../models/Group");


router.get("/", async (req, res) => {
  try {
    const groups = await Group.find();

    res.status(200).json({
      success: true,
      count: groups.length,
      groups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.status(200).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid group ID"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid group ID"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, members, createdBy } = req.body;

    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { name, members, createdBy },
      { new: true, runValidators: true }
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Group updated successfully",
      group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});




router.post("/", async (req, res) => {
  try {
    const { name, members, createdBy } = req.body;

    const group = await Group.create({
      name,
      members,
      createdBy
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      group
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;