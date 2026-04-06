const express = require("express");
const router = express.Router();

const {
  getHome,
  getProduct,
  thankYouPage
} = require("../controllers/storefrontController");

// ======================
// STOREFRONT ONLY
// ======================
router.get("/", getHome);
router.get("/product/:id", getProduct);
router.get("/thank-you", thankYouPage);

module.exports = router;