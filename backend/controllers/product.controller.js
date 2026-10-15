const mongoose = require("mongoose");
const Product = require("../models/product.model");

// ---------------------------------------------------------------
// POST /products   -> create one product
// ---------------------------------------------------------------
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // 1. every field is mandatory
    if (!name || !description || !category || !image) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // 2. price must be a number greater than 0
    if (price === undefined || isNaN(price) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be greater than 0",
      });
    }

    // 3. stock must be a number that is not negative
    if (stock === undefined || isNaN(stock) || Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /products                          -> all products
// GET /products?search=keyboard          -> name contains "keyboard"
// GET /products?category=Electronics     -> only that category
// GET /products?sort=price_asc           -> cheapest first   (bonus)
// ---------------------------------------------------------------
const getAllProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Build the MongoDB filter one piece at a time, so any mix of
    // query parameters works without needing a separate endpoint.
    const filter = {};

    if (search) {
      // "i" makes the match case-insensitive, so "KEY" finds "Keyboard"
      filter.name = { $regex: search, $options: "i" };
    }

    if (category) {
      filter.category = category;
    }

    // Bonus: sorting by price
    let sortOption = { createdAt: -1 }; // newest first by default
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    // the UI does not need the description in the list, so we leave it out
    const products = await Product.find(filter).select("-description").sort(sortOption);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

// ---------------------------------------------------------------
// GET /products/:id   -> one product
// ---------------------------------------------------------------
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // An id that is not a valid ObjectId would make findById throw,
    // so we check the shape first and answer 400 instead of 500.
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};

module.exports = { createProduct, getAllProducts, getProductById };
