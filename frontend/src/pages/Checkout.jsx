import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { loadRazorpayScript } from "../utils/loadRazorpay";

const EMPTY_FORM = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  pincode: "",
};

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, subtotal, loading: cartLoading, reloadCart } = useCart();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [paying, setPaying] = useState(false);
  const [serverError, setServerError] = useState("");

  const money = (n) => `₹${n.toLocaleString("en-IN")}`;

  // You cannot check out nothing. If the cart is empty - because it was
  // emptied in another tab, or somebody typed /checkout straight in - send
  // them back rather than showing a form that cannot work.
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartLoading, cartItems, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // clear this field's error as soon as the user starts fixing it
    setErrors({ ...errors, [e.target.name]: "" });
  };

  // The SAME rules the server applies. Checking here saves a pointless
  // request; checking on the server is what actually keeps the data clean,
  // because a form can always be bypassed.
  const validate = () => {
    const found = {};

    if (!form.fullName.trim()) found.fullName = "Full name is required";
    if (!form.addressLine.trim()) found.addressLine = "Address is required";
    if (!form.city.trim()) found.city = "City is required";
    if (!form.state.trim()) found.state = "State is required";

    if (!form.phone.trim()) {
      found.phone = "Phone is required";
    } else if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      found.phone = "Enter a valid 10 digit phone number";
    }

    if (!form.pincode.trim()) {
      found.pincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      found.pincode = "Pincode must be exactly 6 digits";
    }

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    // if the form is wrong, NO request is sent at all
    if (!validate()) return;

    setPaying(true);

    try {
      // 1. ask our own server to prepare the order.
      //    We send the address and nothing else - no items, no total.
      const res = await api.post("/orders/create-payment-order", {
        shippingAddress: form,
      });

      const { orderId, razorpayOrderId, amount, currency, keyId } = res.data;

      // 2. make sure Razorpay's popup script is on the page
      const ready = await loadRazorpayScript();
      if (!ready) {
        setServerError("Could not reach the payment provider. Check your connection.");
        setPaying(false);
        return;
      }

      // 3. open the popup. keyId is the PUBLIC key - the secret stays
      //    on the backend and is never sent to the browser.
      const razorpay = new window.Razorpay({
        key: keyId,
        amount, // already in paise, straight from the server
        currency,
        order_id: razorpayOrderId,
        name: "ShopKart",
        description: "Order payment",
        prefill: { name: form.fullName, contact: form.phone },

        // 4. Razorpay calls this when the customer has paid.
        //    These three values are NOT proof of payment on their own -
        //    the backend has to verify the signature.
        handler: async (response) => {
          try {
            await api.post("/orders/verify-payment", {
              orderId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // the server has emptied the cart, so pull the new (empty)
            // cart into our shared state - that is what makes the navbar
            // show Cart (0) without a refresh
            reloadCart();

            navigate(`/orders/${orderId}`, { state: { justPaid: true } });
          } catch (err) {
            setServerError(
              "We could not verify that payment. Your cart has been left as it is."
            );
            setPaying(false);
          }
        },

        modal: {
          // the customer closed the popup without paying
          ondismiss: () => {
            setPaying(false);
            setServerError("Payment cancelled. Your cart is still here.");
          },
        },
      });

      razorpay.open();
    } catch (err) {
      setServerError(
        err.response?.data?.message || "Could not start the payment. Please try again."
      );
      setPaying(false);
    }
  };

  const field = (name, label, placeholder, extra = {}) => (
    <div className="form-row">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        {...extra}
      />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div>
      <Navbar />

      <main className="page">
        <h1>Checkout</h1>

        {serverError && <p className="state error-state">{serverError}</p>}

        <div className="checkout-grid">
          <form className="shipping-form" onSubmit={handleSubmit} noValidate>
            <h2>Shipping details</h2>

            {field("fullName", "Full name", "Vaishnavi Reddy")}
            {field("phone", "Phone", "10 digit mobile number")}
            {field("addressLine", "Address", "House number, street, area")}
            {field("city", "City", "Bengaluru")}
            {field("state", "State", "Karnataka")}
            {field("pincode", "Pincode", "560001")}

            <button className="pay-btn" type="submit" disabled={paying}>
              {paying ? "Opening payment..." : `Pay ${money(subtotal)}`}
            </button>
          </form>

          <aside className="order-summary">
            <h2>Your order</h2>

            {cartItems.map((item) => (
              <div className="summary-line" key={item.product._id}>
                <span>
                  {item.product.name} × {item.quantity}
                </span>
                <span>{money(item.product.price * item.quantity)}</span>
              </div>
            ))}

            <div className="summary-row total">
              <span>Total</span>
              <span>{money(subtotal)}</span>
            </div>

            <p className="summary-note">
              The amount is calculated again on the server before payment.
            </p>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Checkout;
