const Razorpay = require("razorpay");

// The SECRET never leaves the backend. The browser only ever receives the
// key id, which is public by design - it just names the account.
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// If the keys are missing we do NOT crash the whole server - the rest of
// ShopKart still works. Only the payment routes refuse, with a clear message.
const isConfigured = Boolean(keyId && keySecret);

const razorpay = isConfigured
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

module.exports = { razorpay, isConfigured, keyId, keySecret };
