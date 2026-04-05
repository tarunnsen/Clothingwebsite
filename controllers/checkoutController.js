const { cartModel } = require("../models/cart");

// ======================
// CHECKOUT PAGE
// ======================
exports.checkoutPage = async (req, res) => {
  try {
    // Auth check
    if (!req.isAuthenticated()) {
      req.session.returnTo = `/checkout/${req.params.cartId}`;
      return res.redirect("/users/signin");
    }

    const cart = await cartModel
      .findOne({ _id: req.params.cartId })
      .populate("products.productId");

    if (!cart || cart.products.length === 0) {
      return res.redirect("/cart");
    }

    res.render("checkout", {
      cart,
      user: req.user
    });

  } catch (err) {
    console.error("Checkout Error:", err);
    res.status(500).send("Internal Server Error");
  }
};