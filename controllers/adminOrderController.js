const orderModel = require("../models/order");
const { productModel } = require("../models/product");
const { sendSMS } = require("../utils/twilioService");

exports.getOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ createdAt: -1 });
    res.render("order", { orders });

  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).send("Error fetching orders");
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const updatedOrder = await orderModel.findOneAndUpdate(
      { orderId },
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let smsBody = "";

    if (status === "shipped") {
      smsBody = `📦 Order ${orderId} shipped`;
    } else if (status === "delivered") {
      for (let item of updatedOrder.products) {
        const product = await productModel.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (product.stock <= 0) {
          await productModel.findByIdAndDelete(product._id);
        }
      }

      smsBody = `✅ Order delivered`;
    }

    if (smsBody) {
      await sendSMS(updatedOrder.phone, smsBody);
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Update order error:", err.message);
    res.status(500).json({ success: false });
  }
};