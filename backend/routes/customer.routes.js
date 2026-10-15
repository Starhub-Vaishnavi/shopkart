const express = require("express");
const router = express.Router();

const {
  registerCustomer,
  loginCustomer,
  getMyProfile,
  logoutCustomer,
  changePassword,
} = require("../controllers/customer.controller");

const protect = require("../middlewares/auth.middleware");

// public routes - anyone can call these
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// protected routes - "protect" runs first and blocks the request if there is no valid token
router.get("/me", protect, getMyProfile);
router.post("/logout", protect, logoutCustomer);
router.patch("/change-password", protect, changePassword);

module.exports = router;
