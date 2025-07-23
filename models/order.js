const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zip: { type: String, required: true },
        country: { type: String, required: true },
    },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, // ✅ Linked Product
            name: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    amount: { type: Number, required: true },
    status: { type: String, default: "Processing" },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
