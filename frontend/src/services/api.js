import axios from "axios";

// One axios instance shared by every page.
const api = axios.create({
  // In development this falls back to the local backend. When deployed,
  // VITE_API_URL is set on the host to the live backend's address.
  // Vite replaces import.meta.env.* at BUILD time, so this must be set
  // before the frontend is built, not after.
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",

  // THE MOST IMPORTANT LINE IN THIS FILE.
  // The auth cookie is HttpOnly, so our JavaScript cannot read it or attach it
  // by hand. withCredentials tells the browser: "on every request to this API,
  // attach the cookie you already hold, and accept any cookie it sends back."
  // Without it the browser silently drops the cookie and /customers/me is 401.
  withCredentials: true,
});

export default api;
