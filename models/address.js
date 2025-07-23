const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const addressSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        addressLine1: {
            type: String,
            required: true,
        },
        addressLine2: {
            type: String,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        postalCode: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateAddress = (data) => {
    const addressSchema = Joi.object({
        user: Joi.string().required(), // ObjectId as a string
        addressLine1: Joi.string().required(),
        addressLine2: Joi.string().optional(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
    });

    return addressSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const addressModel = mongoose.model("address", addressSchema);

module.exports = {
    addressModel,
    validateAddress,
};
