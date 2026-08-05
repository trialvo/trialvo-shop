# Single Product Page Order — Implementation Ledger

> **Created:** 2026-05-03  
> **Purpose:** Complete reference for implementing the single-product-page order flow.  
> **Status:** Phase 1 DB + Phase 4 order filter done. Everything else pending.

---

## What's Already Done

### ✅ Phase 1: Database Schema
```sql
-- ALREADY EXECUTED on local DB (myecom-mysql container)
ALTER TABLE products ADD COLUMN has_single_product_page TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE orders MODIFY COLUMN order_type ENUM('regular','guest','single_page') NOT NULL DEFAULT 'regular';
```
**Verified:** Both columns confirmed via `SHOW COLUMNS`.

### ✅ Phase 4: Order Listing Filter
- **File:** `controllers/order.js` line 1950
- **Change:** `['regular', 'guest']` → `['regular', 'guest', 'single_page']`

### ✅ Permission Settings (Previous Session)
- **File:** `config/PermissionSettingsDB.js` — Added `single_page` scope with `phone_verified` (bool), `is_email_required`, `is_email_verification_required`, `is_phone_verification_required`
- **File:** `helpers/orderPermission.js` — Added `validateSinglePageOrderPermission()` (line ~179)
- **File:** `graduate_shop_admin/src/pages/Admins/PermissionsPage.tsx` — Unblocked "Single-Page Checkout Order" section

---

## Database Context

### Key Tables
- **products**: Has `slug VARCHAR(255)` with unique index `ux_products_slug`. Has new `has_single_product_page TINYINT(1)`.
- **orders**: `order_type ENUM('regular','guest','single_page')`. Admin manual orders use `order_type='regular'` + `created_by_admin` flag.
- **order_items**: Stores per-item snapshots with `bulk_rule_id`, `bulk_discount_applied`, `combo_rule_id`, `combo_discount_applied`, `coupon_code`, `coupon_discount`, `weight_kg`.
- **order_addresses**: Links `order_id` to address + `location_mapping_id`.
- **order_couriers**: Delivery charge snapshot per order.
- **sku_bulk_discount_rules**: `product_sku_id`, `min_qty`, `discount_type` (0=flat, 1=pct), `discount_value`, `free_delivery`, `status`.
- **product_skus**: `product_id`, `color_id`, `variant_id`, `selling_price`, `discount`, `discount_type`, `stock`, `sku`, `weight_kg`, `free_delivery`.

### DB Connection
- Container: `myecom-mysql`
- Credentials: `root` / `secret` / `myecomv2` / port `13306`
- Command: `docker exec -i myecom-mysql mysql -uroot -psecret myecomv2 -e "SQL"`

---

## Discount Rules for Single Page Orders

| Discount Type | Applies? | Notes |
|---|---|---|
| SKU-level discount (selling_price → final_unit_price) | ✅ Yes | Standard per-variation discount |
| Bulk discount (quantity tiers per SKU) | ✅ Yes | Uses `sku_bulk_discount_rules` |
| Combo discount | ❌ No | Requires multiple different products |
| Cart-wide discount | ❌ No | Cart concept doesn't apply |
| Coupon discount | ❌ No | Explicitly disabled |

### Grand Total Formula
```
grandTotal = subtotal - skuDiscountTotal - bulkDiscountTotal + effectiveDeliveryAmount + effectiveWeightExtraCharge
```

### How to Use `calculateBulkComboDiscounts()`
Located in `controllers/user_discount.js` line 344 (exported).
```js
const { calculateBulkComboDiscounts } = require('./user_discount');
const result = await calculateBulkComboDiscounts(connection, cartItems);
// USE ONLY result.bulkDiscountTotal
// FORCE result.comboDiscountTotal = 0
// FORCE result.cartWideDiscount = 0
```
The function also sets `result.enrichedItems[].effective_free_delivery` when a bulk rule grants free delivery.

---

## Phase 2: Backend — Product Flag (PENDING)

### 2A. Admin `getProducts` (line 1341)
Uses `p.*` in SELECT — already includes `has_single_product_page` automatically. No change needed for the list query.

