const express = require("express");
const router = express.Router();

const {
  createProduct,
  getAllProducts,
  getProductById,
} = require("../controllers/product.controller");

router.post("/", createProduct);      // POST /products
router.get("/", getAllProducts);      // GET  /products  (+ ?search= &category= &sort=)
router.get("/:id", getProductById);   // GET  /products/:id

module.exports = router;
