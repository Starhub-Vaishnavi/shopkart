require("dotenv").config(); // load the values from .env into process.env

const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const customerRoutes = require("./routes/customer.routes");
const productRoutes = require("./routes/product.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const orderRoutes = require("./routes/order.routes");
const cartRoutes = require("./routes/cart.routes");

const app = express();

// ----- middlewares that run on every request -----
app.use(express.json());   // parses a JSON body into req.body
app.use(cookieParser());   // parses the Cookie header into req.cookies

// lets the React app (a different origin) call this API *and* send cookies
app.use(
  cors({
    // Vite normally uses 5173, but if that port is already busy it quietly
    // moves to 5174. We allow both so the app works either way.
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true, // without this the browser drops our cookie
  })
);

// ----- routes -----
app.use("/customers", customerRoutes); // every route inside gets the /customers prefix
app.use("/products", productRoutes);   // every route inside gets the /products prefix
app.use("/wishlist", wishlistRoutes);  // every route inside gets the /wishlist prefix
app.use("/cart", cartRoutes);          // every route inside gets the /cart prefix
app.use("/orders", orderRoutes);    // every route inside gets the /orders prefix

const PORT = process.env.PORT || 8000; // 8000, because macOS AirPlay occupies 5000

// connect to MongoDB first, and only then start listening
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
  });
