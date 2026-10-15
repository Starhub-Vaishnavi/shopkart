const jwt = require("jsonwebtoken");

// Builds a signed JWT that carries the customer's id.
// Only the id goes inside - never the password or any secret data.
const generateToken = (customerId) => {
  return jwt.sign(
    { id: customerId },        // 1. payload  -> the data we want to remember
    process.env.JWT_SECRET,    // 2. secret   -> used to sign and later verify
    { expiresIn: "7d" }        // 3. options  -> the token dies after 7 days
  );
};

module.exports = generateToken;
