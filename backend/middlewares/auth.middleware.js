const jwt = require("jsonwebtoken");
const Customer = require("../models/customer.model");

// Runs BEFORE a protected controller.
// Its job: prove who the caller is, or stop the request with 401.
const protect = async (req, res, next) => {
  try {
    // 1. read the token out of the cookie the browser sent
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 2. verify the signature. If someone edited the token, this throws.
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // -> { id: "..." }

    // 3. load that customer from MongoDB, without the password field
    const customer = await Customer.findById(decoded.id).select("-password");

    if (!customer) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // 4. hand the customecd ~/projects/shopkart && ./start-db.shr over to the controller
    req.user = customer;

    next(); // move on to the next function in the chain
  } catch (error) {
    // invalid or expired token lands here
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

module.exports = protect;
