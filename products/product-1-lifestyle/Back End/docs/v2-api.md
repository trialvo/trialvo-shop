# V2 — New API Endpoints

> Based on `git diff main v2 -- index.js` — only routes that did **not** exist in v1 (main).  
> **Base URL:** `http://localhost:7000/api/v1`  
> **Admin auth:** `Authorization: Bearer <admin_jwt>`

---

## Table of Contents
1. [Firebase Push Credentials](#1-firebase-push-credentials)
2. [Admin Notification Permissions](#2-admin-notification-permissions)
3. [CAPI Tracking (Facebook)](#3-capi-tracking-facebook)
4. [Dynamic Policies](#4-dynamic-policies)
5. [Bulk & Combo Discount Rules](#5-bulk--combo-discount-rules)
6. [Order Refunds](#6-order-refunds)
7. [Order Assignment](#7-order-assignment)
8. [Order Distribution Settings & Agents](#8-order-distribution-settings--agents)
9. [Notification History](#9-notification-history)
10. [Admin Audit Logs](#10-admin-audit-logs)
11. [Admin Management](#11-admin-management)
12. [Announcements](#12-announcements)
13. [City Zone Suggestions](#13-city-zone-suggestions)
14. [Policy Partial Update (PATCH)](#14-policy-partial-update-patch)
15. [Subscribers Management](#15-subscribers-management)
16. [Discount — SKU Search & Bulk Rule Corrections](#16-discount--sku-search--bulk-rule-corrections)
17. [Bug Fixes — `v.priority` → `v.serial`](#17-bug-fixes)
18. [Product Image Serial / Reorder](#18-product-image-serial--reorder)
19. [Product Face Image (Listing Thumbnail)](#19-product-face-image-listing-thumbnail--v2-025)
20. [Variant `serial` Column — Bug Fixes](#20-variant-serial-column--bug-fixes)
21. [Image Reorder UI — Admin Panel UX Improvements](#21-image-reorder-ui--admin-panel-ux-improvements)
22. [Variant Image Assignment via SKU](#22-variant-image-assignment-via-sku-sku_id-on-product_images--v2-026v2-027)
23. [V2 Bug Fixes & Refinements (2026-03-18)](#23-v2-bug-fixes--refinements-2026-03-18)
24. [Courier Webhooks — Real-Time Status Updates](#24-courier-webhooks--real-time-status-updates)
25. [Courier Status Sync — Manual & Bulk](#25-courier-status-sync--manual--bulk)
26. [Admin Orders — Quick Cancel UI](#26-admin-orders--quick-cancel-ui)
27. [V2-035 — Push Notification Fixes & Bell Badge Integration](#27-v2-035--push-notification-fixes--bell-badge-integration)
28. [V2-041 — Push Notification Deep-Link Navigation](#28-v2-041--push-notification-deep-link-navigation)
29. [V2-045 — Fix `updateOrderItems` Grand Total Corruption](#29-v2-045--fix-updateorderitems-grand-total-corruption)
30. [V2-046 — Admin Manual Order Calculation Parity Fix](#30-v2-046--admin-manual-order-calculation-parity-fix)
31. [V2-047 — Category Image Compression (saveCategoryImage + Backfill)](#31-v2-047--category-image-compression-savecategoryimage--backfill)

---

## 1. Firebase Push Credentials

### Get Credential
```
GET /api/v1/config/firebase-credential
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{
  "id": 1,
  "label": "Production FCM",
  "project_id": "my-project",
  "is_active": true,
  "created_at": "2026-03-01T10:00:00.000Z"
}
```

---

### Create / Update Credential
```
POST /api/v1/config/firebase-credential
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "label": "Production FCM",
  "credential_json": {
    "type": "service_account",
    "project_id": "my-project",
    "private_key_id": "key123",
    "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk@my-project.iam.gserviceaccount.com",
    "client_id": "123456789"
  }
}
```
**Response:**
```json
{ "success": true, "id": 1 }
```

---

### Toggle Active Credential
```
PATCH /api/v1/config/firebase-credential/toggle
Authorization: Bearer <admin_jwt>
```
**Body:** none

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_active": false
  },
  "message": "Firebase credential deactivated successfully."
}
```

---

## 2. Admin Notification Permissions

Controls which events each admin receives push/email alerts for.
Only active admins are returned/updated (`admins.is_active = 1` and `admins.deleted_at IS NULL`).

### Get Permissions for One Admin
```
GET /api/v1/admin/notification-permissions/:admin_id
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "admin_id": 3,
    "order_notification_email": true,
    "order_notification_sms": false,
    "order_notification_firebase_push": true,
    "personal_notification_email": true,
    "personal_notification_sms": false,
    "personal_notification_firebase_push": true,
    "updated_by_admin": 1,
    "created_at": "2026-03-10T12:00:00.000Z",
    "updated_at": "2026-03-11T08:30:00.000Z",
    "admin_name": "Karim Uddin",
    "admin_email": "karim@example.com",
    "admin_phone": "01700000000",
    "profile_img_path": "/uploads/profiles/admins/3/img_1767801057092.png",
    "role_name": "ADMIN"
  }
}
```
If the admin is inactive/deleted (or has no row in `admin_notification_permissions`), `data` is `null`.

---

### Set Permissions for One Admin
```
PUT /api/v1/admin/notification-permissions/:admin_id
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "order_notification_email": true,
  "order_notification_sms": false,
  "order_notification_firebase_push": true,
  "personal_notification_email": true,
  "personal_notification_sms": false,
  "personal_notification_firebase_push": true
}
```
**Response:**
```json
{ "success": true, "message": "Notification permissions updated." }
```
If admin is inactive/deleted, API returns `404 Admin not found.`

---

### Get All Admins' Permissions
```
GET /api/v1/admin/notification-permissions
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "admin_id": 1,
      "order_notification_email": true,
      "order_notification_sms": false,
      "order_notification_firebase_push": true,
      "personal_notification_email": true,
      "personal_notification_sms": false,
      "personal_notification_firebase_push": true,
      "updated_by_admin": 1,
      "created_at": "2026-03-01T10:00:00.000Z",
      "updated_at": "2026-03-11T08:30:00.000Z",
      "admin_name": "Super Admin",
      "admin_email": "superadmin@example.com",
      "admin_phone": "01800000000",
      "profile_img_path": "/uploads/profiles/admins/1/avatar.png",
      "role_name": "SUPER_ADMIN"
    }
  ]
}
```

---

## 3. CAPI Tracking (Facebook)

Server-side Facebook Conversion API events for deduplication.

### Track Purchase
```
POST /api/v1/track/purchase
Content-Type: application/json
```
**Body:**
```json
{
  "order_id": 101,
  "event_id": "evt_purchase_abc123",
  "fbp": "_fbp.1.1234567890.987654321",
  "fbc": "fb.1.1234567890.AbCdEfGhIjKl",
  "client_ip": "103.45.67.89",
  "client_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```
**Response:**
```json
{
  "success": true,
  "fbtrace_id": "AbCdEfGh1234"
}
```

---

### Track Registration
```
POST /api/v1/track/registration
Content-Type: application/json
```
**Body:**
```json
{
  "user_id": 55,
  "event_id": "evt_reg_def456",
  "fbp": "_fbp.1.1234567890.987654321",
  "client_ip": "103.45.67.89",
  "client_user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
}
```
**Response:**
```json
{ "success": true, "fbtrace_id": "XyZwAbCd5678" }
```

---

## 4. Dynamic Policies

Manage legal/content pages (return policy, privacy policy, etc.) from admin panel or serve publicly to frontend.

> **DB table:** `dynamic_policies`  
> **Lookup field:** `policy_key` (unique slug-like identifier, immutable after creation)

---

### Schema
| Field | Type | Notes |
|---|---|---|
| `id` | bigint | Auto increment |
| `policy_key` | varchar(100) | Unique identifier, e.g. `return_policy` |
| `title` | varchar(150) | Display name |
| `bd_title` | varchar(150) | nullable; Bengali title for dual-language support |
| `content` | longtext | HTML or plain text body |
| `content_type` | enum(`html`,`text`) | Default `html` |
| `status` | tinyint | `1` = active (publicly visible), `0` = inactive |
| `updated_by_admin` | int FK | Admin who last updated |
| `created_at` / `updated_at` | timestamp | — |
| `deleted_at` | timestamp | Soft delete |

---

### [Admin] List All Policies
```
GET /api/v1/admin/policies
Authorization: Bearer <admin_jwt>
```
**Optional query params:** `?status=1`, `?include_deleted=true`  
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "policy_key": "return_policy",
      "title": "Return Policy",
  "bd_title": "ফেরত নীতি",
      "content_type": "html",
      "status": 1,
      "updated_by_admin": 6,
      "created_at": "2026-03-01T00:00:00.000Z",
      "updated_at": "2026-03-05T00:00:00.000Z"
    }
  ]
}
```

---

### [Admin] Get Policy by Key (with content)
```
GET /api/v1/admin/policy/:key
Authorization: Bearer <admin_jwt>
```
**Example:** `GET /api/v1/admin/policy/return_policy`  
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "policy_key": "return_policy",
    "title": "Return Policy",
  "bd_title": "ফেরত নীতি",
    "content": "<p>We accept returns within 7 days...</p>",
    "content_type": "html",
    "status": 1,
    "updated_by_admin": 6,
    "created_at": "2026-03-01T00:00:00.000Z",
    "updated_at": "2026-03-05T00:00:00.000Z",
    "deleted_at": null
  }
}
```

---

### [Admin] Create or Update Policy (Upsert)
```
POST /api/v1/admin/policy
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "policy_key": "return_policy",
  "title": "Return Policy",
  "bd_title": "ফেরত নীতি",
  "content": "<p>We accept returns within 7 days of delivery.</p>",
  "content_type": "html",
  "status": 1
}
```
> If `policy_key` already exists the row is updated (and restored if soft-deleted).  
> `content_type` and `status` are optional — defaults: `html`, `1`.

**Response:**
```json
{
  "success": true,
  "message": "Policy updated successfully.",
  "data": { "id": 1, "policy_key": "return_policy" }
}
```

---

### [Admin] Delete Policy (soft delete)
```
DELETE /api/v1/admin/policy/:key
Authorization: Bearer <admin_jwt>
```
**Example:** `DELETE /api/v1/admin/policy/return_policy`  
> Only `SUPER_ADMIN` role can delete policies.

**Response:**
```json
{ "success": true, "message": "Policy deleted successfully." }
```

---

### [Public] List All Active Policies
```
GET /api/v1/policies
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "policy_key": "return_policy",
      "title": "Return Policy",
  "bd_title": "ফেরত নীতি",
      "content": "<p>...</p>",
      "content_type": "html",
      "updated_at": "2026-03-05T00:00:00.000Z"
    }
  ]
}
```

---

### [Public] Get Active Policy by Key
```
GET /api/v1/policy/:key
```
**Example:** `GET /api/v1/policy/return_policy`  
**Response:**
```json
{
  "success": true,
  "data": {
    "policy_key": "return_policy",
    "title": "Return Policy",
  "bd_title": "ফেরত নীতি",
    "content": "<p>We accept returns within 7 days...</p>",
    "content_type": "html",
    "updated_at": "2026-03-05T00:00:00.000Z"
  }
}
```

---

## 5. Bulk & Combo Discount Rules

> **`free_delivery` flag (V2-028):** Both bulk and combo rules now support a `free_delivery` field. When set to `true`, triggering that rule at checkout **waives the entire order's delivery charge and weight surcharge** (sets both to ৳0).

### SKU Bulk Rules — Buy N, Get Discount

#### List All Bulk Rules
```
GET /api/v1/admin/discount/bulk-rules
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Buy 3 Get 10% Off",
    "product_sku_id": 42,
    "min_quantity": 3,
    "discount_type": 1,
    "discount_value": 10,
    "free_delivery": false,
    "status": true
  }
]
```

---

#### Create Bulk Rule
```
POST /api/v1/admin/discount/bulk-rule
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Buy 3 Get 10% Off",
  "product_sku_id": 42,
  "min_quantity": 3,
  "discount_type": 1,
  "discount_value": 10,
  "free_delivery": true,
  "status": true
}
```
> `discount_type`: `0` = flat amount, `1` = percentage  
> `free_delivery`: optional boolean (default `false`). When `true`, triggering this rule waives delivery + weight surcharge.

**Response:**
```json
{ "success": true, "id": 1 }
```

---

#### Edit / Delete Bulk Rule
```
PUT    /api/v1/admin/discount/bulk-rule/:id
DELETE /api/v1/admin/discount/bulk-rule/:id
```
> `PUT` body may include any subset of create fields, including `free_delivery`.

---

### Combo Rules — Buy A + B Together

#### List All Combo Rules
```
GET /api/v1/admin/discount/combo-rules
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  {
    "id": 1,
    "name": "Shirt + Pant Bundle",
    "discount_type": 0,
    "discount_value": 200,
    "free_delivery": false,
    "status": true,
    "items": [
      { "product_sku_id": 42, "product_name": "Blue Shirt (M)" },
      { "product_sku_id": 55, "product_name": "Black Pant (32)" }
    ]
  }
]
```

---

#### Create Combo Rule
```
POST /api/v1/admin/discount/combo-rule
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Shirt + Pant Bundle",
  "discount_type": 0,
  "discount_value": 200,
  "free_delivery": true,
  "status": true,
  "items": [
    { "product_sku_id": 42 },
    { "product_sku_id": 55 }
  ]
}
```
> `free_delivery`: optional boolean (default `false`).

**Response:**
```json
{ "success": true, "id": 1 }
```

---

#### Edit / Delete Combo Rule
```
PUT    /api/v1/admin/discount/combo-rule/:id
DELETE /api/v1/admin/discount/combo-rule/:id
```
> `PUT` body may include any subset of create fields, including `free_delivery`.

---

## 6. Order Refunds

### Create Refund
```
POST /api/v1/admin/order/refund
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "order_id": 101,
  "amount": 500,
  "method": "bkash",
  "reference": "TXN98765",
  "note": "Customer returned damaged item"
}
```
**Response:**
```json
{ "success": true, "refund_id": 3 }
```

---

### Get Refunds for an Order
```
GET /api/v1/admin/order/:order_id/refunds
Authorization: Bearer <admin_jwt>
```
**Example:** `GET /api/v1/admin/order/101/refunds`  
**Response:**
```json
[
  {
    "id": 3,
    "order_id": 101,
    "amount": 500,
    "method": "bkash",
    "reference": "TXN98765",
    "status": "pending",
    "note": "Customer returned damaged item",
    "created_at": "2026-03-10T10:00:00.000Z"
  }
]
```

---

### Update Refund Status
```
PATCH /api/v1/admin/order/refund/:id/status
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{ "status": "completed" }
```
> Status values: `pending` | `processing` | `completed` | `failed`

**Response:**
```json
{ "success": true }
```

---

## 7. Order Assignment

Assign orders to specific delivery agents manually.

### Assign Order
```
POST /api/v1/admin/order/assign
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "order_id": 101,
  "agent_id": 2
}
```
**Response:**
```json
{ "success": true, "assigned_at": "2026-03-10T11:00:00.000Z" }
```

---

### Unassign Order
```
DELETE /api/v1/admin/order/unassign/:order_id
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{ "success": true }
```

---

### Get Assignment Logs
```
GET /api/v1/admin/order/assignment-logs
Authorization: Bearer <admin_jwt>
```
**Query params:** `?order_id=101&agent_id=2&limit=20&offset=0`  
**Response:**
```json
[
  {
    "id": 1,
    "order_id": 101,
    "agent_id": 2,
    "agent_name": "Karim",
    "assigned_by": "Super Admin",
    "assigned_at": "2026-03-10T11:00:00.000Z"
  }
]
```

---

## 8. Order Distribution & Assignment (V2-017)

> **Auth:** All endpoints require `Bearer <admin_jwt>`.  
> **SUPER_ADMIN** — full access (manage pool, settings, redistribute, manual assign).  
> **ADMIN / ORDER_MANAGER** — read own pool stats only (no pool management).

---

### Distribution Algorithm

Orders are assigned using a **Least-Loaded-First** algorithm (not round-robin):

1. Fetch all active pool agents with their current live active-order count in one query.
2. Sort by `active_order_count ASC, serial ASC` — emptiest admin first; serial is the tie-breaker.
3. Skip any agent whose `active_order_count >= max_active_orders` (cap enforcement).
4. Assign to the first eligible agent.

**Result:** If Admin A has 10 active orders and Admin B has 5, the next order always goes to Admin B — regardless of serial or who was assigned last. Agents with equal load fall back to the serial tie-breaker.

---

### Get Distribution Settings
```
GET /api/v1/admin/order-distribution/settings
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "auto_assign_enabled": 1,
    "assign_on_order_create": 1,
    "include_admin_role": 1,
    "include_order_manager_role": 1,
    "last_assigned_admin_id": 14,
    "updated_by_admin": 6,
    "updated_at": "2026-04-03T00:00:00.000Z"
  }
}
```

---

### Update Distribution Settings
```
PATCH /api/v1/admin/order-distribution/settings
```
**Body (all fields optional):**
```json
{
  "auto_assign_enabled": true,
  "assign_on_order_create": true,
  "include_admin_role": true,
  "include_order_manager_role": true
}
```
**Response:** `{ "success": true }`

---

### Get Eligible Admins (Pool Management UI)
```
GET /api/v1/admin/order-distribution/eligible-admins
```
Returns all ADMIN and ORDER_MANAGER accounts (plus the requesting SUPER_ADMIN's own account) with their **accurate per-admin** active order counts.

> **Bug fixed (2026-04-03):** Replaced correlated subqueries with pre-aggregated derived table JOINs to fix MariaDB GROUP BY scope resolution that caused all admins to show the same total count.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 11,
      "admin_name": "FAMIDA HAQ ORTHI",
      "email": "orthifahmia@gmail.com",
      "profile_img_path": "/uploads/profiles/admins/11/img.png",
      "is_active": 1,
      "role_name": "ADMIN",
      "role_id": 2,
      "pool_id": 5,
      "serial": 1,
      "max_active_orders": null,
      "pool_auto_assign": 1,
      "pool_status": 1,
      "active_order_count": 28,
      "today_handled_count": 28
    },
    {
      "id": 13,
      "admin_name": "Sars",
      "email": "5arafatshovo@gmail.com",
      "profile_img_path": null,
      "is_active": 1,
      "role_name": "ADMIN",
      "role_id": 2,
      "pool_id": null,
      "serial": null,
      "max_active_orders": null,
      "pool_auto_assign": null,
      "pool_status": null,
      "active_order_count": 0,
      "today_handled_count": 0
    }
  ]
}
```
- `pool_id: null` → admin is not in the pool
- `active_order_count` → non-terminal orders currently assigned to this admin
- `today_handled_count` → orders assigned to this admin today (by `assigned_at` date)

---

### List Pool Agents
```
GET /api/v1/admin/order-distribution/agents
```
Returns raw pool records (internal use; prefer `/eligible-admins` for UI).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "admin_id": 11,
      "status": 1,
      "auto_assign_enabled": 1,
      "max_active_orders": null,
      "serial": 1,
      "created_at": "2026-04-02T20:00:00.000Z"
    }
  ]
}
```

---

### Add Agent to Pool
```
POST /api/v1/admin/order-distribution/agent
```
**Body:**
```json
{
  "admin_id": 11,
  "status": true,
  "auto_assign_enabled": true,
  "max_active_orders": 30,
  "serial": 1
}
```
**Response:** `{ "success": true, "pool_id": 5 }`

---

### Edit Agent (Configure)
```
PUT /api/v1/admin/order-distribution/agent/:id
```
**Body (all optional):**
```json
{
  "status": true,
  "auto_assign_enabled": true,
  "max_active_orders": 25,
  "serial": 2
}
```
> **`serial` (Priority tie-breaker):** Lower number = higher tie-break priority. Only applies when two admins have an equal `active_order_count`. Integer ≥ 1.  
> **`max_active_orders`:** Hard cap. Agent is skipped in auto-assign once reached. `null` = unlimited.

**Response:** `{ "success": true, "message": "Agent updated." }`

---

### Upsert Agent by Admin ID (Add/Update) — UI Toggle
```
POST /api/v1/admin/order-distribution/agent/by-admin/:admin_id
```
Used by the pool toggle button in the UI. Creates a new pool entry if none exists; sets `status=false` (without removing) if updating.

**Body:**
```json
{
  "auto_assign_enabled": true,
  "status": true,
  "max_active_orders": null,
  "serial": 1
}
```
**Response:** `{ "success": true, "pool_id": 7, "message": "Agent added to pool." }`

> **On deactivation (`status: false`):** All currently active (non-terminal) orders assigned to this admin are automatically unassigned and logged so they can be redistributed.

---

### Remove Agent from Pool
```
DELETE /api/v1/admin/order-distribution/agent/:id
```
> **Important:** On removal, `unassignActiveOrders` is called **before** deleting the pool record. All non-terminal orders assigned to this admin have `assigned_to_admin_id` cleared and are logged in `order_assignment_logs` with `action_type = 'unassign'`. This ensures freed orders become available for redistribution immediately.

**Response:**
```json
{
  "success": true,
  "message": "Agent removed from distribution pool. 28 active order(s) unassigned and ready for redistribution.",
  "orders_freed": 28
}
```

---

### Redistribute Unassigned Orders
```
POST /api/v1/admin/order-distribution/redistribute-unassigned
```
Bulk assigns all orders where `assigned_to_admin_id IS NULL` (active status only) using the **Least-Loaded-First** algorithm.

> The algorithm re-fetches live load counts **before each assignment** in the loop, so running counts stay accurate as redistribution progresses. This prevents uneven splits — all freed orders go to the emptiest agent first until loads equalize.

**Response:**
```json
{
  "success": true,
  "message": "Redistribution complete. Assigned: 28, Skipped (agents at capacity): 0",
  "assigned": 28,
  "skipped": 0
}
```

---

### Manual Order Assignment
```
POST /api/v1/admin/order-distribution/assign
```
Manually assign or reassign a specific order to a specific admin.

**Body:**
```json
{
  "order_id": 887,
  "admin_id": 11
}
```
**Response:**
```json
{
  "success": true,
  "message": "Order assigned successfully."
}
```
If reassigning from another admin, `action_type` in the log is `'redistribute'`.

---

### Unassign Order
```
DELETE /api/v1/admin/order/unassign/:order_id
```
Clears assignment fields on a specific order and logs the action.

**Response:** `{ "success": true, "message": "Order unassigned." }`

---

### Get Assignment Logs
```
GET /api/v1/admin/order-distribution/assignment-logs
```
**Query (all optional):**
- `order_id` (int) — filter by order
- `limit` (int, default 50)
- `offset` (int, default 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "order_id": 887,
      "action_type": "auto_assign",
      "from_admin_id": null,
      "to_admin_id": 11,
      "changed_by_admin_id": null,
      "from_admin_name": null,
      "to_admin_name": "FAMIDA HAQ ORTHI",
      "changed_by_name": null,
      "created_at": "2026-04-03T00:00:00.000Z"
    }
  ]
}
```
**`action_type` values:**
| Value | Meaning |
|---|---|
| `auto_assign` | System assigned on order create |
| `manual_assign` | Admin manually assigned |
| `redistribute` | Bulk redistribution or manual reassign from another admin |
| `unassign` | Cleared (freed from pool removal or manual unassign) |

---

### Auto-Assignment Integration

`autoAssignOrder(connection, orderId)` is called **non-blocking** immediately after order creation in:
- `guest_order.js` — Guest checkout
- `order.js` — Registered user checkout
- `admin_order.js` — Admin manual order (existing customer)
- `admin_order.js` — Admin manual order (stranger/walk-in)

If `auto_assign_enabled = false` or no eligible agents exist, the function returns `null` silently without affecting order creation.

---

## 9. Notification History

View logs of all emails, SMS, and push notifications sent.

### Get Notification Batches
```
GET /api/v1/admin/notifications/batches
Authorization: Bearer <admin_jwt>
```
**Query:** `?limit=20&offset=0`  
**Response:**
```json
[
  {
    "id": 1,
    "type": "email",
    "subject": "Your order is confirmed",
    "sent_count": 1,
    "failed_count": 0,
    "created_at": "2026-03-10T10:00:00.000Z"
  }
]
```

---

### Get Email Logs
```
GET /api/v1/admin/notifications/email-logs
Authorization: Bearer <admin_jwt>
```
**Query:** `?limit=20&offset=0&from=2026-03-01&to=2026-03-10`  
**Response:**
```json
[
  {
    "id": 1,
    "to": "customer@email.com",
    "subject": "Order #101 Confirmed",
    "status": "sent",
    "created_at": "2026-03-10T10:00:00.000Z"
  }
]
```

---

### Get SMS Logs
```
GET /api/v1/admin/notifications/sms-logs
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  {
    "id": 1,
    "to": "01712345678",
    "message": "Your order #101 has been confirmed.",
    "status": "sent",
    "provider": "alpha_sms",
    "created_at": "2026-03-10T10:00:00.000Z"
  }
]
```

---

### Get Push Notification Logs
```
GET /api/v1/admin/notifications/push-logs
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  {
    "id": 1,
    "title": "Order Confirmed",
    "body": "Your order #101 is confirmed!",
    "status": "sent",
    "created_at": "2026-03-10T10:00:00.000Z"
  }
]
```

---

## 10. Admin Audit Logs

View admin activity logs and user activity logs from the admin panel.

### Get Admin Audit Logs
```
GET /api/v1/admin/getAuditLogs
Authorization: Bearer <admin_jwt>
```
**Query params (all optional):**
- `admin_id` (int): Filter by actor admin id
- `target_id` (int): Filter by `resource_id`
- `action` (string): Action key (for example `EDIT_ADMIN`)
- `search` (string): Search actor email/first_name/last_name
- `date_from` (YYYY-MM-DD): Start date (00:00:00)
- `date_to` (YYYY-MM-DD): End date (23:59:59)
- `limit` (int): Default `100`, allowed `20..500`
- `cursor` (int): Cursor pagination (log id)
- `page` (int): Page pagination (`>=1`)

> Use either `cursor` or `page`, not both.
> Validation: `page >= 1`, `cursor >= 1`.
> `next_cursor` is returned for cursor mode (or default first page without `page`), while `has_more` works for both modes.

**Response:**
```json
{
  "count": 240,
  "limit": 100,
  "next_cursor": 8120,
  "has_more": true,
  "data": [
    {
      "id": 8210,
      "admin_id": 3,
      "action": "EDIT_ADMIN",
      "resource_id": 7,
      "meta": {
        "changed_fields": ["permissions", "is_active"]
      },
      "created_at": "2026-03-10T08:41:00.000Z",
      "actor_email": "admin@example.com",
      "actor_name": "Super Admin"
    }
  ]
}
```

---

### Get Admin Audit Action Keys
```
GET /api/v1/admin/getActionsKey
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  { "action_key": "CREATE_ADMIN", "display_name": "Create New Admin" },
  { "action_key": "EDIT_ADMIN", "display_name": "Edit Admin" }
]
```

---

### Get User Audit Logs (Admin View)
```
GET /api/v1/admin/getUserAuditLogs
Authorization: Bearer <admin_jwt>
```
**Query params (all optional):**
- `user_id` (int): Filter by user id
- `action` (string): Action key
- `search` (string): Search user email/first_name/last_name
- `date_from` (YYYY-MM-DD): Start date (00:00:00)
- `date_to` (YYYY-MM-DD): End date (23:59:59)
- `limit` (int): Default `100`, allowed `20..500`
- `cursor` (int): Cursor pagination (log id)
- `page` (int): Page pagination (`>=1`)

> Use either `cursor` or `page`, not both.
> Validation: `page >= 1`, `cursor >= 1`.
> `next_cursor` is returned for cursor mode (or default first page without `page`), while `has_more` works for both modes.

**Response:**
```json
{
  "count": 540,
  "limit": 100,
  "next_cursor": 11900,
  "has_more": true,
  "data": [
    {
      "id": 12000,
      "user_id": 91,
      "action": "PROFILE_UPDATED",
      "ip_address": "103.120.10.14",
      "user_agent": "Mozilla/5.0",
      "old_values": { "phone": "01711111111" },
      "new_values": { "phone": "01722222222" },
      "created_at": "2026-03-10T11:00:00.000Z",
      "user_email": "user@example.com",
      "first_name": "Nusrat",
      "last_name": "Jahan",
      "action_display_name": "Profile Updated"
    }
  ]
}
```

---

### Get User Audit Action Keys
```
GET /api/v1/admin/getUserActionsKey
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
[
  { "action_key": "PROFILE_UPDATED", "display_name": "Profile Updated" },
  { "action_key": "PASSWORD_CHANGED", "display_name": "Password Changed" }
]
```

---

## 11. Admin Management

### Soft Delete Admin
```
DELETE /api/v1/admin/soft-delete/:id
Authorization: Bearer <admin_jwt>
```

Soft-deletes an admin by setting:
- `admins.is_active = 0`
- `admins.deleted_at = NOW()`
- `admins.deleted_by_admin_id = <actor_admin_id>`
- `admins.token_version = token_version + 1` (forces re-login for existing sessions)

**Rules:**
- Requires `admin.manage` permission.
- Caller cannot soft-delete self.
- `SUPER_ADMIN` cannot be soft-deleted.
- `ADMIN` cannot soft-delete another `ADMIN`.
- Already deleted admin returns `400`.

**Response:**
```json
{
  "success": true,
  "id": 7,
  "message": "Admin soft-deleted successfully."
}
```

**Common Errors:**
- `404` - `Target admin not found.`
- `400` - `Target admin already soft-deleted.`
- `403` - `You cannot soft-delete your own account.`
- `403` - `SUPER_ADMIN is immutable.`
- `403` - `ADMIN cannot modify another ADMIN.`

---

## 12. Announcements

All announcement endpoints require admin auth:
`Authorization: Bearer <admin_jwt>`

For `create` and `edit`, use `multipart/form-data` if uploading `announcement_image`.
`zones` supports all these formats:
- Repeated key: `zones=Dhaka`, `zones=Chattogram`
- Bracket key: `zones[]=Dhaka`, `zones[]=Chattogram`
- JSON string: `["Dhaka","Chattogram"]`
- JSON object array: `[{"location_mapping_id":8200,"city_name":"Dhaka","area_name":"Mirpur-1"}]`
- Comma-separated string: `Dhaka, Chattogram`

---

### Create Announcement
```
POST /api/v1/admin/announcement
Authorization: Bearer <admin_jwt>
Content-Type: multipart/form-data
```
**Body (form-data):**
- `headline` (string, required)
- `body` (string, required)
- `target_type` (string, optional): `all | subscribed_only | registered_users_only` (default: `all`)
- `zone_scope` (string, optional): `all | selected` (default: `all`)
- `zones` (array-like, required if `zone_scope=selected`)
  - Recommended item format (v2 area-level):
    - `location_mapping_id` (int, optional but preferred)
    - `city_name` (string, optional)
    - `area_name` (string, optional)
- `status` (string, optional): `draft | scheduled | sent | cancelled` (default: `draft`)
- `scheduled_at` (string, optional; required future datetime if `status=scheduled`)
- `announcement_image` (file, optional)

**Response:**
```json
{
  "success": true,
  "announcement_id": 12,
  "message": "Announcement draft saved successfully."
}
```

---

### Get All Announcements
```
GET /api/v1/admin/announcements
Authorization: Bearer <admin_jwt>
```
**Query params (optional):**
- `limit` (int, default: `20`)
- `offset` (int, default: `0`)
- `status`: `draft | scheduled | sent | cancelled`
- `target_type`: `all | subscribed_only | registered_users_only`
- `zones` (string): city name fragment or comma-separated fragments. Uses partial `LIKE` match (example: `dh` matches `dhaka`) and always includes `zone_scope=all`.
  When this filter is used, matched `zone_scope=selected` announcements are listed first, then `zone_scope=all`, each by newest first.
- `search` (headline search)
- `start_date` (`YYYY-MM-DD`)
- `end_date` (`YYYY-MM-DD`)

**Response:**
```json
{
  "success": true,
  "total": 2,
  "limit": 20,
  "offset": 0,
  "data": [
    {
      "id": 12,
      "headline": "Eid Offer",
      "target_type": "all",
      "zone_scope": "all",
      "status": "draft",
      "scheduled_at": null,
      "image_path": "/uploads/announcements/announcement_1767801000000.png",
      "zones": []
    }
  ]
}
```

---

### Get Announcement By ID
```
GET /api/v1/admin/announcement/:id
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "headline": "Eid Offer",
    "body": "Big sale starts now",
    "target_type": "all",
    "zone_scope": "selected",
    "status": "draft",
    "scheduled_at": null,
    "image_path": "/uploads/announcements/announcement_1767801000000.png",
    "zones": [
      {
        "location_mapping_id": 8200,
        "city_name": "Dhaka",
        "area_name": "Mirpur-1",
        "city_name_normalized": "dhaka",
        "area_name_normalized": "mirpur-1"
      }
    ]
  }
}
```

---

### Get Announcement Alert Counts
```
GET /api/v1/admin/announcements/alert
Authorization: Bearer <admin_jwt>
```
**Response:**
```json
{
  "success": true,
  "meta": {
    "total_unsent": 4,
    "total_scheduled_pending": 2,
    "total_scheduled_overdue": 1
  }
}
```

---

### Edit Announcement
```
PUT /api/v1/admin/announcement/:id
Authorization: Bearer <admin_jwt>
Content-Type: multipart/form-data
```
Sent announcements are editable and can be reused as templates for later sends.

**Body (all optional, but at least one must be sent):**
- `headline` (string)
- `body` (string)
- `target_type` (string): `all | subscribed_only | registered_users_only`
- `zone_scope` (string): `all | selected`
- `zones` (array-like; required if `zone_scope=selected`, same formats as create)
- `status` (string): `draft | scheduled | sent | cancelled`
- `scheduled_at` (string; future datetime required if final status is `scheduled`)
- `announcement_image` (file; replaces old image)

**Response:**
```json
{
  "success": true,
  "message": "Announcement updated successfully."
}
```

---

### Delete Announcement
```
DELETE /api/v1/admin/announcement/:id
Authorization: Bearer <admin_jwt>
```
Soft-deletes the announcement (marks `deleted_at`, and status to `cancelled`).

**Response:**
```json
{
  "success": true,
  "message": "Announcement moved to trash successfully."
}
```

---

### Send Announcement By ID
```
POST /api/v1/admin/announcement/send/:id
Authorization: Bearer <admin_jwt>
```
Starts async email dispatch and marks announcement as sent.
This endpoint can be called again for an already sent announcement (reuse flow).

Zone matching behavior:
- Uses `announcement_zones.location_mapping_id` when present (exact area match against both `user_addresses` and `order_addresses`).
- Falls back to city-name matching for legacy city-only zone rows.
- Includes all registered users regardless of `users.status` (`active` / `inactive` / `banned`), excluding only soft-deleted users.

**Response:**
```json
{
  "success": true,
  "recipient_count": 1250,
  "message": "Sending started. It will take approx 6 minutes."
}
```

---

### Send Announcement Manually (Custom Emails)
```
POST /api/v1/admin/announcement/send-manual
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "announcement_id": 12,
  "emails": [
    "a@example.com",
    "b@example.com"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "valid_recipients": 2,
  "message": "Manual dispatch started for 2 valid addresses."
}
```

---

## Summary of All New Endpoints

| # | Method | Route | Auth | Description |
|---|--------|-------|------|-------------|
| 1 | GET | `/config/firebase-credential` | Admin | Get FCM credential |
| 2 | POST | `/config/firebase-credential` | Admin | Create/update FCM credential |
| 3 | PATCH | `/config/firebase-credential/toggle` | Admin | Toggle active credential |
| 4 | GET | `/admin/notification-permissions/:admin_id` | Admin | Get one admin's perms |
| 5 | PUT | `/admin/notification-permissions/:admin_id` | Admin | Set one admin's perms |
| 6 | GET | `/admin/notification-permissions` | Admin | Get all admins' perms |
| 7 | POST | `/track/purchase` | Public | CAPI purchase event |
| 8 | POST | `/track/registration` | Public | CAPI registration event |
| 9 | GET | `/admin/policies` | Admin | List policies |
| 10 | GET | `/admin/policy/:key` | Admin | Get policy |
| 11 | POST | `/admin/policy` | Admin | Create/update policy |
| 12 | DELETE | `/admin/policy/:key` | Admin | Delete policy |
| 13 | GET | `/policies` | Public | List public policies |
| 14 | GET | `/policy/:key` | Public | Get public policy |
| 15 | GET | `/admin/discount/bulk-rules` | Admin | List bulk rules |
| 16 | POST | `/admin/discount/bulk-rule` | Admin | Create bulk rule |
| 17 | PUT | `/admin/discount/bulk-rule/:id` | Admin | Edit bulk rule |
| 18 | DELETE | `/admin/discount/bulk-rule/:id` | Admin | Delete bulk rule |
| 19 | GET | `/admin/discount/combo-rules` | Admin | List combo rules |
| 20 | POST | `/admin/discount/combo-rule` | Admin | Create combo rule |
| 21 | PUT | `/admin/discount/combo-rule/:id` | Admin | Edit combo rule |
| 22 | DELETE | `/admin/discount/combo-rule/:id` | Admin | Delete combo rule |
| 23 | POST | `/admin/order/refund` | Admin | Create refund |
| 24 | GET | `/admin/order/:order_id/refunds` | Admin | Get order refunds |
| 25 | PATCH | `/admin/order/refund/:id/status` | Admin | Update refund status |
| 26 | POST | `/admin/order/assign` | Admin | Assign order to agent |
| 27 | DELETE | `/admin/order/unassign/:order_id` | Admin | Unassign order |
| 28 | GET | `/admin/order/assignment-logs` | Admin | View assignment history |
| 29 | GET | `/admin/order-distribution/settings` | Admin | Get distribution settings |
| 30 | PATCH | `/admin/order-distribution/settings` | Admin | Update settings |
| 31 | GET | `/admin/order-distribution/agents` | Admin | List agents |
| 32 | POST | `/admin/order-distribution/agent` | Admin | Add agent |
| 33 | PUT | `/admin/order-distribution/agent/:id` | Admin | Edit agent |
| 34 | DELETE | `/admin/order-distribution/agent/:id` | Admin | Remove agent |
| 35 | GET | `/admin/notifications/batches` | Admin | Notification batches |
| 36 | GET | `/admin/notifications/email-logs` | Admin | Email logs |
| 37 | GET | `/admin/notifications/sms-logs` | Admin | SMS logs |
| 38 | GET | `/admin/notifications/push-logs` | Admin | Push logs |
| 39 | GET | `/admin/getAuditLogs` | Admin | Get admin audit logs |
| 40 | GET | `/admin/getActionsKey` | Admin | Get admin audit action keys |
| 41 | GET | `/admin/getUserAuditLogs` | Admin | Get user audit logs (admin view) |
| 42 | GET | `/admin/getUserActionsKey` | Admin | Get user audit action keys |
| 43 | DELETE | `/admin/soft-delete/:id` | Admin | Soft delete admin |
| 44 | POST | `/admin/announcement` | Admin | Create announcement (`channel`: email/sms/both) |
| 45 | GET | `/admin/announcements` | Admin | List announcements |
| 46 | GET | `/admin/announcement/:id` | Admin | Get announcement by id |
| 47 | GET | `/admin/announcements/alert` | Admin | Get announcement alert counts |
| 48 | PUT | `/admin/announcement/:id` | Admin | Edit announcement (`channel` editable, sent items re-editable) |
| 49 | DELETE | `/admin/announcement/:id` | Admin | Soft-delete announcement |
| 50 | POST | `/admin/announcement/send/:id` | Admin | Send announcement by channel (email/sms/both) |
| 51 | POST | `/admin/announcement/send-manual` | Admin | Send to manual email/phone list |
---

### List Announcements
```
GET /api/v1/admin/announcements
Authorization: Bearer <admin_jwt>
```
**Query Filters:**
| Param | Type | Notes |
|---|---|---|
| `status` | string | `draft`, `scheduled`, `sent`, `cancelled` |
| `target_type` | string | `all`, `subscribed_only`, `registered_users_only` |
| `channel` | string | `email`, `sms`, `both` |
| `zones` | string | Comma-separated partial city names, e.g. `ta,dh` (LIKE match). `zone_scope=selected` results come first, global (`all`) come after. |
| `search` | string | Searches `headline` |
| `start_date` | string | `YYYY-MM-DD` |
| `end_date` | string | `YYYY-MM-DD` |
| `limit` | int | Default 20 |
| `offset` | int | Default 0 |

---

### Send Announcement — Re-send Guard

If an announcement's `status` is already `sent`, attempting to send again returns:
```json
{ "flag": 403, "error": "This announcement has already been sent. To send it again, edit the announcement and change its status first." }
```
**Re-send workflow:** Edit the announcement → set `status` back to `draft` → call send again.

---

### Send Manual Announcement — Phone Normalization & Deduplication

`phones` entries are normalized to BD 11-digit format before deduplication:

| Input | Normalized |
|---|---|
| `+8801711000001` | `01711000001` |
| `8801711000001` | `01711000001` |
| `01711000001` | `01711000001` |

Duplicate phones (e.g. one with prefix, one without) are sent only once.
Emails are lowercased and deduplicated before dispatch.

Updated response:
```json
{
  "success": true,
  "email_recipients": 2,
  "sms_recipients": 1,
  "message": "Manual dispatch started for 3 recipient(s)."
}
```

---

### DB Change
```sql
-- announcements table
ALTER TABLE `announcements`
  ADD COLUMN `channel` ENUM('email','sms','both') NOT NULL DEFAULT 'email'
  AFTER `target_type`;

-- announcement_zones table (V2-046 area-level targeting)
ALTER TABLE `announcement_zones`
  ADD COLUMN `location_mapping_id` INT NULL AFTER `announcement_id`,
  ADD COLUMN `area_name` VARCHAR(150) NULL AFTER `city_name`,
  ADD COLUMN `area_name_normalized` VARCHAR(170) NULL AFTER `city_name_normalized`;
```

---

## 13. Permission Config — Announcement Settings

`auto_send_scheduled_announcement` has been added to the permission config. This flag is reserved for a future scheduler agent.

### Get
```
GET /api/v1/config/getPermissionConfig?section=announcement
Authorization: Bearer <super_admin_jwt>
```
**Response:**
```json
{
  "success": true,
  "data": {
    "announcement": {
      "auto_send_scheduled_announcement": false
    }
  }
}
```

### Update
```
PATCH /api/v1/config/patchPermissionConfig
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "announcement": {
    "auto_send_scheduled_announcement": true
  }
}
```
> When `true`, a future scheduler agent will automatically dispatch announcements whose `status = 'scheduled'` and `scheduled_at <= NOW()`.


> **New field:** `channel` (`"email"` | `"sms"` | `"both"`) on the `announcements` table.
> Defaults to `"email"` for backward compatibility.

### Create Announcement
```
POST /api/v1/admin/announcement
Authorization: Bearer <admin_jwt>
Content-Type: multipart/form-data
```
**Body (new field):**
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `channel` | string | No | `email` | `email`, `sms`, or `both` |

> Service availability is checked at creation time. If the required service (email/sms) is not configured and active in `system_config`, a `503` is returned.

**Response:**
```json
{ "success": true, "announcement_id": 5, "message": "Announcement draft saved successfully." }
```

---

### Edit Announcement
```
PUT /api/v1/admin/announcement/:id
Authorization: Bearer <admin_jwt>
Content-Type: multipart/form-data
```
**Body (new field):**
| Field | Type | Required | Notes |
|---|---|---|---|
| `channel` | string | No | `email`, `sms`, or `both`. Service is checked if changed. |

> **Change from v1:** Sent announcements are now editable (status `sent` block removed). They can be reused as templates for future sends.

---

### Send Announcement
```
POST /api/v1/admin/announcement/send/:id
Authorization: Bearer <admin_jwt>
```
Dispatches the announcement using the `channel` stored on the record.

- **`email`** leg: same as before — throttled bulk mail (250ms between sends).
- **`sms`** leg: fetches verified phones from `user_phones WHERE is_verified = 1` for matching recipients. Body HTML is auto-normalized to plain text (≤ 160 chars). Throttled at 300ms between sends.
- **`subscribed_only` + `sms`**: subscribers have no phone records — SMS leg is silently skipped, a server-side warning is logged.

**Response:**
```json
{
  "success": true,
  "channel": "both",
  "email_recipient_count": 420,
  "sms_recipient_count": 318,
  "message": "Sending started. It will take approx 3 minutes."
}
```

---

### Send Manual Announcement
```
POST /api/v1/admin/announcement/send-manual
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```
**Body:**
```json
{
  "announcement_id": 5,
  "emails": ["a@b.com", "c@d.com"],
  "phones": ["01711000001", "01922000002"]
}
```
- `emails` and `phones` are both optional, but at least one must be provided.
- `phones`: BD 11-digit mobile numbers (01xxxxxxxxx). Validated on server.
- SMS body is auto-normalized from HTML to plain text.

**Response:**
```json
{
  "success": true,
  "email_recipients": 2,
  "sms_recipients": 2,
  "message": "Manual dispatch started for 4 recipient(s)."
}
```

---

### DB Change
```sql
-- announcements table
ALTER TABLE `announcements`
  ADD COLUMN `channel` ENUM('email','sms','both') NOT NULL DEFAULT 'email'
  AFTER `target_type`;
```

---

## 13. City Zone Suggestions

Returns a deduplicated, sorted list of unique city names for legacy/quick city suggestion use (announcement filters, compatibility).

> **V2-030 Change:** City names are now sourced from `location_mappings.city_name` (Pathao-synced, standardized spelling) instead of raw text from order/user addresses. Legacy address text is included as a fallback UNION for users who ordered before the area selector was introduced.

### Get City Zones
```
GET /api/v1/admin/city-zones
Authorization: Bearer <admin_jwt>
```

**Auth roles:** `SUPER_ADMIN`, `ADMIN`, `READ_ONLY_ADMIN`

**No query parameters.**

**Response:**
```json
{
  "success": true,
  "total": 66,
  "cities": [
    "Bagerhat",
    "Dhaka",
    "Chittagong",
    "Sylhet"
  ]
}
```

**Notes:**
- Primary source: `DISTINCT city_name` from `location_mappings WHERE pathao_city_id IS NOT NULL` (standardized, 66 Pathao districts).
- Secondary/legacy source: `DISTINCT city` from `order_addresses` UNION `user_addresses` (catches old text-only orders).
- Zone filtering in `sendAnnouncement` now uses `COALESCE(lm.city_name, ua.city)` via `location_mapping_id` JOIN — improves match accuracy for users with new-style addresses.
- Results are `TRIM`med and sorted `A → Z`.
- Admin frontend caches the response in `localStorage` for **24 hours** under the
  key `app:city_zones_cache` and re-fetches automatically after expiry.
- A **"Sync zones ↻"** button on the Create / Edit Announcement page lets admins
  force-refresh the cache on demand.

---

## 13a. Delivery Areas (Courier Location Selector)

> **Added in V2-030.** Powers the `DeliveryAreaSelector` component in the shop checkout and address book.

### Get Delivery Areas
```
GET /api/v1/delivery-areas
```
**Public — no auth required.**

**Query params:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Optional. Filters by `city_name` or `area_name` (LIKE match) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "city_name": "Dhaka",
      "areas": [
        { "id": 8200, "area_name": "Mirpur-1" },
        { "id": 8201, "area_name": "Mirpur-2" }
      ]
    }
  ]
}
```

**Notes:**
- Only returns rows where `pathao_city_id IS NOT NULL` (Pathao-sourced areas).
  Steadfast rows (651 police-station level rows) are excluded from this selector.
- The `id` returned is `location_mappings.id` — stored as `location_mapping_id` on `order_addresses` and `user_addresses`.
- Steadfast dispatch uses a city-name text match fallback at dispatch time, so customers don't need to select a Steadfast-specific area.

### DB Schema: `location_mappings` (V2-030 updated)

| Column | Type | Description |
|---|---|---|
| `id` | int PK | |
| `location_type` | enum | `city` \| `rural` |
| `city_name` | varchar(150) utf8mb4 | District/city (e.g. "Dhaka") |
| `area_name` | varchar(150) utf8mb4 | Specific area (e.g. "Mirpur-1") |
| `pathao_city_id` | int | Pathao city ID for dispatch |
| `pathao_zone_id` | int | Pathao zone ID for dispatch |
| `pathao_area_id` | int UNIQUE | Pathao area ID (deduplication key) |
| `steadfast_id` | int UNIQUE | Steadfast police station ID (dedup key) |
| `redx_area_id` | int | RedX area ID (populated after RedX sync) |
| `paperfly_thana_id` | int | Paperfly thana ID (future) |

**Charset:** `utf8mb4_unicode_ci` (supports Bengali area names from Steadfast).

---

## 13b. Multi-Courier Dispatch Architecture (V2-030)

Dispatch queries in `order.js` (`dispatchOrder` + bulk dispatch) now use a 3-JOIN COALESCE pattern:

```sql
-- lm  = primary row linked by location_mapping_id FK
-- lm2 = Pathao fallback: text match on city/area name when FK row has no pathao IDs
-- lm3 = Steadfast fallback: city_name text match when FK row has no steadfast_id
COALESCE(lm.pathao_city_id, lm2.pathao_city_id) AS pathao_city_id,
COALESCE(lm.pathao_zone_id, lm2.pathao_zone_id) AS pathao_zone_id,
COALESCE(lm.pathao_area_id, lm2.pathao_area_id) AS pathao_area_id,
COALESCE(lm.steadfast_id,   lm3.steadfast_id)   AS steadfast_id
```

**Why this matters:** The area selector only shows Pathao rows (21,285 entries). A customer who selects "Mirpur-1" gets `location_mapping_id` pointing to a Pathao row. When dispatching via **Steadfast**, the system falls back to matching on `lm3.city_name = SUBSTRING_INDEX(oa.city, ' ', 1)` to find the Steadfast police-station row for that district.

**Adding a new courier (RedX, Paperfly):** Add its COALESCE leg to the JOIN and populate `redx_area_id` / `paperfly_thana_id` via `syncAllCourierLocations` once API credentials are configured.

---

## 14. Policy Partial Update (PATCH)

Allows an admin to update **individual fields** of an existing policy without
resubmitting the full record. Useful for quick status or type toggles from the
UI table.

### Patch Policy
```
PATCH /api/v1/admin/policy/:key
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**URL params:** `:key` — the policy key (e.g. `privacy_policy`).

**Auth roles:** `SUPER_ADMIN`, `ADMIN`

**Body (all fields optional — send only what changed):**
```json
{
  "title": "Privacy Policy",
  "content": "<p>Updated content</p>",
  "content_type": "html",
  "status": "active"
}
```

| Field | Type | Values |
|---|---|---|
| `title` | string | max 200 chars |
| `bd_title` | string | optional Bengali title (max 150 chars); send empty string to clear |
| `content` | string | sanitised HTML or markdown |
| `content_type` | string | `"html"` \| `"markdown"` |
| `status` | string | `"active"` \| `"inactive"` |

**Response:**
```json
{ "success": true, "message": "Policy updated." }
```

**Notes:**
- At least one field must be provided, else returns `400 PARAMETER_MISSING`.
- HTML content is sanitised server-side (strips unsafe tags/attributes).
- Returns `404` if policy key does not exist.

---

## 15. Subscribers Management

Admin endpoints for listing and manipulating newsletter subscribers.

**Auth roles for all endpoints:** `SUPER_ADMIN`, `ADMIN`

### List Subscribers
```
GET /api/v1/admin/subscribes
Authorization: Bearer <admin_jwt>
```

**Query params:**

| Param | Type | Description |
|---|---|---|
| `limit` | int | Page size (default 20) |
| `offset` | int | Pagination offset |
| `type` | string | `subscribed` \| `unsubscribed` \| `suspended` |
| `search` | string | Search by email or name |

**Response:**
```json
{
  "success": true,
  "total": 150,
  "limit": 20,
  "offset": 0,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "status": 1,
      "suspended_at": null,
      "subscribed_at": "2026-01-01T00:00:00.000Z",
      "first_name": "Jane",
      "last_name": "Doe"
    }
  ]
}
```

### Get Subscriber by ID
```
GET /api/v1/admin/subscriber/:id
Authorization: Bearer <admin_jwt>
```

### Toggle Subscription (subscribe ↔ unsubscribe)
```
PATCH /api/v1/admin/subscriber/:id/manual-sub-toggle
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**Body (optional):**
```json
{ "reason": "Admin action" }
```

**Response:**
```json
{ "success": true, "new_status": 0, "message": "Subscriber unsubscribed." }
```

**Notes:** Cannot toggle if subscriber is currently banned (`suspended_at` is set).

### Toggle Ban (ban ↔ unban)
```
PATCH /api/v1/admin/subscriber/:id/manual-ban-toggle
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**Body (optional):**
```json
{
  "reason": "Spam complaints",
  "effect_linked_account": false
}
```

| Field | Type | Description |
|---|---|---|
| `reason` | string | Optional reason stored in audit |
| `effect_linked_account` | bool | If `true`, also suspends/restores linked user account |

**Response:**
```json
{
  "success": true,
  "is_suspended": true,
  "user_account_synced": false,
  "message": "Subscriber banned."
}
```

---

## 16. Discount — SKU Search & Bulk Rule Corrections

### SKU Autocomplete Search *(new)*
```
GET /api/v1/admin/discount/skus?q=<search_term>
Authorization: Bearer <admin_jwt>
```

**Auth roles:** `SUPER_ADMIN`, `ADMIN`, `CATALOG_MANAGER`

**Query params:**

| Param | Type | Description |
|---|---|---|
| `q` | string | Search term — matched against `product_skus.sku` OR `products.name` (LIKE, max 30 results) |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 942,
      "sku": "GF-SHIRT-RED-M",
      "product_name": "Classic Shirt",
      "color_name": "Red",
      "variant_name": "M",
      "selling_price": 850,
      "stock": 24
    }
  ]
}
```

---

### Bulk Discount Rule — Corrected Field Names

The following endpoints previously documented `is_active` incorrectly.
The actual DB column and accepted field name is **`status`**.

#### Create Bulk Rule
```
POST /api/v1/admin/discount/bulk-rule
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Buy 3 Get 10% Off",
  "product_sku_id": 942,
  "min_qty": 3,
  "discount_type": 1,
  "discount_value": 10,
  "status": true
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | No | Display label |
| `product_sku_id` | int | **Yes** | FK → `product_skus.id` |
| `min_qty` | int | **Yes** | Must be ≥ 1 |
| `discount_type` | int | No | `0` = flat ৳, `1` = percentage % (default `0`) |
| `discount_value` | float | **Yes** | Cannot be negative |
| `status` | bool | No | Default `true` |

#### Edit Bulk Rule
```
PUT /api/v1/admin/discount/bulk-rule/:id
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**Body (all optional — send only changed fields):**
```json
{
  "min_qty": 5,
  "discount_value": 15,
  "discount_type": 1,
  "status": false
}
```

#### List Bulk Rules
```
GET /api/v1/admin/discount/bulk-rules?status=true&product_sku_id=942
Authorization: Bearer <admin_jwt>
```

**Query params:** `product_sku_id` (int), `status` (bool)

---

## 17. Bug Fixes

### `product.js` — `v.priority` → `v.serial` (variants & product_images)

The v2 DB migration renamed:
- `variants.priority` → `variants.serial`
- `product_images.priority` → `product_images.serial`

All affected SQL queries in `controllers/product.js` have been updated:

| Affected query | Change |
|---|---|
| `GET /api/v1/products` listing subquery | `v.priority` → `v.serial` in SELECT + ORDER BY |
| `GET /api/v1/admin/product/variations/:product_id` | `v.priority` → `v.serial` |
| `GET /api/v1/admin/product/variation/:id` | `v.priority` → `v.serial` |
| `GET /api/v1/product/getvariations/:id` (public) | `v.priority` → `v.serial` |
| `GET /api/v1/product/variation/:id` (public images) | `product_images.priority` → `product_images.serial` |

Response field names updated accordingly:
- `variant.priority` → `variant.serial`
- `images[].priority` → `images[].serial`

> **Frontend note:** Any storefront/admin code reading `variant.priority` or
> `image.priority` should be updated to read `.serial` instead.

---

## 18. Product Image Serial / Reorder

Completes the V2 `product_images.serial` migration by:
1. Assigning correct serial values on image insert (previously all images got `serial = 1`).
2. Providing a dedicated endpoint to reorder existing images via drag-and-drop.

### Changes to existing endpoints

| Endpoint | Change |
|---|---|
| `POST /api/v1/product` | New images inserted with `serial = 1, 2, 3…` based on upload order |
| `PUT /api/v1/product/:id` | New images appended with `serial = max_existing + 1, + 2…` |

The `images[]` array in all product GET responses already returns images ordered by `serial ASC` — no change needed there.

---

### Reorder Product Images

```
PATCH /api/v1/admin/product/:id/images/reorder
Authorization: Bearer <admin_jwt>
Content-Type: application/json
```

**URL params:** `:id` — product ID.

**Auth roles:** `SUPER_ADMIN`, `ADMIN`, `CATALOG_MANAGER`

**Body:**
```json
{
  "image_ids": [5, 3, 8, 1]
}
```

`image_ids` is an **ordered array** of all image IDs for the product.
Position in the array becomes the `serial` value (position 0 → serial 1, etc.).

**Validation:**
- `image_ids` must be a non-empty array of positive integers.
- No duplicate IDs allowed.
- All IDs must belong to the specified product (cross-product manipulation is rejected with 400).

**Success response `200`:**
```json
{ "success": true }
```

**Error responses:**

| Status | Reason |
|---|---|
| `400` | `image_ids` missing, empty, has duplicates, or contains invalid integers |
| `400` | One or more IDs don't belong to this product |
| `401` | Admin JWT missing or invalid |
| `403` | Role not permitted |
| `404` | Product not found |

**Audit log:** logged under `EDIT_PRODUCT` action with `meta.image_reorder = [ordered_ids]`.

---

## 19. Product Face Image (Listing Thumbnail) � V2-025

Optimised WebP thumbnail (`face_image`) stored per product for fast listing pages.  
Loading the `/all-products` / shop listing pages previously required fetching the first full-resolution product image. The face image is a compressed, resized copy (400 � 400 px, WebP, quality 60) generated automatically from the product's serial-1 image.

### Database

Column added in **V2-005** (already in `v2.sql`):
```sql
ALTER TABLE `products`
  ADD COLUMN `face_image` VARCHAR(512) NULL AFTER `video_path`;
```

### Storage path

| Environment | Path |
|---|---|
| Local (dev) | `uploads/faceimage/face_<timestamp>.webp` |
| GCS (prod) | `uploads/faceimage/face_<timestamp>.webp` (in bucket) |

### When face_image is generated / updated

| Trigger | Controller | Details |
|---|---|---|
| Create product | `createProduct` | Generated from the first uploaded image (serial 1) |
| Edit product (add/delete images) | `editProduct` | Regenerated from the new serial-1 image; cleared to NULL if all images deleted |
| Image reorder | `reorderProductImages` | Regenerated from the newly promoted serial-1 image |

Generation is **non-fatal** � if sharp fails for any reason, the product operation still succeeds and the existing `COALESCE` fallback in listing queries keeps the listing working.

### New helper

`helpers/img.js` � `saveFaceImage(sourceRelativePath)`:
- Reads source image from local disk or GCS (based on `STORAGE_DRIVER` env)
- Resizes to `FACE_IMAGE_WIDTH` � `FACE_IMAGE_HEIGHT` with `cover` fit
- Encodes as WebP at `FACE_IMAGE_QUALITY`
- Saves via storage adapter, returns relative path

### New env vars

```env
FACE_IMAGE_WIDTH=400    # thumbnail width px (default 400)
FACE_IMAGE_HEIGHT=400   # thumbnail height px (default 400)
FACE_IMAGE_QUALITY=60   # WebP quality 0�100 (default 60)
```

These are also added to `cloudbuild.yaml` substitutions for Cloud Run deploy.

### Listing query usage

All product-listing queries already use:
```sql
COALESCE(p.face_image, (SELECT pi.img_path FROM product_images pi
    WHERE pi.product_id = p.id ORDER BY pi.serial ASC, pi.id ASC LIMIT 1)) AS thumbnail
```
So `face_image` is used when available; first product image is the fallback.

### Backfill (one-time, per environment)

1. Apply the V2-025 SQL block from `updatequerylist.sql` (resets stale raw-path entries).
2. Run: `node scripts/backfill-face-images.js --force`
   - `--force` regenerates even if `face_image` is already set (needed to replace raw-path entries set by V2-005).

### `GET /api/v1/admin/product` response update

`face_image` is now included in the admin product list response:
```json
{
  "id": 344,
  "face_image": "/uploads/faceimage/face_344_1773748454859.webp",
  "images": [ ... ]
}
```

---

## 20. Variant `serial` Column � Bug Fixes

After the V2 rename of `variants.priority` ? `variants.serial`, several active queries
and JS response mappers in `controllers/product.js` still referenced the old column name,
causing `Unknown column 'variant_priority' in field list` errors on product listing.

### Queries fixed

| Location | Old reference | New reference |
|---|---|---|
| `getProductsusers` skuSubquery `GROUP_CONCAT ORDER BY` (�3) | `s.variant_priority DESC` | `s.variant_serial ASC` |
| `getProductById` variation mapper | `v.variant_priority` | `v.variant_serial` |
| `getAdminProductDetail` variation mapper | `v.variant_priority` | `v.variant_serial` |

The `skuSubquery` already correctly aliased `v.serial AS variant_serial` � only the ORDER BY clauses and mappers needed updating.

---

## 21. Image Reorder UI � Admin Panel UX Improvements

`DraggableImageGrid.tsx` was rewritten for reliability and mobile usability.

### Problems with original implementation
- `hover` midpoint guard (`hoverClientX < hoverMidX`) blocked movement to non-adjacent cards � only 1 slot at a time possible.
- `onReorder` (API call) was fired on every hover event during drag, causing **concurrent PATCH requests ? MySQL deadlock** on `product_images` rows.
- No mobile/touch support.

### New implementation

**Two-layer state:**
| Layer | When updated | API call? |
|---|---|---|
| `localImages` (component state + ref) | Every drag hover | No |
| Parent `onReorder` callback | Once, on `useDrag.end` | Yes (1 call) |

**Controls on each image card:**
| Control | Action |
|---|---|
| ? drag handle | Free-form drag to any position |
| � arrow | Move left by 1 |
| ? Set Cover | Jump to position 1 (serial 1) immediately |
| � arrow | Move right by 1 |
| ?? Delete | Toggle delete mark |

Arrow / Set Cover buttons trigger the API immediately (discrete click = no debounce needed).

**Visual feedback:**
- First image shows **"Cover"** badge (brand colour).
- Drop target highlights with ring on hover.
- Dragging card fades to 30% opacity.


---

---

## 22. Variant Image Assignment via SKU (`sku_id` on `product_images`) — V2-026/V2-027

Allows admins to assign product images to a specific **product SKU** (a color + size variation). In the shop, the gallery automatically shows only relevant images as customers select color and/or size.

### Database change — V2-027

V2-026 (temporary `color_id` column) was replaced by V2-027.

**V2-027** adds a nullable `sku_id` FK to `product_images`:

```sql
-- Roll back V2-026
ALTER TABLE product_images DROP FOREIGN KEY IF EXISTS fk_pi_color, DROP KEY IF EXISTS idx_pi_color;
ALTER TABLE product_images DROP COLUMN IF EXISTS color_id;

-- Apply V2-027
ALTER TABLE `product_images`
  ADD COLUMN `sku_id` INT DEFAULT NULL
    COMMENT 'NULL = shared (all SKUs); SET = shown only for this color+size combo'
    AFTER `serial`,
  ADD KEY `idx_pi_sku` (`sku_id`),
  ADD CONSTRAINT `fk_pi_sku`
    FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`) ON DELETE SET NULL;
```

| `sku_id` value | Meaning |
|---|---|
| `NULL` | Shared — shown for all color/size selections (default for all existing images) |
| `<sku_id>` | SKU-specific — shown only when that color+size combination is selected |

---

### New endpoint — V2-027

#### `PATCH /api/v1/admin/product/image/:imageId/sku`

Assign or clear a SKU on a single product image.

**Auth roles:** `SUPER_ADMIN`, `ADMIN`, `CATALOG_MANAGER`

**Body:**
```json
{ "sku_id": 12 }    // assign to SKU #12 (e.g. Blue / M)
{ "sku_id": null }  // clear → image becomes shared
```

**Validation:**
- `sku_id` must be a positive integer or `null`
- The specified SKU must belong to this product (`product_skus.product_id = product.id`)

**Success `200`:** `{ "success": true, "image_id": 1718, "sku_id": 12 }`

**Audit log:** `EDIT_PRODUCT` with `meta.image_sku_assign = { image_id, sku_id }`.

---

### Updated image response shape

All product image arrays now include `sku_id` plus denormalized `sku_color_id` and `sku_variant_id` (from a LEFT JOIN on `product_skus`):

```json
"images": [
  { "id": 1718, "path": "...", "serial": 1, "sku_id": null,  "sku_color_id": null, "sku_variant_id": null },
  { "id": 1719, "path": "...", "serial": 2, "sku_id": 12,    "sku_color_id": 5,    "sku_variant_id": 3  }
]
```

Denormalized fields allow the shop to filter without additional lookups.

Affected endpoints:
- `GET /api/v1/admin/product/:id`
- `GET /api/v1/user/product/:id`
- `GET /api/v1/user/product/variation/:id`

---

### Admin panel UX

`DraggableImageGrid` shows a **🎨 SKU dropdown** on each image card (populated with all color+size combos e.g. `Blue / M`, `Red / XL`). Selecting a SKU calls `PATCH /admin/product/image/:imageId/sku` immediately. Clearing sets `sku_id = null` (shared). The badge on the image thumbnail shows the assigned color name and size.

### Shop gallery filter logic (updated)

`ProductGallery` receives `selectedColorId` + `selectedVariantId` from `ProductDetails`.

**All images are always shown** — matching images are displayed at full brightness, non-matching images are dimmed (`opacity-40 + grayscale`). This is a visual cue, not a filter. Users can still purchase any in-stock variation regardless of whether an image is assigned to it.

| State | Images displayed |
|---|---|
| No images have `sku_id` assigned | All full brightness (backwards compatible) |
| No color/size selected | All full brightness |
| Color selected, color has assigned images | Shared + matched images bright; others dimmed |
| Color selected, **no images assigned to that color** | **All images full brightness** (generic fallback — lets user see product while still purchasing) |
| Color + size, matching combo has image | Shared + exact match bright; others dimmed |
| Color + size, no exact match image | Fallback: color-matched images if any, otherwise all bright |

Gallery auto-jumps to image index 0 whenever the customer switches color or size.

Size/color selectors are **always driven by stock** (`available_variants` / `available_colors` from the variations query), never by image assignments — users can always add to cart any in-stock combination.

---

## 23. V2 Bug Fixes & Refinements (2026-03-18)

### 23.1 `GET /api/v1/user/product/:id` — Missing `sku_id` on Images

**Bug:** The user-facing product detail endpoint (`getProductByIdUser`) was fetching images with only `id, img_path, serial` — no `sku_id` JOIN. This meant the shop gallery never received the assignment data and could not filter images by color/size.

**Fix:** Updated image query to LEFT JOIN `product_skus`:

```sql
SELECT pi.id, pi.img_path, pi.serial, pi.sku_id,
       ps.color_id AS sku_color_id, ps.variant_id AS sku_variant_id
FROM product_images pi
LEFT JOIN product_skus ps ON ps.id = pi.sku_id
WHERE pi.product_id = ?
ORDER BY pi.serial ASC, pi.id ASC
```

This endpoint now returns the same `sku_id + sku_color_id + sku_variant_id` fields as the admin endpoint. (Section 22 affected-endpoints list was already correct; the fix brought the implementation in line with the spec.)

---

### 23.2 Face Image File Accumulation — `editProduct` & `reorderProductImages`

**Bug:** Every time a new cover image was set (either by adding/deleting images in `editProduct`, or by drag-reordering via `reorderProductImages`), a new `face_image` WebP thumbnail was generated and saved — but the **old file was never deleted**. Over time this accumulated orphaned thumbnail files in `uploads/faceimage/`.

**Fix:** Before calling `saveFaceImage()`, both handlers now:
1. Query `SELECT face_image FROM products WHERE id = ?` to get the current thumbnail path.
2. Call `deleteFileIfExists(oldPath)` to remove the old file from disk/GCS.
3. Then proceed with generating and saving the new thumbnail.

Affected controller functions:

| Function | Trigger |
|---|---|
| `editProduct` | Admin saves product with image changes (add or delete) |
| `reorderProductImages` | Admin reorders images, promoting a new image to serial 1 |

> `createProduct` is unaffected — there is no previous face_image to delete on first creation.

---

### 23.3 Shop Smart Color/Size Cross-Filtering — `ProductInfoPanel`

_Frontend-only change (no API impact):_

- **`handleColorChange`:** When the customer switches to a new color, if the currently selected size does not exist for that color (no variation in stock), the size auto-resets to the first available size for the new color (or 0/none if the new color has no sizes).
- **`handleSizeChange`:** When the customer picks a size that the currently selected color does not offer, the color auto-switches to the first color that does have that size in stock.
- **Unavailability indicators:** Sizes and colors that don't form a valid variation with the current selection are shown with a diagonal strikethrough line + reduced opacity. This is purely visual — clicking them still works and triggers the appropriate auto-switch.

---

## 24. Order Basic Info Update (2026-03-20)

### 24.1 `PATCH /api/v1/admin/order/info/:id` — Update Order Basic Details

**Feature:** Replaces UI placeholders on the `OrderEditorPage` in the admin panel by officially supporting modification of a customer's basic info on an order.

**Payload:**
```json
{
  "customer_name": "string",
  "customer_phone": "string",

  "customer_email": "string (optional)",
  "payment_type": "gateway | cod | mixed",
  "note": "string (optional)",
  "full_address": "string",
  "city": "string",
  "zip_code": "string"
}
```

**Actions Performed:**
1. Updates the `orders` table (`customer_name`, `customer_phone`, `customer_email`, `payment_type`, `note`).
2. Updates the `order_addresses` table (`full_address`, `city`, `zip_code`).
3. Dispatches a `UPDATE_ORDER_INFO` audit log recording the modified fields.

**Response:**
```json
{
  "success": true,
  "message": "Order information updated successfully"
}
```

---

### 24.2 `PATCH /api/v1/admin/order/items/:id` — Update Order Line Items & Delivery Charge

**Feature:** Updates order item rows (quantity, discount, product SKU) and order-level charges (delivery, special discount), then atomically recalculates `grand_total`.

**Payload:**
```json
{
  "items": [
    {
      "order_item_id": 12,
      "product_sku_id": 45,
      "quantity": 2,
      "discount": 100
    }
  ],
  "delivery_charge": 130,
  "discount_total": 0
}
```

**Actions Performed:**
1. Updates each `order_items` row (quantity, discount, product_sku_id).
2. Updates `orders.delivery_charge` and `orders.discount_total` if provided.
3. Recalculates and saves `orders.grand_total = subtotal + delivery_charge - discount_total`.
4. Appends `UPDATE_ORDER_ITEMS` audit log entry.

**Response:**
```json
{
  "success": true,
  "message": "Order items updated successfully"
}
```


---

## 25. Bulk / Combo / Cart-Wide Discount Integration — V2-029

Three public (no auth) shop-panel endpoints plus DB schema for discount tracking on orders.

---

### 25.1 `GET /api/v1/user/bulk-rules`

Returns active SKU-level bulk discount rules with product/image data.
Optional query param: `product_sku_id` (int) to filter.

`discount_type`: `0` = flat BDT per unit, `1` = percentage of line total.

---

### 25.2 `GET /api/v1/user/combo-rules`

Returns active combo rules with tiers and required item lists.
Combo applies only if cart satisfies all `required_qty` for every tier item (all-or-nothing).

---

### 25.3 `GET /api/v1/user/cart-discount-config`

Returns `overall_cart_discount` permission settings for live checkout preview.

**Response `data`:**
| Field | Type | Description |
|---|---|---|
| `is_enabled` | bool | Whether cart-wide discount is active |
| `basis` | string | `"item_count"` or `"total_selling_price"` |
| `min_item_count` | int | Min total qty (when basis = item_count) |
| `min_total_selling_price` | int | Min subtotal (when basis = total_selling_price) |
| `discount_type` | string | `"flat"` or `"percentage"` |
| `discount_value` | number | Flat BDT amount or % value |
| `apply_with_bulk_combo` | bool | If false, cart-wide is skipped when bulk/combo apply |

---

### 25.4 Updated Order Response Fields

Orders now return:

**Order-level:** `bulk_discount_total`, `combo_discount_total`, `cart_wide_discount`

**Item-level:** `bulk_rule_id`, `bulk_discount_applied`, `combo_rule_id`, `combo_discount_applied`

---

### 25.5 DB Migration — V2-029

`sql
ALTER TABLE orders
  ADD COLUMN bulk_discount_total  DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_total,
  ADD COLUMN combo_discount_total DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER bulk_discount_total,
  ADD COLUMN cart_wide_discount   DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER combo_discount_total;

ALTER TABLE order_items
  ADD COLUMN bulk_rule_id           INT           NULL     DEFAULT NULL AFTER weight_kg,
  ADD COLUMN bulk_discount_applied  DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER bulk_rule_id,
  ADD COLUMN combo_rule_id          INT           NULL     DEFAULT NULL AFTER bulk_discount_applied,
  ADD COLUMN combo_discount_applied DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER combo_rule_id;
`

---

### 25.6 Discount Application Priority

`
grandTotal = subtotal + deliveryCharge + weightSurcharge
           - skuDiscount - couponDiscount
           - bulkDiscount - comboDiscount - cartWideDiscount
`

Order: SKU discount → Bulk → Combo → Coupon → Cart-Wide

---

## 26. Compare & Budget Plan

Two dedicated public endpoints for the Compare & Plan feature. No authentication required.

---

### 26.1 GET /api/v1/user/compare

Fetch full product detail for 1-2 products in a **single request**, including images, SKU variations with item discount, and active bulk discount tiers per SKU.

**Query Parameters**

| Parameter | Type   | Required | Description                               |
|-----------|--------|----------|-------------------------------------------|
| ids       | string | Yes      | Comma-separated product IDs (1 or 2 IDs) |

**Example**
```
GET /api/v1/user/compare?ids=42,87
```

**Response Shape**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 42,
      "name": "Blue Polo Shirt",
      "slug": "blue-polo-shirt",
      "brand": { "id": 3, "name": "CoolBrand" },
      "main_category": { "id": 1, "name": "Men" },
      "sub_category": { "id": 5, "name": "Tops" },
      "free_delivery": true,
      "summary": { "total_variations": 4, "total_in_stock": 3, "total_stock": 110, "min_price": 720, "max_price": 850 },
      "images": [{ "id": 11, "path": "uploads/img.jpg", "position": 1, "product_sku_id": null }],
      "variations": [
        {
          "id": 201, "sku": "POLO-BLU-M",
          "color": { "id": 2, "name": "Blue", "hex": "#1a73e8" },
          "variant": { "id": 3, "name": "M" },
          "selling_price": 800, "discount": 10, "discount_type": 1,
          "final_price": 720, "item_discount_amount": 80,
          "stock": 45, "in_stock": true, "weight_kg": 0.3,
          "bulk_rules": [
            { "min_qty": 5, "discount_value": 5, "discount_type": 1, "discount_label": "5% off", "effective_price": 684 },
            { "min_qty": 20, "discount_value": 10, "discount_type": 1, "discount_label": "10% off", "effective_price": 648 }
          ]
        }
      ]
    }
  ]
}
```

**Notes**
- ulk_rules per variation are from sku_bulk_discount_rules (status=1 only).
- effective_price in bulk rule = inal_price_after_item_discount - bulk_discount.
- Returns 404 if a product ID is not found or its category chain is inactive.

---

### 26.2 POST /api/v1/user/budget-plan

Server-side budget calculator. Returns affordable in-stock SKUs with fully stacked discounts (item + bulk tier + coupon), sorted by quantity descending.

**Request Body**

| Field             | Type   | Required | Description                                      |
|-------------------|--------|----------|--------------------------------------------------|
| budget            | float  | Yes      | Max spend in BDT (must be > 0)                  |
| coupon            | string | No       | Coupon code (case-insensitive)                  |
| search            | string | No       | Name search filter                               |
| main_category_id  | int    | No       | Filter by main category                          |
| sub_category_id   | int    | No       | Filter by sub-category                           |
| child_category_id | int    | No       | Filter by child category                         |
| limit             | int    | No       | Max results (default 40, max 100)                |
| customer_id       | int    | No       | For per-user coupon usage limit check            |

**Example Request**
```json
{ "budget": 5000, "coupon": "SAVE20", "search": "shirt", "customer_id": 12 }
```

**Example Response**
```json
{
  "success": true,
  "meta": {
    "budget": 5000,
    "coupon_applied": true,
    "coupon_title": "Save 20% Sitewide",
    "coupon_error": null,
    "total_matches": 27,
    "returned": 27
  },
  "data": [
    {
      "product_id": 42, "product_name": "Blue Polo Shirt",
      "sku_id": 201, "sku": "POLO-BLU-M",
      "thumbnail": "uploads/img.jpg",
      "color_name": "Blue", "color_hex": "#1a73e8", "variant_name": "M",
      "free_delivery": true, "stock": 45,
      "pricing": {
        "original_price": 800,
        "item_discount": 80,
        "price_after_item_discount": 720,
        "coupon_discount_per_unit": 36,
        "bulk_discount_applied": { "min_qty": 5, "discount_label": "5% off" },
        "effective_price_per_unit": 648
      },
      "bulk_rules": [ { "min_qty": 5, "discount_value": 5, "discount_type": 1, "discount_label": "5% off", "effective_price": 684 } ],
      "affordability": { "qty_affordable": 7, "total_spend": 4536, "total_saved": 1064, "change": 464 }
    }
  ]
}
```

**Discount Stacking Logic**

```
effective_price = original_price
               - item_discount
               - bulk_discount  (best tier where budget / price >= min_qty)
               - coupon_discount_per_unit (proportional, same as /coupon/validate)
```

max_discount_amount cap on coupons applied before per-SKU split.
Results sorted: qty_affordable DESC, then effective_price_per_unit ASC.

**Error / Edge Cases**

| Condition                  | Response                                              |
|----------------------------|-------------------------------------------------------|
| budget <= 0                | 400 - "Budget must be positive."                     |
| Invalid/expired coupon     | 200 - meta.coupon_error set, coupon not applied       |
| Coupon usage limit reached | 200 - meta.coupon_error set                           |
| No affordable SKUs found   | 200 - data: []                                        |

---

## 28. Courier Webhook Integration — V2-028

Real-time order status updates via webhooks from Steadfast and Pathao. The cron job (`cron/tracking_sync.js`, runs every 30 min) remains active as a fallback for missed webhooks.

### 28.1 New Endpoint — Generate Steadfast Webhook Token

```
GET /api/v1/config/steadfast/webhook-token
Auth: Bearer <admin-jwt>  (SUPER_ADMIN only)
```

**Response:**
```json
{ "success": true, "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

The token is a JWT signed with `ApplicationSettings.jwtSecret`, payload `{ purpose: "steadfast_webhook" }`, expiry 100 years. It is **not** stored automatically — the admin must save it via `PUT /api/v1/config/editSteadfastConfig` with `webhook_secret` set to the generated token.

### 28.2 Webhook Receiver Endpoints

Both endpoints are unauthenticated externally (auth is in the payload/header).

| Provider  | Endpoint                              |
|-----------|---------------------------------------|
| Steadfast | `POST /api/v1/webhooks/steadfast`     |
| Pathao    | `POST /api/v1/webhooks/pathao`        |

### 28.3 Steadfast Webhook Auth

Steadfast sends `Authorization: Bearer <token>` on every call. The server compares this token directly with the stored `STEADFAST_WEBHOOK_SECRET` config key. If they match, the status update is applied.

**Setup (admin steps):**
1. Open Admin Panel → Business Settings → Courier Settings → Edit Steadfast
2. Click **Generate Webhook Token** — this fills the Webhook Integration Secret field
3. Save the config
4. In Steadfast Merchant Dashboard → Webhook → Add Webhook:
   - **Callback URL:** `https://<your-api-domain>/api/v1/webhooks/steadfast`
   - **Auth Token (Bearer):** paste the generated token

### 28.4 Pathao Webhook Auth

Pathao uses a user-defined secret string stored as `PATHAO_WEBHOOK_SECRET`.

**Handshake:** When admin registers the webhook in Pathao's dashboard, Pathao fires a `POST` with `{ "event": "webhook_integration" }`. Our server responds HTTP 202 with header:
```
X-Pathao-Merchant-Webhook-Integration-Secret: <PATHAO_WEBHOOK_SECRET>
```

**Ongoing events:** Pathao sends `X-PATHAO-Signature: <secret>` on every event. Our server compares this with the stored `PATHAO_WEBHOOK_SECRET`.

**Setup (admin steps):**
1. Open Admin Panel → Business Settings → Courier Settings → Edit Pathao
2. Set the **Webhook Integration Secret** field to any secure random string, save
3. In Pathao Merchant Dashboard → Developer API → Webhook Integration:
   - **Callback URL:** `https://<your-api-domain>/api/v1/webhooks/pathao`
   - **Secret:** same string you saved in step 2
4. Click Add Webhook → Pathao fires the handshake → server returns 202 with the secret header

### 28.5 Tracking URL Formats

| Provider  | Tracking URL pattern |
|-----------|----------------------|
| Steadfast | `https://steadfast.com.bd/t/{tracking_number}` |
| Pathao    | `https://merchant.pathao.com/tracking?consignment_id={tracking_number}&phone={customer_phone}` |
| RedX      | `https://redx.com.bd/track-parcel/?trackingId={tracking_number}` |
| Paperfly  | `https://paperfly.com.bd/tracking/?trackId={tracking_number}` |

These URLs are built dynamically in:
- **Admin panel:** `OrderEditorPage.tsx` → `mapApiOrderToEditorData()` → `courier.trackingUrl`
- **Shop panel:** `MyOrderDetailsClient.tsx` → `getTrackingUrl()` helper (already correct)

---

## 25. Courier Status Sync — Manual & Bulk

> **Added:** 2026-04-03  
> **Purpose:** On-demand fallback for couriers (primarily Steadfast) that do not fire webhooks for all status changes.

### 25.1 Single Order Sync

Fetches live status from the courier API for one order and updates the DB if changed.

```
POST /api/v1/admin/order/sync-courier-status/:orderId
Authorization: Bearer <admin_jwt>
```

**Path param:** `orderId` — internal order ID.

**Response:**
```json
{
  "success": true,
  "updated": true,
  "courier_raw_status": "cancelled",
  "previous_status": "processing",
  "new_status": "cancelled",
  "message": "Status updated: processing → cancelled"
}
```

| Field | Description |
|---|---|
| `updated` | `true` if the order status was changed |
| `courier_raw_status` | The raw string returned by the courier API |
| `previous_status` | Order status before this sync |
| `new_status` | Order status after this sync (same as previous if not updated) |

**Guards:**
- Returns 404 if order or courier record not found
- Skips update if order is already in a terminal state (`delivered`, `returned`, `cancelled`, `trash`)
- Skips update if mapped status is the same as current status

**Where used:** `SidebarCourierCard` in the order editor — "Sync Status" button (only visible when a tracking URL exists).

---

### 25.2 Bulk Sync All Active Orders

Fetches live statuses for **all active dispatched orders** in one call. Designed for efficiency.

```
POST /api/v1/admin/orders/bulk-sync-courier-status
Authorization: Bearer <admin_jwt>
```

**No request body required.**

**Response:**
```json
{
  "success": true,
  "checked": 28,
  "updated": 3,
  "errors": 0,
  "message": "Updated 3 of 28 orders"
}
```

| Field | Description |
|---|---|
| `checked` | Total orders queried from the courier API |
| `updated` | Orders whose status changed and were updated in DB |
| `errors` | Orders where the courier API call failed |

**Performance design:**
- **1 SQL query** to fetch all `shipped` / `out_for_delivery` / `processing` orders with a tracking number (cap: 100)
- **1 config query** to load all courier configs grouped by provider
- **Concurrency pool (×10)** — max 10 simultaneous courier API calls
- **`Promise.allSettled`** — one failing call does not abort the rest
- **1 bulk `UPDATE`** — `CASE WHEN … END` for all changed orders in one SQL statement
- **1 bulk `INSERT`** — all history entries in one multi-row INSERT

**Eligible orders:** `order_status IN ('shipped', 'out_for_delivery', 'processing')` AND `tracking_number IS NOT NULL AND tracking_number != ''`.

**Terminal guard:** Orders already in `delivered`, `returned`, `cancelled`, `trash` are excluded from the DB query entirely.

**Required role:** `SUPER_ADMIN`, `ADMIN`, or `ORDER_MANAGER`.

**Where used:** "Sync All Status" button in the Admin Orders list header (`AllOrdersView.tsx`).

---

### 25.3 Status Mapping

Both endpoints use the same internal mapper:

| Courier raw value | Mapped internal status |
|---|---|
| `delivered`, `partial_delivered` | `delivered` |
| `returned` | `returned` |
| `cancelled` | `cancelled` |
| `out_for_delivery` | `out_for_delivery` |
| `in_transit`, `sorting`, `picked_up`, `pickup_in_progress`, `at_sorting_hub`, `received_at_hub`, `pickup.done` | `shipped` |
| anything else (incl. `unknown`, `in_review`) | no change |

> **Steadfast limitation:** Steadfast's tracking API (`/status_by_trackingcode/:id`) returns `"unknown"` for merchant-cancelled orders (not `"cancelled"`). There is no programmatic way to detect Steadfast merchant cancellations via their public API. Admins should manually cancel such orders using the Quick Cancel button in the orders list.

---

## 26. Admin Orders — Quick Cancel UI

> **Added:** 2026-04-03 (frontend only — no new API endpoint)

A **red ✕ (XCircle) button** was added to the sticky Action column of the orders table (`OrdersTable.tsx`).

**Behaviour:**
- Visible only for non-terminal orders (`new`, `approved`, `processing`, `packaging`, `shipped`, `out_for_delivery`, `on_hold`)
- Hidden for `cancelled`, `delivered`, `returned`, `trash`
- Clicking shows a **6-second confirmation toast**: *"Cancel order #123? [Confirm] [Dismiss]"*
- Confirming calls the existing `PATCH /api/v1/admin/order/status/:orderId` endpoint with `{ order_status: "cancelled" }`
- Uses optimistic update — status pill changes immediately, reverts on error

**Use case:** After cancelling an order in the Steadfast merchant dashboard (which does not trigger a webhook), the admin can immediately reflect the cancellation in the admin panel without navigating to the order editor.

---

## 27. Steadfast Webhook Token — No Expiry

> **Updated:** 2026-04-03

The `POST /api/v1/config/generate-steadfast-webhook-token` endpoint previously generated a JWT with `expiresIn: "36500d"` (100 years). This has been changed to generate a token with **no expiry claim at all** (`exp` field omitted from payload).

```
POST /api/v1/config/generate-steadfast-webhook-token
Authorization: Bearer <admin_jwt>  (SUPER_ADMIN only)
```

**Response:**
```json
{ "success": true, "token": "eyJ..." }
```

**Token payload:**
```json
{ "purpose": "steadfast_webhook", "iat": 1743700000 }
```

No `exp` claim → token is valid permanently until the secret key changes or the admin regenerates it.

**How it's used:**
1. Admin generates the token in Admin Panel → Business Settings → Courier Settings → Steadfast → "Generate Webhook Token"
2. Paste the token into Steadfast Merchant Dashboard → Webhook → Auth Token (Bearer)
3. Steadfast includes `Authorization: Bearer <token>` on every webhook call
4. Our server compares it as a plain string against the stored `STEADFAST_WEBHOOK_SECRET` (no JWT signature/expiry verification is performed)

> **Note:** Even though this is a JWT, our backend performs a **string comparison** (`token === storedSecret`), not JWT signature verification. This is intentional — simplicity over complexity, since the token is a shared secret used as a bearer token.

---

*Last updated: 2026-04-03 (V2-017 additions)*

---

## V2-017 Additions: Order Distribution & Assignment

### New Endpoints

#### `GET /admin/order-distribution/eligible-admins`
Returns all eligible admins (based on distribution settings roles) with their current workload stats.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "admin_name": "Sajib Rahman",
      "email": "sajib@example.com",
      "role_name": "ORDER_MANAGER",
      "profile_img_path": null,
      "pool_id": 1,
      "serial": 1,
      "pool_auto_assign": true,
      "max_active_orders": null,
      "active_order_count": 5,
      "today_handled_count": 12
    }
  ]
}
```

---

#### `POST /admin/order-distribution/agents/by-admin/:admin_id`
Upsert (add or update) a pool agent by admin ID.

**Body:**
```json
{
  "auto_assign_enabled": true,
  "max_active_orders": 20,
  "serial": 1,
  "status": true
}
```

**Response:** `{ "success": true, "data": { ...agent row } }`

---

#### `POST /admin/order-distribution/redistribute`
Bulk auto-assigns all unassigned active orders using the current pool and settings.

**Response:** `{ "success": true, "message": "Redistributed 7 orders." }`

---

### Updated Endpoints

#### `GET /admin/orders` — Assignment Filter Params

| Param | Type | Description |
|---|---|---|
| `assigned_to_me` | `bool` | When `true`, returns only orders assigned to the authenticated admin |
| `assigned_to_admin_id` | `int` | Filter by a specific admin's assigned orders |

**New fields in each order row:**
```json
{
  "assigned_to_admin_id": 3,
  "assigned_by_admin_id": 1,
  "assignment_method": "auto",
  "assigned_at": "2026-04-03T10:00:00.000Z",
  "assigned_admin_name": "Sajib Rahman"
}
```

---

#### `PUT /admin/notification-permissions/:admin_id` — New Field

| Field | Type | Default | Description |
|---|---|---|---|
| `allow_handle_unassigned_order` | `bool` | `true` | When `false`, admin can only view and process orders assigned to them |

---

### DB Changes

| Table | Change |
|---|---|
| `order_distribution_settings` | New singleton table |
| `order_distribution_agents` | New pool membership table |
| `order_assignment_logs` | New audit log table |
| `orders` | Added: `assigned_to_admin_id`, `assigned_by_admin_id`, `assignment_method`, `assigned_at` |
| `admin_notification_permissions` | Added: `allow_handle_unassigned_order` (default `1`) |

---

## V2-034 — Admin Notification & Firebase Push System

### Overview

Implements end-to-end admin notification wiring across **Email**, **SMS**, and **Firebase Push** channels. All notifications are **non-blocking** (fire-and-forget) to ensure service failures (e.g. SMS provider down) never affect order processing.

#### Architecture

```
Order Event / Pool Event
        │
        ▼
helpers/notify.js  ─── sendAdminOrderNotification()  → ASSIGNED admin only (order__notification_admin perm)
                   │     ├── waits 900ms for auto-assign on new_order before fetching
                   │     └── fallback: all pool agents (if still unassigned after retry)
                   └── sendPersonalNotification()     → Single admin (personal_notification_admin perm)
                              │
                     ┌────────┼────────┐
                     ▼        ▼        ▼
                   Email     SMS   Firebase Push
```

> **Updated in V2-035:** `sendAdminOrderNotification` was changed to target only the order's `assigned_to_admin_id` instead of broadcasting to all active admins. See [V2-035](#27-v2-035--push-notification-fixes--bell-badge-integration).

#### Permission Gating (two-level)

1. **Global flags** in `permission_config` table (sections: `order__notification_admin`, `personal_notification_admin`)
2. **Per-admin flags** in `admin_notification_permissions` columns: `order_notification_email`, `order_notification_sms`, `order_notification_firebase_push`, `personal_notification_email`, `personal_notification_sms`, `personal_notification_firebase_push`

Both levels must be `true` for a channel to fire.

### New Files

| File | Purpose |
|------|---------|
| `helpers/notify.js` | Centralised notification dispatcher |
| `controllers/admin_push.js` | FCM token registration endpoints |
| `public/firebase-messaging-sw.js` (admin panel) | Firebase service worker for background push |
| `src/lib/firebase.ts` (admin panel) | Firebase singleton + token helpers |
| `src/api/admin-push.api.ts` (admin panel) | Frontend API for token registration |
| `src/providers/PushNotificationProvider.tsx` (admin panel) | React provider for push UX |

### New API Endpoints

#### `POST /admin/push-token`
**Auth required.** Register (or refresh) an FCM token for the authenticated admin.

**Body:**
```json
{ "fcm_token": "string", "user_agent": "string (optional)" }
```

#### `DELETE /admin/push-token`
**Auth required.** Deregister an FCM token (called on logout).

**Body:**
```json
{ "fcm_token": "string" }
```

### Notification Events

| Event | Function | Triggered From |
|-------|----------|----------------|
| New order placed (regular/guest/manual/stranger) | `sendAdminOrderNotification(orderId, 'new_order')` | `order.js`, `guest_order.js`, `admin_order.js` |
| Order assigned to admin | `sendPersonalNotification(adminId, ...)` | `order_assignment.js` → `sendAssignmentNotification()` |
| Admin added to distribution pool | `sendPersonalNotification(adminId, ...)` | `addDistributionAgent`, `upsertAgentByAdminId` |
| Admin removed from distribution pool | `sendPersonalNotification(adminId, ...)` | `removeDistributionAgent` |

### DB Changes

| Table | Change |
|-------|--------|
| `admin_push_tokens` | **NEW** — stores FCM tokens per admin session |

#### `admin_push_tokens` Schema

| Column | Type | Description |
|--------|------|-------------|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | PK |
| `admin_id` | `INT` | FK → `admins.id` ON DELETE CASCADE |
| `fcm_token` | `TEXT` | Firebase Cloud Messaging token |
| `user_agent` | `VARCHAR(512)` | Browser identifier |
| `is_active` | `TINYINT(1)` | 1 = active, 0 = deactivated (logout/invalid) |
| `created_at` | `TIMESTAMP` | Auto-set |
| `updated_at` | `TIMESTAMP` | Auto-updated |

### Setup Required (One-time)

1. **Run DB migration:** Execute `scripts/v2-034-run-now.sql` in MySQL Workbench.

2. **Get VAPID Key:** Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → **Generate key pair** → Copy the public key.

3. **Set VAPID Key:** In `src/lib/firebase.ts`, paste the public key into the `VAPID_KEY` constant:
   ```ts
   export const VAPID_KEY = "BPaste_your_key_here";
   ```

4. **Ensure Firebase credential is uploaded:** Admin Panel → Settings → Firebase Credential → paste the service account JSON and toggle active.

---

## 27. V2-035 — Push Notification Fixes & Bell Badge Integration

### Overview

Fixes and completes the end-to-end push notification pipeline for both the **Shop Panel** and **Admin Panel**. Addresses: bell badge not updating for background pushes, admin SMS/push not being delivered, all-admin broadcast replaced with assigned-admin targeting, and broken toggle UI in the Permissions page.

---

### Backend Changes

#### `helpers/notify.js` — Targeted Admin Notification (Breaking Change)

`sendAdminOrderNotification()` was rewritten to notify **only the assigned admin** instead of all active admins.

| Behaviour | Before (V2-034) | After (V2-035) |
|---|---|---|
| Recipients | All active admins | `orders.assigned_to_admin_id` only |
| New order timing | Immediate | Waits 900ms for auto-assign, then retries |
| Still-unassigned fallback | N/A | Broadcasts to all active `order_distribution_agents` |
| DB query | All admins JOIN perms | Specific admin IDs IN (...) JOIN perms |

**Logic flow:**
```
sendAdminOrderNotification(orderId, eventType)
  ├── load global flags for order__notification_admin
  ├── fetch order (including assigned_to_admin_id)
  ├── if new_order AND assigned_to_admin_id IS NULL:
  │     └── await 900ms → re-fetch order
  ├── if assigned_to_admin_id IS NOT NULL:
  │     └── targetAdminIds = [assigned_to_admin_id]
  └── else (still unassigned):
        └── targetAdminIds = all active pool agents
```

#### `index.js` — New Debug Endpoint (DEV ONLY)

```
GET /api/v1/debug/admin-notify-eligibility
```
No auth required. Returns all active admins with their notification eligibility summary:

```json
{
  "global_flags": { "email": "true", "sms": "true", "firebase_push_notification": "true" },
  "admins": [
    {
      "id": 13,
      "name": "Sars",
      "email": "...",
      "phone": "01629615314",
      "has_phone": true,
      "want_email": true,
      "want_sms": true,
      "want_push": true,
      "has_push_token": true,
      "sms_will_fire": true,
      "push_will_fire": true
    }
  ]
}
```
> **Remove before production deploy.**

---

### Service Worker Changes (Both Panels)

Both `gcp_graduatefashion_shop/public/firebase-messaging-sw.js` and `graduate_shop_admin/public/firebase-messaging-sw.js` were updated:

| Change | Purpose |
|---|---|
| `self.addEventListener('install', () => self.skipWaiting())` | New SW activates immediately on page reload (no need to close all tabs) |
| `self.addEventListener('activate', e => e.waitUntil(clients.claim()))` | SW immediately takes control of all open pages after activation |
| `self.clients.matchAll(...).then(clients => clients.forEach(c => c.postMessage({type:'GF_PUSH_NOTIFICATION', ...})))` inside `onBackgroundMessage` | Notifies open browser tabs to update the bell badge when a background push arrives |

---

### Shop Panel Changes

#### `components/notifications/PushNotificationManager.tsx`

Added a `navigator.serviceWorker.addEventListener('message', handleSWMessage)` listener that receives `GF_PUSH_NOTIFICATION` messages from the service worker (fired for background pushes) and calls `pushNotification()` to update the bell badge store.

**Bell badge flow (after V2-035):**
```
Foreground push:
  Firebase SDK onMessage → onForegroundMessage handler → pushNotification() → bell badge updates

Background push (tab hidden/minimized):
  Firebase SW onBackgroundMessage → shows browser notification
                                 → postMessage to open tabs
                                 → handleSWMessage → pushNotification() → bell badge updates
```

---

### Admin Panel Changes

#### `src/hooks/useAdminNotificationStore.ts` — NEW FILE

Lightweight `localStorage`-backed singleton store for admin push notifications, following the same pattern as the shop panel's `useNotificationStore`. Exports:

| Export | Description |
|---|---|
| `pushAdminNotification(title, body, data?)` | Module-level function; adds a notification to the store |
| `markAllAdminNotificationsRead()` | Marks all as read |
| `clearAdminNotifications()` | Clears store |
| `useAdminNotificationStore()` | React hook; returns `{ items, unreadCount, markAllRead, clearAll }` |

Storage key: `gf_admin_push_notifications` (max 30 items retained).

#### `src/providers/PushNotificationProvider.tsx`

Two additions:
1. Foreground messages → `pushAdminNotification()` so the bell badge updates when the admin panel tab is active.
2. `navigator.serviceWorker.addEventListener('message', handleSWMessage)` listener → `pushAdminNotification()` for background pushes (same pattern as shop panel).

#### `src/components/header/NotificationDropdown.tsx`

Updated to merge push notification data with existing contact-message data:
- Bell badge count = `pushUnreadCount + contactUnreadCount`
- Dropdown shows **Recent Alerts** section (push notifications from `useAdminNotificationStore`) above the existing **Contact Messages** section.

#### `src/pages/Admins/PermissionsPage.tsx` — Bug Fix

| Bug | Fix |
|---|---|
| All toggle buttons in Admin Notifications tab were non-functional | `useState(() => { setRows(...) })` incorrectly used as a side-effect; replaced with `useEffect(() => { setRows(...) }, [data])`. The initializer only ran during the first render when `data` was still `undefined`, so `rows` was never populated and toggle clicks had no visible effect. |
| "Order Assignment" column shown in Admin Notifications tab | Removed — this is handled exclusively by the `/order-distribution` page |

---

### Summary of Affected Files

| File | Type | Change |
|---|---|---|
| `gcp_graduatefashion_api/helpers/notify.js` | Backend | Targeted admin notification (assigned-only) |
| `gcp_graduatefashion_api/index.js` | Backend | New debug eligibility endpoint |
| `gcp_graduatefashion_shop/public/firebase-messaging-sw.js` | Shop SW | skipWaiting + postMessage bridge |
| `gcp_graduatefashion_shop/components/notifications/PushNotificationManager.tsx` | Shop FE | SW message listener → bell badge |
| `graduate_shop_admin/public/firebase-messaging-sw.js` | Admin SW | skipWaiting + postMessage bridge |
| `graduate_shop_admin/src/hooks/useAdminNotificationStore.ts` | Admin FE | **NEW** — push notification store |
| `graduate_shop_admin/src/providers/PushNotificationProvider.tsx` | Admin FE | Foreground + background push → bell store |
| `graduate_shop_admin/src/components/header/NotificationDropdown.tsx` | Admin FE | Merged push + contact counts in bell |
| `graduate_shop_admin/src/pages/Admins/PermissionsPage.tsx` | Admin FE | Fixed toggle bug; removed Order Assignment column |

---

### Required Admin Action (One-Time)

1. Go to `/permissions` → **Admin Notifications** tab.
2. For each admin that should receive SMS and Push notifications, toggle SMS and Push ON and click **Save**.
3. Hard-reload (`Ctrl+Shift+R`) both the shop and admin panels once to activate the new service workers.

---

## 28. V2-036 — Notification Bug Fixes (2026-04-04)

### Overview

Fixes three bugs discovered after V2-035 rollout: wrong status text on approval notifications, duplicate push notifications delivered twice, and admin SMS/push being silently dropped because the global channel flags defaulted to `false`.

---

### Bug #1 — "Order Confirmed!" text on Order Approved

**File:** `helpers/notify.js`

The `approved` entry in `sendCustomerOrderNotification()` `STATUS_MESSAGES` was reusing the "Order Confirmed!" wording that belongs to order placement. Fixed to correctly say "Order Approved!".

| Before | After |
|---|---|
| `✅ Order Confirmed!` | `✅ Order Approved!` |
| `Your order has been confirmed and is being prepared.` | `Your order has been approved and is now being prepared for you.` |

> "Order Confirmed" is now reserved for the order-creation email. "Order Approved" fires when an admin changes status to `approved`.

---

### Bug #2 — Admin SMS & Push Never Fired (Wrong Defaults)

**File:** `helpers/notify.js` → `loadGlobalFlags()`

SMS and Firebase Push channel flags defaulted to `false` when no explicit row existed in `permission_config`. Email defaulted to `true`. This caused SMS and Push to be silently skipped for admins unless the permission row was explicitly set.

```js
// Before
sms:   map['sms']                         ?? false,   // ← always off if unset
push:  map['firebase_push_notification']  ?? false,   // ← always off if unset

// After
sms:   map['sms']                         ?? true,    // ← on unless explicitly disabled
push:  map['firebase_push_notification']  ?? true,    // ← on unless explicitly disabled
```

Applies to **both** `order__notification_admin` and `personal_notification_admin` sections (same function is called for both).

---

### Bug #3 — Push Notification Arrives Twice

**Files:** `hooks/useNotificationStore.ts` (shop), `src/hooks/useAdminNotificationStore.ts` (admin)

Both the FCM foreground handler (`onForegroundMessage`) and the service-worker background handler (`onBackgroundMessage` → `client.postMessage`) can fire for the same FCM delivery in certain browser/SDK version combinations where Firebase's compat SDK does not fully block `onBackgroundMessage` when the tab is focused.

**Fix:** Added a **5-second deduplication guard** inside both `pushNotification()` and `pushAdminNotification()`:

```ts
const isDuplicate = store.some(
  (n) =>
    n.order_id === data?.order_id &&
    n.status   === data?.new_status &&   // (event_type for admin store)
    now - n.receivedAt < 5_000
);
if (isDuplicate) return;  // silently skip
```

The guard reads the current store before inserting, so no additional state or refs are needed. A `console.debug` line is emitted when a duplicate is suppressed for easier debugging.

---

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/helpers/notify.js` | `approved` status text fix; SMS/Push defaults → `true` |
| `gcp_graduatefashion_shop/hooks/useNotificationStore.ts` | 5-second dedup guard in `pushNotification()` |
| `graduate_shop_admin/src/hooks/useAdminNotificationStore.ts` | 5-second dedup guard in `pushAdminNotification()` |

---

## 29. V2-037 — Notification Follow-up Fixes (2026-04-04)

### Bug A — Admin Receives 2 Emails on New Order (Double Notification)

**Root cause:** When a new order is placed and auto-assigned:
1. `sendAdminOrderNotification(orderId, 'new_order')` waits 900ms then sees the order is now assigned → sends "New Order" email to the assigned admin
2. `autoAssignOrder()` in `order_assignment.js` line 869 fires `sendAssignmentNotification()` → sends "Order Assignment Notice" to the same admin

Both arrive at the same time for the same order → admin sees 2 separate emails.

**Fix:** Added an early return in `sendAdminOrderNotification()` for `new_order` events when the order is already assigned post-retry:

```js
if (eventType === 'new_order' && order.assigned_to_admin_id) {
  console.log(`[Notify] Order #${orderId} is auto-assigned → skipping new_order broadcast`);
  return;
}
```

**Result:** If auto-assign happens, only the "Order Assignment Notice" fires. If order remains unassigned (no agents available), only the "New Order" broadcast fires to all pool agents — correct behavior in both cases.

---

### Bug B — Shop Shows Toast Alert Card Twice

**Root cause:** React StrictMode in development runs `useEffect` twice (mount → unmount → mount). The `doRegisterToken()` is async. Both mount cycles call `onLogin()` → `doRegisterToken()` before either's `async` resolves. If both complete before the cleanup ref clears them, two foreground message listeners could be active briefly during a push.

**Fix:** Added `isRegisteringRef` flag in `PushNotificationManager.tsx`:
```ts
const isRegisteringRef = useRef(false);

async function doRegisterToken() {
  if (isRegisteringRef.current) return;  // ← guard
  isRegisteringRef.current = true;
  try { ... } finally { isRegisteringRef.current = false; }
}
```

Also: `pushNotification()` now returns `boolean` (true = stored, false = duplicate). The foreground handler skips the `toast.custom()` call when `pushNotification()` returns `false`, ensuring the toast is never shown for a suppressed duplicate.

---

### Bug C — Admin SMS Not Working

**Root cause:** Configuration-level issue. `sendSMS` reads `SMS_ACTIVE_PROVIDER` from `system_config`. With `bulksms` as the active provider, the BulkSMS API returns an error code (`1002` = invalid API key / `1003` = sender ID error / balance issues). The error is caught silently.

**Fix applied:** Improved the SMS error log to show the phone number being targeted:
```
[Notify] ❌ Admin SMS failed for #13 (01629615314): SMS Service err: ...error detail...
```

**To diagnose:** After next order approval, look in the API terminal for `[Notify] ❌ Admin SMS failed`. The error message will contain the BulkSMS error code. Common causes:
- `1002` = API key invalid — update key in Admin → Settings → SMS
- `1003` = Sender ID not approved — remove Sender ID from config or use approved one
- `1011` = Insufficient SMS balance — recharge the BulkSMS account

---

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/helpers/notify.js` | Skip `new_order` broadcast when auto-assigned; improved SMS error log |
| `gcp_graduatefashion_shop/components/notifications/PushNotificationManager.tsx` | `isRegisteringRef` dedup guard; toast skipped on duplicate push |
| `gcp_graduatefashion_shop/hooks/useNotificationStore.ts` | `pushNotification()` returns `boolean` |

---

## 30. V2-038 — Assignment Notification Routing Fix (2026-04-04)

### Problem

Admin receives only an email when an order is assigned to them — no SMS, no push notification.

**Root cause:** `sendAssignmentNotification()` in `controllers/order_assignment.js` was calling `sendPersonalNotification()`. This function is intended for **personal account events** (password change, role change, pool add/remove) and dispatches only email in its implementation. It is **not** wired to the full order-notification SMS + push pipeline.

### Fix

`sendAssignmentNotification()` now calls `sendAdminOrderNotification()` with a new event type `'order_assigned'`:

```js
// Before
async function sendAssignmentNotification(assignedAdminId, orderId) {
  sendPersonalNotification(null, assignedAdminId, `Order #${orderId} Assigned to You`, ...)
}

// After
async function sendAssignmentNotification(assignedAdminId, orderId) {
  sendAdminOrderNotification(null, orderId, 'order_assigned');
}
```

`sendAdminOrderNotification()` runs the full pipeline: **Email → SMS → Firebase Push**, respecting both global channel flags and per-admin notification preferences.

### New Event Type Added

Added `'order_assigned'` to the subject/bodyText builder in `sendAdminOrderNotification()`:

| Event Type | Subject | Body |
|---|---|---|
| `order_assigned` | `📋 Order #X Assigned to You — Graduate Fashion` | `Order #X has been assigned to you. Please log in to process it.` |

### Target Resolution

For `order_assigned`, `order.assigned_to_admin_id` is always set (assignment just happened), so the notification goes **only to the assigned admin** — no broadcast.

### Notification Event Table (Updated)

| Event | eventType | Triggered From |
|---|---|---|
| New order placed (unassigned) | `new_order` | `order.js`, `guest_order.js`, `admin_order.js` |
| New order placed (auto-assigned) | skipped → `order_assigned` fires | `autoAssignOrder()` |
| Order assigned to admin (auto or manual) | `order_assigned` | `sendAssignmentNotification()` |

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/controllers/order_assignment.js` | `sendAssignmentNotification` → calls `sendAdminOrderNotification('order_assigned')`; removed unused `sendPersonalNotification` import |
| `gcp_graduatefashion_api/helpers/notify.js` | Added `order_assigned` subject + bodyText cases |

---

## 31. V2-039 — Push Dedup & Permissions UI Fixes (2026-04-04)

### Fix A — Push Notification Duplicated in Both Panels (Service Worker)

**Root cause:** Firebase compat SDK `10.12.2` fires `onBackgroundMessage` in the service worker **even when a browser tab is in the foreground**. This caused:
- Frontground tab: `onForegroundMessage` → in-app toast ✅ AND simultaneously `onBackgroundMessage` → `showNotification()` OS popup + `postMessage()` → second in-app notification ❌

**Fix:** Both service workers now check `client.visibilityState === 'visible'` before calling `showNotification()`. If any tab is visible (focused), the OS notification is skipped — the foreground handler is already handling it. The `postMessage` to update bell badges always fires regardless.

```js
// onBackgroundMessage handler (both SWs)
self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
  const hasFocused = clientList.some((c) => c.visibilityState === 'visible');

  if (!hasFocused) {
    // Only show OS notification when no tab is visible
    self.registration.showNotification(title, { ... });
  }

  // Always postMessage for bell badge sync
  clientList.forEach((c) => c.postMessage({ type: 'GF_PUSH_NOTIFICATION', ... }));
});
```

**Result:**
- Tab focused → only 1 in-app toast (from `onForegroundMessage`)
- Tab minimized/background → OS system notification + bell updates on tab re-focus

| When | Before | After |
|---|---|---|
| Tab focused | OS popup + in-app toast (×2) | In-app toast only (×1) |
| Tab minimized | OS popup | OS popup |

---

### Fix B — `/permissions` System Settings Tab Shows Red Error on 403

When a non-Super-Admin opens `/permissions`, the System Permissions tab API returns `403`. Previously this rendered a red `"Failed to load permission config."` error.

**Fix:** The error state now renders a neutral info card:
> *"System-level permission configuration is only available to Super Admins. Contact your system administrator to adjust global channel settings."*

This is the correct UX — 403 is an expected access-control state, not a system failure.

---

### Fix C — Admin Notification Table: Saving One Row Resets Others

**Root cause:** The `useEffect` that syncs the `rows` state called `setRows(data.data.map(...))` — completely replacing all rows on every data refetch. When saving row A triggered a refetch, the effect ran, and all unsaved changes in rows B/C/D were lost.

**Fix:** The effect now **merges** instead of replacing. Dirty rows (user has unsaved toggles) are preserved through refetches:

```ts
useEffect(() => {
  if (!data?.data) return;
  setRows((prev) => {
    if (prev.length === 0) return data.data.map((p) => ({ ...p, dirty: false }));
    return data.data.map((p) => {
      const existing = prev.find((r) => r.admin_id === p.admin_id);
      if (existing?.dirty) return existing;  // ← keep unsaved edits
      return { ...p, dirty: false };
    });
  });
}, [data]);
```

---

### Fix D — Per-Row Save Buttons Replaced with Single "Save Changes" Button

The Admin Notifications table previously had a Save icon button on every row. This was confusing — especially combined with the row-reset bug above.

**Change:** All per-row save buttons removed. Replaced with a single **"Save Changes (N)"** button below the table.

**Behaviour:**

| State | Button |
|---|---|
| No changes | Grey disabled `"Save Changes"` |
| N rows edited | Blue active `"Save Changes (N)"` + amber text `"N rows with unsaved changes"` |
| Saving | Spinner `"Saving…"` |

- Rows with pending changes show a small **amber dot** `●` as an inline indicator
- Save fires all dirty rows **in parallel** (`Promise.all`) for speed
- Single toast: `"Permissions saved for 2 admins"` or `"Permissions saved for Sazzad"`
- `saving` state simplified from `Record<number, boolean>` to a single `boolean`

---

### Files Changed

| File | Change |
|---|---|
| `graduate_shop_admin/public/firebase-messaging-sw.js` | Skip `showNotification()` when a focused tab exists |
| `gcp_graduatefashion_shop/public/firebase-messaging-sw.js` | Same fix |
| `graduate_shop_admin/src/pages/Admins/PermissionsPage.tsx` | 403 info card; merge rows on refetch; single Save All button |

---

## 28. V2-039 — ORDER_MANAGER Contact Access & Searchable Assignment UX

### Background
ORDER_MANAGER admins were receiving push notifications for assigned contact messages and reports but could not view them in the admin panel. Additionally, manually assigning support items required memorizing numeric IDs.

### Changes

#### Backend — `gcp_graduatefashion_api/controllers/contact.js`

**`getAllContactMessages`** now allows `ORDER_MANAGER` in `ALLOWED_ROLES`:
```js
const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "READ_ONLY_ADMIN"];
```
ORDER_MANAGER scope: only returns messages where `cm.assigned_to_admin_id = adminInfo.id`.  
SUPER_ADMIN / ADMIN still sees all messages (no restriction applied).

**`getContactMessageById`** (first definition) — also updated to include `ORDER_MANAGER`.

#### Frontend — `graduate_shop_admin`

**`ReportsPage.tsx` & `ContactMessagesPage.tsx`**
- Replaced single `canManage` flag with two granular flags:
  - `canManagePool` — SUPER_ADMIN + ADMIN only (for the Distribution Pool tab)
  - `canAssign` — SUPER_ADMIN + ADMIN + ORDER_MANAGER (for the Assign tab)
- ORDER_MANAGER now sees the **Assign** tab in both pages, allowing them to reassign their own items.

**`SupportAssignTab.tsx`** — UX overhaul: **ID text field → Searchable Item Picker**
- New `items?: AssignableItem[]` prop accepts open/active items from the parent page.
- A button opens a dropdown with a search input — items are filterable by name, subject, or `#ID`.
- Each row shows the item ID, sender name, subject, and current assignee.
- Selecting an item locks it in (shown as a chip with a ×-clear button).
- If `items` is not provided, falls back to the raw numeric ID input (backwards compatible).

