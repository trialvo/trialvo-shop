# Version 2 Change Guideline

This file is the running source of truth for all V2 migration work.

## Scope
- Base reference (current production and code): `scripts/v1.sql`.
- Working target schema: `scripts/v2.sql`.
- Migration query history: `scripts/updatequerylist.sql`.
- Codebase to update after schema edits: controllers, config, helpers, services, validators, and route usage in `index.js`.

## Working Agreement
For every requested change:
1. Understand requested application behavior change.
2. Update `scripts/v2.sql` to represent the new target schema.
3. Append migration SQL to `scripts/updatequerylist.sql` to transform current DB state toward V2.
4. Update this file with:
   - What existed before.
   - What was changed in schema.
   - What code must change.
   - Status/progress and risks.

## Migration Principles
- Never rewrite history in `updatequerylist.sql`; append new migration blocks.
- Keep queries idempotent when possible (`IF EXISTS`, `IF NOT EXISTS`, safe `UPDATE` guards).
- Prefer explicit transactions for destructive/multi-step migration blocks.
- Preserve data unless change request explicitly allows data loss.
- Keep backward compatibility notes if deployment is phased.

## Change Record Template
Use one section per change request.

### Change ID: V2-XXX
- Date:
- Request summary:
- Requested by:
- Related files referenced:

#### Previous State (DB)
- Tables/columns/constraints/indexes before change:
- Existing data behavior before change:

#### Schema Changes in `v2.sql`
- Added:
- Modified:
- Removed:
- Constraint/index changes:

#### Migration SQL Added to `updatequerylist.sql`
- Block label:
- Forward migration queries:
- Data backfill queries:
- Safety guards:

#### Required Code Changes
- API/route layer (`index.js`):
- Controller logic:
- Validation/casting:
- Query/select/insert/update statements:
- Response shape changes:
- Config/permission impact:

#### Testing Checklist
- Read path tests:
- Write path tests:
- Regression checks:
- Manual verification SQL:

#### Status
- `planned` | `in_progress` | `done` | `blocked`
- Notes:

---

## Current Baseline Snapshot
- `scripts/v1.sql` is production-aligned baseline.
- `scripts/v2.sql` currently contains schema-only copy of v1 plus:
  - `permission_config` table.
  - post-dump `name_bd` additions to selected catalog tables.
- `scripts/updatequerylist.sql` contains migration block `V2-001` (admins soft delete migration).
- `scripts/updatequerylist.sql` contains migration blocks:
  - `V2-001` (initial admins soft delete migration)
  - `V2-002` (correction: keep `is_active` and soft delete together)
  - `V2-003` (variants ordering changed from `priority` to `serial`)
  - `V2-004` (product image ordering changed from `priority` to `serial`)
  - `V2-005` (add `products.face_image` for optimized listing thumbnails)
  - `V2-006` (add SKU weight + delivery charge extra-per-kg settings)
  - `V2-007` (announcement zone targeting with selected city snapshots)
  - `V2-008` (add `orders.origin` for order source tracking)
  - `V2-009` (normalize `orders.origin` labels/default to readable values)
  - `V2-010` (add `ip_address` capture for orders and guest_orders)
  - `V2-011` (bulk/combo discount schema + overall-cart policy keys)
  - `V2-012` (fix overall-cart numeric config value types)
  - `V2-013` (dynamic policy content management with LONGTEXT/HTML support)
  - `V2-014` (dedicated Firebase push credential table + verification metadata)
  - `V2-015` (simplify Firebase credential table to minimal JSON + status model)
  - `V2-016` (remove deleted_at from firebase credential store)
  - `V2-017` (order auto-distribution + manual assignment/reassignment foundation)
  - `V2-018` (admin notification permission model upgrade: 6 global keys + per-admin matrix table)
  - `V2-019` (order multi-refund ledger for admin order-edit refund tracking)
  - `V2-020` (unified email/SMS/push notification history with batch and attempt logs)

## Open Items
- Apply remaining V2 schema requests incrementally.
- Postpone codebase edits until DB restructuring phase is complete.

---

### Change ID: V2-001
- Date: 2026-03-05
- Request summary: Replace admin deactivation (`is_active`) with soft delete (`deleted_at`) so superior admin can deactivate/reactivate by soft delete state.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/v1.sql`, `controllers/admin.js`, `helpers/common.js`

#### Previous State (DB)
- Table: `admins`
- Status column: `is_active` (`tinyint(1)`, default `1`)
- No dedicated soft delete fields in `admins` table
- Email uniqueness enforced by `UNIQUE KEY email (email)`

#### Schema Changes in `v2.sql`
- Added:
  - `admins.deleted_at` (`timestamp NULL DEFAULT NULL`)
  - `admins.deleted_by_admin_id` (`int NULL`)
  - `KEY idx_admins_deleted_at (deleted_at)`
  - `KEY idx_admins_deleted_by_admin (deleted_by_admin_id)`
  - `FK fk_admins_deleted_by_admin (deleted_by_admin_id -> admins.id ON DELETE SET NULL)`
- Modified:
  - Admin status model now represented by soft delete state:
    - Active admin: `deleted_at IS NULL`
    - Deactivated admin: `deleted_at IS NOT NULL`
- Removed:
  - `admins.is_active`
- Constraint/index changes:
  - Added 2 indexes for list/filter performance and actor lookup
  - Added self-referencing FK for deletion actor tracking

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-001`
- Forward migration queries:
  - Add `deleted_at`, `deleted_by_admin_id`
  - Add indexes and FK
  - Drop `is_active`
- Data backfill queries:
  - Convert old inactive records: `is_active = 0 -> deleted_at = NOW()`
- Safety guards:
  - Transaction used
  - Precondition notes added (maintenance window, backup, code update dependency)

#### Required Code Changes
- API/route layer (`index.js`):
  - No route path changes required.
- Controller logic:
  - `controllers/admin.js`:
    - Login must reject admins where `deleted_at IS NOT NULL`.
    - Admin list/filter/get APIs must use `deleted_at` instead of `is_active`.
    - Admin edit flow should toggle soft delete (`deleted_at`) for deactivate/reactivate actions.
    - Create admin flow should stop writing `is_active`.
    - Forgot/reset password flows should only allow `deleted_at IS NULL`.
    - Profile response should derive status from `deleted_at`.
- Validation/casting:
  - Replace direct `is_active` request field usage with `is_deleted` (or map `is_active` to inverse `deleted_at` internally for backward compatibility).
- Query/select/insert/update statements:
  - Replace all admin table filters `is_active = 1` with `deleted_at IS NULL`.
  - Replace admin table filters `is_active = 0` with `deleted_at IS NOT NULL`.
  - Remove insert/update references to `is_active`.
- Response shape changes:
  - Prefer exposing `is_deleted` and `deleted_at`.
  - Optional compatibility: keep `is_active` as derived (`deleted_at IS NULL`) until frontend updates.
- Config/permission impact:
  - None expected.
  - Auth middleware (`helpers/common.js`) must verify admin is not soft-deleted.

#### Testing Checklist
- Read path tests:
  - `getAdmins` active/deleted filtering.
  - `getAdminById` includes deletion state.
  - Auth token validation fails for deleted admins.
- Write path tests:
  - Deactivate admin sets `deleted_at` and increments token version.
  - Reactivate admin clears `deleted_at`.
  - Create admin inserts without `is_active`.
- Regression checks:
  - Role assignment still works.
  - Admin audit logs still insert correctly.
  - Password reset blocked for deleted admins.
- Manual verification SQL:
  - `SELECT id,email,deleted_at,deleted_by_admin_id FROM admins ORDER BY id;`
  - `SHOW CREATE TABLE admins;`

#### Status
- `in_progress`
- Notes:
  - DB schema and migration script completed.
  - Codebase updates intentionally postponed as requested.

---

### Change ID: V2-002
- Date: 2026-03-05
- Request summary: Keep both `is_active` and soft delete for `admins` (`deleted_at`), instead of replacing `is_active`.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `scripts/guidline.md`

#### Previous State (DB)
- `V2-001` planned to drop `admins.is_active` and rely only on `deleted_at`.
- This conflicted with intended business logic:
  - `is_active` = activation/deactivation by superior admin.
  - `deleted_at` = soft delete/restore lifecycle.

#### Schema Changes in `v2.sql`
- Added back:
  - `admins.is_active` (`tinyint(1)`, default `1`)
