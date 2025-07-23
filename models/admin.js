const mongoose = require("mongoose");
const Joi = require("joi");

// Mongoose Schema
const adminSchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: "admin" },
    },
    { timestamps: true }
);

// Joi Validation Schema
const validateAdmin = (data) => {
    const adminSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid("admin", "superadmin").default("admin"),
    });

    return adminSchema.validate(data, { abortEarly: false });
};

// Exporting the Mongoose Model and Joi Validation
const adminModel = mongoose.model("admin", adminSchema);

module.exports = {
    adminModel,
    validateAdmin,
};
