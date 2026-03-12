const mongoose = require('mongoose');

// declaring schecma
const UserSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"]
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true
        },
        password: {
            type: String,
            required: [true, "Password is required"]
        },
        phoneNumber: {
            type: Number,
            required: [true, "Phone number is required"]
        },
        secondaryPhoneNumber: {
            type: Number,
        },
        address: {
            type: String
        },
        house_flat_no: {
            type: String
        },
        city: {
            type: String,
            required: [true, "Phone number is required"]
        },
        state: {
            type: String
        },
        landmark: {
            type: String
        },
        pincode: {
            type: Number,
            required: [true, "PINCODE is required"]
        },
        isAdmin: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date,
            default: Date.now
        }
    }
);
const User = mongoose.model('User', UserSchema);
module.exports = User;