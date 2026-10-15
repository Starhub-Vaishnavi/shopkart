import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import WishlistButton from "../components/WishlistButton";
import AddToCartButton from "../components/AddToCartButton";

function ProductDetails() {
  // useParams reads the :id out of the URL, e.g. /products/66d123abc456
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // runs again if the id in the URL changes
  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data.product))
      .catch(() => setError("Something went wrong while loading this product."))
      .finally(() => setLoading(false));

    // is this product already saved? a 401 just means logged out.
    api
      .get("/wishlist")
      .then((res) => setIsSaved(res.data.wishlist.some((p) => p._id === id)))
      .catch(() => setIsSaved(false));
  }, [id]);

  if (loading) return <p className="state">Loading product...</p>;

  if (error) return <p className="state error-state">{error}</p>;

  if (!product) return <p className="state">No product found.</p>;

  return (
    <div>
      <Navbar />

      <main className="page">
        <button className="back-btn" onClick={() => navigate("/products")}>
          ← Back to products
        </button>

        <div className="details">
          <img className="details-img" src={product.image} alt={product.name} />

          <div className="details-info">
            <span className="product-category">{product.category}</span>
            <h1>{product.name}</h1>
            <p className="details-price">
              ₹{product.price.toLocaleString("en-IN")}
            </p>
            <p className="details-desc">{product.description}</p>

            {product.stock > 0 ? (
              <p className="in-stock">{product.stock} units in stock</p>
            ) : (
              <p className="out-stock">Out of stock</p>
            )}

            <WishlistButton productId={product._id} initiallySaved={isSaved} />

            <AddToCartButton productId={product._id} stock={product.stock} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default ProductDetails;
