const express = require("express");
const router = express.Router();
const { validateAdmin } = require("../middleware/admin");

const {
  createAdmin,
  loginPage,
  loginAdmin,
  logoutAdmin,
  dashboard
} = require("../controllers/adminAuthController");

const {
  getProducts,
  getProductDetails
} = require("../controllers/adminProductController");

const {
  getOrders,
  updateOrder
} = require("../controllers/adminOrderController");

// Auth
router.get("/admin/create", createAdmin);
router.get("/login", loginPage);
router.post("/login", loginAdmin);
router.get("/logout", validateAdmin, logoutAdmin);

// Dashboard
router.get("/dashboard", validateAdmin, dashboard);

// Products
router.get("/products", validateAdmin, getProducts);
router.get("/product/:id", validateAdmin, getProductDetails);

// Orders
router.get("/orders", validateAdmin, getOrders);
router.post("/update-order", updateOrder);

module.exports = router;