const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const reviewSchema = mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
        },
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateReview = (data) => {
    const reviewSchema = Joi.object({
        product: Joi.string().required(), // ObjectId as a string
        user: Joi.string().required(), // ObjectId as a string
        rating: Joi.number().min(1).max(5).required(),
        review: Joi.string().optional(),
    });

    return reviewSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const reviewModel = mongoose.model("review", reviewSchema);

module.exports = {
    reviewModel,
    validateReview,
};
