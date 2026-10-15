const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist,
  getWishlistCount,
} = require("../controllers/wishlist.controller");

const protect = require("../middlewares/auth.middleware");

// Every wishlist route is protected. "protect" runs first and answers 401
// if there is no valid token, so a controller below never sees a stranger.

router.get("/", protect, getWishlist);                 // GET    /wishlist
router.get("/count", protect, getWishlistCount);       // GET    /wishlist/count   (bonus)

router.post("/:productId", protect, addToWishlist);           // POST   /wishlist/:productId
router.delete("/:productId", protect, removeFromWishlist);    // DELETE /wishlist/:productId
router.patch("/:productId/toggle", protect, toggleWishlist);  // PATCH  ...toggle    (bonus)

module.exports = router;
