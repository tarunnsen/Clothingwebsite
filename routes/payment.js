require("dotenv").config();
const express = require("express");

const {
  createOrder,
  verifyPayment,
  webhookHandler,
  downloadInvoice
} = require("../controllers/paymentController");

//  ADD THIS
const { checkoutPage } = require("../controllers/checkoutController");

const router = express.Router();

// ======================
// CHECKOUT (IMPORTANT)
// ======================
router.get("/checkout/:id", checkoutPage);

// ======================
// PAYMENT ROUTES
// ======================
router.post("/create/orderId", createOrder);
router.post("/api/payment/verify", verifyPayment);
router.post("/webhook", webhookHandler);

// ======================
// INVOICE
// ======================
router.get("/download-invoice/:orderId", downloadInvoice);

module.exports = router;