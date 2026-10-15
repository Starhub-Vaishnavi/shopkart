import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const money = (n) => `₹${n.toLocaleString("en-IN")}`;

  const loadOrders = () => {
    setLoading(true);
    setError("");

    api
      .get("/orders")
      .then((res) => setOrders(res.data.orders))
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          navigate("/login");
        } else {
          setError("Unable to load your orders");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  // a date a person can read, instead of the raw timestamp
  const when = (iso) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <div>
      <Navbar />

      <main className="page">
        <h1>My Orders</h1>

        {loading && <p className="state">Loading your orders...</p>}

        {!loading && error && (
          <div className="state">
            <p className="error-state">{error}</p>
            <button className="retry-btn" onClick={loadOrders}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="state">
            <p>You have not placed any orders yet.</p>
            <button className="retry-btn" onClick={() => navigate("/products")}>
              Browse Products
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="order-list">
            {orders.map((order) => (
              <Link className="order-row" to={`/orders/${order._id}`} key={order._id}>
                <div className="order-main">
                  <p className="order-id">#{order._id.slice(-8)}</p>
                  <p className="order-when">{when(order.createdAt)}</p>
                  <p className="order-items">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""} ·{" "}
                    {order.items.map((i) => i.name).join(", ")}
                  </p>
                </div>

                <div className="order-side">
                  <p className="order-total">{money(order.totalAmount)}</p>
                  <span className={`status-chip s-${order.status.toLowerCase()}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;
