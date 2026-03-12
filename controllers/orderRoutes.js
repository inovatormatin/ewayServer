const Orderproduct = require("../models/orderModel");
const { validationResult } = require("express-validator");
require("dotenv").config();

// Route 1: Get orders by ID
const getorderproduct = async (req, res) => {
  try {
    const getOrder = await Orderproduct.find({ userId: req.params.id });
    if (getOrder === null) {
      res.status(200).json({ msg: "No order found." });
    }
    res.status(200).json(getOrder);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Route 2: Create Order for user
const createOrder = async (req, res) => {
  // if there are errors return bad request and error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { items, paymentMethod, userInfo, userId, paymentId } = req.body;
    if (userId !== req.user.id.toString()) {
      return res.status(403).json({ error: 'User ID mismatch' });
    }
    const orderproduct = new Orderproduct({
      items,
      paymentMethod,
      userInfo,
      userId,
      ...(paymentId && { paymentId, paymentStatus: 'Paid' }),
    });
    const newOrderproduct = await orderproduct.save();
    res.status(200).json({newOrderproduct, msg : "Order placed."});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Route 3: cancel order (login required)
const deleteOrder = async (req, res) => {
  try {
    // find order by id which we want to update
    let delorder = await Orderproduct.findById(req.params.id);
    if (!delorder) {
        return res.status(404).json({ error: "Order not found" })
    }
    // checking for user access
    if (delorder.userId.toString() !== req.user.id) {
        return res.status(401).send("Not allowed")
    }
    // cancelling order
    delorder = await Orderproduct.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: "Order Cancelled."});
} catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server errror" });
}
}

// Route 4: Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Orderproduct.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Route 5: Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Orderproduct.find().sort({ orderPlaced: -1 });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createOrder,
  getorderproduct,
  deleteOrder,
  updateOrderStatus,
  getAllOrders
};
