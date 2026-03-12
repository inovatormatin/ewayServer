# CLAUDE.md — E-Way Backend (Node/Express)

> Sprint-by-sprint upgrade plan for the `eway-server` repository.  
> Stack: Node.js, Express, MongoDB (Mongoose), JWT, Bcrypt, Vercel

---

## Sprint 1 — Security Hardening & Environment Config
**Goal:** JWT tokens expire. No secrets are ever hardcoded. CORS is locked down.

### Tasks

#### 1.1 — Add JWT Expiry
- In `controllers/userRoutes.js`, both `login` and `signup` generate a token.
- Update all `jwt.sign()` calls to include expiry:
  ```js
  // Before
  const authtokken = jwt.sign(data, process.env.JWT_SECRET);

  // After
  const authtokken = jwt.sign(data, process.env.JWT_SECRET, { expiresIn: '7d' });
  ```
- Use `7d` for a persistent session feel. Can tighten to `24h` later.

#### 1.2 — Fix JWT Payload (Security Issue)
- Current payload uses `user.id` (the model's static `.id`, not the document's `._id`).
  ```js
  // Current (buggy)
  const data = { user: { user: user.id } };

  // Fixed
  const data = { user: { id: newuser._id } };
  ```
- Update `middleware/fetchuser.js` to read `req.user.id` consistently.
- Verify all controllers that use `req.user.id` still work after this fix.

#### 1.3 — Environment Variables Audit
- Ensure `.env` contains (and only contains):
  ```
  MONGO_URL=
  JWT_SECRET=
  PORT=4000
  RAZORPAY_KEY_ID=       # Sprint 5
  RAZORPAY_KEY_SECRET=   # Sprint 5
  ```
