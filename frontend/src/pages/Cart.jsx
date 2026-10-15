import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import Navbar from "../components/Navbar";

function Cart() {
  const navigate = useNavigate();

  // everything comes from the one shared cart
  const {
    cartItems,
    loading,
    error,
    busyId,
    cartCount,
    subtotal,
    updateQuantity,
    removeFromCart,
    reloadCart,
  } = useCart();

  const money = (n) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div>
      <Navbar />

      <main className="page">
        <h1>My Cart</h1>

        {/* 1. loading */}
        {loading && <p className="state">Loading your cart...</p>}

        {/* 2. error, with a retry */}
        {!loading && error && cartItems.length === 0 && (
          <div className="state">
            <p className="error-state">{error}</p>
            <button className="retry-btn" onClick={reloadCart}>
              Try again
            </button>
          </div>
        )}

        {/* 3. empty, with a way out */}
        {!loading && !error && cartItems.length === 0 && (
          <div className="state">
            <p>Your cart is empty.</p>
            <button className="retry-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {cartItems.length > 0 && (
          <>
            {/* an error AFTER the cart loaded - e.g. stock refused */}
            {error && <p className="cart-banner">{error}</p>}

            <div className="cart-layout">
              <div className="cart-items">
                {cartItems.map((item) => {
                  const p = item.product;
                  const isBusy = busyId === p._id;
                  const lineTotal = p.price * item.quantity; // derived, never stored

                  return (
                    <div className="cart-row" key={p._id}>
                      <img className="cart-img" src={p.image} alt={p.name} />

                      <div className="cart-info">
                        <span className="product-category">{p.category}</span>
                        <h3 className="product-name">{p.name}</h3>
                        <p className="cart-unit">{money(p.price)} each</p>

                        <div className="qty-row">
                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(p._id, item.quantity - 1)}
                            disabled={isBusy || item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span className="qty-value">{item.quantity}</span>

                          <button
                            className="qty-btn"
                            onClick={() => updateQuantity(p._id, item.quantity + 1)}
                            disabled={isBusy || item.quantity >= p.stock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>

                          <button
                            className="cart-remove"
                            onClick={() => removeFromCart(p._id)}
                            disabled={isBusy}
                          >
                            {isBusy ? "Working..." : "Remove"}
                          </button>
                        </div>

                        {item.quantity >= p.stock && (
                          <p className="qty-note">Only {p.stock} in stock</p>
                        )}
                      </div>

                      <p className="cart-line">{money(lineTotal)}</p>
                    </div>
                  );
                })}
              </div>

              {/* order summary - every number here is calculated, not stored */}
              <aside className="summary">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Items</span>
                  <span>{cartCount}</span>
                </div>

                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>

                <div className="summary-row">
                  <span>Delivery</span>
                  <span className="free">Free</span>
                </div>

                <div className="summary-row total">
                  <span>Total</span>
                  <span>{money(subtotal)}</span>
                </div>

                <button
                  className="checkout-btn"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Cart;