- Retained:
  - `admins.deleted_at`
  - `admins.deleted_by_admin_id`
  - related indexes and FK
- Final intended model:
  - Active usable admin: `is_active = 1 AND deleted_at IS NULL`
  - Deactivated admin: `is_active = 0 AND deleted_at IS NULL`
  - Soft-deleted admin: `deleted_at IS NOT NULL` (regardless of `is_active`)

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-002`
- Forward migration queries:
  - Add back `is_active` after `token_version`
  - Backfill `is_active` using `deleted_at` state
- Data backfill queries:
  - `is_active = 1` when `deleted_at IS NULL`
  - `is_active = 0` when `deleted_at IS NOT NULL`
- Safety guards:
  - Transaction used
  - Marked as correction block intended for environments where `V2-001` was already applied

#### Required Code Changes
- Controller logic (`controllers/admin.js`):
  - Activation/deactivation should update `is_active` only.
  - Soft delete/restore should update `deleted_at` (+ `deleted_by_admin_id`) only.
  - Login / password reset eligibility should require both:
    - `is_active = 1`
    - `deleted_at IS NULL`
- Auth middleware (`helpers/common.js`):
  - Token holder must resolve to admin with `is_active = 1 AND deleted_at IS NULL`.
- Admin listing/filter APIs:
  - Support separate filters for:
    - active/inactive (`is_active`)
    - deleted/not deleted (`deleted_at`)
- Response shape:
  - Include both status dimensions (`is_active`, `is_deleted`, `deleted_at`).

#### Testing Checklist
- Read path tests:
  - Admin list by `is_active`
  - Admin list by deleted state
  - Combined filtering behavior
- Write path tests:
  - Toggle active status does not soft-delete
  - Soft delete does not overwrite intended active flag unexpectedly
  - Restore deleted admin keeps/sets desired `is_active`
- Regression checks:
  - JWT auth rejects inactive or deleted admins
  - Audit logs correctly identify deactivate vs delete actions

#### Status
- `in_progress`
- Notes:
  - `V2-001` is superseded by `V2-002` for final intended behavior.
  - Apply migration blocks in sequence for environments that already consumed `V2-001`.

---

### Change ID: V2-003
- Date: 2026-03-05
- Request summary: For `variants`, drop fixed `priority` ordering and introduce `serial` so admin drag-and-drop can control exact position.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/attribute.js`

#### Previous State (DB)
- Table: `variants`
- Ordering column: `priority` (`tinyint`, default `1`)
- Existing index: `idx_var_attr_priority (attribute_id, priority)`
- Existing controller ordering behavior relied on priority-based sort (e.g., `ORDER BY priority DESC, ...`)

#### Schema Changes in `v2.sql`
- Added:
  - `variants.serial` (`int NOT NULL DEFAULT 1`)
  - `KEY idx_var_attr_serial (attribute_id, serial)`
- Modified:
  - Ordering model changes from static bucket-style priority to exact serial positioning.
- Removed:
  - `variants.priority`
  - `idx_var_attr_priority`
- Constraint/index changes:
  - Replaced `(attribute_id, priority)` index with `(attribute_id, serial)` for fast ordered fetch per attribute.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-003`
- Forward migration queries:
  - Add `serial` column
  - Backfill `serial` using row-number by current ordering logic
  - Drop priority index/column and add serial index
- Data backfill queries:
  - `ROW_NUMBER() OVER (PARTITION BY attribute_id ORDER BY priority DESC, updated_at DESC, id ASC)`
  - preserves current effective order when transitioning to serial
- Safety guards:
  - Transaction wrapper included
  - Preconditions recorded (apply once, maintenance window, deploy code updates after migration)

#### Required Code Changes
- API/route layer (`index.js`):
  - No route changes required.
- Controller logic:
  - `controllers/attribute.js`:
    - Replace variant request fields from `priority` to `serial` for create/update/filter.
    - Remove priority validation (`1..3`) for variants.
    - Add serial validation (`int >= 1`) and optionally max bound by list size.
    - Replace variant ordering from `ORDER BY ... priority ...` to `ORDER BY serial ASC`.
    - Add or update bulk reorder endpoint logic for drag-and-drop (`[{id, serial}]` style update).
- Validation/casting:
  - Replace typed body/query `priority` with `serial` where variant-related.
- Query/select/insert/update statements:
  - `INSERT INTO variants (...)` should write `serial`, not `priority`.
  - `UPDATE variants SET ...` should update `serial`.
  - All `WHERE priority = ?` and `ORDER BY priority` for variants must be replaced.
  - Any joined sort using `v.priority` should use `v.serial`.
- Response shape changes:
  - Return `serial` in variant payloads.
  - Remove/deprecate `priority` in variant responses.
- Config/permission impact:
  - None.

#### Testing Checklist
- Read path tests:
  - Variant list returns in `serial ASC`.
  - Attribute details include variants sorted by `serial`.
- Write path tests:
  - Create variant with explicit `serial`.
  - Update variant `serial`.
  - Drag-and-drop reorder updates persisted positions correctly.
- Regression checks:
  - Product SKU relations to variants unchanged.
  - Variant uniqueness (`attribute_id`, `name`) unchanged.
- Manual verification SQL:
  - `SHOW COLUMNS FROM variants;`
  - `SHOW INDEX FROM variants;`
  - `SELECT id, attribute_id, name, serial FROM variants ORDER BY attribute_id, serial, id;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Codebase updates intentionally postponed until DB restructuring phase completes.

---

### Change ID: V2-004
- Date: 2026-03-05
- Request summary: For `product_images`, drop `priority` and introduce `serial` so admin can set image position via drag-and-drop.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/product.js`

#### Previous State (DB)
- Table: `product_images`
- Ordering column: `priority` (`tinyint`, default `1`)
- Existing index: `KEY product_id (product_id)`
- Existing product image fetch logic commonly sorted by `priority ASC, id ASC`

#### Schema Changes in `v2.sql`
- Added:
  - `product_images.serial` (`int NOT NULL DEFAULT 1`)
  - `KEY idx_pi_product_serial (product_id, serial)`
- Modified:
  - Image ordering model changed from `priority` to exact serial ordering for drag-and-drop.
- Removed:
  - `product_images.priority`
  - old index `product_id`
- Constraint/index changes:
  - Replaced single-column product index with composite `(product_id, serial)` to optimize ordered reads.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-004`
- Forward migration queries:
  - Add `serial` column
  - Backfill serial per product
  - Drop old index/column and add new composite index
- Data backfill queries:
  - `ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY priority ASC, id ASC)`
  - preserves existing displayed image order during migration
- Safety guards:
  - Transaction wrapper included
  - Preconditions recorded (maintenance window + deploy code updates afterward)

#### Required Code Changes
- API/route layer (`index.js`):
  - No route path changes required.
- Controller logic:
  - `controllers/product.js`:
    - Replace all reads of `product_images.priority` with `product_images.serial`.
    - Replace all image ordering clauses:
      - `ORDER BY pi.priority ASC` -> `ORDER BY pi.serial ASC`
      - keep `id ASC` as tie-breaker where needed.
    - Update image mapping payloads from `{ priority }` to `{ serial }`.
    - Add/update bulk image reorder endpoint contract (`[{id, serial}]`) for drag-and-drop persistence.
- Validation/casting:
  - Replace request/query field references from `priority` to `serial` for product images.
- Query/select/insert/update statements:
  - Replace `SELECT ... priority FROM product_images` with `SELECT ... serial ...`.
  - Replace any subquery thumbnail selector ordering by `priority` to ordering by `serial`.
  - For new image insert flow, define serial assignment strategy:
    - append to end (`MAX(serial)+1`) or explicit serial from request.
- Response shape changes:
  - Return `serial` in product images list.
  - Remove/deprecate `priority` from image responses.
- Config/permission impact:
  - None.

#### Testing Checklist
- Read path tests:
  - Product details return images sorted by `serial ASC, id ASC`.
  - Product listing thumbnails follow new serial order.
- Write path tests:
  - New image insert gets correct serial.
  - Drag-and-drop reorder updates persist and re-read correctly.
- Regression checks:
  - Image delete flow still works.
  - Product creation/edit media workflow remains stable.
