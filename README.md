# ShopKart — Engineering Labs 01 & 02

| Lab | What it is | Folder |
|-----|-----------|--------|
| Lab 01 | Backend — Customer Authentication APIs | `backend/` |
| Lab 02 | Frontend — Register / Login / Home UI | `frontend/` |

Lab 02 is the React UI that talks to the Lab 01 APIs. Same project, two halves.

---

## How to run (3 terminals)

**Terminal 1 — database**
```bash
./start-db.sh
```

**Terminal 2 — backend** (http://localhost:8000)
```bash
cd backend && npm run dev
```

**Terminal 3 — frontend** (http://localhost:5173)
```bash
cd frontend && npm run dev
```

Then open http://localhost:5173

> **Why port 8000 and not 5000?** On macOS, port 5000 is taken by the
> AirPlay Receiver, which answers every request with `403 Forbidden`.
> To use 5000 anyway: System Settings → General → AirDrop & Handoff →
> turn off AirPlay Receiver, then change `PORT` in `backend/.env`
> and `baseURL` in `frontend/src/services/api.js`.

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

---

## Deploying

Three free services. The code is already prepared for all of them.

| Part | Host | Root directory |
|------|------|----------------|
| Database | MongoDB Atlas (free M0) | — |
| Backend | Render | `backend` |
| Frontend | Vercel | `frontend` |

**1. Database — MongoDB Atlas**

Create a free M0 cluster, add a database user, and under Network Access allow
`0.0.0.0/0` (Render's IPs are not fixed). Copy the connection string; it looks
like `mongodb+srv://user:pass@cluster.mongodb.net/shopkart`.

**2. Backend — Render**

New Web Service → connect this repo → root directory `backend`. Render reads
`render.yaml`, so you only have to fill in the environment variables:

```
NODE_ENV=production
MONGO_URI=<the Atlas string>
JWT_SECRET=<a long random string>
RAZORPAY_KEY_ID=<your test key id>
RAZORPAY_KEY_SECRET=<your test key secret>
CLIENT_URL=<the Vercel URL, added after step 3>
```

**3. Frontend — Vercel**

Import this repo → root directory `frontend`. Add one environment variable:

```
VITE_API_URL=https://<your-render-service>.onrender.com
```

Vite bakes this in at **build** time, so set it before deploying — and
redeploy if you ever change it.

**4. Join them up**

Put the Vercel URL into `CLIENT_URL` on Render and redeploy the backend,
otherwise CORS will block the browser.

### Why the cookie needs care when deployed

Locally both halves are on `localhost`, so a `sameSite: "lax"` cookie works.
Deployed they are on two different domains, and a lax cookie is **not** sent
across sites — login would appear to succeed and then every protected route
would answer 401. In production the cookie is therefore `sameSite: "none"`
with `secure: true`, which browsers only accept over HTTPS. Both hosts
provide HTTPS, so this works.

### Note on the free tier

A free Render service sleeps after inactivity, so the first request after a
quiet period takes around 50 seconds. That is the host, not the code.
