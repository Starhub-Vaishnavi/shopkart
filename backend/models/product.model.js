const mongoose = require("mongoose");

// The shape of one document inside the "products" collection.
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: [1, "Price must be greater than 0"], // price cannot be 0 or negative
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
    trim: true,
  },
  stock: {
    type: Number,
    required: true,
    min: [0, "Stock cannot be negative"], // 0 is allowed (out of stock)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// "Product" -> mongoose creates the collection "products"
module.exports = mongoose.model("Product", productSchema);