### 2B. User `getProductByIdUser` (line 2110)
Uses `p.*` — already included in DB response. But the serialized response object (line 2193-2232) needs to add:
```js
has_single_product_page: !!productRow.has_single_product_page,
```
Add after line 2226 (after `robots`).

### 2C. New Toggle Endpoint
Add to `controllers/product.js`:
```js
exports.toggleSingleProductPage = api(
  { params: { id: { type: "int", required: true } } },
  auth(async (req, connection, adminInfo) => {
    const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER"];
    if (!adminInfo.roles.some(r => ALLOWED_ROLES.includes(r))) throw new errors.UNAUTHORIZED();
    const product = await connection.queryOne("SELECT id, has_single_product_page FROM products WHERE id = ?", [req.typed.params.id]);
    if (!product) throw new errors.NOT_FOUND("Product not found.");
    const newVal = product.has_single_product_page ? 0 : 1;
    await connection.query("UPDATE products SET has_single_product_page = ? WHERE id = ?", [newVal, product.id]);
    return { success: true, has_single_product_page: !!newVal };
  })
);
```

### 2D. New Single Page Data Endpoint
Public endpoint (no auth). Returns product + bulk offers for single product page.
```js
exports.getSinglePageData = api(
  { params: { id: { type: "int", required: true } } },
  async (req, connection) => {
    const productId = req.typed.params.id;
    // 1. Verify product exists, is active, has_single_product_page = 1
    const product = await connection.queryOne(
      `SELECT p.id, p.name, p.slug, p.has_single_product_page
       FROM products p
       INNER JOIN main_categories mc ON mc.id = p.main_category_id
       WHERE p.id = ? AND p.status = 1 AND p.has_single_product_page = 1
         AND mc.status = 1`, [productId]
    );
    if (!product) throw new errors.NOT_FOUND("Product not found or single page not enabled.");
    
    // 2. Get all SKU IDs for this product
    const skus = await connection.query(
      `SELECT id FROM product_skus WHERE product_id = ? AND status = 1`, [productId]
    );
    const skuIds = skus.map(s => s.id);
    
    // 3. Get bulk rules for those SKUs
    let bulkOffers = [];
    if (skuIds.length > 0) {
      bulkOffers = await connection.query(
        `SELECT r.id, r.product_sku_id, r.min_qty, r.discount_type, r.discount_value, r.free_delivery,
                ps.selling_price, ps.discount AS sku_discount, ps.discount_type AS sku_discount_type,
                ps.color_id, ps.variant_id,
                c.name AS color_name, v.name AS variant_name
         FROM sku_bulk_discount_rules r
         JOIN product_skus ps ON ps.id = r.product_sku_id
         LEFT JOIN colors c ON c.id = ps.color_id
         LEFT JOIN variants v ON v.id = ps.variant_id
         WHERE r.product_sku_id IN (?) AND r.status = 1
         ORDER BY r.product_sku_id ASC, r.min_qty ASC`,
        [skuIds]
      );
    }
    
    // 4. Return (frontend will also call getProductByIdUser for full product details)
    return { success: true, data: { product_id: productId, bulk_offers: bulkOffers } };
  }
);
```

### 2E. Register Routes in `index.js`
```js
// In imports (around line 176):
// Add to the existing product destructure:
// toggleSingleProductPage, getSinglePageData

// In routes (find product routes section):
app.patch(`${BASE_URL}/admin/product/:id/toggle-single-page`, toggleSingleProductPage);
app.get(`${BASE_URL}/user/product/:id/single-page-data`, getSinglePageData);
```

---

## Phase 3: Backend — Single Page Order Controller (PENDING)

### File: `controllers/single_page_order.js` (NEW)

This is the most critical file. Model it after `createActualOrderFromGuest()` in `guest_order.js` (line 516-1229).

### Imports Needed
```js
const { api } = require('../helpers/common');
const errors = require('../helpers/errors');
const validator = require('validator');
const crypto = require('crypto');
const { getConfig } = require('../config/ApplicationSettingsDB');
const { getPermissionConfig } = require('../config/PermissionSettingsDB');
const { BRAND_NAME } = require('../config/ApplicationSettings');
const { sendSMS } = require('../helpers/sms');
const { sendEmailVerification } = require('../mail-templates/emailverify');
const { getFraudTestResults } = require('../helpers/courier');
const { autoAssignOrder } = require('./order_assignment');
const { sendAdminOrderNotification } = require('../helpers/notify');
const { validateSinglePageOrderPermission } = require('../helpers/orderPermission');
const { bumpOrderEventVersion } = require('../helpers/orderEventVersion');
const { calculateBulkComboDiscounts } = require('./user_discount');
```

