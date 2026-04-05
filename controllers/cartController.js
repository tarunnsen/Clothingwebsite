const { cartModel } = require("../models/cart");
const { productModel } = require("../models/product");

// ======================
// AUTH CHECK
// ======================
exports.authCheck = (req, res) => {
  res.json({ authenticated: req.isAuthenticated() });
};

// ======================
// GET CART
// ======================
exports.getCart = async (req, res) => {
  try {
    const cart = await cartModel
      .findOne({ user: req.session?.passport?.user })
      .populate("products.productId");

    res.render("cartdetails", { cart });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).send(err.message);
  }
};

// ======================
// ADD TO CART
// ======================
exports.addToCart = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      req.session.returnTo = `/cart/add/${req.params.id}`;

      if (req.query.ajax === "true") {
        return res.status(401).send("Unauthorized");
      }

      return res.redirect("/users/signin");
    }

    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    let cart = await cartModel.findOne({
      user: req.session.passport.user
    });

    if (!cart) {
      cart = new cartModel({
        user: req.session.passport.user,
        products: [
          {
            productId: product._id,
            quantity: 1
          }
        ]
      });
    } else {
      const existingProduct = cart.products.find(
        p => p.productId.toString() === product._id.toString()
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.products.push({
          productId: product._id,
          quantity: 1
        });
      }
    }

    await cart.save();

    if (req.query.ajax === "true") {
      const updatedCart = await cartModel
        .findOne({ user: req.session.passport.user })
        .populate("products.productId");

      return res.render("cartdetails", { cart: updatedCart });
    }

    res.redirect("/cart");

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).send(err.message);
  }
};

// ======================
// DECREASE QUANTITY
// ======================
exports.decreaseQuantity = async (req, res) => {
  try {
    const cart = await cartModel.findOne({
      user: req.session.passport.user
    });

    if (!cart) {
      if (req.query.ajax === "true") {
        return res.status(400).send("Cart not found");
      }
      return res.redirect("/cart");
    }

    const index = cart.products.findIndex(
      p => p.productId.toString() === req.params.id
    );

    if (index > -1) {
      if (cart.products[index].quantity > 1) {
        cart.products[index].quantity -= 1;
      } else {
        cart.products.splice(index, 1);
      }
    }

    await cart.save();

    if (req.query.ajax === "true") {
      const updatedCart = await cartModel
        .findOne({ user: req.session.passport.user })
        .populate("products.productId");

      return res.render("cartdetails", { cart: updatedCart });
    }

    res.redirect("/cart");

  } catch (err) {
    console.error("Decrease quantity error:", err);
    res.status(500).send(err.message);
  }
};

// ======================
// REMOVE FROM CART
// ======================
exports.removeFromCart = async (req, res) => {
  try {
    const cart = await cartModel.findOne({
      user: req.session.passport.user
    });

    if (!cart) {
      if (req.query.ajax === "true") {
        return res.status(400).send("Cart not found");
      }
      return res.redirect("/cart");
    }

    cart.products = cart.products.filter(
      p => p.productId.toString() !== req.params.id
    );

    await cart.save();

    if (req.query.ajax === "true") {
      const updatedCart = await cartModel
        .findOne({ user: req.session.passport.user })
        .populate("products.productId");

      return res.render("cartdetails", { cart: updatedCart });
    }

    res.redirect("/cart");

  } catch (err) {
    console.error("Remove from cart error:", err);
    res.status(500).send(err.message);
  }
};