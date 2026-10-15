const crypto = require("crypto");
const mongoose = require("mongoose");

const Customer = require("../models/customer.model");
const Product = require("../models/product.model");
const Order = require("../models/order.model");
const { razorpay, isConfigured, keyId, keySecret } = require("../utils/razorpay");

// ---------------------------------------------------------------
// Shipping address validation, done on the SERVER.
// The form checks the same rules, but a form can be bypassed -
// anyone can call this endpoint directly with Postman.
// ---------------------------------------------------------------
const validateShipping = (shippingAddress) => {
  if (!shippingAddress) return "Shipping address is required";

  const fields = ["fullName", "phone", "addressLine", "city", "state", "pincode"];

  for (const field of fields) {
    const value = shippingAddress[field];
    // a string of spaces is not a real answer, so trim before checking
    if (!value || typeof value !== "string" || value.trim() === "") {
      return "All shipping fields are required";
    }
  }

  if (!/^[6-9]\d{9}$/.test(shippingAddress.phone.trim())) {
    return "Phone must be a valid 10 digit number";
  }

  if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
    return "Pincode must be exactly 6 digits";
  }

  return null; // no problems
};

// ---------------------------------------------------------------
// POST /orders/create-payment-order
//
// Takes the shipping details and NOTHING else. Not the items, not the
// total - the server reads those from the cart it already holds.
// ---------------------------------------------------------------
const createPaymentOrder = async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message:
          "Payments are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env",
      });
    }

    const { shippingAddress } = req.body;

    // 1. the address has to be usable
    const addressError = validateShipping(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    // 2. read THIS customer's cart, with the real products attached
    const customer = await Customer.findById(req.user._id).populate("cart.product");

    if (!customer.cart || customer.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty",
      });
    }

    // 3. re-check every line before charging anyone. The cart may be hours
    //    old - a product could have been deleted or sold out since.
    const items = [];
    let totalAmount = 0;

    for (const line of customer.cart) {
      const product = line.product;

      // populate() leaves null here if the product was deleted
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available",
        });
      }

      if (product.stock < line.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Only ${product.stock} left`,
        });
      }

      // SNAPSHOT the name and price as they are right now
      items.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: line.quantity,
        image: product.image,
      });

      // the total is built here, from database prices.
      // Anything the frontend sent as a total is never even read.
      totalAmount += product.price * line.quantity;
    }

    // 4. save our own order first, in PENDING_PAYMENT
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      totalAmount,
      paymentStatus: "PENDING",
      status: "PENDING_PAYMENT",
    });

    // 5. ask Razorpay for a matching order.
    //    Razorpay works in PAISE, so rupees must be multiplied by 100.
    //    Math.round avoids a floating point value like 2998.9999999.
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // 6. hand the browser only what it needs to open the payment popup.
    //    The key SECRET is not here, and never will be.
    return res.status(201).json({
      success: true,
      orderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount, // in paise, as Razorpay expects
      currency: razorpayOrder.currency,
      keyId, // public key id only
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not start the payment. Please try again.",
    });
  }
};

// ---------------------------------------------------------------
// POST /orders/verify-payment
//
// Razorpay's popup hands the browser three values. The browser sends them
// here. We do NOT trust them - we recompute the signature ourselves and
// only believe the payment if ours matches theirs.
// ---------------------------------------------------------------
const verifyPayment = async (req, res) => {
  try {
    if (!isConfigured) {
      return res.status(503).json({
        success: false,
        message: "Payments are not configured",
      });
    }

    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // this order has to belong to the person asking
    if (!order.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Already paid? Then this is a replay - a refresh, a double submit, or
    // somebody re-sending an old request. Answer success and change NOTHING.
    // Without this guard a bogus second request could mark a genuinely paid
    // order as FAILED, and the stock would be taken off twice.
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({
        success: true,
        message: "This order has already been paid for",
        orderId: order._id,
      });
    }

    // THE IMPORTANT LINE.
    // We sign with the razorpayOrderId WE stored in step 5 above, not with
    // one taken from the request. If the browser lies about which order was
    // paid, the signature simply will not match.
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      order.paymentStatus = "FAILED";
      await order.save();

      // the cart is deliberately left untouched, so the customer can retry
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // ---- the payment is genuine ----
    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    // take the stock off the shelf now that the money is real
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity } }
      );
    }

    // ONLY NOW is the cart emptied - never before verification
    const customer = await Customer.findById(req.user._id);
    customer.cart = [];
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified and order placed",
      orderId: order._id,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /orders   -> this customer's orders, newest first
// ---------------------------------------------------------------
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /orders/:id   -> one order, only if you own it
// ---------------------------------------------------------------
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Somebody else's order is answered as "not found" rather than "forbidden",
    // so an attacker cannot even learn that the order exists.
    if (!order.user.equals(req.user._id)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// BONUS - PATCH /orders/:id/status
// Moves an order along the delivery journey. In a real shop this would be
// an admin-only route; here it is a dev endpoint so the progression can be
// demonstrated.
// ---------------------------------------------------------------
const ORDER_FLOW = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    if (!ORDER_FLOW.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ORDER_FLOW.join(", ")}`,
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.user.equals(req.user._id)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // an unpaid order has not been placed yet, so it cannot be shipped
    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({
        success: false,
        message: "Only a paid order can move through the delivery stages",
      });
    }

    // you may only move FORWARD along the journey, one stage at a time
    const currentIndex = ORDER_FLOW.indexOf(order.status);
    const nextIndex = ORDER_FLOW.indexOf(status);

    if (nextIndex !== currentIndex + 1) {
      return res.status(400).json({
        success: false,
        message: `An order at ${order.status} cannot jump to ${status}`,
      });
    }

    order.status = status;
    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order is now ${status}`,
      status: order.status,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
