import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Checkout sends us here with this flag right after a verified payment,
  // so the same page doubles as the order confirmation screen.
  const justPaid = location.state?.justPaid === true;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const money = (n) => `₹${n.toLocaleString("en-IN")}`;

  const loadOrder = () => {
    setLoading(true);
    setError("");

    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.order))
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          navigate("/login");
        } else if (err.response && err.response.status === 404) {
          setError("We could not find that order.");
        } else {
          setError("Unable to load this order");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadOrder, [id]);

  return (
    <div>
      <Navbar />

      <main className="page">
        {loading && <p className="state">Loading your order...</p>}

        {!loading && error && (
          <div className="state">
            <p className="error-state">{error}</p>
            <button className="retry-btn" onClick={loadOrder}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && order && (
          <>
            {justPaid && (
              <div className="paid-banner">
                <p className="paid-title">Payment successful</p>
                <p>Thank you — your order has been placed.</p>
              </div>
            )}

            <h1>Order #{order._id.slice(-8)}</h1>

            <div className="order-meta">
              <span className={`status-chip s-${order.status.toLowerCase()}`}>
                {order.status.replace("_", " ")}
              </span>
              <span className={`status-chip p-${order.paymentStatus.toLowerCase()}`}>
                Payment {order.paymentStatus}
              </span>
            </div>

            <div className="checkout-grid">
              <section className="order-box">
                <h2>Items</h2>
                {order.items.map((item, index) => (
                  <div className="summary-line" key={index}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{money(item.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="summary-row total">
                  <span>Total paid</span>
                  <span>{money(order.totalAmount)}</span>
                </div>

                <p className="summary-note">
                  These are the names and prices as they were on the day you
                  ordered, even if the shop has changed them since.
                </p>
              </section>

              <aside className="order-box">
                <h2>Delivering to</h2>
                <p className="address">
                  {order.shippingAddress.fullName}
                  <br />
                  {order.shippingAddress.addressLine}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}
                  <br />
                  {order.shippingAddress.pincode}
                  <br />
                  {order.shippingAddress.phone}
                </p>

                <div className="order-links">
                  <Link className="nav-link" to="/orders">
                    All my orders
                  </Link>
                  <Link className="nav-link" to="/products">
                    Continue shopping
                  </Link>
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default OrderDetails;
