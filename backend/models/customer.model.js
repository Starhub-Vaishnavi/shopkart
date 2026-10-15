const mongoose = require("mongoose");

// This is the shape of one document inside the "customers" collection.
const customerSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,     // MongoDB will not allow two customers with the same email
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,   // we always store the bcrypt hash here, never the real password
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  // Lab 04: the customer's wishlist.
  // We store only the product's _id here, never a copy of the product itself.
  // "ref" tells mongoose which collection these ids belong to, so populate()
  // knows where to look them up.
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  // Lab 05: the shopping cart.
  // Each row is a REFERENCE to a product plus how many of it we want.
  // We never copy the product's name or price in here - those live on the
  // product document and can change at any time.
  cart: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        min: 1, // you cannot have zero of something in a cart - remove it instead
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// "Customer" -> mongoose creates the collection "customers"
module.exports = mongoose.model("Customer", customerSchema);
