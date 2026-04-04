
const razorpay = require("../config/razorpay");
const Order = require("../models/order");
const { sendOrderEmailToAdmin } = require("../utils/sendMail");
const { runInBackground } = require("../utils/background");
const crypto = require("crypto");
const { generateInvoice } = require("../utils/generateInvoice");
const { sendSMS } = require("../utils/twilioService");


exports.createOrder = async (req, res) => {
    try {

        // 🔍 DEBUG START
        console.log("========== CREATE ORDER DEBUG ==========");
        console.log("REQ BODY:", req.body);
        console.log("========================================");
        // 🔍 DEBUG END

        const { name, email, phone, address, products, totalAmount } = req.body;

        if (!products || products.length === 0 || !totalAmount || isNaN(totalAmount)) {
            console.log("❌ Validation failed:", {
                products,
                totalAmount
            });

            return res.status(400).json({ success: false, message: "Invalid order details" });
        }

        const amountInPaise = Number(totalAmount) * 100;

        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: `order_${Date.now()}`,
            payment_capture: 1,
        };

        console.log("🟡 Creating Razorpay order with:", options);

        const order = await razorpay.orders.create(options);

        console.log("🟢 Razorpay order created:", order.id);

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

        console.log("🟢 Order saved in DB:", newOrder.orderId);

        runInBackground(() => sendOrderEmailToAdmin(newOrder));

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            key: process.env.RAZORPAY_KEY_ID,
        });

    } catch (error) {
        console.error("❌ Create order FULL ERROR:", error);
        res.status(500).json({ success: false, message: "Payment gateway error" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, signature } = req.body;

        if (!razorpayOrderId || !razorpayPaymentId || !signature) {
            return res.status(400).json({ success: false, message: "Missing payment details" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpayOrderId + "|" + razorpayPaymentId)
            .digest("hex");

        if (generatedSignature !== signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        const order = await Order.findOne({ orderId: razorpayOrderId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found in database" });
        }

        order.status = "paid";
        order.paymentId = razorpayPaymentId;

        if (!order.address || order.address.street === "N/A") {
            order.address = order.address || {
                street: "Unknown",
                city: "Unknown",
                state: "Unknown",
                zip: "Unknown",
                country: "Unknown",
            };
        }

        await order.save();

        const orderIdForInvoice = order.orderId;
        const phoneForSms = order.phone;

        runInBackground(async () => {
            await generateInvoice(order);
            await sendSMS(
                phoneForSms,
                `🎉 Your order ${orderIdForInvoice} has been confirmed! 🚀`
            );
        });

        res.json({
            success: true,
            message: "Payment verified successfully!",
            invoiceUrl: `/payment/download-invoice/${order.orderId}`,
            redirectUrl: `/thank-you?orderId=${razorpayOrderId}`,
        });
    } catch (error) {
        console.error("Payment verify error:", error?.message || error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
