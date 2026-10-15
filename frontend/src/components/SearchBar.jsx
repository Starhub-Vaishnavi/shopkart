// The search box and the category dropdown.
// This component holds no state of its own - the Products page owns the values
// and passes them down, so there is only one source of truth.
function SearchBar({ search, setSearch, category, setCategory }) {
  return (
    <div className="filters">
      <input
        className="search-input"
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <select
        className="category-select"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="Electronics">Electronics</option>
        <option value="Fashion">Fashion</option>
        <option value="Books">Books</option>
        <option value="Home">Home</option>
      </select>
    </div>
  );
}

export default SearchBar;
