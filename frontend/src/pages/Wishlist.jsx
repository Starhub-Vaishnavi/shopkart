import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Wishlist() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // which product is currently being removed, so only that button says
  // "Removing..." instead of every button on the page
  const [removingId, setRemovingId] = useState("");

  const loadWishlist = () => {
    setLoading(true);
    setError("");

    api
      .get("/wishlist")
      .then((res) => setItems(res.data.wishlist))
      .catch((err) => {
        // not logged in is a different problem from a broken server
        if (err.response && err.response.status === 401) {
          navigate("/login");
        } else {
          setError("Unable to load wishlist");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadWishlist, []);

  const handleRemove = async (productId) => {
    setRemovingId(productId);

    try {
      await api.delete(`/wishlist/${productId}`);

      // remove it from the screen without reloading the page
      setItems((current) => current.filter((p) => p._id !== productId));

      // tell the navbar its badge is out of date
      window.dispatchEvent(new Event("wishlist-changed"));
    } catch (err) {
      setError("Could not remove that product. Please try again.");
    } finally {
      setRemovingId("");
    }
  };

  return (
    <div>
      <Navbar />

      <main className="page">
        <h1>My Wishlist</h1>

        {/* 1. loading */}
        {loading && <p className="state">Loading your wishlist...</p>}

        {/* 2. error, with a retry button */}
        {!loading && error && (
          <div className="state">
            <p className="error-state">{error}</p>
            <button className="retry-btn" onClick={loadWishlist}>
              Try again
            </button>
          </div>
        )}

        {/* 3. empty, with a way out */}
        {!loading && !error && items.length === 0 && (
          <div className="state">
            <p>Your wishlist is empty.</p>
            <button className="retry-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {/* the saved products */}
        {!loading && !error && items.length > 0 && (
          <div className="product-grid">
            {items.map((product) => (
              <div className="product-card" key={product._id}>
                <img className="product-img" src={product.image} alt={product.name} />

                <div className="product-body">
                  <span className="product-category">{product.category}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </p>

                  {product.stock > 0 ? (
                    <p className="in-stock">{product.stock} units left</p>
                  ) : (
                    <p className="out-stock">Out of stock</p>
                  )}

                  <button onClick={() => navigate(`/products/${product._id}`)}>
                    View Details
                  </button>

                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(product._id)}
                    disabled={removingId === product._id}
                  >
                    {removingId === product._id
                      ? "Removing..."
                      : "Remove from Wishlist"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Wishlist;
