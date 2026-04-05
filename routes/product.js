const express = require("express");
const router = express.Router();

const { getAllProducts } = require("../controllers/productController");

// ✅ Public only
router.get("/", getAllProducts);

module.exports = router;