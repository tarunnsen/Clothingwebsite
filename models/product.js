const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema (Multiple Images + Category Integration)
const productSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
        stock: { type: Number, required: true, default: 0 },
        sizes: [{ type: String, required: true }], // Array of sizes
        colors: [{ type: String, required: true }], // Array of colors
        material: { type: String, required: true },
        gsm: { type: Number, required: true },
        images: [{ type: String }], // File paths to images
        category: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }] // Linking to categories
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateProduct = (data) => {
    const productSchema = Joi.object({
        name: Joi.string().required(),
        sku: Joi.string().required(),
        price: Joi.number().required(),
        discountPrice: Joi.number().optional(),
        stock: Joi.number().default(0),
        sizes: Joi.array().items(Joi.string()).required(),
        colors: Joi.array().items(Joi.string()).required(),
        material: Joi.string().required(),
        gsm: Joi.number().required(),
        images: Joi.array().items(Joi.string()).optional(),
        categories: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional() // MongoDB ObjectId
    });

    return productSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const productModel = mongoose.model("Product", productSchema);
module.exports = { productModel, validateProduct };