- Add `.env` to `.gitignore` (verify it isn't already committed).
- Add `.env.example` with blank values and commit it.

#### 1.4 — Tighten CORS
- Current config uses `app.use(cors())` which allows all origins — too permissive.
- Update `server.js`:
  ```js
  const allowedOrigins = [
    'https://e-way.netlify.app',
    'http://localhost:3000',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }));
  ```

#### 1.5 — Centralized Error Handler Middleware
- Create `middleware/errorHandler.js`:
  ```js
  const errorHandler = (err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || 'Internal server error' });
  };
  module.exports = errorHandler;
  ```
- Register it at the bottom of `server.js` (after all routes):
  ```js
  app.use(require('./middleware/errorHandler'));
  ```
- Refactor controllers to call `next(err)` instead of `res.status(500).json(...)` in catch blocks.

### Definition of Done
- [ ] All JWT tokens expire in 7 days
- [ ] JWT payload uses correct `_id` field
- [ ] CORS only allows the Netlify URL and localhost
- [ ] `.env` is gitignored and `.env.example` exists
- [ ] All unhandled errors flow through the central error handler

---

## Sprint 2 — Input Validation & Route Protection
**Goal:** No unprotected write routes. All inputs are validated before hitting the DB.

### Tasks

#### 2.1 — Protect Product & Blog Write Routes
- Currently `addproduct`, `updateproduct`, `deleteproduct` have **no auth middleware**.
- Add `fetchuser` middleware to all write routes in `routes/productRoutes.js`:
  ```js
  router.post('/addproduct', fetchuser, [...validators], addproduct);
  router.put('/updateproduct/:id', fetchuser, updateproduct);
  router.delete('/deleteproduct/:id', fetchuser, deleteproduct);
  ```
- Same for `routes/blogRoutes.js` — protect `addblog`, `updateblog`, `deleteblog`.

#### 2.2 — Add `isAdmin` Check Middleware
- Add `isAdmin` boolean field to `models/userModel.js`:
  ```js
  isAdmin: { type: Boolean, default: false }
  ```
- Create `middleware/requireAdmin.js`:
  ```js
  const User = require('../models/userModel');

  const requireAdmin = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin access required' });
    next();
  };
  module.exports = requireAdmin;
  ```
- Add `requireAdmin` to all product/blog write routes (after `fetchuser`).

#### 2.3 — Validate Cart & Order Inputs
- `routes/cartRoutes.js` — add `body()` validation for `userId` and `cart` array.
- `routes/orderRoutes.js` — already has validators; verify `userId` matches `req.user.id` to prevent spoofing:
  ```js
  // In createOrder controller, add:
  if (req.body.userId !== req.user.id) {
    return res.status(403).json({ error: 'User ID mismatch' });
  }
  ```

#### 2.4 — Fix the Typo in Product Route
- In `src/constant/routes.js` (frontend), `addproduct` points to `products/addblog` — this is a copy-paste bug.
- Fix on the backend side too: ensure `routes/productRoutes.js` uses `/addproduct` not `/addblog`.

### Definition of Done
- [ ] No product or blog can be created/updated/deleted without a valid admin JWT
- [ ] `isAdmin` field exists on the User model
- [ ] Order `userId` is validated against the authenticated user
- [ ] The `addblog` typo on the product route is fixed

---

## Sprint 3 — Product Reviews Feature
**Goal:** Users can submit and read reviews per product.

### Tasks

#### 3.1 — Update Product Model (`models/productModel.js`)
Add a `reviews` array and computed fields:
```js
reviews: [
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName:  { type: String, required: true },
    rating:    { type: Number, required: true, min: 1, max: 5 },
    comment:   { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }
],
averageRating: { type: Number, default: 0 },
totalReviews:  { type: Number, default: 0 },
```

#### 3.2 — Review Controllers (`controllers/reviewRoutes.js`)
```js
// GET /api/products/getreviews/:productId
const getReviews = async (req, res, next) => { ... }

// POST /api/products/addreview/:productId  (auth required)
const addReview = async (req, res, next) => {
  // 1. Check user hasn't already reviewed this product
  // 2. Push new review to product.reviews
  // 3. Recalculate and save averageRating and totalReviews
}
```

#### 3.3 — Review Routes
Add to `routes/productRoutes.js`:
```js
router.get('/getreviews/:productId', getReviews);
router.post(
  '/addreview/:productId',
  fetchuser,
  body('rating', 'Rating 1-5 required').isInt({ min: 1, max: 5 }),
  body('comment', 'Comment required').isLength({ min: 5 }),
  addReview
);
```

### Definition of Done
- [ ] `GET /api/products/getreviews/:id` returns all reviews for a product
- [ ] `POST /api/products/addreview/:id` requires auth and valid body
- [ ] One review per user per product is enforced
- [ ] `averageRating` and `totalReviews` update automatically after each review

---

## Sprint 4 — Order Status Tracking
**Goal:** Orders have a status field. Admins can update it. Users see current status.

### Tasks

#### 4.1 — Add Status to Order Model (`models/orderModel.js`)
```js
status: {
  type: String,
  enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
  default: 'Pending',
},
```

#### 4.2 — Update Order Status Route
Add to `routes/orderRoutes.js`:
```js
// PATCH /api/userorder/updatestatus/:id  (admin only)
router.patch('/updatestatus/:id', fetchuser, requireAdmin, updateOrderStatus);
```

Controller in `controllers/orderRoutes.js`:
```js
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Orderproduct.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.status(200).json(order);
  } catch (err) { next(err); }
};
```

#### 4.3 — Include Status in getorders Response
- `GET /api/userorder/getorders/:id` already returns all order fields — since `status` is now in the schema, it will be included automatically. No change needed.

### Definition of Done
- [ ] All new orders default to `"Pending"` status
- [ ] `PATCH /api/userorder/updatestatus/:id` is admin-only
- [ ] Status transitions are validated against the enum
- [ ] Existing orders in DB are unaffected (default kicks in for missing field)

---

## Sprint 5 — Razorpay Payment Integration
**Goal:** Backend creates and verifies Razorpay orders before any order is saved to MongoDB.

### Tasks

#### 5.1 — Install Razorpay SDK
```bash
npm install razorpay
```

#### 5.2 — Add Keys to `.env`
```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

#### 5.3 — Payment Controller (`controllers/paymentRoutes.js`)
```js
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
const createPaymentOrder = async (req, res, next) => {
  try {
    const { amount } = req.body; // amount in paise (e.g. ₹500 = 50000)
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    });
    res.status(200).json(order);
  } catch (err) { next(err); }
};

