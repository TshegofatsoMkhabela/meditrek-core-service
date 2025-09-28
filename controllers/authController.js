const User = require("../models/user");
const { hashPassword, comparePassword } = require("../helpers/auth");
const jwt = require("jsonwebtoken");

const test = (req, res) => {
  res.json("test is working");
};

// Register Endpoint
const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      idNumber,
      phoneNumber,
      address,
      password,
    } = req.body;

    // Check if name was entered
    if (!firstName || !lastName) {
      return res.json({
        error: "Full name is required",
      });
    }

    if (!idNumber || !phoneNumber || !address) {
      return res.json({
        error: "Please enter all required fields",
      });
    }

    // Check if password is good
    if (!password || password.length < 6) {
      return res.json({
        error: "Password is required and must be atleast 6 characters long",
      });
    }

    // Check email
    const exist = await User.findOne({ email });

    if (exist) {
      return res.json({
        error: "Email is taken already",
      });
    }

    const hashedPassword = await hashPassword(password);
    // Create user in database
    const user = await User.create({
      firstName,
      lastName,
      email,
      idNumber,
      phoneNumber,
      address,
      password: hashedPassword,
    });

    return res.json(user);
  } catch (error) {
    console.log(error);
  }
};

// Login Endpoint
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "No user found",
      });
    }

    // Check if password match
    const match = await comparePassword(password, user.password);

    if (match) {
      jwt.sign(
        { email: user.email, id: user._id, firstName: user.firstName },
        process.env.JWT_SECRET,
        {},
        (error, token) => {
          if (error) throw error;
          res.cookie("token", token).json(user);
        }
      );
    } else {
      return res.json({
        error: "Passwords do not match",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// Profile Endpoint
const getProfile = (req, res) => {
  const { token } = req.cookies;

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, {}, (error, user) => {
      if (error) throw error;
      res.json(user);
    });
  } else {
    res.json(null);
  }
};

module.exports = {
  test,
  registerUser,
  loginUser,
  getProfile,
};