- Manual verification SQL:
  - `SHOW COLUMNS FROM product_images;`
  - `SHOW INDEX FROM product_images;`
  - `SELECT id, product_id, serial, img_path FROM product_images ORDER BY product_id, serial, id;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code updates intentionally postponed until DB restructuring phase completes.

---

### Change ID: V2-005
- Date: 2026-03-05
- Request summary: Add `products.face_image` to serve lightweight product thumbnails on listing pages and reduce traffic/latency.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/product.js`

#### Previous State (DB)
- Product listing APIs pick image from `product_images` (`serial`/old `priority`-ordered image).
- No dedicated optimized thumbnail path in `products`.
- Listing pages may load larger original product image assets.

#### Schema Changes in `v2.sql`
- Added:
  - `products.face_image` (`varchar(512)`, nullable)
- Modified:
  - Product entity now supports a dedicated listing-thumbnail path independent of original gallery images.
- Removed:
  - None.
- Constraint/index changes:
  - None in this step.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-005`
- Forward migration queries:
  - Add `products.face_image`
  - Backfill from first product image (`serial ASC, id ASC`) as bootstrap fallback
- Data backfill queries:
  - Uses `ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY serial ASC, id ASC)` to pick one deterministic image per product
- Safety guards:
  - Transaction wrapper included
  - Preconditions note that `V2-004` should be applied first

#### Required Code Changes
- API/route layer (`index.js`):
  - No route changes required unless adding explicit image-regeneration endpoint.
- Controller logic:
  - `controllers/product.js`:
    - On product create/edit/image reorder:
      - detect current front image (`serial = 1`)
      - generate reduced-quality derivative
      - store derivative in dedicated folder (e.g. `uploads/products/face/`)
      - update `products.face_image`
    - On image delete:
      - if deleted image was current front image, regenerate `face_image` from next serial image
      - if no images left, set `face_image = NULL`
    - Product list/query endpoints should prefer `products.face_image` for thumbnail response.
    - Product details can still return full gallery from `product_images`.
- Validation/casting:
  - Add optional internal validation for face-image generation params (size/quality) if configurable.
- Query/select/insert/update statements:
  - Listing queries currently using subqueries like `(SELECT pi.img_path ... ORDER BY pi.serial ASC LIMIT 1)` should migrate to `p.face_image`.
  - Keep fallback logic initially: `COALESCE(p.face_image, first_gallery_image)` until regeneration is fully reliable.
- Response shape changes:
  - Return listing image using `face_image` path.
  - Optionally expose both `face_image` and full gallery image set in detail endpoints.
- Config/permission impact:
  - May add config keys later for face image width/height/quality.

#### Testing Checklist
- Read path tests:
  - Product listing response returns `face_image`.
  - Listing pages no longer depend on heavy original image for thumbnail.
- Write path tests:
  - Create product generates and saves `face_image`.
  - Reorder images updates `face_image` according to new serial-1 image.
  - Delete/replace first image updates `face_image` correctly.
- Regression checks:
  - Existing gallery image upload and retrieval remain intact.
  - CDN/static serving for new folder path works in local + production storage driver.
- Manual verification SQL:
  - `SHOW COLUMNS FROM products LIKE 'face_image';`
  - `SELECT id, name, face_image FROM products ORDER BY id DESC LIMIT 50;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Image optimization/generation logic intentionally postponed to code phase.

---

### Change ID: V2-006
- Date: 2026-03-05
- Request summary: Add product variation weight in kg and delivery charge weight-threshold configuration so extra courier charge can be applied for overweight orders.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/delivery.js`, `controllers/order.js`, `controllers/admin_order.js`, `controllers/guest_order.js`

#### Previous State (DB)
- `product_skus` had no per-item weight field.
- `delivery_charges` had only flat/base amounts (`customer_charge`, `our_charge`) with no weight threshold model.

#### Schema Changes in `v2.sql`
- Added:
  - `product_skus.weight_kg` (`decimal(10,3) NOT NULL DEFAULT 0.000`)
  - `delivery_charges.default_weight_kg` (`decimal(10,3) NOT NULL DEFAULT 1.000`)
  - `delivery_charges.extra_charge_per_kg` (`decimal(10,2) NOT NULL DEFAULT 0.00`)
- Modified:
  - Delivery charge configs now support base + overweight rule.
- Removed:
  - None.
- Constraint/index changes:
  - None in this step.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-006`
- Forward migration queries:
  - Add `weight_kg` to `product_skus`
  - Add `default_weight_kg` and `extra_charge_per_kg` to `delivery_charges`
- Data backfill queries:
  - Not required (safe defaults set by DDL)
- Safety guards:
  - Transaction wrapper included
  - Defaults chosen to avoid immediate pricing break until code is updated

#### Required Code Changes
- API/route layer (`index.js`):
  - No route changes required if existing create/edit endpoints are extended.
- Controller logic:
  - `controllers/product.js`:
    - Create/edit variation payload must accept `weight_kg`.
    - Persist and return `weight_kg` in variation responses.
  - `controllers/delivery.js`:
    - Create/edit/get delivery charge payloads must include:
      - `default_weight_kg`
      - `extra_charge_per_kg`
  - `controllers/order.js`, `controllers/admin_order.js`, `controllers/guest_order.js`:
    - Compute order total weight from order items and SKU weights:
      - `total_weight_kg = SUM(item_qty * sku.weight_kg)`
    - Compute extra customer charge:
      - `extra_kg = GREATEST(total_weight_kg - default_weight_kg, 0)`
      - `extra_charge = extra_kg * extra_charge_per_kg`
      - `final_delivery_charge = base_customer_charge + extra_charge`
    - Decide rounding policy (recommended: 2 decimal places, round half up).
- Validation/casting:
  - Add numeric validation:
    - `weight_kg >= 0`
    - `default_weight_kg >= 0`
    - `extra_charge_per_kg >= 0`
- Query/select/insert/update statements:
  - Include new columns in all delivery charge CRUD SQL.
  - Include `weight_kg` in SKU read/write SQL used by order pricing logic.
- Response shape changes:
  - Return `weight_kg` for SKU APIs.
  - Return delivery weight config fields in delivery charge APIs.
  - Optionally include computed `total_weight_kg` and `extra_delivery_charge` in order summaries.
- Config/permission impact:
  - No new permission keys required if existing delivery/product management permissions are reused.

#### Testing Checklist
- Read path tests:
  - SKU fetch returns `weight_kg`.
  - Delivery charge fetch returns `default_weight_kg` and `extra_charge_per_kg`.
- Write path tests:
  - Create/edit SKU with `weight_kg`.
  - Create/edit delivery charge with new weight config fields.
  - Order pricing adjusts correctly for overweight cases.
- Regression checks:
  - Existing flat-rate behavior remains same when `extra_charge_per_kg = 0`.
  - Non-overweight orders do not get extra charge.
- Manual verification SQL:
  - `SHOW COLUMNS FROM product_skus;`
  - `SHOW COLUMNS FROM delivery_charges;`
  - `SELECT id, sku, weight_kg FROM product_skus ORDER BY id DESC LIMIT 50;`
  - `SELECT id, title, customer_charge, default_weight_kg, extra_charge_per_kg FROM delivery_charges ORDER BY id;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code changes intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-007
- Date: 2026-03-05
- Request summary: Add announcement zone selection so admin can send to all zones or selected zones (zones are `city_name` from `location_mappings`).
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/announcement.js`, `scripts/v2.sql` (`location_mappings`)

#### Previous State (DB)
- `announcements` supported audience targeting (`target_type`) and schedule/status flow.
- No zone targeting model existed.
- `location_mappings.city_name` source list may change over time as courier integrations evolve.

#### Schema Changes in `v2.sql`
- Added:
  - `announcements.zone_scope` enum(`all`,`selected`) default `all`
  - `KEY idx_announcement_zone_scope (zone_scope)`
  - New table `announcement_zones`:
    - `announcement_id`
    - `city_name`
    - `city_name_normalized`
    - unique constraint per announcement+city
- Modified:
  - Announcement model now supports geographic targeting dimension.
- Removed:
  - None.
