const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Every function here runs AFTER the protect middleware, so req.user is the
// logged-in customer. The user id is never read from the request.

// Sends back the whole cart, with each row's product filled in.
// Used by every endpoint so the frontend always receives the same shape.
const sendCart = async (customerId, res, status = 200) => {
  const customer = await Customer.findById(customerId).populate(
    "cart.product", // reach INSIDE each row and populate its product field
    "name price category image stock"
  );

  // A product that was deleted from the catalogue would leave a row whose
  // product is null. Dropping those keeps the page from crashing.
  const cart = customer.cart.filter((item) => item.product);
  return res.status(status).json({
    success: true,
    count: cart.length,
    cart,
  });
};

// ---------------------------------------------------------------
// POST /cart/:productId   -> add one, or increment if already there
// ---------------------------------------------------------------
const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // nothing can be added if the shelf is empty
    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    const customer = await Customer.findById(req.user._id);

    // is this product already a row in the cart?
    const existingItem = customer.cart.find((item) =>
      item.product.equals(productId)
    );

    if (existingItem) {
      // THE RULE: a second add does not create a second row - it increments.
      const newQuantity = existingItem.quantity + 1;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} in stock`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      customer.cart.push({ product: productId, quantity: 1 });
    }

    await customer.save();

    return sendCart(customer._id, res, 201);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /cart   -> the logged-in customer's cart
// ---------------------------------------------------------------
const getCart = async (req, res) => {
  try {
    return sendCart(req.user._id, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// PATCH /cart/:productId   -> set an exact quantity
// body: { quantity: 3 }
// ---------------------------------------------------------------
const updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Number() because a body value could arrive as the string "3"
    const wanted = Number(quantity);

    if (!Number.isInteger(wanted) || wanted < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number of at least 1",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (wanted > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} in stock`,
      });
    }

    const customer = await Customer.findById(req.user._id);

    const item = customer.cart.find((row) => row.product.equals(productId));

    // changing the quantity of something that is not in the cart is a 404
    if (!item) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    item.quantity = wanted;
    await customer.save();

    return sendCart(customer._id, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// DELETE /cart/:productId   -> remove the whole row
// ---------------------------------------------------------------
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const customer = await Customer.findById(req.user._id);

    const isInCart = customer.cart.some((row) => row.product.equals(productId));

    if (!isInCart) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    customer.cart = customer.cart.filter((row) => !row.product.equals(productId));
    await customer.save();

    // the lab asks for the UPDATED cart back, so the frontend can redraw
    return sendCart(customer._id, res);
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = { addToCart, getCart, updateQuantity, removeFromCart };
