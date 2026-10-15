// Razorpay's popup comes from a script on their servers. It is not an npm
// package, so we add the <script> tag ourselves the first time it is needed.
//
// We load it on demand rather than in index.html, so someone who never
// checks out never downloads it.
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    // already loaded by a previous checkout attempt
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false); // offline, or blocked
    document.body.appendChild(script);
  });
}
