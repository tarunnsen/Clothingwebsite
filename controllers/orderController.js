const Order = require("../models/order");

exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    if (!orderId || orderId.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID"
      });
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("GetOrder Error:", error?.message || error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};