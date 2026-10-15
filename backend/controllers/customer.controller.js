const bcrypt = require("bcrypt");
const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

// Settings used every time we set or clear the auth cookie.
const cookieOptions = {
  httpOnly: true,   // browser JavaScript CANNOT read this cookie -> protects against XSS
  secure: false,    // set to true only when the site runs on HTTPS
  sameSite: "lax",  // don't send this cookie on cross-site requests -> protects against CSRF
};

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // in milliseconds

// ---------------------------------------------------------------
// POST /customers/register
// ---------------------------------------------------------------
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. all fields are mandatory
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. password must be at least 6 characters
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // 3. email must be unique
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // 4. turn the plain password into a bcrypt hash (10 = salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. save the customer with the HASH, never the plain password
    const customer = await Customer.create({
      fullName,
      email,
      password: hashedPassword,
      phone,
    });

    // 6. reply with the customer, password left out on purpose
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// POST /customers/login
// ---------------------------------------------------------------
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // 1. find the customer by email
    const customer = await Customer.findOne({ email });
    if (!customer) {
      // same message as a wrong password, so attackers cannot guess which emails exist
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 2. bcrypt hashes the typed password and compares it with the stored hash
    const isPasswordCorrect = await bcrypt.compare(password, customer.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 3. create the JWT
    const token = generateToken(customer._id);

    // 4. put the JWT inside an HttpOnly cookie
    res.cookie("token", token, { ...cookieOptions, maxAge: SEVEN_DAYS });

    // 5. reply. The token is in the cookie, so it is not in the body.
    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /customers/me   (protected)
// ---------------------------------------------------------------
const getMyProfile = async (req, res) => {
  // auth.middleware already verified the token and put the customer on req.user
  return res.status(200).json(req.user);
};

// ---------------------------------------------------------------
// POST /customers/logout   (protected)
// ---------------------------------------------------------------
const logoutCustomer = async (req, res) => {
  // delete the cookie from the browser
  res.clearCookie("token", cookieOptions);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// ---------------------------------------------------------------
// PATCH /customers/change-password   (protected)  -- bonus task
// ---------------------------------------------------------------
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // req.user has no password (the middleware removed it), so fetch the full document
    const customer = await Customer.findById(req.user._id);

    // 1. the old password must be correct
    const isOldPasswordCorrect = await bcrypt.compare(oldPassword, customer.password);
    if (!isOldPasswordCorrect) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    // 2. hash the new password before saving
    customer.password = await bcrypt.hash(newPassword, 10);
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
};
