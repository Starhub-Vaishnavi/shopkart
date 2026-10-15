import { useNavigate } from "react-router-dom";
import WishlistButton from "./WishlistButton";
import AddToCartButton from "./AddToCartButton";

// One card. It receives a single product as a prop and only displays it.
// "isSaved" tells it whether this product is already in the wishlist, so the
// heart is drawn correctly the moment the page loads.
function ProductCard({ product, isSaved }) {
  const navigate = useNavigate();

  return (
    <div className="product-card">
      <img className="product-img" src={product.image} alt={product.name} />

      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₹{product.price.toLocaleString("en-IN")}</p>

        {/* stock 0 means out of stock, so we show a different label */}
        {product.stock > 0 ? (
          <p className="in-stock">{product.stock} units left</p>
        ) : (
          <p className="out-stock">Out of stock</p>
        )}

        <button onClick={() => navigate(`/products/${product._id}`)}>
          View Details
        </button>

        <AddToCartButton productId={product._id} stock={product.stock} />

        <WishlistButton productId={product._id} initiallySaved={isSaved} />
      </div>
    </div>
  );
}

export default ProductCard;
