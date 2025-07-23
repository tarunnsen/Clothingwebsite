const express = require("express");
const router = express.Router();
const { adminModel } = require("../models/admin");
const orderModel = require("../models/order")

const { validateAdmin, userIsLoggedIn } = require("../middleware/admin"); // ✅ Sahi Import

const { productModel } = require("../models/product")
const bcrypt = require("bcrypt");//
const jwt = require("jsonwebtoken");//
const { categoryModel } = require("../models/category");
const { sendSMS } = require("../utils/twilioService.js"); // ✅ Twilio Service Import करें

require("dotenv").config();

// ⚠️ TEMPORARY — just for one-time admin creation
router.get("/admin/create", async function (req, res) {
    try {
        let salt = await bcrypt.genSalt(10);
        let hash = await bcrypt.hash("moniii", salt);

        let user = new adminModel({
            name: "Tarun",
            email: "tarun@gmail.com",
            password: hash,
            role: "admin",
        });

        await user.save();

        let token = jwt.sign({ email: "tarun@gmail.com", admin: true }, process.env.JWT_KEY);
        res.cookie("token", token);
        res.send("admin created successfully ✅");
    } catch (err) {
        res.send(err.message);
    }
});


router.get("/login", function (req, res) {
    res.render("Admin_login");
});

router.post("/login", async function (req, res) {
    let { email, password } = req.body;
    let admin = await adminModel.findOne({ email });
    if (!admin) return res.send("this admin is not available");

    let valid = await bcrypt.compare(password, admin.password);
    if (valid) {
        let token = jwt.sign({ email: "tarun@gmail.com", admin: true }, process.env.JWT_KEY);
        res.cookie("token", token);
        res.redirect("/admin/dashboard");
    }
});

router.get("/dashboard", validateAdmin, async function (req, res) {
    res.render("admin_dashboard");
});

router.get("/products", validateAdmin, async function (req, res) {
    const result = await productModel.aggregate([
        {
            $group: {
                _id: "$category",
                products: { $push: "$$ROOT" } // Collect all products in an array
            }
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                products: { $slice: ["$products", 10] } // Limit to first 10 products
            }
        }
    ]);

    const formattedResult = result.reduce((acc, item) => {
        acc[item.category] = item.products;
        return acc;
    }, {});

    for (let key in formattedResult) {
        console.log(formattedResult[key])
    }

    res.render("clothes", { products: formattedResult })

});

router.get("/product/:id", validateAdmin, async (req, res) => {
    try {
        const productId = req.params.id;

        // ✅ Find product
        const product = await productModel.findById(productId);
        if (!product) return res.status(404).send("Product Not Found");

        // ✅ Find orders containing this product
        const orders = await orderModel.find({
            "products.productId": product._id,
        });

        // ✅ Pass product & matching orders to view
        res.render("Adminpd", { product, orders });
    } catch (error) {
        console.error("Error loading admin product page:", error.message);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/logout", validateAdmin, async function (req, res) {
    res.cookie("token", "");
    res.redirect("/admin/login");
});


router.get("/orders", validateAdmin, async (req, res) => {
    try {
        const orders = await orderModel.find().sort({ createdAt: -1 }); // Latest orders first
        res.render("order", { orders }); // orders.ejs file render karega
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).send("Error fetching orders");
    }
});

// ✅ Order Status Update API
router.post("/update-order", async (req, res) => {
    try {
        const { orderId, status } = req.body;

        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Missing Order ID or Status" });
        }

        // ✅ Database में Order Update करें
        const updatedOrder = await orderModel.findOneAndUpdate(
            { orderId },
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found!" });
        }

        console.log("✅ Order Updated Successfully:", updatedOrder);

        // ✅ **Order Status के हिसाब से SMS भेजें**
        let smsBody = "";

        if (status === "shipped") {
            smsBody = `📦 Your order ${orderId} has been shipped! 🚚 Track your order here: [Tracking Link]`;
        } else if (status === "out_for_delivery") {
            smsBody = `🚚 Your order ${orderId} is out for delivery! Get ready to receive it. 📦`;
        } else if (status === "delivered") {
            smsBody = `✅ Your order ${orderId} has been delivered! Thank you for shopping with us. 🛍️`;

            // ✅ **If Order is Delivered, Reduce Stock**
            for (let item of updatedOrder.products) {
                const product = await productModel.findByIdAndUpdate(
                    item.productId,
                    { $inc: { stock: -item.quantity } }, // ✅ Reduce stock
                    { new: true }
                );

                // ✅ **अगर stock 0 हो जाए तो product delete कर दो**
                if (product.stock <= 0) {
                    await productModel.findByIdAndDelete(product._id);
                    console.log(`🚨 Product Deleted: ${product.name} (ID: ${product._id})`);
                }
            }

            console.log("✅ Stock Updated Successfully!");
        } else if (status === "cancelled") {
            smsBody = `❌ Your order ${orderId} has been cancelled. If this was a mistake, please contact support.`;
        }

        // ✅ अगर कोई SMS भेजने लायक Status है, तो Send करें
        if (smsBody) {
            await sendSMS(updatedOrder.phone, smsBody);
            console.log(`✅ SMS Sent for Status: ${status}`);
        }

        res.json({ success: true, message: "Order status updated successfully!" });

    } catch (error) {
        console.error("❌ Error Updating Order:", error.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});




module.exports = router