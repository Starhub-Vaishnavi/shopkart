const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// Every function below runs AFTER the protect middleware, so req.user is
// already the logged-in customer. We never read a user id from the request
// body - the JWT decides who you are.

// ---------------------------------------------------------------
// POST /wishlist/:productId   -> add one product
// ---------------------------------------------------------------
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. is it even a valid MongoDB id?
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    // 2. does that product actually exist?
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);

    // 3. is it already saved? .some() with .equals() because these are
    //    ObjectIds, and comparing them with === would always be false.
    const alreadySaved = customer.wishlist.some((id) => id.equals(productId));

    if (alreadySaved) {
      return res.status(409).json({
        success: false,
        message: "Product already in wishlist",
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /wishlist   -> the logged-in customer's saved products
// ---------------------------------------------------------------
const getWishlist = async (req, res) => {
  try {
    // populate() swaps each stored id for the real product document.
    // Without it we would only get back an array of ids.
    // The second argument lists the fields we want, so we do not ship
    // the description to a page that never shows it.
    const customer = await Customer.findById(req.user._id).populate(
      "wishlist",
      "name price category image stock"
    );

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
      wishlist: customer.wishlist,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// DELETE /wishlist/:productId   -> remove one product
// ---------------------------------------------------------------
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const customer = await Customer.findById(req.user._id);

    const isSaved = customer.wishlist.some((id) => id.equals(productId));

    // removing something that was never there is a 404, not a silent success
    if (!isSaved) {
      return res.status(404).json({
        success: false,
        message: "Product not in wishlist",
      });
    }

    // keep every id EXCEPT the one being removed
    customer.wishlist = customer.wishlist.filter((id) => !id.equals(productId));
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// BONUS - PATCH /wishlist/:productId/toggle
// One endpoint that adds if missing and removes if present, and tells
// the frontend which of the two it did.
// ---------------------------------------------------------------
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const customer = await Customer.findById(req.user._id);
    const alreadySaved = customer.wishlist.some((id) => id.equals(productId));

    if (alreadySaved) {
      customer.wishlist = customer.wishlist.filter((id) => !id.equals(productId));
      await customer.save();

      return res.status(200).json({
        success: true,
        saved: false, // the UI uses this to draw an empty heart
        message: "Product removed from wishlist",
      });
    }

    customer.wishlist.push(productId);
    await customer.save();

    return res.status(200).json({
      success: true,
      saved: true, // ...and a filled heart
      message: "Product added to wishlist",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// BONUS - GET /wishlist/count   -> just the number, for the navbar badge
// ---------------------------------------------------------------
const getWishlistCount = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id);

    return res.status(200).json({
      success: true,
      count: customer.wishlist.length,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
};
