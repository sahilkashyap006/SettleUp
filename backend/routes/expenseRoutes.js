
const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");

// CREATE an expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, paidBy, groupId, splitAmong } = req.body;

    const expense = await Expense.create({
      title,
      amount,
      paidBy,
      groupId,
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

// GET balances for a specific group
router.get("/group/:groupId/balances", async (req, res) => {
  console.log("=== BALANCES ROUTE VERSION 2 ===");

  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ groupId });

    const completedPayments = await Settlement.find({
      groupId,
      status: "completed",
    });

    console.log("Group ID:", groupId);
    console.log("Expenses found:", expenses.length);
    console.log("Completed payments found:", completedPayments.length);
    console.log("Completed payments:", completedPayments);

    const balances = {};

    // Calculate balances from expenses
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

    // Apply completed payments to outstanding balances
    for (const payment of completedPayments) {
      balances[payment.paidBy] =
        (balances[payment.paidBy] || 0) + payment.amount;

      balances[payment.paidTo] =
        (balances[payment.paidTo] || 0) - payment.amount;
    }

    // Round balances to two decimal places
    for (const member of Object.keys(balances)) {
      balances[member] = Math.round(balances[member] * 100) / 100;
    }

    console.log("Final balances:", balances);

    res.status(200).json({
      success: true,
      debugVersion: "balances-v2",
      completedPaymentCount: completedPayments.length,
      completedPayments: completedPayments.map((payment) => ({
        paidBy: payment.paidBy,
        paidTo: payment.paidTo,
        amount: payment.amount,
        status: payment.status,
      })),
      balances,
    });
  } catch (error) {
    console.error("Balance calculation error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// SETTLE UP: Calculate minimum transactions
router.get("/group/:groupId/settle-up", async (req, res) => {
  try {
    const { groupId } = req.params;

    const expenses = await Expense.find({ groupId });

    const completedPayments = await Settlement.find({
      groupId,
      status: "completed",
    });

    const balances = {};

    // Calculate balances from expenses
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

    // Apply completed payments
    for (const payment of completedPayments) {
      balances[payment.paidBy] =
        (balances[payment.paidBy] || 0) + payment.amount;

      balances[payment.paidTo] =
        (balances[payment.paidTo] || 0) - payment.amount;
    }

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
    console.error("Settle-up calculation error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET expenses for a specific group
router.get("/group/:groupId", async (req, res) => {
  try {
    const expenses = await Expense.find({
      groupId: req.params.groupId,
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

// GET all expenses
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find();

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

// GET one expense
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid expense ID",
    });
  }
});

// UPDATE an expense
router.put("/:id", async (req, res) => {
  try {
    const { title, amount, paidBy, groupId, splitAmong } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, paidBy, groupId, splitAmong },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

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
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid expense ID",
    });
  }
});

module.exports = router;
