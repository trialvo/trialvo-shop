# Delivery System Architecture & Improvement Plan

## 1. Executive Summary
The current delivery system successfully integrates Steadfast for single-order dispatch but lacks scalability for high-volume operations. Specifically, it misses bulk order creation, Pathao integration, and real-time tracking (webhooks/cron). 

This plan addresses these weaknesses by introducing **Bulk Dispatching APIs**, **Full Pathao Integration**, a robust **Tracking Timeline (Live Tracking)**, and automated **Status Shifting** via Webhooks and Cron Jobs.

---

## 2. Weaknesses in the Current Implementation
1. **Single Dispatch Bottleneck:** Admins must click "Dispatch" one by one. There is no API or UI to select 50 orders and dispatch them collectively.
2. **Missing Pathao Implementation:** Boilerplate exists in `courier.js`, but actual dispatch logic and auth flow for Pathao API `POST /aladdin/api/v1/orders` is missing.
3. **No Historical Tracking:** The `order_couriers` table stores the *current* tracking number, and the admin panel shows "live status" by pinging the courier API directly. But if a status changes from "Pending" -> "Shipped" -> "Delivered", the system does not record *when* it happened. Customers have zero visibility in their Shop Panel.
4. **No Automatic Status Updates:** An order stays "Dispatched" in our DB until an admin manually checks it. It should automatically update to "Delivered" or "Returned" based on courier data.
5. **Combo / Bulk Discount Integrity:** When sending order values to the courier (`amount_to_collect`), we must guarantee it strictly equals the `due_amount` mapping directly to what the customer actually owes inclusive of all combo/bulk discounts and waived delivery. Currently, passing raw pricing could misalign if logic duplicates across the app.

---

## 3. Pathao Integration Design
Pathao utilizes OAuth 2.0 (Password Grant). Tokens expire in 432,000 seconds (5 Days).
1. **Auth Flow:** Update `getPathaoToken` in `courier.js` to cache the `access_token` in memory (or redis) and refresh only when expired to speed up processing.
2. **New Dispatch Method:**  
   Implement `dispatchPathao(order, config, weight)`.
   * **Endpoint:** `POST /aladdin/api/v1/orders`
   * **Payload Mapping:**
     * `merchant_order_id` = `INV-{order.id}`
     * `recipient_city`, `recipient_zone`, `recipient_area` mapped from our `location_mappings` DB table.
     * `amount_to_collect` = `order.due_amount`.
     * `item_weight` = `weight_kg_total`.

---

## 4. Bulk Dispatch Implementation
Both Steadfast and Pathao support bulk order arrays.
1. **API Changes:** Create a new route `POST /api/v1/admin/orders/bulk-dispatch`.
   * Accepts: `{ order_ids: [101, 102, 103], provider: 'pathao' }`
   * Controller validates: Ensure all orders are in `Approved` or `Processing` status.
   * Maps orders into an array payload matching the chosen courier's bulk format.
2. **Steadfast Bulk Data Structure:**
   * Endpoint: `POST /create_order/bulk-order`
   * Data: `{ data: [ { invoice, recipient_name, ... }, ... ] }`
3. **Pathao Bulk Data Structure:**
   * Endpoint: `POST /aladdin/api/v1/orders/bulk`
   * Data: `{ orders: [ { merchant_order_id, ... }, ... ] }`
4. **Admin UI UI Update:** Modify `OrderList.tsx` to include native checkboxes on the table rows, and a floating global action bar that says: `Dispatch [N] Orders`.

---

## 5. Live Tracking & Timeline Architecture
To support live tracking for both **Users (Frontend)** and **Admins (Backend)**, we separate state management from live polling.

### Database Updates
Create a new table `order_status_history`:
* `id`, `order_id` (FK), `internal_status` (e.g., shipped, delivered), `courier_status` (e.g., "Arrived at Hub"), `remarks`, `created_at`.

### Mechanism 1: Webhook Integration (Primary & Fastest)
* Expose public endpoints:
  * `POST /api/v1/webhooks/pathao`
  * `POST /api/v1/webhooks/steadfast`
* Configure these URLs inside the Pathao & Steadfast Merchant Dashboards.
* When the courier fires a JSON payload updating an order to "Delivered", the API intercepts it:
  1. Finds `order_id` from the provided Tracking ID or `merchant_order_id`.
  2. Inserts a row into `order_status_history`.
  3. Auto-updates `orders.order_status = 'delivered'`.

### Mechanism 2: Cron Job Auto-Sync (Fallback & Safety Net)
* In case a webhook fails or is unsupported, we run a scheduled Node script utilizing `node-cron`.
* **Schedule:** `0 * * * *` (Runs every 1 hour).
* **Behavior:** Selects all orders where `order_status IN ('shipped', 'out_for_delivery')`. Loops through them (with concurrency limits) and pings `status_by_invoice` (Steadfast) or Pathao tracking API. 
* Any detected changes trigger DB updates and history logs.

---

## 6. Frontend Shop Implementation (User Tracking)
* Add a `Tracking Timeline` component to the `My Orders > Order Details` page.
* Pulls data from `GET /api/v1/orders/{id}/tracking-history`.
* Renders a vertical stepper:
  * [x] Order Placed (March 1)
  * [x] Order Approved (March 2)
  * [x] Handed to Courier (March 3) 
  * [ ] In Transit (Pending)
  * [ ] Delivered (Pending)