**`ContactMessagesPage.tsx` — `AssignContactTab`**
- Now accepts `rows: ContactMessage[]` + `rowsLoading: boolean` props.
- Filters to active rows (`status !== 0`) and maps them to `AssignableItem[]`.

**`ReportsPage.tsx` — `AssignReportsTab`**
- Now accepts `rows: Report[]` + `rowsLoading: boolean` props.
- Filters to `open | in_progress` rows and maps them to `AssignableItem[]` with current assignee name.

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/controllers/contact.js` | Added `ORDER_MANAGER` to `getAllContactMessages` and first `getContactMessageById`; scoped list to assigned-only for ORDER_MANAGER |
| `graduate_shop_admin/src/components/support/SupportAssignTab.tsx` | Replaced ID input with searchable item picker; added `items`/`itemsLoading` props |
| `graduate_shop_admin/src/pages/SupportMessages/ReportsPage.tsx` | Split `canManage` → `canManagePool` + `canAssign`; passed open rows to `AssignReportsTab` |
| `gcp_graduatefashion_api/controllers/contact.js` | Added `ORDER_MANAGER` to `getAllContactMessages` and first `getContactMessageById`; scoped list to assigned-only for ORDER_MANAGER |
| `graduate_shop_admin/src/components/support/SupportAssignTab.tsx` | Replaced ID input with searchable item picker; added `items`/`itemsLoading` props |
| `graduate_shop_admin/src/pages/SupportMessages/ReportsPage.tsx` | Split `canManage` → `canManagePool` + `canAssign`; passed open rows to `AssignReportsTab` |
| `graduate_shop_admin/src/components/website-settings/contact-messages/ContactMessagesPage.tsx` | Split `canManage` → `canManagePool` + `canAssign`; passed rows to `AssignContactTab` |

---

## 29. V2-040 — Admin Hierarchy Enforcement in Assignment Endpoints

### Hierarchy Rule
```
SUPER_ADMIN  → can assign any order/report/contact to anyone; can unassign anything
ADMIN        → can only reassign items currently assigned to themselves; cannot assign to SUPER_ADMIN or another ADMIN
ORDER_MANAGER→ cannot manually assign (no access to Assign tab's write operations)
```

### Eligible-Admin Lists (Pool UI)
Admins **can see** all members at the same and lower levels in the distribution pool (visibility for awareness).
They **cannot manipulate** peers — add/remove/edit pool agents remains SUPER_ADMIN only across all three systems.

### Changes — `controllers/order_assignment.js`

#### `assignOrder`
- Added `isSuperAdmin` flag.
- **New check:** ADMIN (`!isSuperAdmin`) can only call this if `order.assigned_to_admin_id === adminInfo.id` — mirrors `assignReport` / `assignContactMessage` behavior.
- **Tightened hierarchy check:** ADMIN cannot assign to `SUPER_ADMIN` **or** `ADMIN` (previously only blocked SUPER_ADMIN target).

#### `unassignOrder`
- Changed from `SUPER_ADMIN + ADMIN` to **SUPER_ADMIN only** — consistent with `unassignReport` and `unassignContactMessage`.

### No Changes Needed
- `assignReport` and `assignContactMessage` already had the "own items only" restriction and the SUPER_ADMIN target block.
- `getEligibleAdmins`, `getReportEligibleAdmins`, `getContactEligibleAdmins` — ADMINs see peers in the list (read-only awareness); no manipulation access (already enforced by SUPER_ADMIN-only add/remove guards).

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/controllers/order_assignment.js` | `assignOrder`: ADMIN restricted to own orders + cannot target ADMIN/SUPER_ADMIN; `unassignOrder`: restricted to SUPER_ADMIN only |

---

## V2-040 — Notification History Full Repair

**Date:** 2026-04-05
**Summary:** Complete end-to-end repair of the notification logging pipeline. Every system-generated notification is now recorded in `notification_histories` with correct column mappings, accurate category values, and per-recipient granularity.

---

### Root Causes Fixed

| Problem | Fix |
|---|---|
| `logNotification` used legacy column names that don't exist in the actual schema | Rewritten with all correct column names (`recipient_email`, `recipient_phone`, `recipient_admin_id`, `recipient_user_id`, etc.) |
| `notify.js` dispatchers had no calls to `logNotification` | Injected `logNotification` call with try/finally into every send path |
| `contact.js` reply had no logging | Added try/finally logging around email and SMS reply sends |
| `report.js` reply had no logging | Added try/finally logging around email, SMS, and push reply sends |
| `notification_histories.category` enum lacked admin categories | DB migrated via V2-040 `ALTER TABLE` |
| Frontend used wrong field names (`r.to`, `r.message`) | Complete page rewrite with correct field names |
| No unified log endpoint | New `GET /admin/notifications/logs` endpoint added |

---

### DB Migration

```sql
-- V2-040
ALTER TABLE notification_histories
  MODIFY COLUMN category
  ENUM(
    'order_status', 'order_admin',
    'forgot_password', 'welcome', 'announcement',
    'contact_reply', 'contact_admin',
    'report_admin', 'report_reply',
    'personal', 'otp', 'system', 'other'
  ) NOT NULL DEFAULT 'other';
```

---

### New Category Taxonomy

| Category | Used When |
|---|---|
| `order_status` | Customer notified of order status change (Email/SMS/Push) |
| `order_admin` | Admin notified of new/assigned order (Email/SMS/Push) |
| `contact_admin` | Admin notified of assigned contact message |
| `contact_reply` | Customer receives reply to their contact query |
| `report_admin` | Admin notified of assigned report |
| `report_reply` | Customer receives reply to their report |
| `personal` | Admin personal notification (manual or system-generated) |
| `announcement` | Bulk announcement to subscribers/users |
| `forgot_password` | Password reset email |
| `welcome` | Welcome email on registration |
| `otp` | OTP delivery |
| `system` | Internal system notifications |
| `other` | Fallback default |

---

### New API Endpoint

#### `GET /admin/notifications/logs` *(NEW)*

Unified filterable notification history. Replaces the 3 channel-specific endpoints for audit purposes.

**Auth:** `SUPER_ADMIN` or `ADMIN`

**Query parameters:**

| Param | Type | Description |
|---|---|---|
| `channel` | string | `email` \| `sms` \| `push` |
| `category` | string | Single or comma-separated enum values |
| `recipient_type` | string | `user` \| `admin` \| `subscriber` \| `guest` \| `manual` \| `other` |
| `status` | string | `queued` \| `sent` \| `failed` \| `delivered` \| `read` \| `cancelled` |
| `batch_id` | int | Filter logs belonging to a batch |
| `search` | string | Full-text search on email, phone, title, message |
| `date_from` | string | `YYYY-MM-DD` |
| `date_to` | string | `YYYY-MM-DD` |
| `limit` | int | Default 50 |
| `offset` | int | Default 0 |

**Response:**
```json
{
  "success": true,
  "total": 1234,
  "data": [
    {
      "id": 5,
      "batch_id": null,
      "channel": "email",
      "category": "order_status",
      "recipient_type": "user",
      "recipient_user_id": 42,
      "recipient_email": "customer@example.com",
      "title": "✅ Order Approved!",
      "message": "Your order #101 has been approved...",
      "status": "sent",
      "error_message": null,
      "related_order_id": 101,
      "sent_at": "2026-04-05T10:30:00Z",
      "created_at": "2026-04-05T10:30:00Z",
      "recipient_admin_name": null,
      "recipient_user_name": "Arif Rahman"
    }
  ]
}
```

---

### Updated Endpoints

#### `GET /admin/notifications/batches` *(updated)*
Now returns enriched columns: `announcement_headline`, `initiated_by_admin_name`, `total_target`, `total_sent`, `total_failed`, `status`, `source_type`.

#### `GET /admin/notifications/email-logs`, `sms-logs`, `push-logs` *(kept, updated)*
Internal queries now use correct column names. Support same filter params as unified endpoint.

---

### Helper Functions Exported from `notification_history.js`

#### `logNotification(connection, opts)` — *repaired*

Insert one row into `notification_histories`. Never throws (errors are swallowed to protect caller flow). Returns `insertId` or `null` on failure.

#### `createNotificationBatch(connection, opts)` — *new*

Insert a row into `notification_batches` and return the `id`. Used by announcement dispatchers.

#### `finalizeNotificationBatch(connection, batchId, totalSent, totalFailed)` — *new*

Update batch row with final send/fail counts and set `status` + `finished_at`.

---

### Files Changed

| File | Change |
|---|---|
| `controllers/notification_history.js` | Complete rewrite — correct column names, new unified endpoint, batch helpers |
| `helpers/notify.js` | Added lazy-loaded `getLogger()`, injected `logNotification` into all 5 dispatchers (order_admin Email+SMS+Push, order_status Email+SMS+Push, personal Email+SMS+Push, contact_admin Email+SMS+Push, report_admin Email+SMS+Push) |
| `controllers/contact.js` | Added `logNotification` import; wrapped email and SMS reply sends in try/finally with logging (category: `contact_reply`) |
| `controllers/report.js` | Added `logNotification` import; wrapped email/SMS/push reply sends in try/finally with logging (category: `report_reply`) |
| `index.js` | Added `getNotificationLogs` import; registered `GET /admin/notifications/logs` route |
| `scripts/updatequerylist.sql` | Appended V2-040 migration block |
| `scripts/v2.sql` | Added `notification_batches` and `notification_histories` table DDL with V2-040 category enum |
| `graduate_shop_admin/src/api/notification-history.api.ts` | Full rewrite with correct TypeScript types and `getNotificationLogs` function |
| `graduate_shop_admin/src/hooks/useNotificationHistory.ts` | Full rewrite with `useNotificationLogs` and correct typed hooks |
| `graduate_shop_admin/src/pages/BusinessSettings/NotificationHistoryPage.tsx` | Complete redesign — two functional tabs: unified Logs (with Channel/Category/Status/Date/Search filters, pagination) and Announcement Batches (with success rate progress bars) |

---

## 28. V2-041 — Push Notification Deep-Link Navigation

> **Frontend only.** No API or DB changes.  
> **Date:** 2026-04-06  
> **Scope:** Admin Panel (`graduate_shop_admin`)

### Problem
When an admin received a push notification (OS system notification or bell dropdown item) for an order/report/contact message assignment, clicking it:
- Showed the right page but **did not open the specific item** (order detail modal, report detail panel, contact message).
- Order links in the bell dropdown pointed to `/orders/:id` which **is a broken route** (correct route is `/all-orders`).
- Clicking an OS push notification in a **different browser window** did nothing (Chrome's `client.navigate()` is unreliable cross-window).

### Solution

#### 1. Service Worker (`public/firebase-messaging-sw.js`)
- `notificationclick` now builds a target path from `data.order_id` / `data.report_id` / `data.message_id`.
- Uses **focus + postMessage(`GF_NAVIGATE`)** instead of `client.navigate()` — reliable across windows.
- If no admin tab exists, opens a new window with the full absolute URL.
- Notification `tag` field now covers all entity types (`order-X`, `report-X`, `message-X`) not just orders.

#### 2. PushNotificationProvider (`src/providers/PushNotificationProvider.tsx`)
- Handles new `GF_NAVIGATE` SW message type.
- Uses `navigateRef` (always-current React Router `navigate` ref) to avoid stale closure in the mount-only SW listener.
- Foreground in-app toast is now **clickable** — navigates to the entity deep-link and dismisses the toast.
- Added `buildDeepLinkPath()` helper.

#### 3. NotificationDropdown (`src/components/header/NotificationDropdown.tsx`)
- Fixed broken `/orders/:id` link → `/all-orders?orderId=X`.
- Report items → `/support-reports?reportId=X`.
- Contact items (push + unread list) → `/contact-page?messageId=X`.

#### 4. AllOrdersView + OrdersTable
- `AllOrdersView` reads `?orderId` URL param via `useSearchParams`, passes it as `defaultOpenOrderId` to `OrdersTable`.
- `OrdersTable` auto-opens the `OrderInfoModal` for the target order when rows load. Uses a `consumedRef` to prevent re-opening on re-renders. Clears the URL param via `replace: true` after modal opens.

#### 5. ReportsPage (`src/pages/SupportMessages/ReportsPage.tsx`)
- Reads `?reportId` URL param and auto-selects that report in the split-pane detail panel when rows arrive.
- Clears the URL param after selection.

#### 6. ContactMessagesPage (`src/components/website-settings/contact-messages/ContactMessagesPage.tsx`)
- Reads `?messageId` URL param and auto-selects that message when rows arrive.
- Clears the URL param after selection.

### Deep-Link URL Scheme

| Entity | URL |
|--------|-----|
| Order #123 | `/all-orders?orderId=123` |
| Report #456 | `/support-reports?reportId=456` |
| Contact Message #789 | `/contact-page?messageId=789` |

### Files Changed (Frontend Only)

| File | Change |
|---|---|
| `public/firebase-messaging-sw.js` | Use focus+postMessage(GF_NAVIGATE) on notificationclick; absolute URL fallback; fix notification tag |
| `src/providers/PushNotificationProvider.tsx` | Handle GF_NAVIGATE; navigateRef for stale-closure safety; clickable foreground toast |
| `src/components/header/NotificationDropdown.tsx` | Fix broken order link; add entity IDs to all deep-link URLs |
| `src/components/orders/all-orders/AllOrdersView.tsx` | Read ?orderId param; pass to OrdersTable |
| `src/components/orders/all-orders/OrdersTable.tsx` | Accept defaultOpenOrderId prop; auto-open modal via useEffect |
| `src/pages/SupportMessages/ReportsPage.tsx` | Read ?reportId param; auto-select report in detail panel |
| `src/components/website-settings/contact-messages/ContactMessagesPage.tsx` | Read ?messageId param; auto-select message in detail panel |

---

## 29. V2-042 — Audit Log Fix for Report & Contact Distribution Actions

> **Date:** 2026-04-06  
> **Scope:** Backend (`gcp_graduatefashion_api`) — `controllers/report.js`, `controllers/contact.js`, DB migration V2-041

### Problem
Admin actions related to the **report distribution pool**, **contact distribution pool**, and **report/contact reply, assign, unassign** were never writing rows to `admin_audit_logs`. Additionally:
- The `audit_actions` lookup table had no entries for any report or contact distribution action keys, so even the existing `admin_audit_logs` rows from `order_assignment.js` could appear unrecognised in the admin audit log page UI.
- User actions (submitting a report or contact message by a logged-in user) were not tracked in `user_audit_logs`.

### Root Cause
`report.js` and `contact.js` were written without `admin_audit_logs` / `user_audit_logs` inserts, and no V2-{n} migration ever registered those action keys in `audit_actions`.

### Fix

#### DB Migration — V2-041 (`updatequerylist.sql`)
Inserted 18 new `audit_actions` rows (all with `INSERT IGNORE`):

| action_key | display_name |
|---|---|
| `REPLY_REPORT` | Reply to Report |
| `ASSIGN_REPORT` | Assign Report |
| `UNASSIGN_REPORT` | Unassign Report |
| `UPDATE_REPORT_STATUS` | Update Report Status |
| `DELETE_REPORT` | Delete Report |
| `UPDATE_REPORT_DISTRIBUTION_SETTINGS` | Update Report Distribution Settings |
| `ADD_REPORT_DISTRIBUTION_AGENT` | Add Report Distribution Agent |
| `EDIT_REPORT_DISTRIBUTION_AGENT` | Edit Report Distribution Agent |
| `REMOVE_REPORT_DISTRIBUTION_AGENT` | Remove Report Distribution Agent |
| `REDISTRIBUTE_REPORTS` | Redistribute Reports |
| `REPLY_CONTACT_MESSAGE` | Reply to Contact Message |
| `ASSIGN_CONTACT_MESSAGE` | Assign Contact Message |
| `UNASSIGN_CONTACT_MESSAGE` | Unassign Contact Message |
| `UPDATE_CONTACT_DISTRIBUTION_SETTINGS` | Update Contact Distribution Settings |
| `ADD_CONTACT_DISTRIBUTION_AGENT` | Add Contact Distribution Agent |
| `EDIT_CONTACT_DISTRIBUTION_AGENT` | Edit Contact Distribution Agent |
| `REMOVE_CONTACT_DISTRIBUTION_AGENT` | Remove Contact Distribution Agent |
| `REDISTRIBUTE_CONTACT_MESSAGES` | Redistribute Contact Messages |

Inserted 2 new `user_audit_actions` rows:

| action_key | category |
|---|---|
| `SUBMIT_REPORT` | SUPPORT |
| `SUBMIT_CONTACT_MESSAGE` | SUPPORT |

#### Backend Changes

**`controllers/report.js`**
- `createReport` — adds `user_audit_logs` insert (`SUBMIT_REPORT`) when `user_id` is present.
- `adminReplyReport` — adds `admin_audit_logs` insert (`REPLY_REPORT`) after saving reply.
- `adminAssignReport` — adds `admin_audit_logs` insert (`ASSIGN_REPORT`).
- `adminUpdateReportStatus` — adds `admin_audit_logs` insert (`UPDATE_REPORT_STATUS`).
- `adminDeleteReport` — adds `admin_audit_logs` insert (`DELETE_REPORT`).
- `updateReportDistributionSettings` — adds `admin_audit_logs` insert (`UPDATE_REPORT_DISTRIBUTION_SETTINGS`).
- `upsertReportAgent` — adds `admin_audit_logs` insert (`ADD_REPORT_DISTRIBUTION_AGENT` or `EDIT_REPORT_DISTRIBUTION_AGENT`).
- `removeReportAgent` — adds `admin_audit_logs` insert (`REMOVE_REPORT_DISTRIBUTION_AGENT`).
- `redistributeReports` — adds `admin_audit_logs` insert (`REDISTRIBUTE_REPORTS`).
- `assignReport` — adds `admin_audit_logs` insert (`ASSIGN_REPORT`).
- `unassignReport` — adds `admin_audit_logs` insert (`UNASSIGN_REPORT`).

**`controllers/contact.js`**
- `createContactMessage` — adds `user_audit_logs` insert (`SUBMIT_CONTACT_MESSAGE`) when `user_id` is present.
- `replyToContactMessage` — adds `admin_audit_logs` insert (`REPLY_CONTACT_MESSAGE`).
- `assignContactMessage` — adds `admin_audit_logs` insert (`ASSIGN_CONTACT_MESSAGE`).
- `updateContactDistributionSettings` — adds `admin_audit_logs` insert (`UPDATE_CONTACT_DISTRIBUTION_SETTINGS`).
- `upsertContactAgent` — adds `admin_audit_logs` insert (`ADD_CONTACT_DISTRIBUTION_AGENT` or `EDIT_CONTACT_DISTRIBUTION_AGENT`).
- `removeContactAgent` — adds `admin_audit_logs` insert (`REMOVE_CONTACT_DISTRIBUTION_AGENT`).
- `redistributeContactMessages` — adds `admin_audit_logs` insert (`REDISTRIBUTE_CONTACT_MESSAGES`).
- `assignContactMessageManual` — adds `admin_audit_logs` insert (`ASSIGN_CONTACT_MESSAGE`).
- `unassignContactMessage` — adds `admin_audit_logs` insert (`UNASSIGN_CONTACT_MESSAGE`).

> All audit log INSERTs use `.catch()` to prevent audit failures from breaking the main request flow.

### Migration Script
One-time script at `scripts/run-v2-041.js` — safe to re-run (uses `INSERT IGNORE`).

---

## 42. V2-042 — Enforcing Order Placement Permissions

### Overview

Previously the `order_place_permission` section in `permission_config` was **stored but never enforced** in the backend. This change wires those permission flags into the three order placement controllers so that admin-configured requirements are validated at order creation time.

---

### New File: `helpers/orderPermission.js`

A reusable validation module with three exported functions:

#### `validateRegularOrderPermission(connection, user, address)`
Enforces `order_place_permission.regular.*` for authenticated shop orders (`POST /api/v1/order/create`).

| Config key | Type | Default | Behaviour |
|---|---|---|---|
| `email_verified` | bool | `true` | Rejects if user email is not verified |
| `phone_verified_mode` | enum | `both` | Controls which phone(s) must be verified |

**`phone_verified_mode` values:**
| Value | What is checked |
|---|---|
| `no_phone_verification_needed` | No phone check |
| `address_phone_verified` | The phone on the selected address must be verified |
| `default_phone_verified` | The user's `is_fully_verified` (default phone) must be set |
| `both` | Both address phone AND default phone must be verified |

#### `validateGuestOrderPermission(connection, guestData)`
Enforces `order_place_permission.guest.*` for guest checkout (`POST /api/v1/guest-order/:id/place`).

| Config key | Type | Default | Behaviour |
|---|---|---|---|
| `is_email_required` | bool | `true` | Rejects if email is missing |
| `is_email_verification_required` | bool | `false` | Rejects if email is not verified (depends on `is_email_required=true`) |
| `is_phone_verification_required` | bool | `true` | Rejects if `is_phone_verified=0` on the guest_orders record |

#### `validateAdminManualOrderPermission(connection, customer, address)`
Enforces `order_place_permission.admin_manual.*` for manually created admin orders (`POST /api/v1/admin/order/create`).

| Config key | Type | Default | Behaviour |
|---|---|---|---|
| `email_verified` | bool | `false` | Rejects if customer's email is not verified |
| `phone_verified_mode` | enum | `no_phone_verification_needed` | Same values as `regular` scope |

---

### Controller Changes

#### `controllers/order.js` — Regular Checkout
- **Removed:** hardcoded `if (user.isFullyVerified !== 1) throw UNVERIFIED_PHONE()`
- **Added:** `await validateRegularOrderPermission(connection, user, address)` after address is loaded

#### `controllers/guest_order.js` — Guest Checkout (`placeGuestOrder`)
- **Removed:** commented-out `if (!is_phone_verified)` check
- **Added:** `await validateGuestOrderPermission(connection, updatedGuestData)` after basic field validation

#### `controllers/admin_order.js` — Manual Order (`createManualOrder`)
- **Added** `is_email_verified` to the customer SELECT query
- **Removed:** commented-out `if (!address.phone_verified)` check
- **Added:** `await validateAdminManualOrderPermission(connection, customer, address)` after address is loaded

---

### No DB Schema Changes

This feature relies entirely on the existing `permission_config` table with the `order_place_permission` section already seeded by `ensurePermissionDefaults()`. No migration is needed.

---

Changes take effect immediately on the next order placement attempt (the permission config is read live from the DB, cached in memory but flushed on update via `clearPermissionCache()`).

---

## 43. V2-043 — Wire Admin-Created Manual Order Placement Permissions

### Overview
Wired the backend `admin_manual` order placement permission requirements to the frontend `/new-sale` Admin Panel page. Previously, the backend silently rejected manual orders that failed verification checks. Now, the frontend dynamically reads the `permission_config` and selected customer/address data to explicitly show which checks pass/fail and provides actionable feedback on how to resolve the issue directly in the UI.

### Backend Changes

**`controllers/admin.js`**
Enriched the address output in `adminGetUserById` and `adminGetUsers` by adding a `LEFT JOIN` on `user_phones` to determine `phone_verified` per address row.

### Frontend Changes

**`graduate_shop_admin/src/api/admin-users.api.ts`**
- Updated `AdminUserAddress` entity to include `phone_verified: boolean | null`.

**`graduate_shop_admin/src/components/sales/BillingPanel.tsx`**
- Injected `AdminManualVerificationPanel`. 
- Pre-flights the user against `order_place_permission.admin_manual` rules (`email_verified` and `phone_verified_mode`).
- Displays ✅, ❌, or ⬜ status badges alongside actionable descriptions that deep-link to the Settings → Permissions panel when a rule fails.
- Renders an inline warning when placement requires are not fully met (e.g., "The phone number on the selected address is not verified").

### DB Schema Changes
- None needed. The feature builds upon the existing `permission_config` setup from V2-042 and solely leverages query enrichment.

---

## 29. V2-045 — Fix `updateOrderItems` Grand Total Corruption

**Date:** 2026-04-09  
**File:** `controllers/order.js` — `exports.updateOrderItems`

### Bug Description

The `updateOrderItems` endpoint (admin order item editor) used a **broken formula** to recalculate `grand_total` after an admin edits order items. Two compounding errors:

1. **Double-subtracted SKU discounts** — The recalculated `subtotal` was already net of SKU discounts (`selling_price - discount` × `qty`), but the formula subtracted the full `discount_total` column (which includes `sku_discount_total` again), causing a second deduction.

2. **Ignored bulk/combo/cart-wide discounts** — The formula did not subtract `bulk_discount_total`, `combo_discount_total`, or `cart_wide_discount` at all, so these stored discount amounts vanished on edit.

**Impact:** 7 orders found corrupted in production DB. Every future admin order edit would have corrupted the `grand_total`.

### Fix Applied

**Before (broken — line 5150):**
```js
newGrandTotal = subtotal + dc - dt + newWeightExtraCharge;
```

**After (correct):**
```js
const couponDiscount     = discount_total - sku_discount_total;
const bulkDiscountStored = bulk_discount_total;
const comboDiscountStored = combo_discount_total;
const cartWideDiscStored = cart_wide_discount;

newGrandTotal = Number(
  (subtotal - couponDiscount - bulkDiscountStored - comboDiscountStored - cartWideDiscStored + dc + newWeightExtraCharge).toFixed(2)
);
```

The query was also updated to fetch `sku_discount_total`, `bulk_discount_total`, `combo_discount_total`, and `cart_wide_discount` from the `orders` table. The UPDATE statement now also syncs `due_amount`.

### Data Repair

A one-time repair script (`scripts/repair_orders.js`) was run to fix 7 corrupted orders by recalculating their `grand_total` and `due_amount` using the correct formula.

### DB Schema Changes
- None. Uses existing columns.

---

## 30. V2-046 — Admin Manual Order Calculation Parity Fix

**Date:** 2026-04-09  
**Files changed:**
- `gcp_graduatefashion_api/controllers/admin_order.js`
- `graduate_shop_admin/src/components/orders/all-orders/types.ts`
- `graduate_shop_admin/src/components/orders/all-orders/AllOrdersView.tsx`
- `graduate_shop_admin/src/components/ui/modal/OrderInfoModal.tsx`

### Problem

Five calculation bugs caused `grand_total` to differ between shop checkout and admin manual order creation (`createManualOrder` + `createManualOrderForStranger`). The `OrderInfoModal` also had a missing **Weight Surcharge** row which made the visual breakdown not add up.

### Bugs Fixed

| # | Bug | Old Code | New Code |
|---|-----|----------|----------|
| 1 | Variation query used product-level `free_delivery` only | `p.free_delivery` | `COALESCE(s.free_delivery, p.free_delivery)` |
| 2 | Mixed free+paid delivery carts were blocked | `throw BAD_REQUEST("Cannot mix...")` | Removed — matches shop checkout |
| 3 | Weight surcharge billed ALL items (incl. free-delivery) | `itemsWithVariations.reduce(...)` | Only paid-delivery items; free-delivery items excluded |
| 4 | Weight surcharge formula wrong when `freeWeightKg = 0` | `weightFreeKg > 0 ? ... : totalWeightKg` | `Math.max(0, paidWeightKg - freeWeightKg)` always |
| 5 | Bulk/combo rule-granted `effective_free_delivery` ignored | Not applied | `allEffFree` logic applied before computing delivery + weight |

### Grand Total Formula (now identical to shop checkout)

```
grandTotal = subtotal
           - discountTotal          (sku_discount + coupon_discount)
           - bulkDiscountTotal
           - comboDiscountTotal
           - cartWideDiscount
           + effectiveDeliveryAmount (0 if allEffFree)
           + weightExtraCharge      (0 if allEffFree; only paid-delivery item weight)
```

### Frontend — OrderInfoModal

- Added `weightKgTotal` and `weightExtraCharge` to `OrderRow` type
- Mapped `o.weight_kg_total` and `o.weight_extra_charge` from API in `AllOrdersView.tsx`
- Added a **+Weight Surcharge (X.XX kg)** row to the order detail modal, shown in orange, between Shipping Cost and Amount Due. This makes the visual breakdown match the stored `grand_total` exactly.

### DB Schema Changes
- None. Uses existing columns (`weight_kg_total`, `weight_extra_charge`).

---

## 31. V2-047 — Regular Checkout Default Phone Verification Source Fix

**Date:** 2026-04-10  
**File:** `helpers/orderPermission.js`

### Problem
For regular authenticated checkout, when `order_place_permission.regular.phone_verified_mode` included `default_phone_verified`, backend validation was using `users.is_fully_verified`.  
This could pass even when the current `users.default_phone_id` phone record itself was unverified.

### Fix Applied
- Added a direct lookup to `user_phones` for the logged-in user:
  - `SELECT id, is_verified FROM user_phones WHERE id = users.default_phone_id AND user_id = users.id`
- `default_phone_verified` now passes only when that exact default phone row has `is_verified = 1`.

### Behavior Impact
- Regular checkout now correctly enforces verification on the **actual default phone**.
- No route changes.
- No DB schema changes.

---

## 31. V2-047 — Category Image Compression (saveCategoryImage + Backfill)

### Problem
Category images were being saved at their original upload size (often 1–1.6 MB each) because the auto-shrink logic was removed at a client's request. With large image counts this significantly slowed page load.

### Changes

#### `helpers/img.js`
- Added new **`saveCategoryImage(tempFilePath, folderPath, width?, height?, quality?)`** export.
  - Shrinks to `CATEGORY_WIDTH × CATEGORY_HEIGHT` (default **400 × 400**) with `fit: cover`.
  - Converts to **WebP** at `CATEGORY_QUALITY` (default **80**).
  - Uses the same `storage.saveBuffer` adapter so it works for both `local` and `gcs` drivers.
  - `withoutEnlargement: true` — small images are not upscaled.
- Updated the top-level destructure import to include `category_height`, `category_quality`, `category_width` from `ApplicationSettings`.

#### `controllers/categories.js`
- Swapped `saveProductImage` → **`saveCategoryImage`** for all 6 category image save calls:
  - `createMainCategory`, `updateMainCategory`
  - `createSubCategory`, `updateSubCategory`
  - `createChildCategory`, `updateChildCategory`
- Removed the now-unused `ApplicationSettings` import (settings are read inside `saveCategoryImage`).

#### `scripts/backfill-category-images.js` _(new file)_
One-off backfill to shrink existing oversized category images on disk / GCS **without changing any DB paths**.

```
# All categories (skip files already ≤ 200 kB)
node scripts/backfill-category-images.js

# Force re-compress everything
node scripts/backfill-category-images.js --force

# Only a specific tier
node scripts/backfill-category-images.js --type main
node scripts/backfill-category-images.js --type sub
node scripts/backfill-category-images.js --type child
```

**Environment variables honoured:**
| Variable | Default | Purpose |
|---|---|---|
| `CATEGORY_WIDTH` | 400 | Output pixel width |
| `CATEGORY_HEIGHT` | 400 | Output pixel height |
| `CATEGORY_QUALITY` | 80 | WebP quality (0–100) |
| `CAT_BACKFILL_THRESHOLD` | 200000 | Skip files (bytes) smaller than this when not `--force` |
| `STORAGE_DRIVER` | local | `local` or `gcs` |

### DB Schema
No changes.

### Behavior Impact
- New category images uploaded going forward are automatically resized & compressed to WebP.
- Backfill script overwrites existing files in-place (no DB migration needed).

---

## 32. V2-036 / V2-037 — Mega Sale: Product-Level Enrollment + SKU Overrides

**Date:** 2026-04-18

### Summary
V2-036 migrated Mega Sale from `permission_config` to dedicated tables. V2-037 restructures from SKU-level to product-level enrollment, adds SKU override table, removes `default_end_at`, and provides a browsable product list in the admin panel.

### Tables (V2-037)

#### `mega_sale_settings` (singleton)
| Column | Type | Description |
|---|---|---|
| `id` | TINYINT UNSIGNED (=1) | Singleton enforced by CHECK |
| `is_active` | TINYINT(1) | Master toggle |
| `campaign_end_at` | DATETIME NULL | Global countdown (banner + fallback for products) |
| `updated_by_admin` | INT NULL | FK → admins |
| `created_at/updated_at` | TIMESTAMP | Audit |

#### `mega_sale_products` (per-product)
| Column | Type | Description |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `product_id` | INT | FK → products (UNIQUE) |
| `is_active` | TINYINT(1) | Per-product toggle |
| `end_at` | DATETIME NULL | Per-product timer override (NULL = inherit `campaign_end_at`) |
| `serial` | INT | Display order |

#### `mega_sale_sku_overrides` (per-SKU exceptions)
| Column | Type | Description |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `mega_sale_product_id` | BIGINT UNSIGNED | FK → mega_sale_products |
| `product_sku_id` | INT | FK → product_skus (UNIQUE) |
| `is_excluded` | TINYINT(1) | 1 = SKU excluded from mega sale |
| `end_at` | DATETIME NULL | Per-SKU timer override (NULL = inherit from product) |

### Timer Inheritance
```
SKU override end_at → Product end_at → Campaign end_at (global)
```

### Admin Endpoints (auth: SUPER_ADMIN)

#### Get Settings + Enrolled Products
```
GET /api/v1/admin/megasale/settings
```

#### Update Settings
```
PUT /api/v1/admin/megasale/settings
{ "is_active": true, "campaign_end_at": "2026-05-01T23:59:59" }
```

#### Browsable Products List
```
GET /api/v1/admin/megasale/products?page=1&limit=20&search=shirt&enrolled=yes
```
Returns all active products with mega sale enrollment status (LEFT JOIN).

#### Add Product to Mega Sale
```
POST /api/v1/admin/megasale/product
{ "product_id": 123, "end_at": "2026-05-15T12:00:00" }
```
All SKUs inherit enrollment by default.

#### Update Product Entry
```
PUT /api/v1/admin/megasale/product/:id
{ "is_active": false, "end_at": "...", "serial": 5 }
```

#### Remove Product from Mega Sale
```
DELETE /api/v1/admin/megasale/product/:id
```
Cascades to delete SKU overrides.

#### Get SKU Overrides for a Product
```
GET /api/v1/admin/megasale/product/:id/skus
```
Returns all SKUs with override status (excluded, timer).

#### Set SKU Override (exclude/timer)
```
PUT /api/v1/admin/megasale/product/:megaSaleProductId/sku/:skuId
{ "is_excluded": true, "end_at": null }
```
Upserts. Pass `is_excluded: true` to exclude a SKU from mega sale.

#### Delete SKU Override (reset to inherit)
```
DELETE /api/v1/admin/megasale/sku-override/:skuId
```

### Public Endpoint

#### Get Storefront Visibility (Mega Sale)
```
GET /api/v1/user/storefront-visibility?page=1&limit=20&search=shirt&stock_filter=in_stock&sort_by=price_asc
```
Joins through products→SKUs, respects `is_excluded` overrides, resolves timers with inheritance.

### Migration
- Script: `scripts/updatequerylist.sql` → V2-036 + V2-037
- Schema: `scripts/v2.sql` → updated table definitions
- V2-037 migrates V2-036 SKU-level data to product-level (GROUP BY product_id)

### Frontend Changes
- **Admin Panel:** Mega Sale tab redesigned with product-level enrollment, browsable product list (Enrolled/All Products tabs), expandable variation rows with per-SKU include/exclude toggles
- **Shop Panel:** Timer fallback updated (removed `default_end_at`, uses `campaign_end_at` only)

---

## 32. V2-049 — Report Image Attachments

> **Date:** 2026-04-21
> **Precondition:** V2-036 (Report System) must be applied.

### Summary
Adds image attachment support to the Report System:
- **Users** can attach up to 4 images when submitting a report (shop panel).
- **Admins** can attach up to 4 images when replying to a report (admin panel).
- Reply emails include attached images as inline CID images.
- The "Track Report" view in the shop panel displays report-level and reply-level images.

### Database
New table `report_images`:

| Column | Type | Description |
|---|---|---|
| `id` | INT UNSIGNED AUTO_INCREMENT | Primary key |
| `report_id` | BIGINT UNSIGNED | FK → `reports(id)` ON DELETE CASCADE |
| `reply_id` | BIGINT UNSIGNED NULL | FK → `report_replies(id)` ON DELETE CASCADE. NULL = report-level image |
| `image_path` | VARCHAR(500) | Relative path to stored image (e.g. `/uploads/reports/5/report_17...webp`) |
| `serial` | TINYINT UNSIGNED DEFAULT 1 | Display order |
| `created_at` | TIMESTAMP | Auto-set on insert |

### Image Processing
- **Function:** `saveReportImage()` in `helpers/img.js`
- **Dimensions:** Configurable via env vars, defaults: 800×800 `fit:inside` (preserves aspect ratio)
- **Format:** WebP, quality 70 (configurable via `REPORT_IMAGE_QUALITY`)
- **Storage:** `uploads/reports/<report_id>/`

### Configuration (`ApplicationSettings.js`)
```
REPORT_IMAGE_WIDTH   = 800   (env: REPORT_IMAGE_WIDTH)
REPORT_IMAGE_HEIGHT  = 800   (env: REPORT_IMAGE_HEIGHT)
REPORT_IMAGE_QUALITY = 70    (env: REPORT_IMAGE_QUALITY)
```

### API Changes

#### POST /api/v1/report (Submit Report)
**Content-Type changed:** `application/json` → `multipart/form-data`
- All existing text fields sent as form fields (unchanged)
- New optional field: `report_images` (up to 4 image files)

#### GET /api/v1/report/track?token=...
**Response additions:**
```json
{
  "data": {
    "images": ["/uploads/reports/1/report_17...webp"],
    "replies": [
      {
        "text": "...",
        "via": "email",
        "sent_at": "...",
        "images": ["/uploads/reports/1/report_17...webp"]
      }
    ]
  }
}
```

#### GET /api/v1/admin/reports/:id
**Response additions:**
```json
{
  "data": {
    "images": ["/uploads/reports/1/report_17...webp"],
    "replies": [
      {
        "images": ["/uploads/reports/1/report_17...webp"]
      }
    ]
  }
}
```

#### POST /api/v1/admin/reports/:id/reply
**Content-Type changed:** `application/json` → `multipart/form-data`
- `reply_text` and `via` sent as form fields (unchanged)
- New optional field: `report_images` (up to 4 image files)
- Reply emails now include attached images as inline CID images

### Migration
- Script: `scripts/updatequerylist.sql` → V2-049
- Schema: `scripts/v2.sql` → report_images table
- One-time migration: `scripts/migrate_report_images.js`

### Frontend Changes
- **Shop Panel:** Submit report form now has image picker (up to 4). Track report view shows report + reply images as clickable thumbnails.
- **Admin Panel:** Report detail view shows report + reply images. Reply form includes image attachment picker (up to 4).

---

## 32. V2-051 — Comment-Only Reviews (No Purchase Required)

### Overview
Customers can now leave **text-only comments/questions** on any product without purchasing it. Star ratings still require a delivered order (one rated review per order item).

### Changes

#### `POST /user/review`
- `rating` and `order_item_id` are now **optional**.
- **With `rating` + `order_item_id`:** Full rated review — purchase verification enforced (existing behavior).
- **Without `rating`:** Comment-only — just needs auth. One comment per product per user.
- `review_text` is **required** for comment-only submissions.

#### `GET /user/product/:product_id/reviews`
- Star breakdown now filters `rating IS NOT NULL` only.
- Review listing uses `LEFT JOIN order_items` so comment-only reviews (no order item) appear in results.
- Comment-only reviews have `rating: null`, `purchased_product_name: null`.

#### Database Migration
```sql
ALTER TABLE product_reviews
  MODIFY COLUMN order_id      BIGINT UNSIGNED NULL DEFAULT NULL,
  MODIFY COLUMN order_item_id BIGINT UNSIGNED NULL DEFAULT NULL,
  MODIFY COLUMN rating        TINYINT UNSIGNED NULL DEFAULT NULL;
```
- Migration script: `scripts/migrate_v2_051_comment_reviews.js`

#### Frontend
- `WriteReviewModal` detects eligible items. If none → shows comment-only form (no stars, blue "Comment Mode" banner).
- `ReviewSection` renders comment-only entries with a blue "Comment" badge instead of green "Verified Purchase".
- `avg_rating` and `review_count` on product cards only count rated reviews.

---

### V2-052: Order Event Version — Admin Polling Optimization

#### Problem
The admin panel fired 13+ `GET /admin/orders?...` queries every 30 seconds to simulate real-time updates (1 per status tab, 1 summary, 1 main list). Each query hit the DB even when nothing changed.

#### Solution
An in-memory monotonic counter (`orderEventVersion`) is incremented on every order-mutating event. The admin panel polls a single lightweight endpoint every 10s and only refreshes the heavy queries when the version changes.

#### New Endpoint
```
GET /api/v1/admin/orders/event-version
→ { "version": 42 }
```
- Returns an opaque, monotonically increasing integer.
- Zero-cost: no database queries, pure memory read.
- Resets to `0` on server restart (forces one clean refresh from all admin panels).

#### Backend Changes
- **New file**: `helpers/orderEventVersion.js` — exports `bumpOrderEventVersion()` and `getOrderEventVersion()`.
- **Bump points** (all called on success only):
  - `controllers/order.js` — createOrder, updateOrderStatus, updateOrderPaymentStatus, updateOrderInfo, updateOrderItems, dispatchOrder, dispatchBulkOrders, syncCourierStatus, bulkSyncCourierStatus, cancelOrderByUser
  - `controllers/guest_order.js` — placeGuestOrder (via createActualOrderFromGuest), adminUpdateGuestOrderStatus, adminDeleteGuestOrder, adminRestoreGuestOrder
  - `controllers/admin_order.js` — createManualOrder, createManualOrderForStranger, markOrderPaidManually
  - `controllers/webhook.js` — Steadfast + Pathao webhook handlers
  - `controllers/order_assignment.js` — assignOrder, unassignOrder, redistributeUnassigned
  - `controllers/order_refund.js` — createRefund, updateRefundStatus
  - `helpers/payment.js` — processSuccessfulPayment (covers all payment callback flows)

#### Admin Panel Changes
- `orders.api.ts` — new `getOrderEventVersion()` API function.
- `AllOrdersView.tsx` — replaced `refetchInterval: 30_000` on all 13 queries with a version-gated `useEffect` that invalidates orders cache only when version changes.

#### Performance Impact
- **Idle**: 13 heavy DB queries / 30s → 1 lightweight HTTP call / 10s (~95% reduction)
- **Active**: same performance (full refresh triggered immediately on any mutation)

---

## 32. V2-053 — Announcement Auto-Send Scheduler

### Problem
The admin permissions page exposes an "Auto-Send Scheduled Announcements" toggle, but no backend mechanism existed to automatically dispatch announcements when their `scheduled_at` time arrives.

### Solution: In-Process Timer (Zero External Dependencies)
A lightweight `setInterval` inside the Node.js process checks for due announcements every 60 seconds. Designed to work on cPanel without cron, message brokers, or external workers.

### Cost Profile
| Toggle State | DB Queries | Impact |
|---|---|---|
| **OFF** (default) | 0/day | Timer reads an in-memory boolean — zero DB cost |
| **ON**, nothing due | ~288/day | Config cache refreshes every 5min + 1 indexed SELECT/min |
| **ON**, announcement due | +dispatch queries | Same as manual "Send" button |

### Permission Config
```
section: announcement
scope: default
key_name: auto_send_scheduled_announcement
value_type: bool
default_value: false
```
Controlled via `PATCH /api/v1/config/patchPermissionConfig` (SUPER_ADMIN only).

### How It Works
1. Server starts → `startAnnouncementScheduler()` is called after `ensurePermissionDefaults`
2. Every 60 seconds:
   - Check in-memory cached `auto_send_scheduled_announcement` flag (refreshed from DB every 5 minutes)
   - If disabled → return immediately (zero cost)
   - If enabled → query `announcements` where `status = 'scheduled' AND scheduled_at <= NOW() AND deleted_at IS NULL` (uses `idx_announcement_delivery` index)
   - Dispatch each due announcement via `dispatchAnnouncementById()` — same logic as manual send
3. Accuracy: announcements fire within ~60 seconds of their scheduled time

### Audit Log
Auto-dispatched announcements are logged with:
- `admin_id`: `NULL` (system-triggered)
- `action`: `'AUTO_SEND_ANNOUNCEMENT'`
- `meta`: includes `triggered_by: 'scheduler'`, channel, recipient counts

### Architecture
- **Shared dispatch function**: `dispatchAnnouncementById()` in `controllers/announcement.js` — used by both the manual send API (`POST /admin/announcement/send/:id`) and the scheduler
- **Concurrency guard**: A `_running` flag prevents overlapping scheduler ticks
- **Independent connections**: Each dispatch uses its own DB connection; failures don't affect other announcements

### Files Changed
- **[NEW]** `service/announcement_scheduler.js` — Timer service with local config cache
- **[MODIFIED]** `controllers/announcement.js` — Extracted `dispatchAnnouncementById()` from `sendAnnouncement`
- **[MODIFIED]** `index.js` — Import and start scheduler on server boot

---

## V2-052 — Admin-Controllable Firebase Client Config

### Summary
Firebase client-side configuration (`FIREBASE_CONFIG` and `VAPID_KEY`) is no longer hardcoded in frontend `env.ts` files or service workers. Instead, the admin manages all Firebase settings from the `/firebase-credential` page, stored in the `firebase_push_credentials` database table, and served via a new **public** API endpoint.

### New Endpoint

#### `GET /config/firebase-client-config` — Public (no auth)

Returns the active Firebase web app config and VAPID key. Used by both shop and admin panels at runtime.

**Response (config exists):**
```json
{
  "success": true,
  "data": {
    "firebase_config": {
      "apiKey": "AIzaSy...",
      "authDomain": "my-project.firebaseapp.com",
      "projectId": "my-project",
      "storageBucket": "my-project.firebasestorage.app",
      "messagingSenderId": "123456789",
      "appId": "1:123456789:web:abc123",
      "measurementId": "G-XXXXXXXXXX"
    },
    "vapid_key": "BFJkMtzWWy..."
  }
}
```

**Response (no config saved):**
```json
{ "success": true, "data": null }
```

### Modified Endpoint

#### `POST /config/firebase-credential`

Now accepts three optional fields (at least one required):
- `credential_json` — Firebase Admin SDK service account JSON (server-side, existing)
- `client_config` — Firebase web app config JSON (client-side, **new**)
- `vapid_key` — VAPID public key string (**new**)

### Modified Response

#### `GET /config/firebase-credential`

Now includes in the response:
- `has_client_config: boolean`
- `client_config: object | null`
- `has_vapid_key: boolean`
- `vapid_key: string | null`

### DB Migration

```sql
ALTER TABLE `firebase_push_credentials`
  ADD COLUMN `client_config` JSON NULL DEFAULT NULL AFTER `credential_json`,
  ADD COLUMN `vapid_key` VARCHAR(200) NULL DEFAULT NULL AFTER `client_config`;
```

### Files Changed
- **[MODIFIED]** `controllers/config.js` — New `getFirebaseClientConfig` handler, extended `upsertFirebaseCredential` and `getFirebaseCredential`
- **[MODIFIED]** `index.js` — Register `GET /config/firebase-client-config` route
- **[MODIFIED]** `scripts/v2.sql` — Added columns to DDL
- **[MODIFIED]** `scripts/updatequerylist.sql` — V2-052 migration block
- **[MODIFIED]** `graduate_shop_admin/src/lib/firebase.ts` — Fetch config from API, localStorage cache
- **[MODIFIED]** `graduate_shop_admin/src/config/env.ts` — Removed FIREBASE_CONFIG + VAPID_KEY
- **[MODIFIED]** `graduate_shop_admin/src/api/firebase-config.api.ts` — Extended types, new fetchFirebaseClientConfig
- **[MODIFIED]** `graduate_shop_admin/src/components/business-settings/firebase/FirebaseCredentialSettings.tsx` — Web Config + VAPID Key form
- **[MODIFIED]** `graduate_shop_admin/public/firebase-messaging-sw.js` — Removed hardcoded config, uses postMessage
- **[MODIFIED]** `gcp_graduatefashion_shop/lib/firebase.ts` — Fetch config from API, localStorage cache
- **[MODIFIED]** `gcp_graduatefashion_shop/config/env.ts` — Removed FIREBASE_CONFIG + VAPID_KEY
- **[MODIFIED]** `gcp_graduatefashion_shop/public/firebase-messaging-sw.js` — Removed hardcoded config, uses postMessage
- **[MODIFIED]** `gcp_graduatefashion_shop/components/account/NotificationPreferenceCard.tsx` — Async config fetch
- **[MODIFIED]** `gcp_graduatefashion_shop/components/notifications/PushNotificationManager.tsx` — Async config check

---

## V2-053 — Notification Bell: Clear Button & Admin Filtering

> **Date:** 2026-04-27
> **Scope:** Backend (`gcp_graduatefashion_api`) + Admin Panel (`graduate_shop_admin`)

### Problems

1. **Clear button doesn't clear contact messages:** The "Clear All" (🗑) button in the admin bell dropdown only cleared push notifications from localStorage. Contact messages (server-side unread data) remained visible because they are live API data, not client-side state.

2. **All admins see all contact messages in bell:** The `getContactMessageCounts` route (old, global) and the bell's `getAllContactMessages` query returned **all** unread messages regardless of assignment, so every admin saw everyone's messages.

### Fix Summary

#### Backend — `controllers/contact.js`

**`getAllContactMessages`** — Added optional `assigned_to_me` query parameter (type: `bool`). When `true`, filters results by `assigned_to_admin_id = adminInfo.id`. ORDER_MANAGER always filters. The contact page (which doesn't pass this param) is unaffected.

**`markAllContactMessagesRead`** *(NEW)* — `POST /admin/contact-messages/mark-all-read`. SUPER_ADMIN marks all unread globally; ADMIN/ORDER_MANAGER only marks their assigned messages as read. No body params required.

#### Backend — `index.js`

- Removed duplicate `getContactMessageCounts` route (line 1348) so the filtered `getContactCounts` (line 1390, already filters by `assigned_to_admin_id` for non-SUPER_ADMIN) takes effect.
- Registered new `POST /admin/contact-messages/mark-all-read` route.
- Added `markAllContactMessagesRead` to imports, removed unused `getContactMessageCounts`.

#### Frontend — Admin Panel

**`contact-messages.api.ts`** — Added `assigned_to_me?: boolean` to `GetContactMessagesParams`; added `markAllContactMessagesRead()` API function.

**`useContactMessages.ts`** — Added `useMarkAllContactMessagesRead()` mutation hook (invalidates counts + list queries on success).

**`NotificationDropdown.tsx`** — Bell dropdown now:
- Passes `assigned_to_me: true` in its unread list query (ADMIN only sees their assigned messages).
- "Mark all read" button marks both push (localStorage) AND contact messages (server-side) as read.
- "Clear all" button clears push notifications AND marks contact messages as read.
- Buttons show when **either** push items or contact items exist (previously only showed for push items).

### Role Behavior Matrix

| Role | Bell Badge Count | Bell Dropdown List | Contact Page |
|---|---|---|---|
| SUPER_ADMIN | All unread globally | All unread globally | All messages |
| ADMIN | Only assigned to me | Only assigned to me | All messages (has "Assigned to me" filter) |
| ORDER_MANAGER | Only assigned to me | Only assigned to me | Only assigned to me |

### Files Changed

| File | Change |
|---|---|
| `gcp_graduatefashion_api/controllers/contact.js` | Added `assigned_to_me` param to `getAllContactMessages`; new `markAllContactMessagesRead` endpoint |
| `gcp_graduatefashion_api/index.js` | Removed duplicate counts route; registered mark-all-read route; updated imports |
| `graduate_shop_admin/src/api/contact-messages.api.ts` | Added `assigned_to_me` param + `markAllContactMessagesRead()` function |
| `graduate_shop_admin/src/components/website-settings/contact-messages/useContactMessages.ts` | Added `useMarkAllContactMessagesRead()` mutation hook |
| `graduate_shop_admin/src/components/header/NotificationDropdown.tsx` | Wired clear/mark-read to handle contact messages; added `assigned_to_me` filter |

---

## V2-054/V2-055 — Single Product Page (No-Login Checkout Flow)

> **Date:** 2026-05-03
> **Scope:** Backend (`gcp_graduatefashion_api`), Shop Frontend (`gcp_graduatefashion_shop`), Admin Panel (`graduate_shop_admin`)

### Overview

A dedicated **Single Product Page** for direct product ordering without requiring user login. Targets high-conversion ad-driven flows where customers click a product link, view details, and checkout immediately with OTP-based identity verification.

### Architecture

```
Product Detail Page → Multi-Variation Cart (sessionStorage) → Checkout Page → OTP Verify → Place Order
```

- **Product Detail Page** (`/single-order-page/[slug]/[id]`) — full product description, reviews, star ratings, bulk discounts, color/variant selectors, image gallery
- **Checkout Page** (`/single-order-page/[slug]/[id]/checkout`) — guest-checkout style form with delivery selector, payment methods, detailed order summary

### Order Type

Orders placed through this flow use `order_type = 'single_page'` in the `orders` table.

---

### DB Schema Changes

#### V2-054 — Product Flag

```sql
ALTER TABLE `products`
  ADD COLUMN `has_single_product_page` TINYINT(1) NOT NULL DEFAULT 0 AFTER `best_deal`;
```

#### V2-055 — OTP Session Table

```sql
CREATE TABLE `single_page_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone_otp` VARCHAR(6) DEFAULT NULL,
  `phone_otp_exp` DATETIME DEFAULT NULL,
  `email_otp` VARCHAR(6) DEFAULT NULL,
  `email_otp_exp` DATETIME DEFAULT NULL,
  `is_phone_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sps_phone` (`phone`),
  INDEX `idx_sps_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Admin Endpoints

#### `PATCH /admin/product/:id/toggle-single-page` *(existing, V2-054)*

Toggles `has_single_product_page` for a product.

**Auth:** `SUPER_ADMIN` or `ADMIN`

**Response:**
```json
{ "success": true, "has_single_product_page": 1 }
```

---

### Public Endpoints (No Auth)

#### `GET /user/product/:id/single-page-data` *(NEW)*

Returns full product detail for the Single Product Page, including images, SKU variations with item discount, bulk discount tiers, available colors/variants, brand info, reviews, and descriptions.

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 344,
    "name": "JULES Men's Tropical Print Half Sleeve Shirt – LGP",
    "name_bd": "...",
    "slug": "jules-mens-tropical-print-half-sleeve-shirt-lgp",
    "short_description": "...",
    "long_description": "...",
    "short_description_bd": "...",
    "long_description_bd": "...",
    "free_delivery": 1,
    "avg_rating": 4.5,
    "review_count": 2,
    "brand": { "id": 5, "name": "Jules", "image": "..." },
    "images": [{ "id": 1, "path": "...", "serial": 1, "sku_color_id": null }],
    "variations": [{
      "id": 100, "sku": "JULES-LEAFG-LXXX-4159",
      "color": { "id": 5, "name": "Leaf Green Print", "name_bd": "...", "hex": "#6B8E23" },
      "variant": { "id": 10, "name": "L", "name_bd": "...", "attribute_name": "Alpha" },
      "selling_price": 1150, "buying_price": 850, "stock": 25,
      "discount": 300, "discount_type": 0,
      "weight_kg": 4, "status": 1
    }],
    "available_colors": [{ "id": 5, "name": "Leaf Green Print", "hex": "#6B8E23" }],
    "available_variants": [{ "id": 10, "name": "L", "attribute_name": "Alpha" }],
    "bulk_offers": [{
      "id": 1, "product_sku_id": 100, "min_qty": 10,
      "discount_type": 1, "discount_value": 20,
      "free_delivery": 1, "name": "10+ pcs 20% off"
    }]
  }
}
```

---

### OTP Endpoints (Rate Limited)

All OTP endpoints use `single_page_sessions` for stateless session tracking (no user account required).

#### `POST /single-page/send-phone-otp` *(NEW)*

Creates or updates a session and sends an SMS OTP.

**Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | No | Existing session UUID (omit for new) |
| `phone` | string | Yes | Mobile number |

**Response:**
```json
{ "success": true, "session_id": "uuid-v4-string", "message": "OTP sent to your phone" }
```

#### `POST /single-page/verify-phone-otp` *(NEW)*

Verifies the phone OTP and marks session as `is_phone_verified = 1`.

**Body:**
| Field | Type | Required |
|---|---|---|
| `session_id` | string | Yes |
| `otp` | string | Yes (6 digits) |

#### `POST /single-page/send-email-otp` *(NEW)*

Sends email OTP for session.

**Body:**
| Field | Type | Required |
|---|---|---|
| `session_id` | string | Yes |
| `email` | string | Yes |

#### `POST /single-page/verify-email-otp` *(NEW)*

Verifies email OTP.

**Body:**
| Field | Type | Required |
|---|---|---|
| `session_id` | string | Yes |
| `otp` | string | Yes (6 digits) |

---

### Permission Endpoint

#### `GET /single-page/order-permissions` *(NEW)*

Returns the current permission config for single-page orders. The frontend uses this to decide which verification fields to show.

**Response:**
```json
{
  "success": true,
  "email_required": true,
  "email_verification_required": false,
  "phone_verification_required": true
}
```

Permission keys read from `order_place_permission.single_page.*`:
| Key | Type | Default | Behaviour |
|---|---|---|---|
| `is_email_required` | bool | `true` | Email field shown/required in checkout |
| `email_verified` | bool | `false` | Email OTP required before placing |
| `phone_verified` | bool | `true` | Phone OTP required before placing |

---

### Order Placement

#### `POST /single-page/place-order` *(NEW)*

Places a single-page order. Supports **multi-SKU batch ordering** (multiple variations of the same product in one order).

**Body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `session_id` | string | Yes | OTP-verified session UUID |
| `product_id` | int | Yes | Product must have `has_single_product_page = 1` |
| `items` | array | Yes* | Array of `{ product_sku_id, quantity }` |
| `product_sku_id` | int | No* | Legacy single-SKU fallback |
| `quantity` | int | No* | Legacy single-SKU fallback |
| `name` | string | Yes | Customer name (2-100 chars) |
| `phone` | string | Yes | Customer phone (10-15 digits) |
| `email` | string | No | Customer email |
| `full_address` | string | Yes | Delivery address (10-500 chars) |
| `city` | string | No | City name |
| `zip_code` | string | No | Zip code |
| `delivery_charge_id` | int | Yes | FK to `delivery_charges` |
| `location_mapping_id` | int | No | FK to `location_mappings` |
| `payment_type` | string | Yes | `gateway`, `cod`, or `mixed` |
| `note` | string | No | Order note (max 1000 chars) |
| `fbp` | string | No | Facebook Pixel browser ID |
| `fbc` | string | No | Facebook Click ID |
| `capi_event_id` | string | No | CAPI dedup event ID |

*Either `items[]` array or `product_sku_id` + `quantity` must be provided.

**Processing Logic:**
1. Validates all inputs (name, phone, address, email format)
2. Verifies product has `has_single_product_page = 1`
3. Validates each SKU belongs to the product and has sufficient stock
4. Verifies OTP session (phone/email as configured)
5. Calculates per-item pricing: selling price − item discount (flat or percentage)
6. Applies **SKU bulk discount rules** per item (highest tier where `qty >= min_qty`)
7. Calculates delivery charge + weight surcharge across all items
8. Checks COD advance payment config if `payment_type = 'cod'`
9. Creates `orders` row with `order_type = 'single_page'`
10. Creates `order_items` rows for each SKU
11. Decrements stock for each SKU
12. Runs fraud check, auto-assignment, admin notifications
13. If `payment_type = 'gateway'`, creates `order_payments` row and returns redirect URL

**Response (COD):**
```json
{
  "success": true,
  "order_id": 12345,
  "invoice": "GF-12345",
  "grand_total": 1830,
  "message": "Order placed successfully"
}
```

**Response (Gateway):**
```json
{
  "success": true,
  "order_id": 12345,
  "invoice": "GF-12345",
  "grand_total": 1830,
  "redirect_url": "https://payment-gateway.com/...",
  "message": "Order placed. Redirecting to payment..."
}
```

---

### Discount Handling

Single-page orders support:
| Discount Type | Supported | Notes |
|---|---|---|
| Item discount (flat/percentage on SKU) | ✅ | Applied per-item from `product_skus.discount` |
| SKU bulk discount tiers | ✅ | From `sku_bulk_discount_rules` |
| Combo discounts | ❌ | Not applicable (single product) |
| Coupons | ❌ | Not supported |
| Cart-wide discounts | ❌ | Not applicable |

---

### Frontend Architecture

#### Product Detail Page
**File:** `app/(public)/single-order-page/[slug]/[id]/SingleOrderPageClient.tsx`
- Image gallery with color-filtered thumbnails
- Star rating display + review comments (read-only)
- Bulk discount tier table
- Multi-variation mini-cart (add multiple sizes/colors)
- `sessionStorage` bridge (`sop_cart` key) to checkout

#### Checkout Page
**File:** `app/(public)/single-order-page/[slug]/[id]/checkout/SingleOrderCheckoutClient.tsx`
- Two-column layout mirroring guest checkout
- Customer info form (Full Name, Mobile, Email, Address)
- `DeliverySelector` component (Inside/Outside Dhaka)
- `PaymentMethod` component (Online Payment / COD)
- Detailed Order Summary sidebar (subtotal, delivery, weight surcharge, item discount, total)
- OTP verification flow (inline modal)

#### Shared Header
Both pages include a sticky header with:
- Graduate logo (links to homepage)
- Language toggle (বাংলা / English)
- Uses `data-sop` attribute to avoid being hidden by the layout CSS

#### Layout
**File:** `app/(public)/single-order-page/layout.tsx`
- Hides default shop header/footer/nav via CSS `:not([data-sop])` selectors
- Single-page headers marked with `data-sop="true"` are preserved

#### i18n
Added 30+ translation keys to `locales/en.json` and `locales/bn.json` under:
- `singleOrder.*` — page titles, buttons, status messages
- `product.color`, `product.freeDelivery` — product attributes
- `customerInfo.*` — checkout form labels
- `orderSuccess.*` — confirmation messages

---

### Files Changed

| File | Change |
|---|---|
| **Backend** | |
| `controllers/single_page_order.js` | **[NEW]** Complete controller: 6 endpoints (OTP send/verify × phone/email, permissions, place-order) |
| `controllers/product.js` | Added `toggleSingleProductPage` and `getSinglePageData` handlers |
| `index.js` | Registered 8 new routes under `/single-page/*` and `/user/product/:id/single-page-data` |
| `scripts/updatequerylist.sql` | V2-054 (product flag) + V2-055 (sessions table) |
| `scripts/v2.sql` | Added `has_single_product_page` to products DDL; added `single_page_sessions` table DDL |
| **Shop Frontend** | |
| `app/(public)/single-order-page/layout.tsx` | **[NEW]** Layout hiding default shop chrome via `data-sop` attribute approach |
| `app/(public)/single-order-page/[slug]/[id]/page.tsx` | **[NEW]** Server component with SEO metadata |
| `app/(public)/single-order-page/[slug]/[id]/SingleOrderPageClient.tsx` | **[NEW]** Product detail page with gallery, reviews, bulk tiers, mini-cart |
| `app/(public)/single-order-page/[slug]/[id]/checkout/page.tsx` | **[NEW]** Checkout server component |
| `app/(public)/single-order-page/[slug]/[id]/checkout/SingleOrderCheckoutClient.tsx` | **[NEW]** Guest-checkout-style checkout with OTP, delivery, payment, order summary |
| `locales/en.json` | Added 30+ translation keys |
| `locales/bn.json` | Added 30+ Bangla translation keys |
| **Admin Panel** | |
| Product management pages | Toggle button for `has_single_product_page` |

---

## V2-056 - Payment Callback Redirect Fixes (SSLCommerz)

### Problem

After SSLCommerz payment (success/fail/cancel), the callback handlers returned raw JSON to the browser instead of redirecting the user back to the frontend. This caused:
1. Users saw raw `{"success":true}` JSON after successful payments
2. For single-page orders (unauthenticated), no way to see a proper result page
3. The `orderId` in the redirect URL was the `order_payments.id` (tran_id), not the actual `orders.id`
4. SQL error `Unknown column 'o.user_id'` crashed `processSuccessfulPayment`

### Root Cause

- The **active** SSLCommerz callback handlers were in `controllers/fallback.js` (not `controllers/order.js` as initially assumed)
- `helpers/payment.js` line 160 referenced `o.user_id` but the `orders` table uses `customer_id`
- `getFrontendUrl()` in `fallback.js` built malformed URLs to a non-existent `/checkout/fallback/` path
- Error catch blocks passed `tran_id` (payment record ID) as `orderId` instead of the actual order ID

### Changes

#### `helpers/responses.js`
- **[NEW]** `QRedirect` class extending `QResponse` — enables HTTP 302 browser redirects from the `api()` wrapper architecture

#### `helpers/payment.js`
- Fixed `o.user_id` → `o.customer_id` in `processSuccessfulPayment` SQL query

#### `controllers/fallback.js` *(active SSLCommerz handlers)*
- `getFrontendUrl()` now redirects to `/checkout/success?orderId=X&payment=success|failed|cancelled`
- Error catch block in `sslCommerzCallback` now resolves `order_id` from `order_payments` before redirecting
- Removed malformed URL construction with duplicate `?` separators

#### `controllers/order.js` *(unused but kept in sync)*
- `sslCommerzCallback`: Added `o.order_type` fetch, redirects via `QRedirect`
- `sslCommerzFail`: Redirects to `/checkout/success?payment=failed`
- `sslCommerzCancel`: Redirects to `/checkout/success?payment=cancelled`
- "Already processed" idempotency check (line 1401): Now redirects instead of returning JSON

### Frontend: `OrderSuccessClient.tsx`

The success page now handles three states based on the `payment` query param:

| `payment` param | Auth State | Behavior |
|---|---|---|
| `success` | Authenticated | Full order details page (existing) |
| `success` | Unauthenticated | ✅ icon + "Payment Successful!" + Order #ID |
| `failed` | Any | ❌ icon + "Payment Failed" + Order #ID + retry message |
| `cancelled` | Any | ❌ icon + "Payment Cancelled" + retry message |
| *(none)* | Authenticated | Full order details page (existing) |

### Redirect Flow Diagram

```
SSLCommerz Gateway
       │
       ├── SUCCESS → POST /api/v1/payment/sslCommerzCallback (fallback.js)
       │                    │
       │                    ├── processSuccessfulPayment() OK
       │                    │   └── 302 → /checkout/success?orderId=929&payment=success
       │                    │
       │                    └── Error (SQL, validation)
       │                        └── Resolve order_id from order_payments
       │                            └── 302 → /checkout/success?orderId=929&payment=failed
       │
       ├── FAILED → POST /api/v1/payment/sslCommerzFail (fallback.js)
       │                └── processFailedPayment() → 302 → ...&payment=failed
       │
       └── CANCEL → POST /api/v1/payment/sslCommerzCancel (fallback.js)
                        └── Mark failed → 302 → ...&payment=cancelled
```

### Files Changed

| File | Change |
|---|---|
| `helpers/responses.js` | **[NEW]** `QRedirect` class |
| `helpers/payment.js` | Fixed `o.user_id` → `o.customer_id` |
| `controllers/fallback.js` | Fixed redirect URLs, orderId resolution, removed malformed URL builder |
| `controllers/order.js` | Added redirect logic (kept in sync, currently unused — routes point to `fallback.js`) |
| `app/(public)/checkout/OrderSuccessClient.tsx` | Payment status fallback UI for all auth states |

---

## V2-057 - Address Book Pollution Security Fix

### Problem (Security)

When a user places an order via **single-page checkout** or **guest checkout** without identity verification (OTP), the backend:
1. Looked up a registered user by the email/phone entered in the form
2. Saved the checkout address into that user's `user_addresses` table
3. Linked unverified phone numbers to the user's account as "verified"

**Impact**: Anyone could type a registered user's email (e.g., `victim@gmail.com`) in an unverified checkout form, and a random/malicious address would appear in the victim's Address Book when they next log in.

### Root Cause

The `existingUserId` lookup in both `single_page_order.js` and `guest_order.js` ran **unconditionally** — it matched users by email/phone regardless of whether the checkout person had actually proved their identity via OTP.

### Fix

Wrapped the user-linking logic with an identity verification guard:

```javascript
// SECURITY: Only link to an existing user account if identity was verified
const identityVerified = session.is_phone_verified || session.is_email_verified;

if (identityVerified) {
  // ... existing user lookup and address save logic ...
}
```

### Behavior Matrix

| Verification Setting | OTP Done? | Links User? | Saves Address? | Links Phone? |
|---|---|---|---|---|
| Verification **OFF** (admin `/permissions`) | N/A (not required) | ❌ | ❌ | ❌ |
| Verification **ON**, OTP **not done** | ❌ | ❌ blocked — order rejected by permission check | | |
| Verification **ON**, OTP **completed** | ✅ | ✅ | ✅ | ✅ |

### Affected Order Types

| Order Type | File | Fixed? | Notes |
|---|---|---|---|
| Single-page | `controllers/single_page_order.js` | ✅ | Guard on `session.is_phone_verified \|\| session.is_email_verified` |
| Guest | `controllers/guest_order.js` | ✅ | Guard on `guestData.is_phone_verified \|\| guestData.is_email_verified` |
| Admin manual | `controllers/admin_order.js` | N/A | Requires admin auth + role check — intentional |
| Regular (logged-in) | `controllers/order.js` | N/A | User is authenticated — address is their own |

### Files Changed

| File | Change |
|---|---|
| `controllers/single_page_order.js` | `existingUserId` lookup guarded by `identityVerified` flag (lines 439-479) |
| `controllers/guest_order.js` | Same guard applied to `createActualOrderFromGuest()` (lines 553-603) |

---

## V2-058 - Single-Page Checkout OTP Toggle Enforcement

### Problem

Single-page checkout called `POST /api/v1/single-page/send-phone-otp` even when the admin permission toggles were both disabled:

- `Require Email Verified = false`
- `Require Phone Verified = false`

This happened because the shop frontend reused the phone OTP endpoint as a hidden "create session" helper before placing the order.

### Fix

Added a session-only endpoint that creates or updates a `single_page_sessions` row without sending SMS or email. The shop now uses this endpoint for non-phone-verification flows, and re-fetches the latest single-page permission toggles with `cache: "no-store"` when the customer clicks Place Order.

### New Endpoint

```
POST /api/v1/single-page/session
Content-Type: application/json
```

**Body:**
```json
{
  "session_id": "optional-existing-session-id",
  "phone": "01700000000",
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "session_id": "b62dc8b7-2048-487e-8fd9-8f6330c3bc57"
}
```

### Behavior Matrix

| Require Phone Verified | Require Email Verified | OTP endpoint called | Verification step opened |
|---|---|---|---|
| `false` | `false` | None | None |
| `true` | `false` | `/single-page/send-phone-otp` | Phone OTP |
| `false` | `true` | `/single-page/send-email-otp` | Email OTP |
| `true` | `true` | Phone OTP, then email OTP | Phone OTP, then email OTP |

### DB Changes

None. The new endpoint reuses the existing `single_page_sessions` table.

### Files Changed

| File | Change |
|---|---|
| `controllers/single_page_order.js` | Added `createSinglePageSession()` without OTP dispatch |
| `index.js` | Added `POST /api/v1/single-page/session` route |
| `SingleOrderCheckoutClient.tsx` | Replaced hidden phone OTP session creation with `/single-page/session`; refreshes permission toggles before choosing OTP vs direct order |


---

## 32. V2-058 - SPP Checkout UX Fixes (2026-05-08)

Three fixes for the Single Product Page (SPP) checkout flow.

### 32.1 Form Auto-fill / Auto-suggest

**Problem:** Browser autofill did not work on the SPP checkout form because inputs lacked standard HTML `autocomplete` attributes.

**Fix:** Added `name` and `autoComplete` attributes to all relevant inputs:

| Input | name | autoComplete | type change |
|---|---|---|---|
| Full Name | name | name | - |
| Phone | phone | tel | text to tel |
| Email | email | email | - |
| Address | address | street-address | - |

### 32.2 Unified Success Page (COD vs Online Payment)

**Problem:** COD orders showed a minimal inline Thank you card on the checkout page, while online payment orders redirected to `/checkout/success` with full order details.

**Fix:** Both COD and online payment flows now redirect to `/checkout/success?orderId=X`. The inline `step === "success"` render block was removed.

### 32.3 Duplicate Admin Push Notifications

**Problem:** Order assignment push notifications appeared twice on the admin panel.

**Root Cause:** `sendFirebasePush` sent both a top-level `notification` key AND a `webpush.notification` key. Firebase SDK auto-displayed one notification, then the SW showed another via `onBackgroundMessage`.

**Fix:** Converted both `sendFirebasePush` (admin) and `sendUserFirebasePush` (user) to data-only FCM messages. Both SWs already read `data.title` / `data.body` as fallback. Safe for all 8 push notification types (order broadcast, assignment, personal, contact, report, order status, contact reply, report reply).

### Files Changed

| File | Change |
|---|---|
| `helpers/notify.js` | `sendFirebasePush`: removed notification + webpush keys, added title/body to data |
| `helpers/notify.js` | `sendUserFirebasePush`: same data-only conversion |
| `SingleOrderCheckoutClient.tsx` | Added autoComplete/name attrs; replaced inline success with router.push |
