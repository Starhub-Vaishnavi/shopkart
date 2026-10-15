import { Routes, Route, Navigate } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

function App() {
  return (
    <Routes>
      {/* opening "/" just sends you to the login page */}
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/home" element={<Home />} />

      <Route path="/products" element={<Products />} />

      {/* ":id" is a URL parameter - it stands for whatever value is in the URL */}
      <Route path="/products/:id" element={<ProductDetails />} />

      <Route path="/wishlist" element={<Wishlist />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />

      <Route path="/orders" element={<Orders />} />

      {/* doubles as the confirmation screen right after a payment */}
      <Route path="/orders/:id" element={<OrderDetails />} />
    </Routes>
  );
}

export default App;
