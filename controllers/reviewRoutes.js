const Product = require("../models/productModel");
const { validationResult } = require("express-validator");

// GET /api/products/getreviews/:productId
const getReviews = async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId).select('reviews averageRating totalReviews');
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.status(200).json({
            reviews: product.reviews,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/products/addreview/:productId  (auth required)
const addReview = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const product = await Product.findById(req.params.productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // one review per user per product
        const alreadyReviewed = product.reviews.some(
            (r) => r.userId.toString() === req.user.id.toString()
        );
        if (alreadyReviewed) return res.status(400).json({ error: 'You have already reviewed this product' });

        const { rating, comment, userName } = req.body;
        product.reviews.push({ userId: req.user.id, userName, rating, comment });

        // recalculate averageRating and totalReviews
        product.totalReviews = product.reviews.length;
        product.averageRating = product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.totalReviews;

        await product.save();
        res.status(200).json({
            reviews: product.reviews,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getReviews, addReview };
