const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  decreaseQuantity,
  removeFromCart,
  authCheck
} = require("../controllers/cartController");

router.get("/auth-check", authCheck);
router.get("/", getCart);
router.get("/add/:id", addToCart);
router.get("/decrease/:id", decreaseQuantity);
router.get("/remove/:id", removeFromCart);

module.exports = router;