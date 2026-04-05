const { productModel } = require("../models/product");

// GET ALL PRODUCTS (public)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await productModel.find().populate("category");
    res.send(products);
  } catch (err) {
    console.error("Get products error:", err.message);
    res.status(500).send("Internal Server Error");
  }
};