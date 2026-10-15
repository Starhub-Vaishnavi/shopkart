const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  updateQuantity,
  removeFromCart,
} = require("../controllers/cart.controller");

const protect = require("../middlewares/auth.middleware");

// Every cart route is protected - a cart belongs to one person.
router.get("/", protect, getCart);                       // GET    /cart
router.post("/:productId", protect, addToCart);          // POST   /cart/:productId
router.patch("/:productId", protect, updateQuantity);    // PATCH  /cart/:productId
router.delete("/:productId", protect, removeFromCart);   // DELETE /cart/:productId

module.exports = router;
