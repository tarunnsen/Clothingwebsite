const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const cartSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    type: Number,
                    default: 1,
                    min: 1,
                },
            },
        ],
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateCart = (data) => {
    const productSchema = Joi.object({
        productId: Joi.string().required(), // ObjectId should be a string representation
        quantity: Joi.number().min(1).default(1),
    });

    const cartSchema = Joi.object({
        user: Joi.string().required(), // ObjectId should be a string representation
        products: Joi.array().items(productSchema).min(1).required(),
    });

    return cartSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const cartModel = mongoose.model("cart", cartSchema);

module.exports = {
    cartModel,
    validateCart,
};
