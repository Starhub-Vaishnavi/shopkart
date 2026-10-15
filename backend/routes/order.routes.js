const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/order.controller");

const protect = require("../middlewares/auth.middleware");

// Every order route is protected. Orders contain an address and a payment
// history, so none of this is public.

// the fixed paths must be declared BEFORE "/:id", otherwise a request to
// /orders/create-payment-order would be read as an order with that id
router.post("/create-payment-order", protect, createPaymentOrder);
router.post("/verify-payment", protect, verifyPayment);

router.get("/", protect, getMyOrders);                      // GET   /orders
router.get("/:id", protect, getOrderById);                  // GET   /orders/:id
router.patch("/:id/status", protect, updateOrderStatus);    // bonus

module.exports = router;