- Constraint/index changes:
  - FK `announcement_zones.announcement_id -> announcements.id` with cascade delete.
  - Explicit design choice: no FK to `location_mappings` (to avoid breakage from mapping row churn).

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-007`
- Forward migration queries:
  - Add `zone_scope` column + index to `announcements`
  - Create `announcement_zones` table
- Data backfill queries:
  - Not required (existing announcements default to `zone_scope='all'`)
- Safety guards:
  - Transaction wrapper included
  - Uniqueness guard prevents duplicate selected zones per announcement

#### Required Code Changes
- API/route layer (`index.js`):
  - No route path changes required if existing create/edit/send APIs are extended.
- Controller logic:
  - `controllers/announcement.js`:
    - Create/edit announcement should accept:
      - `zone_scope` (`all` or `selected`)
      - `zones` array when `zone_scope='selected'`
    - Persist selected zones into `announcement_zones`.
    - Replace old zone entries on edit.
    - On dispatch/send:
      - if `zone_scope='all'` -> no zone filter
      - if `zone_scope='selected'` -> filter recipients by normalized city value
    - Return selected zones in get/list detail responses.
- Validation/casting:
  - Validate `zones` is non-empty when `zone_scope='selected'`.
  - Normalize city names before save and filter (trim/lowercase/collapse spaces).
  - Optional validation: selected zones should exist in current `location_mappings.city_name` list at create time.
- Query/select/insert/update statements:
  - Add CRUD SQL for `announcement_zones`.
  - Dispatch query must include zone filter condition for selected scope.
  - Recipient zone source should be consistent (e.g., user address city normalization).
- Response shape changes:
  - Include `zone_scope` in announcement responses.
  - Include `zones` list for selected announcements.
- Config/permission impact:
  - None expected.

#### Testing Checklist
- Read path tests:
  - Announcement detail returns `zone_scope` + `zones`.
  - Legacy announcements default to `zone_scope='all'`.
- Write path tests:
  - Create scheduled announcement with selected zones.
  - Edit zones and verify replacement behavior.
  - Send selected-zone announcement reaches only matching recipients.
- Regression checks:
  - Existing non-zone announcement flow remains unchanged for `zone_scope='all'`.
  - Deleting announcement cascades zone rows.
- Manual verification SQL:
  - `SHOW COLUMNS FROM announcements LIKE 'zone_scope';`
  - `SHOW TABLES LIKE 'announcement_zones';`
  - `SELECT announcement_id, city_name, city_name_normalized FROM announcement_zones ORDER BY announcement_id, city_name_normalized;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Chosen approach is robust against `location_mappings` row changes because selected zones are stored as announcement snapshots.

---

### Change ID: V2-008
- Date: 2026-03-05
- Request summary: Add `orders.origin` to record where order came from; field should be editable and default to own platform source.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/order.js`, `controllers/admin_order.js`, `controllers/guest_order.js`

#### Previous State (DB)
- `orders` had no explicit source/origin field.
- Source attribution had to be inferred from flow/endpoint context.

#### Schema Changes in `v2.sql`
- Added:
  - `orders.origin` (`varchar(100) NOT NULL DEFAULT 'Own platform'`)
  - `KEY idx_orders_origin (origin)`
- Modified:
  - Orders now support explicit source tagging and later manual edits.
- Removed:
  - None.
- Constraint/index changes:
  - Added index for filtering/reporting by origin.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-008`
- Forward migration queries:
  - Add `origin` column with default
  - Add index `idx_orders_origin`
- Data backfill queries:
  - Not needed; existing rows receive default `Own platform` because column is non-null with default.
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- API/route layer (`index.js`):
  - No route path changes required.
- Controller logic:
  - `controllers/order.js`:
    - Include `origin` in order create payload (optional, default to `Own platform`).
    - Persist and return `origin` in order APIs.
  - `controllers/admin_order.js`:
    - Allow admin/manual order creation/edit with explicit `origin`.
  - `controllers/guest_order.js`:
    - Set guest flow origin values where appropriate (or keep default).
    - Ensure conversion from guest order preserves intended origin.
- Validation/casting:
  - Add string validation for `origin` (length <= 100).
  - Define controlled vocabulary at code level (recommended) while keeping DB flexible string.
- Query/select/insert/update statements:
  - Include `origin` in `INSERT INTO orders ...`.
  - Include `origin` in SELECT projections used by admin/user order detail/list/report endpoints.
  - Include `origin` in editable order update endpoints if user/admin can modify it.
- Response shape changes:
  - Add `origin` to order response DTOs.
- Config/permission impact:
  - None expected.

#### Testing Checklist
- Read path tests:
  - Existing orders show default `Own platform`.
  - List and detail endpoints return `origin`.
- Write path tests:
  - New order create stores provided origin or default.
  - Editable origin update persists correctly.
- Regression checks:
  - Existing order creation paths still work without providing origin.
- Manual verification SQL:
  - `SHOW COLUMNS FROM orders LIKE 'origin';`
  - `SHOW INDEX FROM orders WHERE Key_name = 'idx_orders_origin';`
  - `SELECT id, order_type, origin, created_at FROM orders ORDER BY id DESC LIMIT 50;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code updates intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-015
- Date: 2026-03-07
- Request summary: Simplify firebase credential storage to minimal fields: `id`, one JSON column, `is_active`, and timestamps.
- Superseded by: `V2-016` (remove `deleted_at`)
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `scripts/guidline.md`

#### Previous State (DB)
- `V2-014` introduced additional metadata columns (`credential_name`, `project_id`, verification fields, `updated_by_admin`).
- Requirement changed to keep the table minimal.

#### Schema Changes in `v2.sql`
- Simplified table `firebase_push_credentials` to:
  - `id`
  - `credential_json` (`JSON`)
  - `is_active`
  - `created_at`, `updated_at`, `deleted_at`
- Removed from target schema:
  - `credential_name`
  - `project_id`
  - `verification_status`
  - `verification_message`
  - `verified_at`
  - `updated_by_admin`
  - related FK and extra indexes

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-015`
- Forward migration queries:
  - Drop FK/indexes tied to removed columns
  - Drop non-minimal columns
  - Convert `credential_json` from `LONGTEXT` to native `JSON`
  - Drop old JSON check constraint (JSON type handles validity)
- Data backfill queries:
  - Not needed (existing JSON payload preserved in `credential_json`)

#### Required Code Changes
- Controller logic:
  - Keep verification logic in application layer:
    - parse uploaded JSON
    - verify with Firebase Admin SDK
    - only set `is_active=1` on successful verification
    - keep `is_active=0` on failed verification
- Cache flow:
  - cache only active credential payload
  - clear cache on create/update/activate/deactivate attempts
- Security:
  - never return full `credential_json` in standard API responses

#### Status
- `superseded`
- Notes:
  - `V2-015` superseded V2-014, and then `V2-016` finalized the single-row table by removing soft-delete.

---

### Change ID: V2-016
- Date: 2026-03-07
- Request summary: Remove `deleted_at` from `firebase_push_credentials`; table will be single-row and update-only.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `scripts/guidline.md`

#### Previous State (DB)
- After `V2-015`, table still had `deleted_at` + `idx_fpc_deleted`.
- This is unnecessary for one-row credential rotation/update flow.

#### Schema Changes in `v2.sql`
- Removed:
  - `firebase_push_credentials.deleted_at`
  - `idx_fpc_deleted`
- Kept:
  - `id`, `credential_json (JSON)`, `is_active`, `created_at`, `updated_at`

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-016`
- Forward migration queries:
  - Drop index `idx_fpc_deleted`
  - Drop column `deleted_at`
- Data backfill queries:
  - Not needed

#### Required Code Changes
- Controller logic:
  - Replace soft-delete behavior with update/replace behavior.
  - If multiple rows exist, enforce single-row rule in code (update latest or normalize to one active record).
- Query/select statements:
  - Remove `deleted_at IS NULL` filters for this table.

#### Status
- `in_progress`
- Notes:
  - Final Firebase credential table shape is now aligned to single-row update-only use case.

---

### Change ID: V2-017
- Date: 2026-03-07
- Request summary: Add order distribution system for auto queue assignment among admin/order manager plus manual assign and redistribute capabilities.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/order.js`, `controllers/admin_order.js`, `controllers/admin.js`

#### Previous State (DB)
- `orders` had no assignment owner fields.
- No distribution queue settings/agent pool.
- No assignment history table for manual/redistribution audit trail.

#### Schema Changes in `v2.sql`
- `orders` table additions:
  - `assigned_to_admin_id`
  - `assigned_by_admin_id`
  - `assignment_method` (`auto`/`manual`/`redistribute`)
  - `assigned_at`
  - indexes and FKs for assignment columns
