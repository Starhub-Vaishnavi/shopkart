import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";

function Home() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // This is what makes /home a PROTECTED route.
  // We never trust the frontend - we ask the backend "who am I?".
  // If the cookie is missing or expired the backend answers 401
  // and we bounce the user to /login.
  useEffect(() => {
    api
      .get("/customers/me")
      .then((res) => setCustomer(res.data))
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  if (!customer) {
    return null; // we are already redirecting to /login
  }

  return (
    <div>
      <Navbar customerName={customer.fullName} />

      <main className="home">
        <h1>Welcome back, {customer.fullName} 👋</h1>
        <p className="subtitle">You are logged in to ShopKart.</p>

        <div className="profile-card">
          <h3>Your Profile</h3>

          <div className="row">
            <span>Name</span>
            <strong>{customer.fullName}</strong>
          </div>
          <div className="row">
            <span>Email</span>
            <strong>{customer.email}</strong>
          </div>
          <div className="row">
            <span>Phone</span>
            <strong>{customer.phone}</strong>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
