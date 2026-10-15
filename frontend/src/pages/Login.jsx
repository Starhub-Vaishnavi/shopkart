import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      return setError("Email and password are required");
    }

    setLoading(true);
    try {
      // We do NOT get a token back to store anywhere.
      // The server replies with Set-Cookie and the browser saves it for us,
      // because api.js has withCredentials: true.
      await api.post("/customers/login", form);
      navigate("/home");
    } catch (err) {
      setError("Invalid Credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1 className="brand">ShopKart</h1>
        <h2>Welcome back</h2>

        {error && <p className="error">{error}</p>}

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
          placeholder="Your password"
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch">
          New to ShopKart? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
