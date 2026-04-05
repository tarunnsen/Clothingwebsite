require("dotenv").config();
const express = require("express");
const { productModel } = require("../models/product");

const {
  createOrder,
  verifyPayment,
  webhookHandler
} = require("../controllers/paymentController");

const router = express.Router();

// User details
router.get("/user/details", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ name: req.user.name, email: req.user.email });
});

// Checkout page
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

// Payment routes
router.post("/create/orderId", createOrder);
router.post("/api/payment/verify", verifyPayment);
router.post("/webhook", webhookHandler);

module.exports = router;