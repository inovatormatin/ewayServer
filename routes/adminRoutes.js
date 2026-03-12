const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const requireAdmin = require('../middleware/requireAdmin');
const Orderproduct = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

// GET /api/admin/stats
router.get('/stats', fetchuser, requireAdmin, async (req, res) => {
    try {
        const [totalOrders, totalUsers, totalProducts] = await Promise.all([
            Orderproduct.countDocuments(),
            User.countDocuments(),
            Product.countDocuments(),
        ]);
        res.status(200).json({ totalOrders, totalUsers, totalProducts });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
