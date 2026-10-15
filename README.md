# ShopKart

A MERN practice shop built across six engineering labs: customer
authentication, a product catalogue, a wishlist, a cart, and a Razorpay
test-mode checkout that turns the cart into a permanent order.

| Lab | What it adds | Where |
|-----|--------------|-------|
| 01 | Customer auth APIs — bcrypt, JWT in an HttpOnly cookie | `backend/` |
| 02 | React UI — register, login, home | `frontend/` |
| 03 | Product catalogue — search, category filter, sorting | both |
| 04 | Wishlist — ObjectId references and `populate()` | both |
| 05 | Shopping cart — shared React context | both |
| 06 | Checkout and orders — Razorpay test mode | both |

**Stack:** React (Vite) · Node + Express · MongoDB (Mongoose) · JWT · Razorpay

---

## Setup

**You need:** Node 18 or newer, and MongoDB. If you do not have MongoDB
installed, `./start-db.sh` downloads a local copy into `.mongodb/` and runs
it — no system-wide install, nothing to uninstall afterwards.

**1. Clone and install**

```bash
git clone https://github.com/Starhub-Vaishnavi/shopkart.git
cd shopkart
cd backend && npm install
cd ../frontend && npm install
```

**2. Create the backend environment file**

```bash
cd backend
cp .env.example .env
```

Then open `.env` and fill it in:

| Variable | What to put |
|----------|-------------|
| `PORT` | `8000` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/shopkart` for the local database |
| `JWT_SECRET` | any long random string |
| `RAZORPAY_KEY_ID` | test key id from dashboard.razorpay.com → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | the matching test secret |

Everything except checkout works without the Razorpay keys — the payment
routes answer with a clear "payments are not configured" message instead.

**3. Run it — three terminals**

```bash
# terminal 1 — database
./start-db.sh

# terminal 2 — backend, on http://localhost:8000
cd backend && npm run dev

# terminal 3 — frontend, on http://localhost:5173
cd frontend && npm run dev
```

Open **http://localhost:5173**, register an account, and start from there.

**4. Add some products**

The catalogue starts empty. Import `ShopKart-Lab03-Products.postman_collection.json`
into Postman and run the create-product request a few times, or send:

```bash
curl -X POST http://localhost:8000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Mechanical Keyboard","description":"RGB mechanical keyboard.","price":2999,"category":"Electronics","image":"https://picsum.photos/seed/keyboard/500/400","stock":10}'
```

**Paying in test mode:** card `4111 1111 1111 1111`, any future expiry, any
CVV. No real money moves.

> **Why port 8000 and not 5000?** On macOS, port 5000 is taken by the
> AirPlay Receiver, which answers every request with `403 Forbidden`.

---

## API reference

| Method | Endpoint | Protected | Purpose |
|--------|----------|-----------|---------|
| POST | `/customers/register` | No | Create an account |
| POST | `/customers/login` | No | Log in, sets the cookie |
| GET | `/customers/me` | Yes | Who am I? |
| POST | `/customers/logout` | Yes | Clear the cookie |
| PATCH | `/customers/change-password` | Yes | Bonus task |

### Testing in Postman
In Postman the cookie is stored automatically after login — just run the
requests in order: register → login → me → logout → me (this last one gives 401).

**Register / Login body**
```json
{ "fullName": "John Doe", "email": "john@gmail.com", "password": "john123", "phone": "9876543210" }
```

### Status codes

| Situation | Code |
|-----------|------|
| Registered | 201 |
| Missing field / password under 6 chars | 400 |
| Wrong email OR wrong password | 401 |
| No token / bad token on a protected route | 401 |
| Email already registered | 409 |

---

## Folder structure

```
backend/                      frontend/src/
├── controllers/              ├── pages/
│   └── customer.controller.js│   ├── Login.jsx
├── models/                   │   ├── Register.jsx
│   └── customer.model.js     │   └── Home.jsx
├── routes/                   ├── components/
│   └── customer.routes.js    │   └── Navbar.jsx
├── middlewares/              ├── services/
│   └── auth.middleware.js    │   └── api.js
├── utils/                    ├── App.jsx
│   └── generateToken.js      └── main.jsx
├── index.js
└── .env
```

## Packages used

**Backend:** express, mongoose, bcrypt, jsonwebtoken, cookie-parser, dotenv, cors
**Frontend:** react, react-router-dom, axios

`dotenv` reads the `.env` file the lab asks for. `cors` is required because the
React app (port 5173) and the API (port 8000) are different origins — without it
the browser refuses to send the cookie. Neither is an auth framework, so both are
within the lab's rules.

---

## Lab 03 — Product Catalogue

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/products` | Create a product |
| GET | `/products` | List products |
| GET | `/products/:id` | One product |

