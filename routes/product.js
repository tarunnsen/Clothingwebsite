const express = require("express");
const router = express.Router();
const { productModel } = require("../models/product");
const { categoryModel } = require("../models/category");
const upload = require("../config/multer"); // multer with diskStorage
const { validateAdmin, userIsLoggedIn } = require("../middleware/admin");

router.get("/", async (req, res) => {
    let products = await productModel.find().populate("category");
    res.send(products);
});

// Delete a product
router.get("/delete/:id", validateAdmin, async (req, res) => {
    if (req.user.admin) {
        await productModel.findByIdAndDelete(req.params.id);
        return res.redirect("/admin/products");
    }
    res.status(403).send("You are not allowed to delete this product.");
});
// Create a product
router.post("/", upload.array("productImages", 8), async (req, res) => {
    try {
        let {
            productName,
            sku,
            price,
            discountPrice,
            stockQuantity,
            sizes,
            colors,
            material,
            gsm,
            category, // can be a string or array
            description,
        } = req.body;

        // Convert to array if needed
        if (typeof sizes === "string") sizes = [sizes];
        if (typeof colors === "string") colors = [colors];
        if (typeof category === "string") category = [category];

        // Basic validation
        if (!productName || !sku || !price || !stockQuantity || !material || !gsm) {
            return res.status(400).send("Missing required fields.");
        }

        // Process categories: find or create, collect IDs
        let categoryIds = [];
        if (Array.isArray(category)) {
            for (let catName of category) {
                let catDoc = await categoryModel.findOne({ name: catName });
                if (!catDoc) {
                    catDoc = await categoryModel.create({ name: catName });
                }
                categoryIds.push(catDoc._id);
            }
        }

        // Get image paths
        const imagePaths = req.files.map(file => "/uploads/" + file.filename);

        // Save product
        await productModel.create({
            name: productName,
            sku,
            price,
            discountPrice,
            stock: stockQuantity,
            sizes,
            colors,
            material,
            gsm,
            description,
            images: imagePaths,
            category: categoryIds,
        });

        res.redirect("/admin/products");
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
