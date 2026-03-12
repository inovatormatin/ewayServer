const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentRoutes');

// create razorpay order
router.post('/create-order', fetchuser, createPaymentOrder);

// verify payment signature
router.post('/verify', fetchuser, verifyPayment);

module.exports = router;
