import axios from "axios";

// One axios instance shared by every page.
const api = axios.create({
  baseURL: "http://localhost:8000", // where the Lab-01 backend is running

  // THE MOST IMPORTANT LINE IN THIS FILE.
  // The auth cookie is HttpOnly, so our JavaScript cannot read it or attach it
  // by hand. withCredentials tells the browser: "on every request to this API,
  // attach the cookie you already hold, and accept any cookie it sends back."
  // Without it the browser silently drops the cookie and /customers/me is 401.
  withCredentials: true,
});

export default api;
