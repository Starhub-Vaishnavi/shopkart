import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";

function Products() {
  const [products, setProducts] = useState([]);

  // the three UI states the lab asks for
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // the filter values the user controls
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // the ids this customer has already wishlisted, so each card can draw the
  // right heart on first render. A Set makes the "is this one saved?" check
  // instant instead of scanning an array for every card.
  const [savedIds, setSavedIds] = useState(new Set());

  // Runs once. If nobody is logged in the call fails with 401, and that is
  // fine - we simply show every heart as empty instead of crashing the page.
  useEffect(() => {
    api
      .get("/wishlist")
      .then((res) => setSavedIds(new Set(res.data.wishlist.map((p) => p._id))))
      .catch(() => setSavedIds(new Set()));
  }, []);

  // Runs on the first render, and again every time search or category changes.
  // The filtering is done by MongoDB, not by React - we just ask for the
  // products we want and render whatever comes back.
  useEffect(() => {
    setLoading(true);
    setError("");

    // build the query string only from the filters that are actually set
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;

    api
      .get("/products", { params })
      .then((res) => setProducts(res.data.products))
      .catch(() => setError("Something went wrong while loading products."))
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div>
      <Navbar />

      <main className="page">
        <h1>Products</h1>

        <SearchBar
          search={search}
          setSearch={setSearch}
          category={category}
          setCategory={setCategory}
        />

        {/* 1. loading state */}
        {loading && <p className="state">Loading products...</p>}

        {/* 2. error state */}
        {!loading && error && <p className="state error-state">{error}</p>}

        {/* 3. empty state */}
        {!loading && !error && products.length === 0 && (
          <p className="state">No products found.</p>
        )}

        {/* the products themselves, drawn with .map() - never hardcoded */}
        {!loading && !error && products.length > 0 && (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isSaved={savedIds.has(product._id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Products;
