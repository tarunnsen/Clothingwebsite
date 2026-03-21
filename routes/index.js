const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { productModel } = require("../models/product");
const { cartModel } = require("../models/cart");


// ✅ Here we can check user is loged in or not
router.get("/cart/auth-check", (req, res) => {
    res.json({ authenticated: req.isAuthenticated() });
});


// 🔹 CART Page
router.get("/cart", async (req, res) => {
    try {
        const cart = await cartModel
            .findOne({ user: req.session?.passport?.user })
            .populate("products.productId");

        res.render("cartdetails", { cart });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.send(err.message);
    }
});


// 🔹 Add to Cart
router.get("/cart/add/:id", async (req, res) => {
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

        console.error(err);
        res.status(500).send(err.message);

    }
});


// 🔻 Decrease Quantity
router.get("/cart/decrease/:id", async (req, res) => {
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

        console.error(err);
        res.status(500).send(err.message);

    }
});


// ❌ Remove Product
router.get("/cart/remove/:id", async (req, res) => {
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

        console.error(err);
        res.status(500).send(err.message);

    }
});


// 🔹 Checkout
router.get("/checkout/:cartId", async (req, res) => {

    if (!req.isAuthenticated()) {

        req.session.returnTo = `/checkout/${req.params.cartId}`;

        return res.redirect("/users/signin");
    }

    try {

        const cart = await cartModel
            .findOne({ _id: req.params.cartId })
            .populate("products.productId");

        if (!cart || cart.products.length === 0) {
            return res.redirect("/cart");
        }

        res.render("checkout", { cart, user: req.user });

    } catch (err) {

        console.error("Checkout Error:", err);
        res.status(500).send("Internal Server Error");

    }
});


// 🏠 HOMEPAGE
router.get("/", async (req, res) => {

    try {

        const bannerProduct = await productModel.aggregate([
            { $sample: { size: 1 } }
        ]);

        const alternateBannerProduct = await productModel.aggregate([
            { $sample: { size: 1 } }
        ]);

        const featuredCategories = await productModel.aggregate([

            { $unwind: "$category" },

            {
                $lookup: {
                    from: "categories",
                    localField: "category",
                    foreignField: "_id",
                    as: "categoryData"
                }
            },

            { $unwind: "$categoryData" },

            {
                $group: {
                    _id: "$categoryData._id",
                    name: { $first: "$categoryData.name" },
                    products: { $push: "$$ROOT" }
                }
            },

            {
                $project: {
                    name: 1,
                    products: { $slice: ["$products", 2] }
                }
            }

        ]);

        const newArrivals = await productModel
            .find()
            .sort({ createdAt: -1 })
            .limit(8);

        res.render("index", {

            bannerProduct: bannerProduct[0] || null,
            alternateBannerProduct: alternateBannerProduct[0] || null,
            featuredCategories,
            newArrivals

        });

    } catch (err) {

        console.error(err);
        res.status(500).send("Server Error");

    }

});


// ✅ Thank You
router.get("/thank-you", (req, res) => {
    res.render("thank-you");
});


// 📦 Product Page
router.get("/product/:id", async (req, res) => {
  try {

    const product = await productModel.findById(req.params.id).lean();

    if (!product) {
      return res.redirect("/");
    }

    const relatedProducts = await productModel.find({
      category: { $in: product.category },
      _id: { $ne: product._id }
    })
    .limit(4)
    .lean();

    res.render("productdetails", {
      product,
      relatedProducts: relatedProducts || []
    });

  } catch (err) {

    console.error("Product Page Error:", err);
    res.redirect("/");

  }
});


module.exports = router;