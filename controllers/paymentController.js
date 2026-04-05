const razorpay = require("../config/razorpay");
const Order = require("../models/order");
const { sendOrderEmailToAdmin } = require("../utils/sendMail");
const { runInBackground } = require("../utils/background");
const crypto = require("crypto");
const { generateInvoice } = require("../utils/generateInvoice");
const { sendSMS } = require("../utils/twilioService");
const fs = require("fs");
const path = require("path");

exports.createOrder = async (req, res) => {
    try {
        const { name, email, phone, address, products, totalAmount } = req.body;

        // Basic validation
        if (!products || products.length === 0 || !totalAmount || isNaN(totalAmount)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order details"
            });
        }

        const amountInPaise = Number(totalAmount) * 100;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `order_${Date.now()}`,
            payment_capture: 1,
        };

        // Create Razorpay order
        const order = await razorpay.orders.create(options);

        // Save order in DB
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

        // Background task (non-blocking)
        runInBackground(() => sendOrderEmailToAdmin(newOrder));

        // Response to frontend
        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error("CreateOrder Error:", error?.message || error);
        res.status(500).json({
            success: false,
            message: "Payment gateway error"
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details"
            });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");

        if (generatedSignature !== signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid signature"
            });
        }

        const order = await Order.findOne({ orderId: razorpayOrderId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Update order
        order.status = "paid";
        order.paymentId = razorpayPaymentId;

        if (!order.address || order.address.street === "N/A") {
            order.address = {
                street: "Unknown",
                city: "Unknown",
                state: "Unknown",
                zip: "Unknown",
                country: "Unknown",
            };
        }

        await order.save();

        // Background tasks
        runInBackground(async () => {
            await generateInvoice(order);
            await sendSMS(
                order.phone,
                `🎉 Your order ${order.orderId} has been confirmed! 🚀`
            );
        });

        res.json({
            success: true,
            message: "Payment verified successfully",
            invoiceUrl: `/payment/download-invoice/${order.orderId}`,
            redirectUrl: `/thank-you?orderId=${razorpayOrderId}`,
        });

    } catch (error) {
        console.error("VerifyPayment Error:", error?.message || error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.webhookHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret missing",
      });
    }

    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const { payload } = req.body;
    const payment = payload.payment.entity;

    const orderId = payment.order_id;
    const paymentId = payment.id;
    const phone = payment.contact;

    const newAddress = {
      street: payment.notes?.street || "N/A",
      city: payment.notes?.city || "N/A",
      state: payment.notes?.state || "N/A",
      zip: payment.notes?.zip || "N/A",
      country: payment.notes?.country || "N/A",
    };

    const existingOrder = await Order.findOne({ orderId });

    if (!existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      !existingOrder.address ||
      existingOrder.address.street === "N/A" ||
      existingOrder.address.city === "N/A"
    ) {
      existingOrder.address = newAddress;
    }

    existingOrder.status = "paid";
    existingOrder.phone = phone;
    existingOrder.paymentId = paymentId;

    await existingOrder.save();

    res.json({ success: true });

  } catch (error) {
    console.error("[WEBHOOK_ERROR]", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const invoicePath = path.join(__dirname, "../invoices", `${orderId}.pdf`);

    if (!fs.existsSync(invoicePath)) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }

    res.download(invoicePath);

  } catch (error) {
    console.error("DownloadInvoice Error:", error?.message || error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};