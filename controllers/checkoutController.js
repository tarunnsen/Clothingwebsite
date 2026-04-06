const { productModel } = require("../models/product");
const { cartModel } = require("../models/cart");

exports.checkoutPage = async (req, res) => {
  if (!req.user) {
    return res.redirect(
      `/users/signin?redirect=${encodeURIComponent(req.originalUrl)}`
    );
  }

  try {
    let product = null;
    let cart = null;

    //  try product first
    product = await productModel.findById(req.params.id);

    if (product) {
      cart = {
        products: [{ productId: product, quantity: 1 }]
      };
    } else {
      //  fallback: treat as cartId
      cart = await cartModel
        .findOne({ user: req.session?.passport?.user })
        .populate("products.productId");

      if (!cart) {
        return res.status(404).send("Cart not found");
      }
    }

    res.render("checkout", {
      product,
      user: req.user,
      cart
    });

  } catch (error) {
    console.error("Checkout Error:", error?.message || error);
    res.status(500).send("Internal Server Error");
  }
};