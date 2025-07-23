const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schemas
const AddressSchema = mongoose.Schema(
    {
        state: { type: String, required: true },
        zip: { type: Number, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
    }
);

const userSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String },
        phone: { type: Number },
        addresses: { type: [AddressSchema], required: true },
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateUser = (data) => {
    const addressSchema = Joi.object({
        state: Joi.string().required(),
        zip: Joi.number().required(),
        city: Joi.string().required(),
        address: Joi.string().required(),
    });

    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        phone: Joi.number().required(),
        addresses: Joi.array().items(addressSchema).min(1).required(),
    });

    return userSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const userModel = mongoose.model("user", userSchema);

module.exports = {
    userModel,
    validateUser,
};
