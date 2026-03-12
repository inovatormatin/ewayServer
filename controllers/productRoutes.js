const Product = require("../models/productModel");
const { validationResult } = require("express-validator");
require("dotenv").config();

// Route 1: Get All products (paginated for lazy loading)
const getallproducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            Product.find().skip(skip).limit(limit),
            Product.countDocuments()
        ]);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalProducts: total,
            hasMore: skip + products.length < total
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server error" })
    }
};


// Route 2: Add new product
const addproduct = async (req, res) => {
    // if there are errors return bad request and error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { name, description, img1, img2, price, category, tags } = req.body;
        const product = new Product({
            name,
            description,
            img1,
            img2,
            price,
            category
        });
        if(tags) {product.tags = tags};
        const newProduct = await product.save();
        res.status(200).json(newProduct)
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server error" })
    }
};

// Route 4: Update product
const updateproduct = async (req, res) => {
    try {
        // creating new object with updated data
        const newProduct = {};
        const { name, description, img1, img2, price, category, tags } = req.body;
        if (name) { newProduct.name = name };
        if (description) { newProduct.description = description };
        if (img1) { newProduct.img1 = img1 };
        if (img2) { newProduct.img2 = img2 };
        if (price) { newProduct.price = price };
        if (category) { newProduct.category = category };
        if (tags) { newProduct.tags = tags };
        // find product by id which we want to update
        let optproduct = await Product.findById(req.params.id);
        if (!optproduct) {
            return res.status(404).json({ error: "Product not found" })
        }
        // updating product
        optproduct = await Product.findByIdAndUpdate(req.params.id, { $set: newProduct }, { new: true });
        res.status(200).json(optproduct);

    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server errror" });
    }
}

// Route 5: Deleting exsiting product
const deleteproduct = async (req, res) => {
    try {
        // find product by id which we want to update
        let delproduct = await Product.findById(req.params.id);
        if (!delproduct) {
            return res.status(404).json({ error: "Product not found" })
        }
        // updating product
        delproduct = await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: "Product deleted", delproduct });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Internal server errror" });
    }
}

module.exports = {
    getallproducts,
    addproduct,
    updateproduct,
    deleteproduct
};