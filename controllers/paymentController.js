
const razorpay = require("../config/razorpay");
const Order = require("../models/order");
const { sendOrderEmailToAdmin } = require("../utils/sendMail");

exports.createOrder = async (req, res) => {
    try {
      const { name, email, phone, address, products, totalAmount } = req.body;
  
      if (!products || products.length === 0 || !totalAmount || isNaN(totalAmount)) {
        return res.status(400).json({ success: false, message: "Invalid order details" });
      }
  
      const amountInPaise = parseInt(totalAmount, 10) * 100;
  
      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: `order_${Date.now()}`,
        payment_capture: 1,
      };
  
      const order = await razorpay.orders.create(options);
  
      const newOrder = await Order.create({
        orderId: order.id,
        customerName: name || "Unknown",
        email: email || "no-email@example.com",
        phone: phone || "0000000000",
        address: {
          street: address?.street || "N/A",
          city: address?.city || "N/A",
          state: address?.state || "N/A",
          zip: address?.zip || "N/A",
          country: address?.country || "N/A",
        },
        products: products,
        amount: order.amount / 100,
        status: "pending",
      });
  
      runInBackground(() => sendOrderEmailToAdmin(newOrder));
  
      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (error) {
      console.error("Create order error:", error.response?.data || error?.message || error);
      res.status(500).json({ success: false, message: "Payment gateway error" });
    }
};