- Added new tables:
  - `order_distribution_agents`
    - explicit eligible pool for auto distribution
    - supports serial queue order and optional max load
  - `order_distribution_settings`
    - single-row config for enabling/disabling auto assignment and role inclusion policy
    - stores `last_assigned_admin_id` for round-robin continuity
  - `order_assignment_logs`
    - immutable assignment history (`auto_assign`, `manual_assign`, `redistribute`, `unassign`)

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-017`
- Forward migration queries:
  - Alter `orders` with assignment columns/indexes/FKs
  - Create `order_distribution_agents`
  - Create `order_distribution_settings` + seed row id=1
  - Create `order_assignment_logs`
- Data backfill queries:
  - Not required (existing orders remain unassigned by default)
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- API/route layer (`index.js`):
  - Add endpoints for:
    - managing distribution agents
    - reading/updating distribution settings
    - manual assign / reassign order
    - assignment logs fetch
- Controller logic:
  - Auto assignment:
    - on new order create, if settings enabled, assign using round-robin over eligible `order_distribution_agents`.
    - update `orders.assigned_*` fields.
    - insert `order_assignment_logs` row with `action_type='auto_assign'`.
  - Manual assignment:
    - allow `SUPER_ADMIN`/`ADMIN` to assign unassigned or assigned order.
    - for already assigned orders, action should be `redistribute`.
    - write audit in `order_assignment_logs`.
  - Eligibility:
    - enforce assignee admin is active (`is_active=1`) and not deleted (`deleted_at IS NULL`).
    - enforce role check (`ADMIN` / `ORDER_MANAGER`) by joining admin roles.
- Validation/casting:
  - Validate target admin id and order id.
  - Prevent no-op reassign (`from_admin_id == to_admin_id`) unless explicitly allowed.
- Query/select/insert/update statements:
  - Include assignment fields in order list/detail queries.
  - Add workload queries per assignee for dashboard and queue.
- Response shape changes:
  - Include assignment metadata in order responses.
  - Include assignment logs in order/admin detail endpoints.
- Permission impact:
  - Recommend explicit permission keys:
    - `order.assignment.manage`
    - `order.assignment.redistribute`

#### Testing Checklist
- Read path tests:
  - Orders return assignment metadata.
  - Assignment logs return accurate sequence.
- Write path tests:
  - Auto assign on order create when enabled.
  - Manual assign by authorized admin.
  - Redistribute already assigned order.
  - Unassign action creates log if supported.
- Regression checks:
  - Order creation still works when auto assignment is disabled.
  - Deleted/inactive assignees are skipped by auto queue.
- Manual verification SQL:
  - `SHOW COLUMNS FROM orders LIKE 'assigned%';`
  - `SELECT id, assigned_to_admin_id, assignment_method, assigned_at FROM orders ORDER BY id DESC LIMIT 50;`
  - `SELECT * FROM order_distribution_settings;`
  - `SELECT * FROM order_distribution_agents ORDER BY serial, id;`
  - `SELECT order_id, action_type, from_admin_id, to_admin_id, changed_by_admin_id, created_at FROM order_assignment_logs ORDER BY id DESC LIMIT 100;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code implementation intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-011
- Date: 2026-03-06
- Request summary: Add custom bulk and combo discount capabilities on top of SKU/coupon pricing, plus overall-cart discount policy from `permission_config`.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/order.js`, `controllers/guest_order.js`, `controllers/product.js`, `controllers/config.js`, `config/PermissionSettingsDB.js`

#### Previous State (DB)
- SKU pricing existed in `product_skus` (`buying_price`, `selling_price`, `discount`, `discount_type`).
- Coupon system existed (`coupons`, `coupon_product_targets`, `coupon_customer_targets`, `coupon_usages`).
- No dedicated schema for:
  - SKU-level bulk discount tiers
  - Multi-SKU combo discount tiers
  - Overall-cart discount policy tied to item-count/total-selling-price thresholds

#### Schema Changes in `v2.sql`
- Added:
  - `sku_bulk_discount_rules`
  - `combo_discount_rules`
  - `combo_discount_rule_tiers`
  - `combo_discount_tier_items`
- Modified:
  - Discount data model now supports three layers:
    - per-SKU bulk
    - combo tier
    - overall-cart policy (config-driven)
- Removed:
  - None.
- Constraint/index changes:
  - uniqueness to prevent duplicate tiers (`product_sku_id + min_qty`, `combo_rule_id + serial`, `combo_tier_id + product_sku_id`)
  - FK cascades to keep discount rules consistent with SKU/rule deletions

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-011`
- Forward migration queries:
  - Create the four new discount tables
  - Seed `permission_config` with `overall_cart_discount` policy keys
- Data backfill queries:
  - No historical data backfill required (new feature tables start empty)
- Safety guards:
  - Transaction wrapper included
  - Permission seed uses `ON DUPLICATE KEY UPDATE` for idempotence

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin CRUD endpoints for:
    - bulk SKU discount rules
    - combo rules + tiers + tier items
- Controller logic:
  - `controllers/product.js` (or dedicated pricing controller):
    - CRUD for `sku_bulk_discount_rules`
    - CRUD for `combo_discount_rules`, `combo_discount_rule_tiers`, `combo_discount_tier_items`
  - `controllers/order.js` and `controllers/guest_order.js`:
    - Apply pricing in deterministic sequence (recommended):
      1. base SKU discount (`product_skus.discount`)
      2. SKU bulk discount
      3. combo discount
      4. coupon discount (if valid)
      5. overall-cart discount (according to `permission_config`)
    - Respect config key `apply_with_bulk_combo` when deciding overall discount stacking.
  - `controllers/config.js` + `config/PermissionSettingsDB.js`:
    - Add permission definitions for new `overall_cart_discount` keys so patch API can validate/manage them.
- Validation/casting:
  - Ensure `discount_type` values limited to `0/1` in tables and `flat/percentage` in config enum keys.
  - Validate quantities and discount values are non-negative.
  - Ensure combo tier has at least one item row.
- Query/select/insert/update statements:
  - Add joins/queries to evaluate best matching SKU bulk tier by quantity.
  - Add combo matching logic across cart items for tier requirements.
  - Add policy reads from `permission_config` for threshold basis and stacking behavior.
- Response shape changes:
  - Expose applied discount breakdown:
    - `sku_bulk_discount_total`
    - `combo_discount_total`
    - `overall_discount_total`
    - plus existing coupon/sku/base totals
- Config/permission impact:
  - New `permission_config` section: `overall_cart_discount` with keys:
    - `enabled` (bool)
    - `basis` (enum: `item_count`, `total_selling_price`)
    - `min_item_count` (string numeric)
    - `min_total_selling_price` (string numeric)
    - `discount_type` (enum: `flat`, `percentage`)
    - `discount_value` (string numeric)
    - `apply_with_bulk_combo` (bool)

#### Testing Checklist
- Read path tests:
  - Fetch bulk/combo rules with tiers/items.
  - Fetch permission config includes `overall_cart_discount` keys.
- Write path tests:
  - Create/update/delete SKU bulk tiers.
  - Create/update/delete combo rules and tier-item sets.
  - Update overall-cart discount policy via permission-config patch.
- Pricing regression tests:
  - SKU bulk only scenario.
  - Combo only scenario.
  - Both bulk and combo present.
  - Overall discount disabled/enabled.
  - Overall discount with `apply_with_bulk_combo=false` and `true`.
  - Coupon + new discounts coexistence and order of operations.
- Manual verification SQL:
  - `SHOW TABLES LIKE 'sku_bulk_discount_rules';`
  - `SHOW TABLES LIKE 'combo_discount_rules';`
  - `SELECT * FROM permission_config WHERE section='overall_cart_discount' ORDER BY key_name;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code implementation intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-014
- Date: 2026-03-07
- Request summary: Add dedicated Firebase push credential flow (separate from system_config/permission_config) with active status and JSON verification support.
- Superseded by: `V2-015` (final simplified table shape)
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `config/ApplicationSettingsDB.js`, `config/firebase.js`, `controllers/config.js`

#### Previous State (DB)
- No dedicated DB table for Firebase Admin SDK credential JSON.
- Existing config tables (`system_config`, `permission_config`) are not suitable for large structured service account JSON payload lifecycle + verification metadata.

#### Schema Changes in `v2.sql`
- Added table: `firebase_push_credentials`
  - `credential_json` (`LONGTEXT`, required, JSON-valid check)
  - `is_active` (active/inactive)
  - verification fields:
    - `verification_status` (`unverified`, `verified`, `failed`)
    - `verification_message`
    - `verified_at`
  - audit/editor fields:
    - `updated_by_admin`
    - timestamps + `deleted_at`
  - optional parsed `project_id` for quick display/filter/debug
- Constraint/index changes:
  - JSON validity check: `json_valid(credential_json)`
  - FK `updated_by_admin -> admins.id`
  - indexes for active/deleted/verification states

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-014`
- Forward migration queries:
  - Create `firebase_push_credentials` table with constraints/indexes