### Validation Helpers
Reuse from `guest_order.js` (lines 41-140):
- `validateName(name)` — 2-100 chars, letters/spaces/hyphens
- `validateEmail(email)` — validator.isEmail
- `validatePhone(phone)` — 10-15 digits, isMobilePhone
- `validateAddress(address)` — 10-500 chars
- `validateCity(city)` — 2-100 chars
- `validateZipCode(zip)` — 4-10 chars
- `validatePaymentType(type)` — must be 'cod' or 'gateway'
- `validateDeliveryChargeId(id)` — must be positive int
- `validateNote(note)` — max 1000 chars
Copy these or extract to a shared helper.

### Endpoint: `POST /api/v1/single-page-order/place`

**Request Body Schema:**
```js
{
  product_sku_id: { type: "int", required: true },
  quantity: { type: "int", required: true },
  name: { type: "string", required: true },
  email: { type: "string", required: false },
  phone: { type: "string", required: true },
  full_address: { type: "string", required: true },
  city: { type: "string", required: false },
  zip_code: { type: "string", required: false },
  location_mapping_id: { type: "int", required: false },
  delivery_charge_id: { type: "int", required: true },
  payment_type: { type: "string", required: true },
  note: { type: "string", required: false },
  // CAPI fields
  fbp: { type: "string", required: false },
  fbc: { type: "string", required: false },
  capi_event_id: { type: "string", required: false }
}
```

**Logic Flow** (mirror `createActualOrderFromGuest` lines 516-1229):

1. **Validate inputs** — all validation helpers
2. **Validate product** — must have `has_single_product_page = 1`, `status = 1`, active category chain
3. **Validate SKU** — must belong to product, `status = 1`, sufficient stock
4. **Validate delivery charge** — `delivery_charges WHERE id = ? AND status = 1`
5. **Enforce permissions** — `await validateSinglePageOrderPermission(connection, { email, phone, is_email_verified, is_phone_verified })`
   - Note: For single page, verification state must be tracked client-side or via a temp session. Consider storing OTP state in a new `single_page_order_sessions` table or reusing the approach from guest orders.
6. **Calculate pricing:**
   ```js
   const rawPrice = Number(sku.selling_price);
   const skuDiscount = sku.discount_type === 1 
     ? (rawPrice * sku.discount) / 100 
     : Number(sku.discount || 0);
   const finalUnitPrice = rawPrice - skuDiscount;
   const subtotal = rawPrice * quantity;
   const skuDiscountTotal = skuDiscount * quantity;
   
   // Bulk discount only (no combo, no cart-wide, no coupon)
   const cartItems = [{ product_sku_id: sku.id, quantity, final_unit_price: finalUnitPrice, selling_price: rawPrice }];
   const discountResult = await calculateBulkComboDiscounts(connection, cartItems);
   const bulkDiscountTotal = discountResult.bulkDiscountTotal;
   // FORCE these to 0:
   const comboDiscountTotal = 0;
   const cartWideDiscount = 0;
   const couponDiscountTotal = 0;
   
   // Free delivery logic
   const skuFreeDelivery = !!(sku.free_delivery ?? product.free_delivery);
   const bulkFreeDelivery = discountResult.enrichedItems[0]?.effective_free_delivery || false;
   const hasFreeDelivery = skuFreeDelivery || bulkFreeDelivery;
   const effectiveDeliveryAmount = hasFreeDelivery ? 0 : (deliveryCharge.customer_charge || 0);
   
   // Weight surcharge
   const weightKg = Number(sku.weight_kg || 0) * quantity;
   const freeWeightKg = Number(deliveryCharge.default_weight_kg || 0);
   const extraPerKg = Number(deliveryCharge.extra_charge_per_kg || 0);
   const excessKg = Math.max(0, weightKg - freeWeightKg);
   const weightExtraCharge = hasFreeDelivery ? 0 : Number((excessKg * extraPerKg).toFixed(2));
   
   const discountTotal = Number((skuDiscountTotal + couponDiscountTotal).toFixed(2));
   const grandTotal = Number((subtotal - discountTotal - bulkDiscountTotal + effectiveDeliveryAmount + weightExtraCharge).toFixed(2));
   ```

