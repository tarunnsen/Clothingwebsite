require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { productModel } = require("../models/product");
const Order = require("../models/order.js");

const { createOrder } = require("../controllers/paymentController.js");
const { verifyPayment } = require("../controllers/paymentController.js");
const { webhookHandler } = require("../controllers/paymentController.js");

const router = express.Router();


router.get("/user/details", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ name: req.user.name, email: req.user.email });
});

router.get("/checkout/:productId", async (req, res) => {
  if (!req.user) {
    return res.redirect(`/users/signin?redirect=${encodeURIComponent(req.originalUrl)}`);
  }

  try {
    const product = await productModel.findById(req.params.productId);
    if (!product) return res.status(404).send("Product not found");

    const user = req.user;
    const cart = {
      products: [{ productId: product, quantity: 1 }],
    };

    res.render("checkout", { product, user, cart });
  } catch (error) {
    console.error("Checkout error:", error?.message || error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/create/orderId", createOrder);

router.post("/api/payment/verify", verifyPayment);

router.post("/webhook", webhookHandler);

router.get("/download-invoice/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found!" });
    }

    const invoicePath = path.join(__dirname, "../invoices", `${orderId}.pdf`);

    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({ success: false, message: "Invoice not found!" });
    }

    res.download(invoicePath);
  } catch (error) {
    console.error("Download invoice error:", error?.message || error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
