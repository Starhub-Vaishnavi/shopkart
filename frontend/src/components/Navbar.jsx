import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";

function Navbar({ customerName }) {
  const navigate = useNavigate();

  // The cart number is DERIVED from the shared cart state - total units across
  // all rows. It is never stored and never hardcoded, so it updates the instant
  // any component adds, changes or removes something.
  const { cartCount } = useCart();

  // BONUS: the number shown next to "Wishlist". It comes from the backend,
  // never from a hardcoded value or a guess kept in the browser.
  const [count, setCount] = useState(null);

  const loadCount = () => {
    api
      .get("/wishlist/count")
      .then((res) => setCount(res.data.count))
      .catch(() => setCount(null)); // logged out - just show no number
  };

  useEffect(() => {
    loadCount();

    // The wishlist button and the wishlist page fire this event after a
    // successful change, so the badge re-counts without a page refresh.
    window.addEventListener("wishlist-changed", loadCount);
    return () => window.removeEventListener("wishlist-changed", loadCount);
  }, []);

  const handleLogout = async () => {
    try {
      // The server clears the cookie. We cannot delete it ourselves
      // because it is HttpOnly - only the server can remove it.
      await api.post("/customers/logout");
    } catch (error) {
      // even if the call fails, still send the user to login
    }
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link className="brand" to="/home">ShopKart</Link>

      <div className="nav-right">
        <Link className="nav-link" to="/products">Products</Link>

        <Link className="nav-link" to="/wishlist">
          Wishlist{count !== null && count > 0 ? ` (${count})` : ""}
        </Link>

        <Link className="nav-link" to="/orders">Orders</Link>

        <Link className="nav-link" to="/cart">
          Cart{cartCount > 0 ? ` (${cartCount})` : ""}
        </Link>

        {customerName && <span className="hello">Hi, {customerName}</span>}
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
