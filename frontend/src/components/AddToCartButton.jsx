import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

// The Add to Cart button. It holds no cart state of its own - everything
// comes from the shared context, which is why the navbar and the cart page
// update at the same moment this button is pressed.
function AddToCartButton({ productId, stock }) {
  const navigate = useNavigate();
  const { addToCart, busyId, isInCart } = useCart();

  // busyId is a single id, not a flag, so ONLY the button that was pressed
  // says "Adding..." - the other eight on the page stay clickable.
  const isBusy = busyId === productId;
  const alreadyInCart = isInCart(productId);

  const handleClick = async () => {
    const result = await addToCart(productId);

    // the session ended - send them to log in rather than failing silently
    if (!result.ok && result.message === "Unauthorized") {
      navigate("/login");
    }
  };

  if (stock < 1) {
    return (
      <button className="cart-add-btn" disabled>
        Out of stock
      </button>
    );
  }

  return (
    <button className="cart-add-btn" onClick={handleClick} disabled={isBusy}>
      {isBusy ? "Adding..." : alreadyInCart ? "Add Another" : "Add to Cart"}
    </button>
  );
}

export default AddToCartButton;
