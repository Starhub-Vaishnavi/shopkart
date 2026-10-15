import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// The heart button that sits on a product card and on the details page.
// It uses the bonus toggle endpoint: one call adds if the product is not
// saved, and removes it if it is. The server answers with { saved: true/false },
// and that answer is what we trust - never our own guess.
function WishlistButton({ productId, initiallySaved }) {
  const navigate = useNavigate();

  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // useState only uses its argument on the FIRST render. The page fetches the
  // wishlist a moment after the products arrive, so initiallySaved can change
  // from false to true after this button already exists. This keeps them in step.
  useEffect(() => {
    setSaved(initiallySaved);
  }, [initiallySaved]);

  const handleClick = async () => {
    setLoading(true);
    setFailed(false);

    try {
      const res = await api.patch(`/wishlist/${productId}/toggle`);

      // the server decides the new state, not us
      setSaved(res.data.saved);

      // let the navbar badge know it should re-count
      window.dispatchEvent(new Event("wishlist-changed"));
    } catch (err) {
      // no token means the session ended - send them to log in
      if (err.response && err.response.status === 401) {
        navigate("/login");
        return;
      }
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wish-wrap">
      <button
        className={saved ? "wish-btn is-saved" : "wish-btn"}
        onClick={handleClick}
        disabled={loading}
      >
        {loading && "⏳ Saving..."}
        {!loading && saved && "♥ Added to Wishlist"}
        {!loading && !saved && "♡ Add to Wishlist"}
      </button>

      {failed && <p className="wish-error">Could not save. Try again.</p>}
    </div>
  );
}

export default WishlistButton;
