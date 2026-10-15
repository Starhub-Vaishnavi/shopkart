const mongoose = require("mongoose");

// ONE LINE of an order.
//
// Notice that name and price are copied in here, even though we also keep a
// reference to the product. That copy is deliberate - it is a SNAPSHOT.
// If the shop raises the price of a keyboard tomorrow, this order must still
// show what the customer actually paid today. The reference is kept as well,
// so "view this product" still works.
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true, // snapshot of the name at the moment of purchase
    },
    price: {
      type: Number,
      required: true, // snapshot of the price at the moment of purchase
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: {
      type: String, // snapshot too, so an old order still shows a picture
    },
  },
  { _id: false } // these rows do not need their own ids
);

// Where the parcel goes. Validated on the server as well as in the form.
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // whose order this is. Taken from the JWT, never from the request body.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    // Always calculated on the server from the snapshot prices.
    // Whatever total the frontend sends is ignored completely.
    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    // PENDING_PAYMENT is the state an order sits in between "Pay Now" being
    // pressed and the signature being verified. It only becomes PLACED once
    // the payment is proven genuine.
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"],
      default: "PENDING_PAYMENT",
    },

    // Razorpay's own ids. We store the order id when we create it, and later
    // verify the signature against THIS stored value - never against whatever
    // the browser sends us.
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true } // gives us createdAt and updatedAt for free
);

module.exports = mongoose.model("Order", orderSchema);