7. **COD advance check** — Copy `checkCODAdvanceRequired()` from `guest_order.js` line 481-513
8. **Fraud check** — `const fraudResults = await getFraudTestResults(phone);`
9. **Find existing user** — Same pattern as guest_order.js lines 557-594 (check by phone, then by email)
10. **INSERT INTO orders** — Same as guest_order.js lines 869-920 but with `order_type = 'single_page'` and `guest_order_uuid = NULL`
11. **INSERT order_items** — Single item, same columns as guest_order.js lines 946-981, but `coupon_code = NULL`, `coupon_discount = 0`, `combo_rule_id = NULL`, `combo_discount_applied = 0`
12. **INSERT order_addresses** — Same as guest_order.js lines 984-1036
13. **INSERT order_couriers** — Same as guest_order.js lines 1038-1059
14. **Stock deduction** — `UPDATE product_skus SET stock = stock - ? WHERE id = ? AND stock >= ?`
15. **Auto-assign** — `await autoAssignOrder(connection, orderId);`
16. **Notifications** — `sendAdminOrderNotification(connection, orderId, 'new_order');`
17. **Bump event version** — `bumpOrderEventVersion();`
18. **Return response** — Same structure as guest_order.js lines 1181-1228

### OTP Endpoints (for verification before placing order)

Since single-page orders don't have a guest_orders row, we need a lightweight session. Options:

**Option A (Recommended): In-memory OTP map**
Store OTP state in a simple `Map` keyed by phone/email. Verify before placing order.

**Option B: New `single_page_sessions` table**
```sql
CREATE TABLE single_page_sessions (
  id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(20),
  email VARCHAR(255),
  phone_otp VARCHAR(6),
  phone_otp_exp DATETIME,
  email_otp VARCHAR(6),
  email_otp_exp DATETIME,
  is_phone_verified TINYINT(1) DEFAULT 0,
  is_email_verified TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Endpoints:
```
POST /api/v1/single-page-order/send-phone-otp    { phone }
POST /api/v1/single-page-order/verify-phone-otp  { phone, otp }
POST /api/v1/single-page-order/send-email-otp    { email, name }
POST /api/v1/single-page-order/verify-email-otp  { email, otp }
GET  /api/v1/single-page-order/permissions        (returns required verifications)
```

The `permissions` endpoint mirrors `getGuestOrderPermissions` (line 4533) but reads `scope = 'single_page'`.

### Register Routes in `index.js`
```js
// Import (add near line 303):
const {
  placeSinglePageOrder,
  sendSinglePagePhoneOtp,
  verifySinglePagePhoneOtp,
  sendSinglePageEmailOtp,
  verifySinglePageEmailOtp,
  getSinglePageOrderPermissions
} = require('./controllers/single_page_order');

