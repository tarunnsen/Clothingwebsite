const express = require("express");
const router = express.Router();

const { getOrderById } = require("../controllers/orderController");

// GET ORDER BY ID
router.get("/:orderId", getOrderById);

module.exports = router;