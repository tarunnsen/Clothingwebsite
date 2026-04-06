require("dotenv").config();
const express = require("express");

const router = express.Router(); // 🔥 TOP PAR

const {
  createOrder,
  verifyPayment,
  webhookHandler,
  downloadInvoice
} = require("../controllers/paymentController");

const { checkoutPage } = require("../controllers/checkoutController");

// ======================
// USER DETAILS (temporary but required)
// ======================
router.get("/user/details", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }

  res.json({
    name: req.user.name,
    email: req.user.email
  });
});

// ======================
// CHECKOUT
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