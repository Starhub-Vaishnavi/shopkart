import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

// ONE cart, shared by the whole app.
//
// Why this file exists: the navbar count, the Add to Cart buttons and the cart
// page all need to agree. If each of them kept its own copy, the navbar could
// say 2 while the cart page showed 3. Here there is a single source of truth,
// and every component reads from it.
const CartContext = createContext();

// Any component can call this instead of importing the context object itself.
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  // SERVER STATE - a mirror of what the backend holds
  const [cartItems, setCartItems] = useState([]);

  // UI STATE - about this screen only, never sent anywhere
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // which product id is mid-request, so one button can say "Adding..."
  // without freezing every other button on the page
  const [busyId, setBusyId] = useState("");

  // ---- load the cart once, when the app starts ----
  const loadCart = () => {
    setLoading(true);
    setError("");

    api
      .get("/cart")
      .then((res) => setCartItems(res.data.cart))
      .catch((err) => {
        // logged out is not an error worth shouting about - just an empty cart
        if (err.response && err.response.status === 401) {
          setCartItems([]);
        } else {
          setError("Unable to load your cart");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadCart, []);

  // Every mutation below sends the change, then replaces the whole cart with
  // whatever the server returned. We never patch the list by hand - the server
  // is the source of truth, so its answer is the new state.

  const addToCart = async (productId) => {
    setBusyId(productId);
    setError("");

    try {
      const res = await api.post(`/cart/${productId}`);
      setCartItems(res.data.cart);
      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not add that to your cart";
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyId("");
    }
  };

  const updateQuantity = async (productId, quantity) => {
    setBusyId(productId);
    setError("");

    try {
      const res = await api.patch(`/cart/${productId}`, { quantity });
      setCartItems(res.data.cart);
      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not update the quantity";
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyId("");
    }
  };

  const removeFromCart = async (productId) => {
    setBusyId(productId);
    setError("");

    try {
      const res = await api.delete(`/cart/${productId}`);
      setCartItems(res.data.cart);
      return { ok: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Could not remove that product";
      setError(message);
      return { ok: false, message };
    } finally {
      setBusyId("");
    }
  };

  // ---- DERIVED VALUES ----
  // Worked out from cartItems every time this renders. They are never stored,
  // because a stored total goes stale the moment a quantity or price changes.

  // the navbar number: total UNITS, not rows. 3 keyboards = 3.
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // the money: always the product's CURRENT price from the database
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // is this product already in the cart? the button uses it for "Add Another"
  const isInCart = (productId) =>
    cartItems.some((item) => item.product._id === productId);

  const value = {
    cartItems,
    loading,
    error,
    busyId,
    cartCount,
    subtotal,
    isInCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    reloadCart: loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
