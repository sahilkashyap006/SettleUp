const express = require("express");

const router = express.Router();

router.post("/test", (req, res) => {
  res.json({
    message: "Data received successfully",
    receivedData: req.body
  });
});

module.exports = router;