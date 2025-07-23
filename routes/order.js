const express = require("express");
const router = express.Router();
const { paymentModel } = require("../models/payment");

router.get("/:orderid", async (req, res) => {
    try {
        const orderId = req.params.orderid;

        // ✅ Ensure orderId is a valid string and not mistaken for _id
        if (!orderId || orderId.length < 10) {
            return res.status(400).json({ success: false, message: "Invalid Order ID" });
        }

        const paymentDetails = await paymentModel.findOne({ orderId: orderId });

        if (!paymentDetails) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.json({ success: true, data: paymentDetails });
    } catch (error) {
        console.error("Error fetching order:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
