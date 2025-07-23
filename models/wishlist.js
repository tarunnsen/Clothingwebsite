const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const wishlistSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "product",
            },
        ],
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateWishlist = (data) => {
    const wishlistSchema = Joi.object({
        user: Joi.string().required(), // ObjectId as a string
        products: Joi.array().items(Joi.string()), // Array of ObjectId strings
    });

    return wishlistSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const wishlistModel = mongoose.model("wishlist", wishlistSchema);

module.exports = {
    wishlistModel,
    validateWishlist,
};
