
const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Group = require("../models/Group");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

// Check whether the logged-in user owns the group.
async function getOwnedGroup(groupId, userId) {
  if (!mongoose.isValidObjectId(groupId)) {
    return null;
  }

  return Group.findOne({
    _id: groupId,
    owner: userId,
  });
}

// Validate payer and split members against the group.
function validateExpenseMembers(group, paidBy, splitAmong) {
  if (!group.members.includes(paidBy)) {
    return "The payer must be a member of this group.";
  }

  if (
    !Array.isArray(splitAmong) ||
    splitAmong.length === 0 ||
    splitAmong.some((member) => !group.members.includes(member))
  ) {
    return "All split members must belong to this group.";
  }

  if (new Set(splitAmong).size !== splitAmong.length) {
    return "Duplicate members are not allowed in the split.";
  }

  return null;
}

// Calculate balances, including completed payments.
async function calculateBalances(groupId) {
  const expenses = await Expense.find({ groupId });

  const completedPayments = await Settlement.find({
    groupId,
    status: "completed",
  });

  const balances = {};

  for (const expense of expenses) {
    const members = expense.splitAmong || [];

    if (members.length === 0) continue;

    const share = expense.amount / members.length;

    for (const member of members) {
      balances[member] = (balances[member] || 0) - share;
    }

    balances[expense.paidBy] =
      (balances[expense.paidBy] || 0) + expense.amount;
  }

  for (const payment of completedPayments) {
    balances[payment.paidBy] =
      (balances[payment.paidBy] || 0) + payment.amount;

    balances[payment.paidTo] =
      (balances[payment.paidTo] || 0) - payment.amount;
  }

  for (const member of Object.keys(balances)) {
    balances[member] = Math.round(balances[member] * 100) / 100;
  }

  return { balances, expenses, completedPayments };
}

// CREATE an expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, paidBy, groupId, splitAmong } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof paidBy !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid title, amount, and payer.",
      });
    }

    const group = await getOwnedGroup(groupId, req.user.userId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const validationError = validateExpenseMembers(
      group,
      paidBy,
      splitAmong
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const expense = await Expense.create({
      title: title.trim(),
      amount: Number(amount),
      paidBy,
      groupId: group._id,
      splitAmong,
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET balances for an owned group
router.get("/group/:groupId/balances", async (req, res) => {
  try {
    const group = await getOwnedGroup(
      req.params.groupId,
      req.user.userId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const { balances, completedPayments } = await calculateBalances(
      group._id
    );

    res.status(200).json({
      success: true,
      completedPaymentCount: completedPayments.length,
      balances,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// SETTLE UP: Calculate minimum transactions
router.get("/group/:groupId/settle-up", async (req, res) => {
  try {
    const group = await getOwnedGroup(
      req.params.groupId,
      req.user.userId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const { balances } = await calculateBalances(group._id);

    const creditors = [];
    const debtors = [];

    for (const [person, balance] of Object.entries(balances)) {
      if (balance > 0.01) {
        creditors.push({ person, amount: balance });
      } else if (balance < -0.01) {
        debtors.push({ person, amount: -balance });
      }
    }

    const transactions = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(
        debtors[i].amount,
        creditors[j].amount
      );

      transactions.push({
        from: debtors[i].person,
        to: creditors[j].person,
        amount: Math.round(amount * 100) / 100,
      });

      debtors[i].amount -= amount;
      creditors[j].amount -= amount;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    res.status(200).json({
      success: true,
      transactionCount: transactions.length,
      transactions,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET expenses for an owned group
router.get("/group/:groupId", async (req, res) => {
  try {
    const group = await getOwnedGroup(
      req.params.groupId,
      req.user.userId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const expenses = await Expense.find({ groupId: group._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET all expenses belonging to the user's groups
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find({ owner: req.user.userId }).select("_id");
    const groupIds = groups.map((group) => group._id);

    const expenses = await Expense.find({
      groupId: { $in: groupIds },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET one expense, only if its group is owned by the user
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const group = await getOwnedGroup(
      expense.groupId,
      req.user.userId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    res.status(200).json({ success: true, expense });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE an expense
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const existingExpense = await Expense.findById(req.params.id);

    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const existingGroup = await getOwnedGroup(
      existingExpense.groupId,
      req.user.userId
    );

    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const {
      title = existingExpense.title,
      amount = existingExpense.amount,
      paidBy = existingExpense.paidBy,
      groupId = existingExpense.groupId.toString(),
      splitAmong = existingExpense.splitAmong,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      !Number.isFinite(Number(amount)) ||
      Number(amount) <= 0 ||
      typeof paidBy !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid title, amount, and payer.",
      });
    }

    const group = await getOwnedGroup(groupId, req.user.userId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Target group not found.",
      });
    }

    const validationError = validateExpenseMembers(
      group,
      paidBy,
      splitAmong
    );

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        title: title.trim(),
        amount: Number(amount),
        paidBy,
        groupId: group._id,
        splitAmong,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE an expense
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    const group = await getOwnedGroup(
      expense.groupId,
      req.user.userId
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