- Data backfill queries:
  - Not required
- Safety guards:
  - Transaction wrapper included
  - JSON validity enforced at DB layer

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin endpoints:
    - create/update firebase credential JSON
    - activate/deactivate credential
    - verify credential
    - get active credential metadata (without exposing private key)
- Controller logic:
  - `controllers/config.js` (or dedicated controller):
    - Save uploaded JSON as a single string in `credential_json`.
    - Extract/store `project_id` from JSON if present.
    - When activating one credential, deactivate others in same transaction (single-active policy in code).
    - Verify by initializing Firebase Admin app with candidate credential and performing a harmless auth check.
    - Update `verification_status`, `verification_message`, `verified_at`.
- Cache flow:
  - Add cache helper similar to existing config cache:
    - `getActiveFirebaseCredential(connection, forceReload=false)`
    - `clearFirebaseCredentialCache()`
  - Clear cache after create/update/activate/deactivate/verify operations.
- Security rules:
  - Never return full `credential_json` in list/detail APIs.
  - Return masked metadata only (e.g., `project_id`, `updated_at`, status flags).
  - Audit log every credential create/update/activation event.
- Validation/casting:
  - Validate incoming JSON parse before save.
  - Ensure required Firebase service-account keys exist (`type`, `project_id`, `private_key`, `client_email`, etc.).

#### Testing Checklist
- Read path tests:
  - Active credential metadata fetch works and uses cache.
- Write path tests:
  - Create credential with valid JSON.
  - Reject invalid JSON.
  - Activate one credential deactivates others.
  - Verify success/failure updates verification fields.
- Regression checks:
  - Existing system_config/permission_config flows unaffected.
  - Push notification sender uses active credential cache.
- Manual verification SQL:
  - `SHOW TABLES LIKE 'firebase_push_credentials';`
  - `SELECT id, project_id, is_active, verification_status, verified_at, updated_at, deleted_at FROM firebase_push_credentials ORDER BY id DESC;`

#### Status
- `superseded`
- Notes:
  - Kept for migration history only.
  - Final target schema is documented in `V2-015`.

---

### Change ID: V2-012
- Date: 2026-03-06
- Request summary: Correct overall-cart discount config key value types from `string` to `number`.
- Requested by: System consistency follow-up
- Related files referenced: `scripts/updatequerylist.sql`, `config/PermissionSettingsDB.js`, `controllers/config.js`

#### Previous State (DB)
- In `V2-011` seed, numeric keys were inserted with `value_type='string'`:
  - `min_item_count`
  - `min_total_selling_price`
  - `discount_value`
- This is inconsistent with strict config patch validation intent.

#### Schema Changes in `v2.sql`
- No table-structure change.
- Data/config semantics updated via migration.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-012`
- Forward migration queries:
  - Update `permission_config.value_type` to `number` for the three keys.
- Data backfill queries:
  - Not needed beyond value_type update.
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- `config/PermissionSettingsDB.js`:
  - Add `overall_cart_discount` definitions with `value_type: "number"` for:
    - `min_item_count`
    - `min_total_selling_price`
    - `discount_value`
- `controllers/config.js`:
  - Extend `validatePermissionUpdates`, parse/serialize helpers to support `number` type.
  - Ensure numeric parsing rejects NaN/negative when not allowed.

#### Status
- `in_progress`
- Notes:
  - This fix prevents future mismatch between config seed and validation rules during patch operations.

---

### Change ID: V2-013
- Date: 2026-03-06
- Request summary: Add dynamic policy functionality so admin can edit all policy types (privacy, terms, refund, return, copyright) with HTML content support.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/config.js` (or dedicated policy controller), `index.js`

#### Previous State (DB)
- No dedicated table for editable policy pages.
- Policy content was not centrally modeled as dynamic CMS-like data.

#### Schema Changes in `v2.sql`
- Added table: `dynamic_policies`
  - `policy_key` (unique logical key, e.g. `privacy_policy`)
  - `title`
  - `content` (`LONGTEXT`, supports large HTML input)
  - `content_type` (`html`/`text`)
  - `status`, `updated_by_admin`, timestamps, `deleted_at`
- Constraint/index changes:
  - Unique key on `policy_key`
  - FK `updated_by_admin -> admins.id` (`ON DELETE SET NULL`)
  - status/deleted indexes for admin/public fetch performance

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-013`
- Forward migration queries:
  - Create `dynamic_policies` table
  - Seed default policy rows:
    - `privacy_policy`
    - `terms_and_conditions`
    - `refund_policy`
    - `return_policy`
    - `copyright_policy`
- Data backfill queries:
  - Not applicable; seeded with empty editable content.
- Safety guards:
  - Transaction wrapper included
  - Seed uses `ON DUPLICATE KEY UPDATE` for idempotence

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin endpoints:
    - create/update policy by `policy_key`
    - list/get policies
    - soft delete/restore policy (optional)
  - Add public endpoint(s):
    - fetch active policy by `policy_key`
    - fetch all active policy pages
- Controller logic:
  - Add policy controller (or extend `controllers/config.js`) to manage `dynamic_policies`.
  - Record `updated_by_admin` from authenticated admin.
  - Enforce soft-delete behavior using `deleted_at`.
- Validation/casting:
  - Validate `policy_key` format and whitelist/allowlist behavior.
  - Validate `content_type` in (`html`, `text`).
  - Optional HTML sanitization before save to prevent unsafe markup.
- Query/select/insert/update statements:
  - Admin list should include inactive/deleted options.
  - Public queries must enforce `status=1 AND deleted_at IS NULL`.
- Response shape changes:
  - Include `policy_key`, `title`, `content`, `content_type`, `updated_at`.
- Config/permission impact:
  - Recommend admin permission key for policy management (e.g., `content.policy.manage`).

#### Testing Checklist
- Read path tests:
  - Public fetch returns active policy content.
  - Admin fetch returns all with status/deleted filters.
- Write path tests:
  - Admin can update HTML content in `LONGTEXT`.
  - Soft delete hides policy from public endpoint.
  - Restore returns policy to public endpoint.
- Regression checks:
  - Existing config/system endpoints unaffected.
- Manual verification SQL:
  - `SHOW TABLES LIKE 'dynamic_policies';`
  - `SELECT policy_key, title, content_type, status, deleted_at FROM dynamic_policies ORDER BY policy_key;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code implementation intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-009
- Date: 2026-03-05
- Request summary: Use human-readable origin labels (`Own platform`, `WhatsApp`, `Facebook`) instead of `own_platform`.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `scripts/guidline.md`

#### Previous State (DB)
- `orders.origin` default/value style used snake_case-like label (`own_platform`).

#### Schema Changes in `v2.sql`
- Modified:
  - `orders.origin` default changed to `'Own platform'`.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-009`
- Forward migration queries:
  - Alter `orders.origin` default to `'Own platform'`.
  - Normalize existing values:
    - `own_platform` variants -> `Own platform`
    - `whatsapp` -> `WhatsApp`
    - `facebook` -> `Facebook`

#### Required Code Changes
- Validation/casting:
  - Standardize origin labels in code (recommended canonical values):
    - `Own platform`
    - `WhatsApp`
    - `Facebook`
- Query/select/insert/update statements:
  - Ensure new inserts default to `Own platform` if omitted.
- Response shape changes:
  - Return normalized labels consistently.

#### Status
- `in_progress`
- Notes:
  - Kept column as `varchar` for future source labels while enforcing readable defaults now.

---

### Change ID: V2-010
- Date: 2026-03-06
- Request summary: Record user IP when placing both regular and guest orders.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/order.js`, `controllers/guest_order.js`, `controllers/admin_order.js`

#### Previous State (DB)
- `orders` and `guest_orders` had no dedicated IP address field for order placement source.
- Some other tables used `VARBINARY(16)` for IP capture (`page_view_logs`, `product_view_logs`), but orders did not.

