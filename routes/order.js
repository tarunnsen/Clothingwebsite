const express = require("express");
const router = express.Router();
const Order = require("../models/order"); // ✅ FIXED

router.get("/:orderid", async (req, res) => {
    try {
        const orderId = req.params.orderid;

        if (!orderId || orderId.length < 10) {
            return res.status(400).json({
                success: false,
                message: "Invalid Order ID"
            });
        }

        // ✅ FIXED: Order model use
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error("Error fetching order:", error.message);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;