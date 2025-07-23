const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const categorySchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        parentCategory: { type: String },
        image: { type: String },
        isFeatured: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateCategory = (data) => {
    const categorySchema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        parentCategory: Joi.string().optional(),
        image: Joi.string().optional().uri(),
        isFeatured: Joi.boolean().default(false),
    });

    return categorySchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const categoryModel = mongoose.model("Category", categorySchema);

module.exports = {
    categoryModel,
    validateCategory,
};
