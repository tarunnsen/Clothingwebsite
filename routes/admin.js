const express = require("express");
const router = express.Router();
const { validateAdmin } = require("../middleware/admin");
const upload = require("../config/multer");

// ======================
// AUTH CONTROLLER
// ======================
const {
  createAdmin,
  loginPage,
  loginAdmin,
  logoutAdmin,
  dashboard
} = require("../controllers/adminAuthController");

// ======================
// PRODUCT CONTROLLER
// ======================
const {
  getProducts,
  getProductDetails,
  createProduct,
  deleteProduct
} = require("../controllers/adminProductController");

// ======================
// ORDER CONTROLLER
// ======================
const {
  getOrders,
  updateOrder
} = require("../controllers/adminOrderController");

// ======================
// AUTH ROUTES
// ======================
router.get("/admin/create", createAdmin);
router.get("/login", loginPage);
router.post("/login", loginAdmin);
router.get("/logout", validateAdmin, logoutAdmin);

// ======================
// DASHBOARD
// ======================
router.get("/dashboard", validateAdmin, dashboard);

// ======================
// PRODUCT ROUTES
// ======================
router.get("/products", validateAdmin, getProducts);
router.get("/product/:id", validateAdmin, getProductDetails);

// ✅ NEW (IMPORTANT)
router.post(
  "/product",
  validateAdmin,
  upload.array("productImages", 8),
  createProduct
);

router.get(
  "/product/delete/:id",
  validateAdmin,
  deleteProduct
);

// ======================
// ORDER ROUTES
// ======================
router.get("/orders", validateAdmin, getOrders);
router.post("/update-order", updateOrder);

module.exports = router;