// POST /api/payments/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    res.status(200).json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) { next(err); }
};
```

#### 5.4 — Payment Routes (`routes/paymentRoutes.js`)
```js
const express = require('express');
const router = express.Router();
const fetchuser = require('../middleware/fetchuser');
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentRoutes');

router.post('/create-order', fetchuser, createPaymentOrder);
router.post('/verify', fetchuser, verifyPayment);

module.exports = router;
```

Register in `server.js`:
```js
app.use('/api/payments', require('./routes/paymentRoutes'));
```

#### 5.5 — Add Payment Info to Order Model
```js
paymentId:      { type: String },   // Razorpay payment_id after verification
paymentStatus:  { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
```
Update `createOrder` controller to accept and store `paymentId` and set `paymentStatus: 'Paid'`.

### Definition of Done
- [ ] `POST /api/payments/create-order` returns a valid Razorpay order object
- [ ] `POST /api/payments/verify` returns `{ success: true }` only for valid signatures
- [ ] Orders saved to MongoDB only after `verify` succeeds (enforced on frontend)
- [ ] `paymentId` and `paymentStatus` stored on every order document

---

## Sprint 6 — Admin Dashboard API Support
**Goal:** Dedicated admin-only endpoints for the frontend Admin Dashboard.

### Tasks

#### 6.1 — Admin Orders Endpoint
Add to `routes/orderRoutes.js`:
```js
// GET /api/userorder/all  (admin only — returns ALL orders, not just one user's)
router.get('/all', fetchuser, requireAdmin, getAllOrders);
```
Controller:
```js
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Orderproduct.find().sort({ orderPlaced: -1 });
    res.status(200).json(orders);
  } catch (err) { next(err); }
};
```

#### 6.2 — Admin Stats Endpoint (Optional but Useful)
```js
// GET /api/admin/stats
router.get('/stats', fetchuser, requireAdmin, async (req, res, next) => {
  try {
    const [totalOrders, totalUsers, totalProducts] = await Promise.all([
      Orderproduct.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
    ]);
    res.status(200).json({ totalOrders, totalUsers, totalProducts });
  } catch (err) { next(err); }
});
```

#### 6.3 — Verify All Existing CRUD Routes Are Admin-Protected
Double check from Sprint 2 that these all require `fetchuser` + `requireAdmin`:
- `POST   /api/products/addproduct`
- `PUT    /api/products/updateproduct/:id`
- `DELETE /api/products/deleteproduct/:id`
- `POST   /api/blogs/addblog`
- `PUT    /api/blogs/updateblog/:id`
- `DELETE /api/blogs/deleteblog/:id`

### Definition of Done
- [ ] `GET /api/userorder/all` returns all orders for admin dashboard
- [ ] Stats endpoint returns live counts
- [ ] All write routes confirmed protected with both `fetchuser` and `requireAdmin`

---

## Middleware & File Reference

| File | Purpose |
|------|---------|
| `middleware/fetchuser.js` | Verifies JWT, attaches `req.user.id` |
| `middleware/requireAdmin.js` | *(new Sprint 2)* Checks `user.isAdmin === true` |
| `middleware/errorHandler.js` | *(new Sprint 1)* Central error response |

---

## Notes
- Sprints 1 and 2 are **independent** — do these first, they unblock everything else.
- Sprint 3 (reviews) and Sprint 4 (order status) can be done **in parallel** once Sprint 2 is done.
- Sprint 5 (payments) should be done **before** Sprint 6 (admin) since the admin dashboard will show payment info.
- After Sprint 1, re-deploy to Vercel and confirm the frontend still works before moving on.
- Run `npm audit` after each sprint and fix any high-severity vulnerabilities.
