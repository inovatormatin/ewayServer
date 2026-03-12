const mongoose = require('mongoose');

// declaring schecma
const OrderSchema = mongoose.Schema(
    {
        items: {
            type: Array,
        },
        paymentMethod: {
            type: String,
            required: [true, "Please give Payment method."]
        },
        userInfo: {
            userName: {
                type: String,
                required: [true, "User Name is required"]
            },
            userEmail: {
                type: String,
                required: [true, "User email is required"]
            },
            phone: {
                type: Object,
                required: [true, "Phone is required"]
            },
            address: {
                type: Object,
                required: [true, "Address is required"]
            },
        },
        userId: {
            type: String,
            required: [true, "User ID is required"]
        },
        status: {
            type: String,
            enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
            default: 'Pending',
        },
        paymentId: {
            type: String,
        },
        paymentStatus: {
            type: String,
            enum: ['Unpaid', 'Paid'],
            default: 'Unpaid',
        },
        orderPlaced: {
            type: Date,
            default: Date.now
        }
    }
);
const Orderproduct = mongoose.model('Orderproduct', OrderSchema);
module.exports = Orderproduct;