Query parameters on `GET /products` (they combine):

```
/products?search=phone
/products?category=Electronics
/products?search=phone&category=Electronics
/products?sort=price_asc      (bonus)
/products?sort=price_desc     (bonus)
```

Frontend routes: `/products` (listing, search, category filter) and
`/products/:id` (details). Postman collection:
`ShopKart-Lab03-Products.postman_collection.json`.

---

## Lab 04 — Wishlist

All wishlist routes are **protected** — the customer is taken from the JWT cookie,
never from the request body.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/wishlist/:productId` | Save a product (409 if already saved) |
| GET | `/wishlist` | The customer's saved products, via `populate()` |
| DELETE | `/wishlist/:productId` | Remove one |
| PATCH | `/wishlist/:productId/toggle` | Bonus — add or remove, returns `{ saved }` |
| GET | `/wishlist/count` | Bonus — the number for the navbar badge |

The customer document stores **ObjectIds only**:

```js
wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
```

Frontend route `/wishlist`, a heart button on every product card and on the
details page, and a live count in the navbar. Postman collection:
`ShopKart-Lab04-Wishlist.postman_collection.json` (run the login request first).

---

## Lab 05 — Shopping Cart

All cart routes are **protected**. Global state lives in a React Context, so the
navbar, the Add to Cart buttons and the cart page always agree.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/cart/:productId` | Add — or **increment** if already in the cart |
| GET | `/cart` | The cart, with each row's product populated |
| PATCH | `/cart/:productId` | Set an exact quantity (body: `{ quantity }`) |
| DELETE | `/cart/:productId` | Remove a row — returns the updated cart |

Every write returns the whole updated cart, so the frontend never patches the
list by hand. The customer document stores **references and a number only**:

```js
cart: [{ product: { type: ObjectId, ref: "Product" }, quantity: { type: Number, min: 1 } }]
```

**Subtotal and the navbar count are derived**, never stored — they are
recalculated from `price × quantity` in `context/CartContext.jsx` on every render.

Frontend route `/cart`. Postman collection:
`ShopKart-Lab05-Cart.postman_collection.json` (run the login request first).

---

## Lab 06 — Checkout and Orders

Razorpay **Test Mode**. The key secret lives only in `backend/.env` and is
never sent to the browser.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/orders/create-payment-order` | Validate the cart, compute the total, create a PENDING_PAYMENT order + a Razorpay order |
| POST | `/orders/verify-payment` | Verify the HMAC signature, mark PAID/PLACED, clear the cart |
| GET | `/orders` | This customer's orders, newest first |
| GET | `/orders/:id` | One order, only if you own it |
| PATCH | `/orders/:id/status` | Bonus — PLACED → CONFIRMED → SHIPPED → DELIVERED |

**Setup — required before checkout works:**

1. Get test keys from dashboard.razorpay.com → Settings → API Keys (**Test Mode**).
2. Put them in `backend/.env`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

3. Restart the backend. Pay with Razorpay's test card `4111 1111 1111 1111`,
   any future expiry, any CVV.

Frontend routes: `/checkout`, `/orders`, `/orders/:id` (which doubles as the
confirmation screen). Postman collection:
`ShopKart-Lab06-Orders.postman_collection.json` (run the login request first).

**Rules enforced on the server:** empty cart rejected, stock re-checked,
total always recomputed from database prices, item name/price snapshotted
onto the order, cart cleared only after a verified signature, and another
customer's order answers 404.
