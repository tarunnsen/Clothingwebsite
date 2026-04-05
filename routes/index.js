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

const {
  checkoutPage
} = require("../controllers/checkoutController");

// Cart
router.get("/cart/auth-check", authCheck);
router.get("/cart", getCart);
router.get("/cart/add/:id", addToCart);
router.get("/cart/decrease/:id", decreaseQuantity);
router.get("/cart/remove/:id", removeFromCart);

// Checkout
router.get("/checkout/:cartId", checkoutPage);

// Storefront
router.get("/", getHome);
router.get("/product/:id", getProduct);
router.get("/thank-you", thankYouPage);

module.exports = router;