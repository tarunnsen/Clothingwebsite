require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { productModel } = require("../models/product");
const { generateInvoice } = require("../utils/generateInvoice.js");
const { sendSMS } = require("../utils/twilioService.js.js");
const path = require("path");
const fs = require("fs");
const Order = require("../models/order.js");

const { createOrder } = require("../controllers/paymentController.js");


const router = express.Router();

function runInBackground(task) {
  setImmediate(() => {
    Promise.resolve()
      .then(task)
      .catch((err) => {
        console.error("Background task failed:", err?.message || err);
      });
  });
}

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

router.post("/api/payment/verify", async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await Order.findOne({ orderId: razorpayOrderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found in database" });
    }

    order.status = "paid";
    order.paymentId = razorpayPaymentId;

    if (!order.address || order.address.street === "N/A") {
      order.address = order.address || {
        street: "Unknown",
        city: "Unknown",
        state: "Unknown",
        zip: "Unknown",
        country: "Unknown",
      };
    }

    await order.save();

    const orderIdForInvoice = order.orderId;
    const phoneForSms = order.phone;

    runInBackground(async () => {
      await generateInvoice(order);
      await sendSMS(
        phoneForSms,
        `🎉 Your order ${orderIdForInvoice} has been confirmed! 🚀`
      );
    });

    res.json({
      success: true,
      message: "Payment verified successfully!",
      invoiceUrl: `/payment/download-invoice/${order.orderId}`,
      redirectUrl: `/thank-you?orderId=${razorpayOrderId}`,
    });
  } catch (error) {
    console.error("Payment verify error:", error?.message || error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/webhook", async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return res.status(500).json({ success: false, message: "Server error: Webhook secret missing" });
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const { payload } = req.body;
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const phone = payment.contact;

    const newAddress = {
      street: payment.notes?.street || "N/A",
      city: payment.notes?.city || "N/A",
      state: payment.notes?.state || "N/A",
      zip: payment.notes?.zip || "N/A",
      country: payment.notes?.country || "N/A",
    };

    const existingOrder = await Order.findOne({ orderId });

    if (!existingOrder) {
      return res.status(400).json({ success: false, message: "Order not found in DB" });
    }

    if (
      !existingOrder.address ||
      existingOrder.address.street === "N/A" ||
      existingOrder.address.city === "N/A"
    ) {
      existingOrder.address = newAddress;
    }

    existingOrder.status = "paid";
    existingOrder.phone = phone;
    existingOrder.paymentId = paymentId;
    await existingOrder.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error?.message || error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

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
