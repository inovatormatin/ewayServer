const user = require("../models/userModel");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Route 1: login
const login = async (req, res) => {
  // if there are errors return bad request and error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  try {
    let person = await user.findOne({ email });
    // checking if person exist or not
    if (!person) {
      return res
        .status(400)
        .json({ error: "Please try to login with correct credentials" });
    }
    // checking if password matches or not
    const passwordCheck = await bcrypt.compare(password, person.password);
    if (!passwordCheck) {
      return res
        .status(400)
        .json({ error: "Please try to login with correct credentials" });
    }
    const data = {
      user: {
        id: person.id,
      },
    };
    // sending authtoken
    const authtokken = jwt.sign(data, process.env.JWT_SECRET);
    res.json({
      success: true,
      authtokken: authtokken,
      message: "User Found",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Route 2: signup
const signup = async (req, res) => {
  // if there are errors return bad request and error
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    // check wether the email is in already use or not
    let newuser = await user.findOne({ email: req.body.email });
    if (newuser) {
      return res
        .status(400)
        .json({ error: "Sorry a user with this email already exist" });
    }
    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);
    // creating new user
    newuser = await user.create({
      name: req.body.name,
      email: req.body.email,
      password: secPass,
    });
    //   creating authtokken
    const data = {
      user: {
        user: user.id,
      },
    };
    const authtokken = jwt.sign(data, process.env.JWT_SECRET);
    res.json({
      success: true,
      authtokken: authtokken,
      message: "User Created",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};

// Route 3: Get logged user detail
const getuser = async (req, res) => {
  try {
    // here user id is coming from fetchuser function (middleware)
    userId = req.user.id;
    // finding user data from database from user id except password
    const person = await user.findById(userId).select("-password");
    // sending data as response
    res.send(person);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" })
  }
};
module.exports = {
  login,
  signup,
  getuser
};
