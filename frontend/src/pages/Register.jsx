import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  // One state object holds all four inputs -> these are controlled components:
  // React owns the value, the input just displays it.
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate(); // lets us move to another route from code

  // Runs on every keystroke. e.target.name matches the key in the state object.
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // stop the browser's default full-page reload
    setError("");

    // --- basic checks before we bother the server ---
    if (!form.fullName || !form.email || !form.password || !form.phone) {
      return setError("All fields are required");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      await api.post("/customers/register", form);
      navigate("/login"); // success -> send them to the login page
    } catch (err) {
      // If err.response exists, the server answered and told us what was wrong.
      // If it does not, the request never arrived - backend down, or blocked by CORS.
      setError(
        err.response?.data?.message ||
          "Cannot reach the server. Is the backend running on port 8000?"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="brand">ShopKart</h1>
        <h2>Create your account</h2>

        {error && <p className="error">{error}</p>}

        <label>Full Name</label>
        <input
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          placeholder="John Doe"
        />

        <label>Email</label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="john@gmail.com"
        />

        <label>Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="At least 6 characters"
        />

        <label>Phone Number</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="9876543210"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
