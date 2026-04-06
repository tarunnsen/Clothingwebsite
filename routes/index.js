const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  authCheck
} = require("../controllers/cartController");

const {
  getHome,
  getProduct,
  thankYouPage
} = require("../controllers/storefrontController");

// ======================
// CART
// ======================
router.get("/cart/auth-check", authCheck);
router.get("/cart", getCart);
router.get("/cart/add/:id", addToCart);
router.get("/cart/decrease/:id", decreaseQuantity);
router.get("/cart/remove/:id", removeFromCart);

// ======================
// STOREFRONT
// ======================
router.get("/", getHome);
router.get("/product/:id", getProduct);
router.get("/thank-you", thankYouPage);

module.exports = router;