#### Schema Changes in `v2.sql`
- Added:
  - `orders.ip_address` (`varbinary(16)`, nullable)
  - `guest_orders.ip_address` (`varbinary(16)`, nullable)
  - `KEY idx_orders_ip_address (ip_address)`
  - `KEY idx_guest_ip_address (ip_address)`
- Modified:
  - Order entities can now retain placement IP for audit/risk/debug.
- Removed:
  - None.
- Constraint/index changes:
  - Added IP indexes for future fraud/report filters.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-010`
- Forward migration queries:
  - Add `ip_address` + index to `orders`
  - Add `ip_address` + index to `guest_orders`
- Data backfill queries:
  - Not required (historical rows remain null)
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- API/route layer (`index.js`):
  - No route path changes required.
- Controller logic:
  - `controllers/order.js`:
    - Capture request IP on order create and save into `orders.ip_address`.
  - `controllers/guest_order.js`:
    - Capture request IP for guest order creation/placement and save into `guest_orders.ip_address`.
  - `controllers/admin_order.js`:
    - Decide behavior for admin-created orders (store request IP/admin panel IP if applicable).
- Validation/casting:
  - Parse and normalize IP source (proxy-aware), then convert to packed binary format for `VARBINARY(16)`.
- Query/select/insert/update statements:
  - Add `ip_address` fields to relevant `INSERT INTO orders` and `INSERT/UPDATE guest_orders` statements.
  - Keep output formatting choice explicit:
    - either hide IP in public APIs
    - or unpack to string only for admin/debug responses.
- Response shape changes:
  - Optional: expose string IP only in admin/internal views.
- Config/permission impact:
  - If behind proxy, ensure trusted proxy config is correct so captured IP is client IP.

#### Testing Checklist
- Read path tests:
  - Verify regular order rows receive packed IP.
  - Verify guest order rows receive packed IP.
- Write path tests:
  - IPv4 capture works.
  - IPv6 capture works.
  - Missing/invalid IP path handled safely (null fallback if needed).
- Regression checks:
  - Existing order creation still works when IP conversion helper fails gracefully.
- Manual verification SQL:
  - `SHOW COLUMNS FROM orders LIKE 'ip_address';`
  - `SHOW COLUMNS FROM guest_orders LIKE 'ip_address';`
  - `SELECT id, HEX(ip_address) AS ip_hex FROM orders ORDER BY id DESC LIMIT 20;`
  - `SELECT id, HEX(ip_address) AS ip_hex FROM guest_orders ORDER BY created_at DESC LIMIT 20;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration prepared.
  - Code updates intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-018
- Date: 2026-03-07
- Request summary: Replace legacy 2-key admin order-status notification setup with 6-channel model across order/personal notifications, and support per-admin enable/disable control from admin panel.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `config/PermissionSettingsDB.js`, `controllers/config.js`

#### Previous State (DB)
- Global config table `permission_config` had only legacy section/keys:
  - `section='order_status_notification_admin'`, `scope='default'`, keys: `email`, `sms`.
- No dedicated per-admin notification matrix table existed.
- Result: system had only 2 global toggles and could not support channel-level permission per admin user.

#### Schema Changes in `v2.sql`
- Added table: `admin_notification_permissions`
  - `id` (PK)
  - `admin_id` (unique FK to `admins.id`, `ON DELETE CASCADE`)
  - Order notification channels:
    - `order_notification_email`
    - `order_notification_sms`
    - `order_notification_firebase_push`
  - Personal notification channels:
    - `personal_notification_email`
    - `personal_notification_sms`
    - `personal_notification_firebase_push`
  - Audit:
    - `updated_by_admin` (FK to `admins.id`, `ON DELETE SET NULL`)
    - `created_at`, `updated_at`
- Constraint/index changes:
  - `UNIQUE KEY uniq_admin_notification_permissions_admin (admin_id)` enforces single row per admin.
  - FK/index on `updated_by_admin` for audit trail.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-018`
- Forward migration queries:
  - Delete deprecated keys from `permission_config`:
    - `order_status_notification_admin` + `default` scope + keys `email`,`sms`.
  - Insert/Upsert new 6 global keys in `permission_config`:
    - `order__notification_admin`: `email`, `sms`, `firebase_push_notification`
    - `personal_notification_admin`: `email`, `sms`, `firebase_push_notification`
  - Create `admin_notification_permissions` table.
  - Seed one permission row per existing admin (`INSERT ... SELECT` with left-join guard).
- Data backfill queries:
  - Backfill is default-value based via seed insert for all existing admins.
- Safety guards:
  - Transaction wrapper included.
  - New key inserts use `ON DUPLICATE KEY UPDATE` to keep migration idempotent for re-run scenarios.

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin APIs for listing and patching per-admin notification permissions.
  - Add optional bulk update endpoint for super-admin workflows.
- Controller logic:
  - `controllers/config.js`:
    - Remove dependency on legacy `order_status_notification_admin` key set.
    - Read/write new global keys under:
      - `order__notification_admin`
      - `personal_notification_admin`
    - Add read/write methods for `admin_notification_permissions` table.
    - Enforce role-based restrictions when enabling order notification channels (e.g., catalog manager/read-only manager cannot enable order-channel permissions).
  - Admin management controller (if separate):
    - Return joined admin + permission-matrix payload for dedicated UI tab.
- Validation/casting:
  - `config/PermissionSettingsDB.js`:
    - Remove old 2-key definitions:
      - `section: "order_status_notification_admin"` keys `email`, `sms`.
    - Add 6 new definitions matching DB keys exactly:
      - `order__notification_admin`: `email`, `sms`, `firebase_push_notification`
      - `personal_notification_admin`: `email`, `sms`, `firebase_push_notification`
    - Keep `value_type: "bool"` for all 6.
  - Add strict boolean validation for per-admin matrix patch input.
- Query/select/insert/update statements:
  - Build admin list query with left join:
    - `admins` + `admin_notification_permissions`.
  - On admin creation, insert default matrix row automatically.
  - On admin delete/deactivation behavior:
    - Row cleanup for hard delete is automatic by FK cascade.
    - For soft-delete admins, keep row unchanged unless business rule says otherwise.
- Response shape changes:
  - For admin permission tab, expose both global and per-admin values.
  - Include computed `can_enable_order_notification` flag based on role to simplify frontend toggle disable state.
- Config/permission impact:
  - Legacy section `order_status_notification_admin` should be treated as removed.
  - Notification dispatch layer must check both:
    - global section key enabled
    - target admin’s per-admin channel enabled.

#### Testing Checklist
- Read path tests:
  - `permission_config` returns 6 new keys and no legacy 2 keys.
  - Admin list endpoint returns one matrix row per admin.
- Write path tests:
  - Patch global keys for both sections.
  - Patch per-admin channel values.
  - Role-restricted admins cannot enable forbidden order channels.
- Regression checks:
  - Existing notification jobs/dispatch do not reference removed key names.
  - New admin creation auto-seeds matrix row correctly.
- Manual verification SQL:
  - `SELECT section, scope, key_name, value FROM permission_config WHERE section IN ('order__notification_admin','personal_notification_admin','order_status_notification_admin') ORDER BY section,key_name;`
  - `SELECT a.id, a.name, p.order_notification_email, p.order_notification_sms, p.order_notification_firebase_push, p.personal_notification_email, p.personal_notification_sms, p.personal_notification_firebase_push FROM admins a LEFT JOIN admin_notification_permissions p ON p.admin_id = a.id ORDER BY a.id;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration completed.
  - Code implementation intentionally postponed per DB-only restructuring phase.



---

### Change ID: V2-019
- Date: 2026-03-07
- Request summary: Support admin order-edit flow where reduced/cancelled items can be refunded in multiple parts; store each refund record with method, reference, and amount.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/order.js`, `controllers/admin_order.js`

#### Previous State (DB)
- `orders` stored payment aggregates (`paid_amount`, `due_amount`) but had no dedicated multi-refund ledger.
- `order_payments` tracked incoming payments only.
- No structured way to keep multiple refund records per single order.

#### Schema Changes in `v2.sql`
- Added table: `order_refunds`
  - `id` (PK)
  - `order_id` (FK to `orders.id`, required)
  - `order_payment_id` (optional FK to `order_payments.id`)
  - `refund_method` enum: `original_method`, `bank_transfer`, `mobile_banking`, `cash`, `other`
  - `status` enum: `pending`, `processed`, `failed`
  - `refund_reference` (bank/gateway/manual reference)
  - `refund_amount` (decimal)
  - `note`
  - `refunded_by_admin` (FK to `admins.id`)
  - `refunded_at`, `created_at`
- Constraint/index changes:
  - One-to-many refund history via `order_id`.
  - Optional linkage to source payment row via `order_payment_id`.
  - Indexes for order timeline, admin audit, and status reports.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-019`