// Routes (add after guest order routes ~line 1100+):
app.post(`${BASE_URL}/single-page-order/place`, placeSinglePageOrder);
app.post(`${BASE_URL}/single-page-order/send-phone-otp`, otpSendLimiter, sendSinglePagePhoneOtp);
app.post(`${BASE_URL}/single-page-order/verify-phone-otp`, otpVerifyLimiter, verifySinglePagePhoneOtp);
app.post(`${BASE_URL}/single-page-order/send-email-otp`, otpSendLimiter, sendSinglePageEmailOtp);
app.post(`${BASE_URL}/single-page-order/verify-email-otp`, otpVerifyLimiter, verifySinglePageEmailOtp);
app.get(`${BASE_URL}/single-page-order/permissions`, getSinglePageOrderPermissions);
```

---

## Phase 5: Admin Panel — Product Toggle (PENDING)

### Product List Page
- Find product list component (likely in `graduate_shop_admin/src/components/products/`)
- Add a toggle switch column for `has_single_product_page`
- API call: `PATCH /api/v1/admin/product/:id/toggle-single-page`
- Show copy-URL icon when enabled: `${SHOP_URL}/single-order-page/${product.slug}/${product.id}`

---

## Phase 6: Admin Panel — Single Page Orders Tab (PENDING)

### Sidebar
- **File:** `graduate_shop_admin/src/layout/AppSidebar.tsx`
- Add nav item under orders section:
```ts
{ nameKey: "singlePageOrders", path: "/single-page-orders", pro: false, new: true }
```

### Page Components (mirror `guest-orders/` pattern)
Create in `graduate_shop_admin/src/components/orders/single-page-orders/`:
- `SinglePageOrdersPage.tsx` — Main container
- Uses same `/api/v1/admin/orders` endpoint with `order_type=single_page` filter

### Route
- **File:** `graduate_shop_admin/src/App.tsx`
- Add: `<Route path="/single-page-orders" element={<SinglePageOrders />} />`

---

## Phase 7: Admin Panel — All Orders Type Column (PENDING)

### Files to Modify
- `graduate_shop_admin/src/components/orders/all-orders/AllOrdersView.tsx` — Add `orderType` to state/filter
- `graduate_shop_admin/src/components/orders/all-orders/OrdersTable.tsx` — Add "Type" badge column
- `graduate_shop_admin/src/components/orders/all-orders/OrderFiltersBar.tsx` — Add type dropdown

### Badge Colors
- Regular → gray
- Guest → blue  
- Single Page → purple

---

## Phase 8: Shop Frontend — Single Product Page (PENDING)

### URL Structure
`/single-order-page/[slug]/[id]` — matches existing product detail pattern `/products/[slug]/[id]`

### Files to Create
```
app/(public)/single-order-page/[slug]/[id]/page.tsx          — Server component + SEO metadata
app/(public)/single-order-page/[slug]/[id]/SingleOrderPageClient.tsx — Main client component
```

### Data Fetching
1. Call existing `GET /api/v1/user/product/:id` (getProductByIdUser) for full product data
2. Call new `GET /api/v1/user/product/:id/single-page-data` for bulk offers

### UI Components
- Product image gallery (reuse existing `ProductImageGallery`)
- Variation selector (color → size, same UX as `ProductInfoPanel.tsx`)
- Bulk offer table grouped by selected variation
- Quantity selector
- Live price summary
- "Order Now" button → navigates to checkout

### Analytics
- Fire `trackViewContent` on page load (same as `ProductInfoPanel.tsx` line 117-128)
- Use `useAnalytics()` hook from `lib/analytics/useAnalytics.ts`

---

## Phase 9: Shop Frontend — Single Page Checkout (PENDING)

### Files to Create
```
app/(public)/single-order-page/[slug]/[id]/checkout/page.tsx
app/(public)/single-order-page/[slug]/[id]/checkout/SinglePageCheckoutClient.tsx
```

### Form Fields
- Name, Email, Phone
- Delivery zone (location_mapping dropdown — same as guest checkout)
- Full address
- Payment method (COD / Gateway)
- **NO coupon field**

### Cost Summary (live calculation)
```
Subtotal:           ৳{selling_price × qty}
SKU Discount:      -৳{skuDiscount × qty}
Bulk Discount:     -৳{bulkDiscount}  (if applicable)
Delivery:          +৳{deliveryCharge}
Weight Surcharge:  +৳{weightExtra}  (if applicable)
─────────────────────────────
Total:              ৳{grandTotal}
```

### OTP Verification Flow
1. On mount, call `GET /api/v1/single-page-order/permissions`
2. If phone verification required → show verify button → modal with OTP input
3. If email verification required → same flow
4. Only enable "Place Order" when all required verifications are done

### Analytics
- `trackInitiateCheckout` on checkout page load
- `trackPurchase` with `event_id` after order success (same pattern as `OrderSuccessClient.tsx` line 88-115)
- Pass `fbp`, `fbc`, `capi_event_id` to the order API (same as `useOrder.ts` line 163-173)
- POST `/api/v1/track/purchase` for server-side CAPI (same pattern as existing flow)

### Cookie Handoff
Use `useCookieIds()` hook from `hooks/useCookieIds.ts` (already exists) to read `_fbp` and `_fbc` cookies.

---

## Analytics Event Matrix

| Event | Where | GTM dataLayer | CAPI Server |
|---|---|---|---|
| `view_item` | Single product page load | ✅ `pushEcommerceEvent('view_item', ...)` | ❌ |
| `begin_checkout` | Checkout page load | ✅ `pushEcommerceEvent('begin_checkout', ...)` | ❌ |
| `purchase` | After successful order | ✅ `pushEcommerceEvent('purchase', { event_id, ... })` | ✅ POST `/track/purchase` |

All events use `useAnalytics()` hook and the existing GTM→FB Pixel→GA4 pipeline. No new GTM tags needed — existing triggers will fire for these standard event names.

---

## Key Code References

| What | File | Line |
|---|---|---|
| Guest order creation logic | `controllers/guest_order.js` | 516-1229 |
| Guest OTP (phone) | `controllers/guest_order.js` | 2825-2880 |
| Guest OTP (email send) | `controllers/guest_order.js` | 4565-4607 |
| Guest OTP (email verify) | `controllers/guest_order.js` | 4614-4659 |
| Guest permissions endpoint | `controllers/guest_order.js` | 4533-4558 |
| COD advance check | `controllers/guest_order.js` | 481-513 |
| Bulk/combo discount calc | `controllers/user_discount.js` | 130-344 |
| Bulk rules user endpoint | `controllers/user_discount.js` | 17-67 |
| Single page permission validator | `helpers/orderPermission.js` | 179-187 |
| Permission config DB | `config/PermissionSettingsDB.js` | 88-95 |
| Admin product list (uses p.*) | `controllers/product.js` | 1341-1610 |
| User product detail (uses p.*) | `controllers/product.js` | 2110-2470 |
| Product response serialization | `controllers/product.js` | 2193-2232 |
| Admin order type validation | `controllers/order.js` | 1950 |
| Order admin list query | `controllers/order.js` | 1914-2060 |
| CAPI tracking controller | `controllers/tracking.js` | 1-163 |
| GTM dataLayer helpers | `shop/lib/analytics/gtm.ts` | 1-164 |
| useAnalytics hook | `shop/lib/analytics/useAnalytics.ts` | 1-221 |
| useCookieIds hook | `shop/hooks/useCookieIds.ts` | 1-72 |
| useOrder (CAPI cookie handoff) | `shop/hooks/useOrder.ts` | 163-173 |
| Order success tracking | `shop/app/(public)/checkout/OrderSuccessClient.tsx` | 88-115 |
| Product detail tracking | `shop/components/product-details/ProductInfoPanel.tsx` | 78, 117-128 |
| Admin sidebar | `graduate_shop_admin/src/layout/AppSidebar.tsx` | 1-473 |
| All orders view | `graduate_shop_admin/src/components/orders/all-orders/AllOrdersView.tsx` | 1-800 |
| Checkout client | `shop/app/(public)/checkout/CheckoutClient.tsx` | 1-516 |
| API index routes | `index.js` | 1-1528 |

---

## Execution Order for Next Session

1. **Phase 2** — Product flag endpoints (toggle + single-page-data) + register routes
2. **Phase 3** — `single_page_order.js` controller (place order + OTP endpoints + permissions)
3. **Phase 5** — Admin product toggle UI
4. **Phase 6** — Admin single page orders tab
5. **Phase 7** — Admin all orders type column
6. **Phase 8** — Shop single product page
7. **Phase 9** — Shop single page checkout
8. **Phase 10** — End-to-end verification

---

## Important Warnings

> ⚠️ The `createActualOrderFromGuest` function is ~700 lines. The new controller should be a simplified version since it handles a SINGLE item (not a cart). No coupon, no combo, no cart-wide discount.

> ⚠️ Stock deduction happens in guest_order.js INSIDE `createActualOrderFromGuest`. The new controller must also deduct stock.

> ⚠️ The `sendOrdermail` helper may need to be checked — look for it in `helpers/` or `mail-templates/`. Guest orders may not send order confirmation email — verify.

> ⚠️ For OTP, the simplest approach is Option B (DB table) since it survives server restarts and works in multi-instance deployments.
