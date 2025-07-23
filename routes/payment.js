require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { paymentModel } = require("../models/payment");
const { productModel } = require("../models/product");
const nodemailer = require("nodemailer");
const { generateInvoice } = require("../utils/generateInvoice.js");
const { sendSMS } = require("../utils/twilioService.js.js"); // ✅ Twilio Service Import करें
const path = require("path");
const fs = require("fs");
const Order = require("../models/order.js");
const redisClient = require("../config/redis"); // ✅ Import Redis client 


const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


router.get("/user/details", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not logged in" });
  }
  res.json({ name: req.user.name, email: req.user.email });
});

router.get("/checkout/:productId", async (req, res) => {
  if (!req.isAuthenticated()) {
    try {
      if (redisClient.isReady) {
        await redisClient.setEx(`redirect:${req.sessionID}`, 300, `/product/${req.params.productId}`);
      }
      req.session.oldSessionID = req.sessionID; // ✅ Store the current session ID for later
    } catch (err) {
      console.error("Redis Error:", err);
    }

    return res.redirect("/users/signin");
  }


  try {
    // ✅ Get product details
    const product = await productModel.findById(req.params.productId);
    if (!product) return res.status(404).send("Product not found");

    // ✅ Get logged-in user details
    const user = req.user; // Passport.js से user info मिल जाएगी

    // ✅ Create a temporary cart for this single product (for checkout.ejs compatibility)
    const cart = {
      products: [{ productId: product, quantity: 1 }], // ✅ Single product as cart item
    };

    res.render("checkout", { product, user, cart }); // ✅ अब cart भी पास कर दिया
  } catch (error) {
    console.error("❌ Checkout Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ Create Order Route (Single Product & Cart) 
// ✅ Create Order Route (Single Product & Cart) 
router.post("/create/orderId", async (req, res) => {
  try {
    console.log("🟢 Received Order Request:", req.body);

    const { name, email, phone, address, products, totalAmount } = req.body;

    if (!products || products.length === 0 || !totalAmount || isNaN(totalAmount)) {
      console.error("❌ Invalid order details!");
      return res.status(400).json({ success: false, message: "Invalid order details" });
    }

    // ✅ Address Debugging (Check if Address is Received)
    console.log("📦 Address Received in Backend:", address);

    const amountInPaise = parseInt(totalAmount, 10) * 100;
    console.log("✅ Amount in Paise:", amountInPaise);

    // ✅ Razorpay Order Options
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`,
      payment_capture: 1
    };

    // ✅ Create Order in Razorpay
    const order = await razorpay.orders.create(options);
    console.log("✅ Razorpay Order Created:", order);

    // ✅ Save Order in Database
    const newOrder = await Order.create({
      orderId: order.id,
      customerName: name || "Unknown",
      email: email || "no-email@example.com",
      phone: phone || "0000000000",
      address: {
        street: address.street || "N/A",
        city: address.city || "N/A",
        state: address.state || "N/A",
        zip: address.zip || "N/A",
        country: address.country || "N/A"
      }, // ✅ Ensure Address is Saved Properly
      products: products,
      amount: order.amount / 100,
      status: "pending",
    });

    console.log("✅ New Order Saved in DB:", newOrder);

    // ✅ **Send Email to Admin**
    await sendOrderEmailToAdmin(newOrder);

    res.json({ success: true, orderId: order.id, amount: order.amount, key: process.env.RAZORPAY_KEY_ID });

  } catch (error) {
    console.error("❌ Error Creating Order:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Payment gateway error" });
  }
});


// ✅ **Admin को Order Email भेजने का Function**
async function sendOrderEmailToAdmin(order) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",  // ✅ Gmail का Use कर रहे हैं
      auth: {
        user: process.env.ADMIN_EMAIL,  // ✅ Admin का Email (Environment में सेट करें)
        pass: process.env.APP_PASSWORD  // ✅ App Password (Normal Password नहीं!)
      }
    });

    let mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL, // ✅ Admin को ही Email भेजेंगे
      subject: `New Order Received - ${order.orderId}`,
      html: `
              <h2>New Order Received</h2>
              <p><b>Order ID:</b> ${order.orderId}</p>
              <p><b>Customer Name:</b> ${order.customerName}</p>
              <p><b>Email:</b> ${order.email}</p>
              <p><b>Phone:</b> ${order.phone}</p>
              <p><b>Address:</b> ${order.address.street}, ${order.address.city}, ${order.address.state} - ${order.address.zip}, ${order.address.country}</p>
              <h3>Products:</h3>
              <ul>
                  ${order.products.map(product => `<li>${product.name} - ₹${product.price} x ${product.quantity}</li>`).join("")}
              </ul>
              <p><b>Total Amount:</b> ₹${order.amount}</p>
              <p><b>Status:</b> ${order.status}</p>
          `
    };

    let info = await transporter.sendMail(mailOptions);
    console.log("✅ Admin Email Sent Successfully:", info.messageId);

  } catch (error) {
    console.error("❌ Error Sending Email:", error.message);
  }
}

router.post("/api/payment/verify", async (req, res) => {
  try {
    console.log("✅ Payment Verification API Hit!");
    console.log("Received Data:", req.body);

    const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !signature) {
      console.error("❌ Missing required payment details!");
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    // ✅ Signature Verification
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("❌ Signature Mismatch!");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    console.log("✅ Signature Verified Successfully!");

    // ✅ Check if Order Exists in Database
    const order = await Order.findOne({ orderId: razorpayOrderId });
    if (!order) {
      console.error("❌ Order Not Found in Database!");
      return res.status(404).json({ success: false, message: "Order not found in database" });
    }

    // ✅ **Address Debugging - Check if Address is Already Stored**
    console.log("📦 Existing Order Address in DB:", order.address);

    // ✅ Order Status & Payment ID Update करो
    order.status = "paid";
    order.paymentId = razorpayPaymentId;

    // ✅ **Ensure Address is Not Overwritten**
    if (!order.address || order.address.street === "N/A") {
      console.log("⚠ Address was empty, updating it now...");
      order.address = order.address || {
        street: "Unknown",
        city: "Unknown",
        state: "Unknown",
        zip: "Unknown",
        country: "Unknown",
      };
    }

    await order.save();

    console.log("✅ Order Updated Successfully in Database:", order);

    // ✅ **Invoice Generate करो**
    const invoicePath = await generateInvoice(order);
    console.log("✅ Invoice Generated Successfully:", invoicePath);

    // ✅ **SMS Notification भेजो**
    await sendSMS(order.phone, `🎉 Your order ${order.orderId} has been confirmed! 🚀`);

    res.json({
      success: true,
      message: "Payment verified successfully!",
      invoiceUrl: `/payment/download-invoice/${order.orderId}`, // ✅ Invoice Download का URL
      redirectUrl: `/thank-you?orderId=${razorpayOrderId}`
    });

  } catch (error) {
    console.error("❌ Payment Verification Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});



// ✅ Webhook Route
router.post("/webhook", async (req, res) => {
  try {
    console.log("✅ Webhook Received!");
    console.log("🔹 Received Data:", JSON.stringify(req.body, null, 2));

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("❌ Webhook Secret Missing!");
      return res.status(500).json({ success: false, message: "Server error: Webhook secret missing" });
    }

    // ✅ Verify Razorpay Signature
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto.createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Webhook Signature Mismatch!");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    console.log("✅ Webhook Signature Verified!");

    // ✅ Extract Payment Details
    const { payload } = req.body;
    const payment = payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;
    const amount = payment.amount / 100; // Convert paise to INR

    console.log(`🟢 Payment Captured: Payment ID ${paymentId}, Order ID ${orderId}, Amount ₹${amount}`);

    // ✅ Extract Customer Details
    const phone = payment.contact;

    const newAddress = {
      street: payment.notes?.street || "N/A",
      city: payment.notes?.city || "N/A",
      state: payment.notes?.state || "N/A",
      zip: payment.notes?.zip || "N/A",
      country: payment.notes?.country || "N/A",
    };

    // ✅ Fetch Existing Order Data
    const existingOrder = await Order.findOne({ orderId });

    if (!existingOrder) {
      console.error("❌ Order Not Found in Database!");
      return res.status(400).json({ success: false, message: "Order not found in DB" });
    }

    console.log("📦 Existing Order Address Before Update:", existingOrder.address);

    // ✅ Prevent Overwriting of Address (Only Update If Address Was "N/A")
    if (
      !existingOrder.address ||
      existingOrder.address.street === "N/A" ||
      existingOrder.address.city === "N/A"
    ) {
      console.log("⚠ Address was missing in DB, updating it now...");
      existingOrder.address = newAddress;
    }

    // ✅ Update Order Status & Payment ID
    existingOrder.status = "paid";
    existingOrder.phone = phone;
    existingOrder.paymentId = paymentId;
    await existingOrder.save();

    console.log("✅ Order Updated Successfully in Database:", existingOrder);

    res.json({ success: true });

  } catch (error) {
    console.error("❌ Webhook Processing Error:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});


router.get("/download-invoice/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // ✅ Find Order in Database
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found!" });
    }

    // ✅ Invoice File Path
    const invoicePath = path.join(__dirname, "../invoices", `${orderId}.pdf`);

    // ✅ Check if Invoice Exists
    if (!fs.existsSync(invoicePath)) {
      console.error(`❌ Invoice not found: ${invoicePath}`);
      return res.status(404).json({ success: false, message: "Invoice not found!" });
    }

    console.log(`✅ Downloading Invoice: ${invoicePath}`);
    res.download(invoicePath);

  } catch (error) {
    console.error("❌ Error Downloading Invoice:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});





module.exports = router;
