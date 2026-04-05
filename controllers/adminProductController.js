const { productModel } = require("../models/product");
const orderModel = require("../models/order");

exports.getProducts = async (req, res) => {
  const result = await productModel.aggregate([
    {
      $group: {
        _id: "$category",
        products: { $push: "$$ROOT" }
      }
    },
    {
      $project: {
        _id: 0,
        category: "$_id",
        products: { $slice: ["$products", 10] }
      }
    }
  ]);

  const formatted = result.reduce((acc, item) => {
    acc[item.category] = item.products;
    return acc;
  }, {});

  res.render("clothes", { products: formatted });
};

exports.getProductDetails = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).send("Product Not Found");

    const orders = await orderModel.find({
      "products.productId": product._id,
    });

    res.render("Adminpd", { product, orders });

  } catch (err) {
    console.error("Admin product error:", err.message);
    res.status(500).send("Internal Server Error");
  }
};