- Forward migration queries:
  - Create `order_refunds` table with FKs and indexes.
- Data backfill queries:
  - None (new feature table starts empty).
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin refund endpoints under order-management flow:
    - create refund entry
    - list refund history per order
    - optional update status (pending/processed/failed)
- Controller logic:
  - `controllers/order.js` / `controllers/admin_order.js`:
    - During admin order-edit (quantity reduction/item removal), calculate refundable amount.
    - Insert one `order_refunds` row per refund action (do not overwrite previous rows).
    - Support manual refund and source-method refund mode.
    - Save `refund_reference` for traceability (bank ref/gateway ref/manual ref).
    - Update order financial aggregates after processed refund (at minimum recompute due/paid/refund view logic).
- Validation/casting:
  - Validate `refund_amount > 0`.
  - Validate `refund_amount` does not exceed remaining refundable balance for the order.
  - Validate enum values for `refund_method` and `status`.
- Query/select/insert/update statements:
  - Add refund history join/query for admin order detail.
  - Add sum query per order (e.g., total refunded amount = SUM(processed refunds)).
- Response shape changes:
  - Return refund timeline array in admin order details.
  - Return computed totals: `total_refunded`, `refundable_remaining`.
- Config/permission impact:
  - Recommend dedicated permission for order refund actions (e.g., `order.refund.manage`).

#### Testing Checklist
- Read path tests:
  - Order detail returns multiple refund records in time order.
- Write path tests:
  - Create first refund for order.
  - Create second refund for same order.
  - Refund with and without `order_payment_id`.
  - Reject over-refund attempts.
- Regression checks:
  - Existing order payment create flow unaffected.
  - Existing order status history unaffected.
- Manual verification SQL:
  - `SHOW TABLES LIKE 'order_refunds';`
  - `SELECT order_id, COUNT(*) AS refund_rows, SUM(CASE WHEN status='processed' THEN refund_amount ELSE 0 END) AS processed_refund_total FROM order_refunds GROUP BY order_id ORDER BY order_id DESC;`
  - `SELECT id, order_id, order_payment_id, refund_method, status, refund_reference, refund_amount, refunded_by_admin, refunded_at FROM order_refunds ORDER BY id DESC LIMIT 100;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration completed.
  - Code implementation intentionally postponed until DB restructuring phase is complete.

---

### Change ID: V2-020
- Date: 2026-03-07
- Request summary: Add complete communication history for email, SMS, and push notifications across current flows (order/payment, forgot password, welcome, announcement, support reply) and future personal/admin notification features.
- Requested by: Product owner
- Related files referenced: `scripts/v2.sql`, `scripts/updatequerylist.sql`, `controllers/announcement.js`, `controllers/user.js`, `controllers/admin.js`, `controllers/order.js`, `controllers/contact.js`, `helpers/sms.js`, `mail-templates/*`, `config/firebase.js`

#### Previous State (DB)
- No unified notification history tables existed for email/SMS/push.
- Existing communication records were fragmented:
  - `contact_replies` kept support reply text + channel (`email`/`sms`) only.
  - Announcements tracked campaign metadata in `announcements`, but not per-recipient delivery outcomes.
  - User/admin/order email and SMS sends had no dedicated dispatch history ledger.
  - No push notification delivery history table existed.
- Result: no central audit trail for what was sent, to whom, by which channel/provider, and whether delivery failed/succeeded.

#### Current Codebase Flows Mapped (for this schema)
- Email flows currently in code:
  - user email verification OTP
  - user welcome email
  - user forgot password email OTP
  - admin forgot password email OTP
  - order/payment status emails
  - announcement bulk/manual email sends
  - support reply email
- SMS flows currently in code:
  - user forgot password OTP SMS
  - user phone OTP SMS
  - support reply SMS
- Push flows:
  - Firebase credential infrastructure exists (`firebase_push_credentials`, `config/firebase.js`) and push feature is planned; history schema added now to support rollout.

#### Schema Changes in `v2.sql`
- Added table: `notification_batches`
  - Purpose: campaign/job level tracking (bulk announcement, personal broadcast, future queue jobs).
  - Key fields: source type/id, channel mix, audience type, status, schedule/start/finish times, totals (`total_target`, `total_sent`, `total_failed`), metadata JSON.
- Added table: `notification_histories`
  - Purpose: per-recipient notification ledger across email/SMS/push.
  - Key fields:
    - channel/category
    - recipient identity (user/admin/subscriber/guest/manual)
    - recipient address/token (`recipient_email`, `recipient_phone`, `device_token`)
    - content snapshot (`title`, `message`, `template_key`)
    - provider data (`provider`, `provider_message_id`)
    - delivery status/timestamps (`queued/sent/failed/delivered/read/cancelled`)
    - relation hooks (`related_order_id`, `related_announcement_id`, `related_contact_message_id`)
    - actor/schedule metadata (`triggered_by_admin_id`, `scheduled_at`, `meta`)
- Added table: `notification_attempts`
  - Purpose: retry/attempt-level provider diagnostics (request/response payloads, http status, success/failure per attempt_no).
- Constraint/index changes:
  - Foreign keys for actor and relation integrity where applicable.
  - High-value indexes for channel+status+time, recipient lookups, and provider message traceability.

#### Migration SQL Added to `updatequerylist.sql`
- Block label: `V2-020`
- Forward migration queries:
  - Create `notification_batches`.
  - Create `notification_histories`.
  - Create `notification_attempts`.
- Data backfill queries:
  - Backfill legacy `contact_replies` into `notification_histories` as `category='contact_reply'` with mapped channel/email/phone and sent timestamp.
- Safety guards:
  - Transaction wrapper included.

#### Required Code Changes
- API/route layer (`index.js`):
  - Add admin endpoints for notification history listing/filtering/detail.
  - Add optional endpoint for batch analytics (announcement/personal campaigns).
- Controller logic:
  - `controllers/announcement.js`:
    - Create one `notification_batches` row per send action.
    - Insert one `notification_histories` row per recipient before/after send.
    - Update status + provider message refs and counters (`total_sent/failed`).
  - `controllers/user.js`, `controllers/admin.js`, `controllers/order.js`, `controllers/contact.js`:
    - On each email/SMS send, write into `notification_histories`.
    - On send failure, set `status='failed'`, store `error_message`.
  - Future push sender integration:
    - Write push sends into `notification_histories` and each retry into `notification_attempts`.
- Helper/template layer:
  - `helpers/sms.js` and mail template senders should return provider response/message IDs where possible.
  - Persist each retry/attempt in `notification_attempts`.
- Validation/casting:
  - Validate enum fields for channel/category/recipient_type/status.
  - Enforce at least one recipient endpoint per row (email/phone/device token) in application validation.
- Query/select/insert/update statements:
  - Add aggregated queries for:
    - sent vs failed by channel/category/date
    - per-order communication timeline
    - per-admin personal notification timeline
- Config/permission impact:
  - Optional new permission section for notification history visibility/manage rights (recommended in later code phase).

#### Testing Checklist
- Read path tests:
  - Filter notification history by channel, status, category, recipient, date range.
  - Fetch communication timeline for a specific order.
- Write path tests:
  - Email send creates history row.
  - SMS send creates history row.
  - Failed send records error status.
  - Retry writes incremented `notification_attempts.attempt_no`.
- Backfill verification:
  - `contact_replies` rows are reflected in `notification_histories` after migration.
- Regression checks:
  - Existing announcement/user/order/contact workflows remain functionally unchanged while adding logging.
- Manual verification SQL:
  - `SHOW TABLES LIKE 'notification_%';`
  - `SELECT channel, category, status, COUNT(*) FROM notification_histories GROUP BY channel, category, status;`
  - `SELECT * FROM notification_batches ORDER BY id DESC LIMIT 20;`
  - `SELECT notification_history_id, attempt_no, status, provider, attempted_at FROM notification_attempts ORDER BY id DESC LIMIT 50;`

#### Status
- `in_progress`
- Notes:
  - DB schema + migration completed.
  - Code implementation intentionally postponed until DB restructuring phase is complete.
