-- Version 2 Update Query List
-- Purpose: incremental migration SQL blocks to move DB from current production-aligned state toward V2.
-- Rule: append-only. Do not delete old blocks.

-- =====================================================================
-- TEMPLATE
-- =====================================================================
-- [V2-XXX] <short-title>
-- Date: YYYY-MM-DD
-- Summary: <what is changing>
-- Preconditions: <optional>

-- START V2-XXX
-- Use transaction when needed
-- START TRANSACTION;

-- DDL changes
-- ALTER TABLE ...;

-- Data backfill changes
-- UPDATE ...;

-- Constraint/index updates
-- CREATE INDEX ...;

-- COMMIT;
-- END V2-XXX

-- =====================================================================
-- CHANGE LOG (append below this line)
-- =====================================================================

-- [V2-001] admins-soft-delete-over-is-active
-- Date: 2026-03-05
-- Summary: Replace `admins.is_active` with soft delete fields so admin deactivation/reactivation is handled by `deleted_at`.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Ensure application code is updated before this is applied in production.
--   3) Backup `admins` table.

-- START V2-001
START TRANSACTION;

-- Add soft delete fields
ALTER TABLE `admins`
  ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL AFTER `token_version`,
  ADD COLUMN `deleted_by_admin_id` INT DEFAULT NULL AFTER `deleted_at`;

-- Backfill existing inactive admins as soft-deleted
UPDATE `admins`
SET
  `deleted_at` = NOW(),
  `deleted_by_admin_id` = NULL
WHERE `is_active` = 0
  AND `deleted_at` IS NULL;

-- Add indexes and FK for deletion actor tracking
ALTER TABLE `admins`
  ADD KEY `idx_admins_deleted_at` (`deleted_at`),
  ADD KEY `idx_admins_deleted_by_admin` (`deleted_by_admin_id`),
  ADD CONSTRAINT `fk_admins_deleted_by_admin`
    FOREIGN KEY (`deleted_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

-- Remove old active flag
ALTER TABLE `admins`
  DROP COLUMN `is_active`;

COMMIT;
-- END V2-001

-- [V2-002] admins-keep-is-active-plus-soft-delete
-- Date: 2026-03-05
-- Summary: Correction to V2-001. Keep `admins.is_active` for activation/deactivation and also keep soft-delete columns.
-- Preconditions:
--   1) Apply only if V2-001 was already executed in an environment.
--   2) If V2-001 was NOT executed, skip this block.

-- START V2-002
START TRANSACTION;

-- Re-introduce activation flag (kept alongside soft delete)
ALTER TABLE `admins`
  ADD COLUMN `is_active` TINYINT(1) DEFAULT 1 AFTER `token_version`;

-- Backfill activation state from soft-delete state for consistency
-- Active only when not soft-deleted
UPDATE `admins`
SET `is_active` = CASE WHEN `deleted_at` IS NULL THEN 1 ELSE 0 END;

COMMIT;
-- END V2-002

-- [V2-003] variants-priority-to-serial-for-drag-drop
-- Date: 2026-03-05
-- Summary: Replace `variants.priority` with `variants.serial` to support drag-and-drop ordering.
-- Preconditions:
--   1) Apply once.
--   2) Run in maintenance window.
--   3) Deploy code updates that use `serial` after this migration.

-- START V2-003
START TRANSACTION;

-- Add new ordering column
ALTER TABLE `variants`
  ADD COLUMN `serial` INT NOT NULL DEFAULT 1 AFTER `name`;

-- Backfill serial per attribute using current display order logic:
-- priority DESC, updated_at DESC, id ASC
UPDATE `variants` v
JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY attribute_id
      ORDER BY priority DESC, updated_at DESC, id ASC
    ) AS serial_no
  FROM `variants`
) x ON x.id = v.id
SET v.serial = x.serial_no;

-- Replace old index and remove old column
ALTER TABLE `variants`
  DROP INDEX `idx_var_attr_priority`,
  ADD KEY `idx_var_attr_serial` (`attribute_id`, `serial`),
  DROP COLUMN `priority`;

COMMIT;
-- END V2-003

-- [V2-004] product-images-priority-to-serial-for-drag-drop
-- Date: 2026-03-05
-- Summary: Replace `product_images.priority` with `product_images.serial` so admin can reorder images by drag-and-drop.
-- Preconditions:
--   1) Apply once.
--   2) Run in maintenance window.
--   3) Deploy code updates that use `serial` after this migration.

-- START V2-004
START TRANSACTION;

-- Add new ordering column
ALTER TABLE `product_images`
  ADD COLUMN `serial` INT NOT NULL DEFAULT 1 AFTER `img_path`;

-- Backfill serial per product using current display order logic:
-- priority ASC, id ASC
UPDATE `product_images` pi
JOIN (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY product_id
      ORDER BY priority ASC, id ASC
    ) AS serial_no
  FROM `product_images`
) x ON x.id = pi.id
SET pi.serial = x.serial_no;

-- Replace old index and remove old column
ALTER TABLE `product_images`
  DROP INDEX `product_id`,
  ADD KEY `idx_pi_product_serial` (`product_id`, `serial`),
  DROP COLUMN `priority`;

COMMIT;
-- END V2-004

-- [V2-005] products-add-face-image-for-listing-performance
-- Date: 2026-03-05
-- Summary: Add `products.face_image` to serve lightweight listing thumbnails and reduce traffic.
-- Preconditions:
--   1) Apply after V2-004 so `product_images.serial` exists.
--   2) Run in maintenance window.
--   3) Deploy code updates to generate optimized face images in separate folder.

-- START V2-005
START TRANSACTION;

-- Add dedicated thumbnail/face image column
ALTER TABLE `products`
  ADD COLUMN `face_image` VARCHAR(512) NULL AFTER `video_path`;

-- Optional bootstrap backfill:
-- set face_image from first product image (serial=1) so listings have immediate fallback
UPDATE `products` p
LEFT JOIN (
  SELECT product_id, img_path
  FROM (
    SELECT
      pi.product_id,
      pi.img_path,
      ROW_NUMBER() OVER (
        PARTITION BY pi.product_id
        ORDER BY pi.serial ASC, pi.id ASC
      ) AS rn
    FROM `product_images` pi
  ) ranked
  WHERE rn = 1
) first_img ON first_img.product_id = p.id
SET p.face_image = first_img.img_path
WHERE p.face_image IS NULL;

COMMIT;
-- END V2-005

-- [V2-006] add-weight-based-delivery-pricing
-- Date: 2026-03-05
-- Summary: Add per-SKU weight and delivery-charge weight threshold/extra-per-kg configuration.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy code updates to calculate extra delivery charge from order weight.

-- START V2-006
START TRANSACTION;

-- Product variation weight (kg)
ALTER TABLE `product_skus`
  ADD COLUMN `weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 0.000 AFTER `sku`;

-- Delivery weight rules
ALTER TABLE `delivery_charges`
  ADD COLUMN `default_weight_kg` DECIMAL(10,3) NOT NULL DEFAULT 1.000 AFTER `our_charge`,
  ADD COLUMN `extra_charge_per_kg` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `default_weight_kg`;

COMMIT;
-- END V2-006

-- [V2-007] announcement-zone-selection
-- Date: 2026-03-05
-- Summary: Add zone targeting for announcements (all zones or selected city zones).
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy announcement API/code updates to write/read selected zones.

-- START V2-007
START TRANSACTION;

-- Announcement-level zone mode
ALTER TABLE `announcements`
  ADD COLUMN `zone_scope` ENUM('all', 'selected') DEFAULT 'all' AFTER `target_type`,
  ADD KEY `idx_announcement_zone_scope` (`zone_scope`);

-- Selected zone targets (city-level snapshot, not FK to location_mappings)
CREATE TABLE `announcement_zones` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `announcement_id` BIGINT UNSIGNED NOT NULL,
  `city_name` VARCHAR(100) NOT NULL,
  `city_name_normalized` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_announcement_city` (`announcement_id`, `city_name_normalized`),
  KEY `idx_az_announcement` (`announcement_id`),
  KEY `idx_az_city_norm` (`city_name_normalized`),
  CONSTRAINT `announcement_zones_ibfk_1`
    FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
);

COMMIT;
-- END V2-007

-- [V2-008] orders-add-origin-source
-- Date: 2026-03-05
-- Summary: Add editable `orders.origin` field to track order source with default `own_platform`.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy code updates to read/write origin in order flows.

-- START V2-008
START TRANSACTION;

ALTER TABLE `orders`
  ADD COLUMN `origin` VARCHAR(100) NOT NULL DEFAULT 'own_platform' AFTER `fraud_test_results`,
  ADD KEY `idx_orders_origin` (`origin`);

COMMIT;
-- END V2-008

-- [V2-009] orders-origin-label-normalization
-- Date: 2026-03-05
-- Summary: Normalize order origin default/value labels to human-readable format.
-- Preconditions:
--   1) Run after V2-008 in environments where V2-008 was applied.

-- START V2-009
START TRANSACTION;

-- Update default label
ALTER TABLE `orders`
  ALTER COLUMN `origin` SET DEFAULT 'Own platform';

-- Normalize existing values
UPDATE `orders`
SET `origin` = 'Own platform'
WHERE `origin` IN ('own_platform', 'Own Platform', 'OWN_PLATFORM');

UPDATE `orders`
SET `origin` = 'WhatsApp'
WHERE LOWER(`origin`) = 'whatsapp';

UPDATE `orders`
SET `origin` = 'Facebook'
WHERE LOWER(`origin`) = 'facebook';

COMMIT;
-- END V2-009

-- [V2-010] orders-and-guest-orders-add-ip-address
-- Date: 2026-03-06
-- Summary: Add user IP capture columns to regular and guest orders.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy code updates to store packed IPv4/IPv6 values.

-- START V2-010
START TRANSACTION;

ALTER TABLE `orders`
  ADD COLUMN `ip_address` VARBINARY(16) NULL AFTER `customer_phone`,
  ADD KEY `idx_orders_ip_address` (`ip_address`);

ALTER TABLE `guest_orders`
  ADD COLUMN `ip_address` VARBINARY(16) NULL AFTER `phone`,
  ADD KEY `idx_guest_ip_address` (`ip_address`);

COMMIT;
-- END V2-010

-- [V2-011] bulk-combo-and-overall-discount-foundation
-- Date: 2026-03-06
-- Summary: Add schema for SKU bulk discounts, combo discounts, and overall-cart discount policy keys.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy pricing-engine code updates before enabling these rules in production.


CREATE TABLE IF NOT EXISTS `permission_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section` varchar(100) NOT NULL,
  `scope` varchar(100) NOT NULL DEFAULT 'default',
  `key_name` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `value_type` varchar(20) NOT NULL,
  `enum_values` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_permission_config` (`section`,`scope`,`key_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;



-- START V2-011
START TRANSACTION;

-- Bulk discount tiers for individual SKU
CREATE TABLE `sku_bulk_discount_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_sku_id` INT NOT NULL,
  `min_qty` INT NOT NULL,
  `discount_type` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = flat, 1 = percentage',
  `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bulk_sku_qty` (`product_sku_id`, `min_qty`),
  KEY `idx_bulk_sku_status_qty` (`product_sku_id`, `status`, `min_qty`),
  CONSTRAINT `sku_bulk_discount_rules_ibfk_1`
    FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
);

-- Combo discount definition (header)
CREATE TABLE `combo_discount_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `description` VARCHAR(255) NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_combo_rules_status` (`status`)
);

-- Combo discount tiers (each tier has its own discount)
CREATE TABLE `combo_discount_rule_tiers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_rule_id` BIGINT UNSIGNED NOT NULL,
  `serial` INT NOT NULL DEFAULT 1,
  `discount_type` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = flat, 1 = percentage',
  `discount_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_serial` (`combo_rule_id`, `serial`),
  KEY `idx_combo_tiers_status` (`combo_rule_id`, `status`, `serial`),
  CONSTRAINT `combo_discount_rule_tiers_ibfk_1`
    FOREIGN KEY (`combo_rule_id`) REFERENCES `combo_discount_rules` (`id`) ON DELETE CASCADE
);

-- Required SKU quantities for each combo tier
CREATE TABLE `combo_discount_tier_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_tier_id` BIGINT UNSIGNED NOT NULL,
  `product_sku_id` INT NOT NULL,
  `required_qty` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_sku` (`combo_tier_id`, `product_sku_id`),
  KEY `idx_combo_items_sku` (`product_sku_id`),
  CONSTRAINT `combo_discount_tier_items_ibfk_1`
    FOREIGN KEY (`combo_tier_id`) REFERENCES `combo_discount_rule_tiers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `combo_discount_tier_items_ibfk_2`
    FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
);

-- Permission config keys for overall cart discount policy
INSERT INTO `permission_config`
  (`section`, `scope`, `key_name`, `value`, `value_type`, `enum_values`, `is_active`)
VALUES
  ('overall_cart_discount', 'default', 'enabled', 'false', 'bool', NULL, 1),
  ('overall_cart_discount', 'default', 'basis', 'item_count', 'enum', 'item_count,total_selling_price', 1),
  ('overall_cart_discount', 'default', 'min_item_count', '0', 'string', NULL, 1),
  ('overall_cart_discount', 'default', 'min_total_selling_price', '0', 'string', NULL, 1),
  ('overall_cart_discount', 'default', 'discount_type', 'flat', 'enum', 'flat,percentage', 1),
  ('overall_cart_discount', 'default', 'discount_value', '0', 'string', NULL, 1),
  ('overall_cart_discount', 'default', 'apply_with_bulk_combo', 'false', 'bool', NULL, 1)
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `value_type` = VALUES(`value_type`),
  `enum_values` = VALUES(`enum_values`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP;

COMMIT;
-- END V2-011

-- [V2-012] overall-cart-discount-config-value-type-fix
-- Date: 2026-03-06
-- Summary: Fix numeric config key value_type for overall_cart_discount so patch validation can handle numeric values.
-- Preconditions:
--   1) Apply after V2-011.
--   2) Update PermissionSettingsDB/controller validation to support `number` type.

-- START V2-012
START TRANSACTION;

UPDATE `permission_config`
SET `value_type` = 'number', `updated_at` = CURRENT_TIMESTAMP
WHERE `section` = 'overall_cart_discount'
  AND `scope` = 'default'
  AND `key_name` IN ('min_item_count', 'min_total_selling_price', 'discount_value');

COMMIT;
-- END V2-012

-- [V2-013] dynamic-policy-management
-- Date: 2026-03-06
-- Summary: Add dynamic policy storage for editable legal/content pages with HTML support.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy admin/public policy API updates after migration.

-- START V2-013
START TRANSACTION;

CREATE TABLE `dynamic_policies` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `policy_key` VARCHAR(100) NOT NULL,
  `title` VARCHAR(150) NOT NULL,
  `content` LONGTEXT NULL,
  `content_type` ENUM('html', 'text') DEFAULT 'html',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by_admin` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dynamic_policy_key` (`policy_key`),
  KEY `idx_dynamic_policy_status` (`status`),
  KEY `idx_dynamic_policy_deleted` (`deleted_at`),
  KEY `idx_dynamic_policy_updated_by` (`updated_by_admin`),
  CONSTRAINT `dynamic_policies_ibfk_1`
    FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

-- Seed common policy records (empty content, editable from admin panel)
INSERT INTO `dynamic_policies` (`policy_key`, `title`, `content`, `content_type`, `status`)
VALUES
  ('privacy_policy', 'Privacy Policy', '', 'html', 1),
  ('terms_and_conditions', 'Terms and Conditions', '', 'html', 1),
  ('refund_policy', 'Refund Policy', '', 'html', 1),
  ('return_policy', 'Return Policy', '', 'html', 1),
  ('copyright_policy', 'Copyright Policy', '', 'html', 1)
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `content_type` = VALUES(`content_type`),
  `status` = VALUES(`status`);

COMMIT;
-- END V2-013

-- [V2-014] firebase-push-credential-store
-- Date: 2026-03-07
-- Summary: Add dedicated table for Firebase push credentials with active status and verification metadata.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy admin API + cache + verification logic after migration.

-- START V2-014
START TRANSACTION;

CREATE TABLE `firebase_push_credentials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `credential_name` VARCHAR(100) NOT NULL DEFAULT 'firebase_fcm',
  `credential_json` LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `project_id` VARCHAR(150) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `verification_status` ENUM('unverified', 'verified', 'failed') NOT NULL DEFAULT 'unverified',
  `verification_message` VARCHAR(500) NULL,
  `verified_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_by_admin` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_fpc_active` (`is_active`),
  KEY `idx_fpc_deleted` (`deleted_at`),
  KEY `idx_fpc_verified` (`verification_status`, `verified_at`),
  KEY `idx_fpc_updated_by` (`updated_by_admin`),
  CONSTRAINT `firebase_push_credentials_ibfk_1`
    FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `firebase_push_credentials_chk_1` CHECK (json_valid(`credential_json`))
);

COMMIT;
-- END V2-014

-- [V2-015] simplify-firebase-push-credentials
-- Date: 2026-03-07
-- Summary: Simplify firebase_push_credentials to minimal fields: id, JSON credential, is_active, timestamps.
-- Preconditions:
--   1) Apply after V2-014.
--   2) Keep verification logic in application layer; do not activate row if verification fails.

-- START V2-015
START TRANSACTION;

-- Drop FK/indexes tied to removed columns
ALTER TABLE `firebase_push_credentials`
  DROP FOREIGN KEY `firebase_push_credentials_ibfk_1`,
  DROP INDEX `idx_fpc_verified`,
  DROP INDEX `idx_fpc_updated_by`;

-- Drop now-unneeded metadata columns
ALTER TABLE `firebase_push_credentials`
  DROP COLUMN `credential_name`,
  DROP COLUMN `project_id`,
  DROP COLUMN `verification_status`,
  DROP COLUMN `verification_message`,
  DROP COLUMN `verified_at`,
  DROP COLUMN `updated_by_admin`;

-- Use native JSON type for full credential payload
ALTER TABLE `firebase_push_credentials`
  DROP CONSTRAINT `firebase_push_credentials_chk_1`,
  MODIFY COLUMN `credential_json` JSON NOT NULL;

COMMIT;
-- END V2-015

-- [V2-016] firebase-credentials-drop-deleted-at
-- Date: 2026-03-07
-- Summary: Remove `deleted_at` from firebase_push_credentials because this is a single-row update-only credential store.
-- Preconditions:
--   1) Apply after V2-015.

-- START V2-016
START TRANSACTION;

ALTER TABLE `firebase_push_credentials`
  DROP INDEX `idx_fpc_deleted`,
  DROP COLUMN `deleted_at`;

COMMIT;
-- END V2-016

-- [V2-017] order-distribution-and-assignment-system
-- Date: 2026-03-07
-- Summary: Add auto distribution queue foundations and manual/reassignment tracking for orders.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy assignment logic in code before enabling auto-assign in production.

-- START V2-017
START TRANSACTION;

-- Extend orders with current assignment state
ALTER TABLE `orders`
  ADD COLUMN `assigned_to_admin_id` INT NULL AFTER `deleted_at`,
  ADD COLUMN `assigned_by_admin_id` INT NULL AFTER `assigned_to_admin_id`,
  ADD COLUMN `assignment_method` ENUM('auto', 'manual', 'redistribute') NULL AFTER `assigned_by_admin_id`,
  ADD COLUMN `assigned_at` TIMESTAMP NULL DEFAULT NULL AFTER `assignment_method`,
  ADD KEY `idx_orders_assigned_to` (`assigned_to_admin_id`),
  ADD KEY `idx_orders_assigned_by` (`assigned_by_admin_id`),
  ADD KEY `idx_orders_assigned_at` (`assigned_at`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`assigned_to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL;

-- Distribution agent pool (admins/order managers eligible for queue assignment)
CREATE TABLE `order_distribution_agents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `serial` INT NOT NULL DEFAULT 1,
  `auto_assign_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `max_active_orders` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_distribution_agent_admin` (`admin_id`),
  KEY `idx_distribution_agents_active` (`status`, `auto_assign_enabled`, `serial`),
  CONSTRAINT `order_distribution_agents_ibfk_1`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
);

-- Global distribution settings (single row)
CREATE TABLE `order_distribution_settings` (
  `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `auto_assign_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `strategy` ENUM('round_robin') NOT NULL DEFAULT 'round_robin',
  `assign_on_order_create` TINYINT(1) NOT NULL DEFAULT 1,
  `include_admin_role` TINYINT(1) NOT NULL DEFAULT 1,
  `include_order_manager_role` TINYINT(1) NOT NULL DEFAULT 1,
  `last_assigned_admin_id` INT NULL,
  `updated_by_admin` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ods_last_assigned` (`last_assigned_admin_id`),
  KEY `idx_ods_updated_by` (`updated_by_admin`),
  CONSTRAINT `order_distribution_settings_chk_1` CHECK ((`id` = 1)),
  CONSTRAINT `order_distribution_settings_ibfk_1`
    FOREIGN KEY (`last_assigned_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_distribution_settings_ibfk_2`
    FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

INSERT INTO `order_distribution_settings` (`id`)
VALUES (1)
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

-- Assignment history log (auto/manual/redistribution trail)
CREATE TABLE `order_assignment_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `action_type` ENUM('auto_assign', 'manual_assign', 'redistribute', 'unassign') NOT NULL,
  `from_admin_id` INT NULL,
  `to_admin_id` INT NULL,
  `changed_by_admin_id` INT NULL,
  `note` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oal_order_id` (`order_id`),
  KEY `idx_oal_to_admin` (`to_admin_id`, `created_at`),
  KEY `idx_oal_changed_by` (`changed_by_admin_id`, `created_at`),
  CONSTRAINT `order_assignment_logs_ibfk_1`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_assignment_logs_ibfk_2`
    FOREIGN KEY (`from_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_assignment_logs_ibfk_3`
    FOREIGN KEY (`to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_assignment_logs_ibfk_4`
    FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

COMMIT;
-- END V2-017

-- [V2-018] admin-notification-permission-model-upgrade
-- Date: 2026-03-07
-- Summary: Replace old admin notification config keys (2) with new 6 keys and add per-admin notification permission table.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Code changes for PermissionSettingsDB/config APIs are applied after DB restructuring phase.

-- START V2-018
START TRANSACTION;

-- Remove deprecated admin notification config keys
DELETE FROM `permission_config`
WHERE `section` = 'order_status_notification_admin'
  AND `scope` = 'default'
  AND `key_name` IN ('email', 'sms');

-- Add new global policy keys (2 sections x 3 channels)
INSERT INTO `permission_config`
  (`section`, `scope`, `key_name`, `value`, `value_type`, `enum_values`, `is_active`)
VALUES
  ('order__notification_admin', 'default', 'email', 'true', 'bool', NULL, 1),
  ('order__notification_admin', 'default', 'sms', 'false', 'bool', NULL, 1),
  ('order__notification_admin', 'default', 'firebase_push_notification', 'true', 'bool', NULL, 1),
  ('personal_notification_admin', 'default', 'email', 'true', 'bool', NULL, 1),
  ('personal_notification_admin', 'default', 'sms', 'false', 'bool', NULL, 1),
  ('personal_notification_admin', 'default', 'firebase_push_notification', 'true', 'bool', NULL, 1)
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`),
  `value_type` = VALUES(`value_type`),
  `enum_values` = VALUES(`enum_values`),
  `is_active` = VALUES(`is_active`),
  `updated_at` = CURRENT_TIMESTAMP;

-- Per-admin notification permission matrix
CREATE TABLE `admin_notification_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `order_notification_email` TINYINT(1) NOT NULL DEFAULT 1,
  `order_notification_sms` TINYINT(1) NOT NULL DEFAULT 0,
  `order_notification_firebase_push` TINYINT(1) NOT NULL DEFAULT 1,
  `personal_notification_email` TINYINT(1) NOT NULL DEFAULT 1,
  `personal_notification_sms` TINYINT(1) NOT NULL DEFAULT 0,
  `personal_notification_firebase_push` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_by_admin` INT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_notification_permissions_admin` (`admin_id`),
  KEY `idx_anp_updated_by` (`updated_by_admin`),
  CONSTRAINT `admin_notification_permissions_ibfk_1`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_notification_permissions_ibfk_2`
    FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

-- Seed row for each existing admin
INSERT INTO `admin_notification_permissions` (`admin_id`)
SELECT a.id
FROM `admins` a
LEFT JOIN `admin_notification_permissions` p ON p.admin_id = a.id
WHERE p.admin_id IS NULL;

COMMIT;
-- END V2-018

-- [V2-019] order-multi-refund-ledger
-- Date: 2026-03-07
-- Summary: Add refund ledger table to support multiple refund entries per order (manual or method-based) with reference tracking.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy admin order-edit/refund logic after migration.

-- START V2-019
START TRANSACTION;

CREATE TABLE `order_refunds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `order_payment_id` BIGINT UNSIGNED NULL,
  `refund_method` ENUM('original_method','bank_transfer','mobile_banking','cash','other') NOT NULL DEFAULT 'original_method',
  `status` ENUM('pending','processed','failed') NOT NULL DEFAULT 'processed',
  `refund_reference` VARCHAR(255) NULL,
  `refund_amount` DECIMAL(12,2) NOT NULL,
  `note` TEXT NULL,
  `refunded_by_admin` INT NULL,
  `refunded_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_refunds_order` (`order_id`),
  KEY `idx_order_refunds_payment` (`order_payment_id`),
  KEY `idx_order_refunds_admin` (`refunded_by_admin`),
  KEY `idx_order_refunds_status_created` (`status`, `created_at`),
  CONSTRAINT `order_refunds_ibfk_1`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_refunds_ibfk_2`
    FOREIGN KEY (`order_payment_id`) REFERENCES `order_payments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_refunds_ibfk_3`
    FOREIGN KEY (`refunded_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

COMMIT;
-- END V2-019

-- [V2-020] unified-notification-history-foundation
-- Date: 2026-03-07
-- Summary: Add unified history for email/SMS/push with batch tracking and attempt logs for current/future notification flows.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy notification write logic in mail/SMS/push dispatch paths after migration.

-- START V2-020
START TRANSACTION;

-- Batch-level tracking (bulk announcement, mass personal sends, etc.)
CREATE TABLE `notification_batches` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_type` ENUM('announcement','manual_announcement','order_status','forgot_password','welcome','contact_reply','personal','system','other') NOT NULL DEFAULT 'other',
  `source_id` VARCHAR(100) NULL,
  `channel` ENUM('email','sms','push','mixed') NOT NULL DEFAULT 'mixed',
  `audience_type` ENUM('user','admin','subscriber','guest','mixed','other') NOT NULL DEFAULT 'mixed',
  `title` VARCHAR(255) NULL,
  `message` LONGTEXT NULL,
  `initiated_by_admin` INT NULL,
  `scheduled_at` TIMESTAMP NULL DEFAULT NULL,
  `started_at` TIMESTAMP NULL DEFAULT NULL,
  `finished_at` TIMESTAMP NULL DEFAULT NULL,
  `status` ENUM('draft','queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `total_target` INT NOT NULL DEFAULT 0,
  `total_sent` INT NOT NULL DEFAULT 0,
  `total_failed` INT NOT NULL DEFAULT 0,
  `meta` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nb_source` (`source_type`, `source_id`),
  KEY `idx_nb_status` (`status`, `created_at`),
  KEY `idx_nb_initiated_by` (`initiated_by_admin`),
  CONSTRAINT `notification_batches_ibfk_1`
    FOREIGN KEY (`initiated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

-- Per-recipient delivery history (single source of truth for channel history)
CREATE TABLE `notification_histories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `batch_id` BIGINT UNSIGNED NULL,
  `channel` ENUM('email','sms','push') NOT NULL,
  `category` ENUM('order_status','forgot_password','welcome','announcement','contact_reply','personal','otp','system','other') NOT NULL DEFAULT 'other',
  `recipient_type` ENUM('user','admin','subscriber','guest','manual','other') NOT NULL DEFAULT 'other',
  `recipient_user_id` BIGINT UNSIGNED NULL,
  `recipient_admin_id` INT NULL,
  `recipient_subscriber_id` BIGINT UNSIGNED NULL,
  `recipient_guest_order_id` VARCHAR(255) NULL,
  `recipient_email` VARCHAR(255) NULL,
  `recipient_phone` VARCHAR(20) NULL,
  `device_token` VARCHAR(255) NULL,
  `title` VARCHAR(255) NULL,
  `message` LONGTEXT NULL,
  `template_key` VARCHAR(100) NULL,
  `provider` VARCHAR(60) NULL,
  `provider_message_id` VARCHAR(255) NULL,
  `status` ENUM('queued','sent','failed','delivered','read','cancelled') NOT NULL DEFAULT 'queued',
  `error_message` VARCHAR(500) NULL,
  `related_order_id` BIGINT UNSIGNED NULL,
  `related_announcement_id` BIGINT UNSIGNED NULL,
  `related_contact_message_id` BIGINT UNSIGNED NULL,
  `triggered_by_admin_id` INT NULL,
  `scheduled_at` TIMESTAMP NULL DEFAULT NULL,
  `sent_at` TIMESTAMP NULL DEFAULT NULL,
  `delivered_at` TIMESTAMP NULL DEFAULT NULL,
  `read_at` TIMESTAMP NULL DEFAULT NULL,
  `meta` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nh_batch` (`batch_id`),
  KEY `idx_nh_channel_status_time` (`channel`, `status`, `created_at`),
  KEY `idx_nh_category_time` (`category`, `created_at`),
  KEY `idx_nh_recipient_user` (`recipient_user_id`),
  KEY `idx_nh_recipient_admin` (`recipient_admin_id`),
  KEY `idx_nh_recipient_subscriber` (`recipient_subscriber_id`),
  KEY `idx_nh_recipient_email` (`recipient_email`),
  KEY `idx_nh_recipient_phone` (`recipient_phone`),
  KEY `idx_nh_related_order` (`related_order_id`),
  KEY `idx_nh_related_announcement` (`related_announcement_id`),
  KEY `idx_nh_template` (`template_key`),
  KEY `idx_nh_provider_msg` (`provider`, `provider_message_id`),
  CONSTRAINT `notification_histories_ibfk_1`
    FOREIGN KEY (`batch_id`) REFERENCES `notification_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_2`
    FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_3`
    FOREIGN KEY (`recipient_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_4`
    FOREIGN KEY (`recipient_subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_5`
    FOREIGN KEY (`related_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_6`
    FOREIGN KEY (`related_announcement_id`) REFERENCES `announcements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_7`
    FOREIGN KEY (`related_contact_message_id`) REFERENCES `contact_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_8`
    FOREIGN KEY (`triggered_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
);

-- Provider/API attempt-level debug and retry trail
CREATE TABLE `notification_attempts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `notification_history_id` BIGINT UNSIGNED NOT NULL,
  `attempt_no` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `provider` VARCHAR(60) NULL,
  `provider_message_id` VARCHAR(255) NULL,
  `http_status` SMALLINT NULL,
  `request_payload` JSON NULL,
  `response_payload` JSON NULL,
  `status` ENUM('success','failed') NOT NULL DEFAULT 'failed',
  `error_message` VARCHAR(1000) NULL,
  `attempted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_notification_attempt_no` (`notification_history_id`, `attempt_no`),
  KEY `idx_na_status_time` (`status`, `attempted_at`),
  KEY `idx_na_provider_msg` (`provider`, `provider_message_id`),
  CONSTRAINT `notification_attempts_ibfk_1`
    FOREIGN KEY (`notification_history_id`) REFERENCES `notification_histories` (`id`) ON DELETE CASCADE
);

-- Backfill legacy contact reply sends as historical notification rows
INSERT INTO `notification_histories` (
  `channel`,
  `category`,
  `recipient_type`,
  `recipient_user_id`,
  `recipient_email`,
  `recipient_phone`,
  `title`,
  `message`,
  `template_key`,
  `status`,
  `related_contact_message_id`,
  `triggered_by_admin_id`,
  `sent_at`,
  `created_at`
)
SELECT
  CASE WHEN cr.`type` = 'sms' THEN 'sms' ELSE 'email' END AS channel,
  'contact_reply' AS category,
  CASE WHEN cm.`user_id` IS NOT NULL THEN 'user' ELSE 'manual' END AS recipient_type,
  cm.`user_id` AS recipient_user_id,
  cm.`email` AS recipient_email,
  cm.`phone` AS recipient_phone,
  CONCAT('Response of ', cm.`subject`, ' - Query ID: ', cm.`id`) AS title,
  cr.`reply_text` AS message,
  CASE WHEN cr.`type` = 'sms' THEN 'contact_reply_sms' ELSE 'contact_reply_email' END AS template_key,
  'sent' AS status,
  cm.`id` AS related_contact_message_id,
  cr.`admin_id` AS triggered_by_admin_id,
  cr.`created_at` AS sent_at,
  cr.`created_at` AS created_at
FROM `contact_replies` cr
JOIN `contact_messages` cm ON cm.`id` = cr.`message_id`;

COMMIT;
-- END V2-020



-- START V1.5-marketing analytics manual edited by developer

-- ALTER TABLE `orders`
--   ADD COLUMN `fbp`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbp cookie for CAPI',
--   ADD COLUMN `fbc`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbc click ID for CAPI',
--   ADD COLUMN `capi_event_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Deduplication event_id shared with browser Pixel';

-- ALTER TABLE `guest_orders`
--   ADD COLUMN `fbp`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbp cookie for CAPI',
--   ADD COLUMN `fbc`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbc click ID for CAPI',
--   ADD COLUMN `capi_event_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Deduplication event_id shared with browser Pixel';


-- -- ============================================================
-- -- [2026-03-08] Analytics: Seed analytics_config (id = 1)
-- -- Single source of truth for ALL analytics configuration.
-- -- Includes the full schema the admin UI expects (analytics + tracking + meta).
-- -- INSERT IGNORE = safe to re-run; will not overwrite if row already exists.
-- -- ============================================================

-- INSERT IGNORE INTO `analytics_config` (`id`, `config`) VALUES (1, '{
--   "meta": {
--     "currency": "BDT",
--     "site_name": "Graduate Fashion",
--     "environment": "production"
--   },
--   "tracking": {
--     "auto_page_view": true,
--     "track_scroll": false,
--     "track_button_clicks": false,
--     "track_search": true
--   },
--   "analytics": {
--     "google_analytics": {
--       "enabled": false,
--       "measurement_id": "",
--       "config": {
--         "anonymize_ip": true,
--         "send_page_view": true,
--         "debug_mode": false
--       }
--     },
--     "google_tag_manager": {
--       "enabled": true,
--       "gtm_id": "GTM-WQDNF2TP",
--       "auth": "",
--       "preview": ""
--     },
--     "facebook_pixel": {
--       "enabled": false,
--       "pixel_id": "",
--       "advanced_matching": {
--         "enabled": false,
--         "email": true,
--         "phone": true,
--         "first_name": false,
--         "last_name": false,
--         "external_id": false
--       },
--       "track_events": {
--         "page_view": true,
--         "view_content": true,
--         "add_to_cart": true,
--         "initiate_checkout": true,
--         "purchase": true,
--         "search": false,
--         "lead": false,
--         "complete_registration": false
--       },
--       "conversion_api": {
--         "enabled": false,
--         "access_token": "",
--         "test_event_code": ""
--       }
--     },
--     "microsoft_clarity": {
--       "enabled": false,
--       "project_id": ""
--     }
--   }
-- }');
-- END V1.5-marketing analytics manual edited by developer


-- START V2-020 - manual query to insert audit action keys by developer

INSERT IGNORE INTO audit_actions (action_key, display_name) VALUES
-- Discount management (new)
('CREATE_BULK_DISCOUNT_RULE',   'Create Bulk Discount Rule'),
('EDIT_BULK_DISCOUNT_RULE',     'Edit Bulk Discount Rule'),
('DELETE_BULK_DISCOUNT_RULE',   'Delete Bulk Discount Rule'),
('CREATE_COMBO_DISCOUNT_RULE',  'Create Combo Discount Rule'),
('EDIT_COMBO_DISCOUNT_RULE',    'Edit Combo Discount Rule'),
('DELETE_COMBO_DISCOUNT_RULE',  'Delete Combo Discount Rule'),

-- Order Assignment / Distribution (new)
('UPDATE_DISTRIBUTION_SETTINGS', 'Update Distribution Settings'),
('ADD_DISTRIBUTION_AGENT',       'Add Distribution Agent'),
('EDIT_DISTRIBUTION_AGENT',      'Edit Distribution Agent'),
('REMOVE_DISTRIBUTION_AGENT',    'Remove Distribution Agent'),
('ASSIGN_ORDER',                 'Assign Order'),
('UNASSIGN_ORDER',               'Unassign Order'),

-- Policy management (new)
('CREATE_POLICY',   'Create Policy'),
('UPDATE_POLICY',   'Update Policy'),
('RESTORE_POLICY',  'Restore Policy'),
('DELETE_POLICY',   'Delete Policy'),


('UPDATE_PERMISSION_CONFIG', 'Update Permission Config'),

-- Admin account management (new)
('DELETE_ADMIN',    'Delete Admin'),
('RESTORE_ADMIN',   'Restore Admin'),

-- Order management (new)
('ORDER_FREE_DELIVERY', 'Admin Set Order Free Delivery');


-- New user audit action keys to insert into user_audit_actions table
INSERT IGNORE INTO user_audit_actions (action_key, display_name, category) VALUES
('SET_INITIAL_PASSWORD', 'Set Initial Password',  'SECURITY'),
('PLACE_ORDER',          'Place Order',            'ORDERS');

-- END V2-020 -manula query toinser  audit action keys by developer

-- START V2-021 (normalize overall_cart_discount key: enabled -> is_enabled)
-- Date: 2026-03-11
-- Summary: Canonicalize permission_config key name for overall_cart_discount to match code definitions.

START TRANSACTION;

-- Create canonical key from legacy key if missing
INSERT INTO permission_config (section, scope, key_name, value, value_type, enum_values, is_active)
SELECT e.section, e.scope, 'is_enabled', e.value, 'bool', NULL, e.is_active
FROM permission_config e
LEFT JOIN permission_config i
  ON i.section = e.section
 AND i.scope = e.scope
 AND i.key_name = 'is_enabled'
WHERE e.section = 'overall_cart_discount'
  AND e.scope = 'default'
  AND e.key_name = 'enabled'
  AND i.id IS NULL;

-- Normalize canonical row metadata
UPDATE permission_config
SET value_type = 'bool',
    enum_values = NULL,
    updated_at = NOW()
WHERE section = 'overall_cart_discount'
  AND scope = 'default'
  AND key_name = 'is_enabled';

-- Remove legacy key to avoid duplicate response fields
DELETE FROM permission_config
WHERE section = 'overall_cart_discount'
  AND scope = 'default'
  AND key_name = 'enabled';

COMMIT;
-- END V2-021

-- [V2-022] new-user-audit-action-keys
-- Date: 2026-03-14
-- Summary: Register new user_audit_actions: CANCEL_ORDER, UPDATE_PROFILE, PLACE_GUEST_ORDER.
-- Preconditions:
--   1) Apply after V2-021.
--   2) Deploy updated controllers that write these action keys.

-- START V2-022
START TRANSACTION;

INSERT INTO `user_audit_actions` (`action_key`, `display_name`)
VALUES
  ('CANCEL_ORDER',      'Cancel Order'),
  ('UPDATE_PROFILE',    'Update Profile'),
  ('PLACE_GUEST_ORDER', 'Place Guest Order')
ON DUPLICATE KEY UPDATE
  `display_name` = VALUES(`display_name`);

COMMIT;
-- END V2-022

-- ============================================================
-- V2-023: Add bd_title (Bengali title) to dynamic_policies
-- Run once on live DB. Column is nullable — no data migration needed.
-- ============================================================
-- START V2-023
ALTER TABLE `dynamic_policies`
  ADD COLUMN `bd_title` VARCHAR(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
    COMMENT 'Bengali title for dual-language support'
  AFTER `title`;
-- END V2-023

-- ============================================================
-- [V2-024] product-image-serial-data-fix
-- Date: 2026-03-17
-- Summary: All product_images rows previously had serial = 1 (DB default).
--          This migration reassigns correct 1-based serial values per product,
--          ordered by id ASC (original insert order), so the image ordering
--          feature works correctly for existing products.
--          No schema change needed — column already exists from V2 rename.
-- Preconditions:
--   1) Run after V2-023.
--   2) Safe to re-run: WHERE serial = 1 filter means only unfixed rows are touched.
-- ============================================================
-- START V2-024

DROP PROCEDURE IF EXISTS fix_product_image_serials;

DELIMITER $$

CREATE PROCEDURE fix_product_image_serials()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE cur_product_id INT;

  -- Cursor over products that have at least one image with serial = 1
  DECLARE cur CURSOR FOR
    SELECT DISTINCT product_id
    FROM product_images
    WHERE serial = 1
    ORDER BY product_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO cur_product_id;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Reassign serials in id ASC order for this product
    SET @rank = 0;
    UPDATE product_images
    SET serial = (@rank := @rank + 1)
    WHERE product_id = cur_product_id
    ORDER BY id ASC;

  END LOOP;

  CLOSE cur;
END$$

DELIMITER ;

CALL fix_product_image_serials();
DROP PROCEDURE IF EXISTS fix_product_image_serials;

-- END V2-024

-- [V2-025] products-generate-face-images-backfill
-- Date: 2026-03-17
-- Summary: Generate optimised WebP face images (400x400, q60) for all existing products
--          that have at least one product_image. Updates products.face_image with the new path.
-- Preconditions:
--   1) V2-005 must be applied (products.face_image column exists).
--   2) V2-024 must be applied (product_images.serial values are correct).
--   3) Run the Node.js backfill script AFTER applying this SQL block:
--        node scripts/backfill-face-images.js
-- Note: Pure SQL cannot do image processing (sharp/resize), so the backfill is split:
--   - SQL below ensures face_image is NULL for products missing one (safe to re-run).
--   - The Node script reads each product's serial=1 image, generates a WebP thumbnail,
--     and writes the path back to products.face_image.

-- START V2-025

-- Reset face_image to NULL for products whose face_image doesn't exist in product_images
-- (safety net in case face_image paths are stale from V2-005 raw-path backfill)
UPDATE products p
LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.serial = 1
SET p.face_image = NULL
WHERE pi.id IS NULL AND p.face_image IS NOT NULL;

-- END V2-025
--          only when that color is selected in the shop panel.
-- Preconditions: colors table must exist (it does since V1).

-- START V2-026

ALTER TABLE `product_images`
  ADD COLUMN `color_id` INT DEFAULT NULL
    COMMENT 'NULL = shared (shown for all colors); SET = shown only for that color'
    AFTER `serial`,
  ADD KEY `idx_pi_color` (`color_id`),
  ADD CONSTRAINT `fk_pi_color`
    FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`) ON DELETE SET NULL;

-- END V2-026

-- [V2-027] product-images-replace-color-id-with-sku-id
-- Date: 2026-03-17
-- Replaces V2-026 (color_id) with sku_id (product_skus FK).
-- sku_id is more expressive: one SKU already encodes color+size.
-- NULL sku_id = shared image shown for all SKUs.

-- START V2-027

-- Roll back V2-026 (if already applied)
-- NOTE: MySQL 8.x does not support DROP FOREIGN KEY IF EXISTS / DROP KEY IF EXISTS
--       (those are MariaDB-only). Use a procedure to check before dropping.
DROP PROCEDURE IF EXISTS rollback_v2_026;
DELIMITER $$
CREATE PROCEDURE rollback_v2_026()
BEGIN
  -- Drop FK if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_images'
      AND CONSTRAINT_NAME = 'fk_pi_color'
  ) THEN
    ALTER TABLE `product_images` DROP FOREIGN KEY `fk_pi_color`;
  END IF;

  -- Drop index if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_images'
      AND INDEX_NAME = 'idx_pi_color'
  ) THEN
    ALTER TABLE `product_images` DROP KEY `idx_pi_color`;
  END IF;

  -- Drop column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_images'
      AND COLUMN_NAME = 'color_id'
  ) THEN
    ALTER TABLE `product_images` DROP COLUMN `color_id`;
  END IF;
END$$
DELIMITER ;
CALL rollback_v2_026();
DROP PROCEDURE IF EXISTS rollback_v2_026;

-- Apply V2-027
ALTER TABLE `product_images`
  ADD COLUMN `sku_id` INT DEFAULT NULL
    COMMENT 'NULL = shared (shown for all SKUs); SET = shown only when this color+size SKU is selected'
    AFTER `serial`,
  ADD KEY `idx_pi_sku` (`sku_id`),
  ADD CONSTRAINT `fk_pi_sku`
    FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`) ON DELETE SET NULL;

-- END V2-027

-- START V2-028
-- Add 'name' column to sku_bulk_discount_rules
ALTER TABLE `sku_bulk_discount_rules`
  ADD COLUMN `name` VARCHAR(255) NULL COMMENT 'Human-readable label e.g. 100 pcs 20% off' AFTER `id`;
-- END V2-028

-- START V2-029
-- Create order_refunds table for multi-refund ledger (V2-019)
CREATE TABLE IF NOT EXISTS `order_refunds` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` INT UNSIGNED NOT NULL,
  `order_payment_id` INT UNSIGNED NULL COMMENT 'Optionally links to a specific payment transaction',
  `refund_method` ENUM('original_method','bank_transfer','mobile_banking','cash','other') NOT NULL,
  `refund_amount` DECIMAL(12,2) NOT NULL,
  `refund_reference` VARCHAR(255) NULL COMMENT 'Bank ref / gateway ref / manual ref',
  `note` TEXT NULL,
  `refunded_by_admin` INT UNSIGNED NULL,
  `status` ENUM('pending','processed','failed') NOT NULL DEFAULT 'pending',
  `refunded_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_refunds_order_id` (`order_id`),
  KEY `idx_order_refunds_status` (`status`),
  CONSTRAINT `fk_order_refunds_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_refunds_admin` FOREIGN KEY (`refunded_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- END V2-029


-- [V2-030] add-weight-to-order-items-and-orders
-- Date: 2026-03-21
-- Summary: Per-item weight snapshot and order-level weight surcharge.

-- START V2-030

ALTER TABLE `order_items`
  ADD COLUMN  `weight_kg` DECIMAL(8,3) NOT NULL DEFAULT 0.000
    COMMENT 'SKU weight snapshot (kg) at time of order placement'
    AFTER `stock_adjusted`;

ALTER TABLE `orders`
  ADD COLUMN  `weight_kg_total`     DECIMAL(10,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total order weight (kg)',
  ADD COLUMN  `weight_extra_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Extra delivery charge due to excess weight' AFTER `weight_kg_total`;

ALTER TABLE `guest_orders`
  ADD COLUMN  `weight_kg_total`     DECIMAL(10,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total order weight (kg)',
  ADD COLUMN  `weight_extra_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Extra delivery charge due to excess weight' AFTER `weight_kg_total`;

-- END V2-030


-- [V2-012] fix-overall-cart-discount-value-types
-- Date: 2026-03-21
-- Corrects stale value_type for overall_cart_discount keys in permission_config.
-- apply_with_bulk_combo was stored as 'number' instead of 'bool'.

-- START V2-012

UPDATE `permission_config`
  SET value_type = 'bool'
  WHERE section = 'overall_cart_discount'
    AND key_name IN ('is_enabled', 'apply_with_bulk_combo')
    AND value_type != 'bool';

UPDATE `permission_config`
  SET value_type = 'number'
  WHERE section = 'overall_cart_discount'
    AND key_name IN ('min_item_count', 'min_total_selling_price', 'discount_value')
    AND value_type != 'number';

-- END V2-012

-- [V2-029] bulk-combo-discount-tracking-columns
-- Date: 2026-03-22
-- Summary: Add bulk_discount_total, combo_discount_total, cart_wide_discount, weight_kg_total,
--          weight_extra_charge to orders; add bulk_rule_id, bulk_discount_applied,
--          combo_rule_id, combo_discount_applied to order_items.
-- Preconditions: V2-011 (bulk/combo tables) must be applied first.

-- START V2-029
START TRANSACTION;

ALTER TABLE `orders`
  ADD COLUMN  `bulk_discount_total`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `discount_total`,
  ADD COLUMN  `combo_discount_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `bulk_discount_total`,
  ADD COLUMN  `cart_wide_discount`   DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `combo_discount_total`
;

ALTER TABLE `order_items`
  ADD COLUMN  `bulk_rule_id`           BIGINT UNSIGNED DEFAULT NULL AFTER `coupon_discount`,
  ADD COLUMN  `bulk_discount_applied`  DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `bulk_rule_id`,
  ADD COLUMN  `combo_rule_id`          BIGINT UNSIGNED DEFAULT NULL AFTER `bulk_discount_applied`,
  ADD COLUMN  `combo_discount_applied` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `combo_rule_id`;

COMMIT;
-- END V2-029

-- ============================================================
-- V2-030: Discount breakdown field notes (2026-03-23)
-- NOTE: DB columns bulk_discount_total, combo_discount_total,
--       cart_wide_discount already exist on the orders table
--       (added in V2-029). No schema change needed.
--
-- Code changes made instead:
-- 1. order.js getMySingleOrder: totals now returns sku_discount_total,
--    bulk_discount_total, combo_discount_total, cart_wide_discount,
--    coupon_discount
-- 2. admin_order.js: same fix for admin order detail endpoint
-- 3. email.js: passes coupon_discount + correct sku_discount to template
-- 4. Frontend: InvoiceTotals, OrderTotals, OrderSuccessClient,
--    MyOrderDetailsClient, ProductCalculationsCard all updated
-- ============================================================
-- ============================================================
-- V2-031: Add sku_discount_total stored column to orders (2026-03-23)
-- Previously sku discount was derived at read time as:
--   discount_total - coupon_discount (fragile, no direct column).
-- This migration adds the dedicated column and back-fills from existing data.
-- ============================================================

-- START V2-031
START TRANSACTION;

ALTER TABLE `orders`
  ADD COLUMN  `sku_discount_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00
  AFTER `discount_total`;

-- Back-fill: sku_discount_total = discount_total - sum(coupon discounts)
UPDATE `orders` o
LEFT JOIN (
  SELECT order_id, COALESCE(SUM(discount_amount), 0) AS coupon_sum
  FROM order_coupons
  GROUP BY order_id
) cp ON cp.order_id = o.id
SET o.sku_discount_total = GREATEST(0, o.discount_total - COALESCE(cp.coupon_sum, 0))
WHERE o.sku_discount_total = 0;

COMMIT;
-- END V2-031

-- ============================================================
-- [V2-026] compare-feature-audit-actions
-- Date: 2026-03-24
-- Summary: Register new user_audit_actions for the Compare & Plan feature.
--          COMPARE_PRODUCTS: authenticated user compares two products.
--          GUEST_COMPARE_PRODUCTS: unauthenticated (guest) product comparison.
-- ============================================================
-- START V2-026
INSERT INTO `user_audit_actions` (`action_key`, `display_name`)
VALUES
  ('COMPARE_PRODUCTS',       'Compare Products'),
  ('GUEST_COMPARE_PRODUCTS', 'Guest Compare Products')
ON DUPLICATE KEY UPDATE `display_name` = VALUES(`display_name`);
-- END V2-026

-- ============================================================
-- Date: 2026-03-25
-- Summary: Add per-SKU free_delivery override column to product_skus.
--          NULL = inherit from products.free_delivery (backward compatible).
--          1    = this SKU ships free regardless of product setting.
--          0    = this SKU is paid delivery regardless of product setting.
-- ============================================================
-- START V2-027
ALTER TABLE `product_skus`
  ADD COLUMN `free_delivery` TINYINT(1) NULL DEFAULT NULL
  COMMENT 'NULL=inherit from products.free_delivery, 1=free, 0=paid';
-- END V2-027

-- ============================================================
-- V2-028: Free Delivery flag on Bulk & Combo Discount Rules
-- ============================================================
-- Summary: Allow admins to mark a bulk or combo rule as "free delivery".
--          When the qualifying rule is triggered at checkout, delivery charge
--          and weight surcharge are waived for the entire order.
-- ============================================================
-- START V2-028
ALTER TABLE `sku_bulk_discount_rules`
  ADD COLUMN `free_delivery` TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = whole-order ships free when this rule is triggered';

ALTER TABLE `combo_discount_rules`
  ADD COLUMN `free_delivery` TINYINT(1) NOT NULL DEFAULT 0
  COMMENT '1 = whole-order ships free when this rule is triggered';
-- END V2-028

-- V2-029: Add location_mapping_id to user_addresses and order_addresses for reliable Pathao dispatch
ALTER TABLE user_addresses ADD COLUMN  location_mapping_id INT NULL DEFAULT NULL AFTER zip_code;
ALTER TABLE order_addresses ADD COLUMN  location_mapping_id INT NULL DEFAULT NULL AFTER zip_code;
-- END V2-029

-- ============================================================
-- [V2-030] courier-location-architecture-fix
-- Date: 2026-03-28
-- Summary:
--   1. Convert location_mappings table to utf8mb4 to support Bengali area names.
--   2. Drop the broken uniq_location index (NULL columns were treated as distinct,
--      allowing duplicate rows per courier per sync run).
--   3. Add per-courier UNIQUE KEY constraints: uniq_pathao_area (pathao_area_id)
--      and uniq_steadfast_id (steadfast_id) so ON DUPLICATE KEY UPDATE works correctly.
--   4. Add paperfly_thana_id column for future Paperfly courier support.
--   5. Add performance indexes on city_name and pathao_city_id.
-- Preconditions:
--   - V2-029 must be applied first.
--   - Run during a maintenance window (CONVERT TO may lock the table briefly).
-- ============================================================
-- START V2-030

-- Dedup any duplicate pathao_area_id rows before adding unique constraint
DELETE lm1 FROM location_mappings lm1
INNER JOIN location_mappings lm2
  ON lm1.pathao_area_id = lm2.pathao_area_id AND lm1.id > lm2.id
WHERE lm1.pathao_area_id IS NOT NULL;

-- Dedup any duplicate steadfast_id rows
DELETE lm1 FROM location_mappings lm1
INNER JOIN location_mappings lm2
  ON lm1.steadfast_id = lm2.steadfast_id AND lm1.id > lm2.id
WHERE lm1.steadfast_id IS NOT NULL;

-- Convert charset to utf8mb4 to support Bengali characters
ALTER TABLE location_mappings CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add paperfly_thana_id column for future courier support
ALTER TABLE location_mappings
  ADD COLUMN  paperfly_thana_id INT DEFAULT NULL
  COMMENT 'Paperfly thana/area ID for dispatch' AFTER steadfast_id;

-- Drop old broken unique index (NULL columns bypass uniqueness in MySQL)
ALTER TABLE location_mappings DROP INDEX  uniq_location;

-- Add per-courier unique keys for proper deduplication
ALTER TABLE location_mappings
  ADD UNIQUE KEY  uniq_pathao_area (pathao_area_id),
  ADD UNIQUE KEY  uniq_steadfast_id (steadfast_id);

-- Add performance indexes
ALTER TABLE location_mappings
  ADD INDEX  idx_lm_city (city_name),
  ADD INDEX  idx_lm_pathao_city (pathao_city_id);

-- Add index on location_mapping_id in address tables for dispatch JOIN performance
ALTER TABLE order_addresses
  ADD INDEX  idx_oa_location_mapping (location_mapping_id);
ALTER TABLE user_addresses
  ADD INDEX  idx_ua_location_mapping (location_mapping_id);

-- END V2-030

-- ============================================================
-- [V2-032] fix-table-charset-utf8mb4
-- Date: 2026-03-29
-- Summary: Convert key tables to utf8mb4 so product names, user content,
--          and Bengali/special-character strings are stored correctly.
--          This fixes: "Incorrect string value" errors when inserting orders
--          with product names containing non-Latin characters.
--          Safe to re-run (CONVERT TO is idempotent when charset is already utf8mb4).
-- Preconditions:
--   1) Run after V2-031.
--   2) May briefly lock tables — run in low-traffic window on production.
--   3) The docker-compose.yml server flags and connection.js charset fix
--      must also be applied (no-SQL changes) to prevent recurrence.
-- ============================================================
-- START V2-032

-- Core order tables
ALTER TABLE `order_items`   CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `orders`        CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `order_addresses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Product catalog
ALTER TABLE `products`      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `product_skus`  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Users & auth
ALTER TABLE `users`         CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `user_addresses` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Content tables
ALTER TABLE `announcements` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `dynamic_policies` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- END V2-032

-- ============================================================
-- [V2-033] courier-webhook-secret-config-rows
-- Date: 2026-04-02
-- Summary: Add STEADFAST_WEBHOOK_SECRET and PATHAO_WEBHOOK_SECRET rows to
--          system_config so the admin can configure webhook authentication.
--          Steadfast uses a Bearer JWT; Pathao uses a shared secret for
--          both the handshake response header and X-PATHAO-Signature validation.
-- Preconditions:
--   1) Run after V2-032.
--   2) Safe to re-run (ON DUPLICATE KEY UPDATE).
-- ============================================================
-- START V2-033

INSERT INTO `system_config` (`service`, `key_name`, `value`, `provider`, `is_active`)
VALUES
  ('courier', 'STEADFAST_WEBHOOK_SECRET', '', 'steadfast', 1),
  ('courier', 'PATHAO_WEBHOOK_SECRET',    '', 'pathao',    1)
ON DUPLICATE KEY UPDATE
  `value`     = VALUES(`value`),
  `is_active` = VALUES(`is_active`);

-- END V2-033

-- ============================================================
-- [V2-017] order-distribution-and-assignment
-- Date: 2026-04-03
-- Summary: Adds order distribution pool, assignment tracking,
--          audit log, and per-admin unassigned-order permission.
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy order_assignment.js controller after migration.
-- ============================================================
-- START V2-017
START TRANSACTION;

-- 1. Distribution settings (singleton)
CREATE TABLE IF NOT EXISTS `order_distribution_settings` (
  `id` INT NOT NULL DEFAULT 1,
  `auto_assign_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `assign_on_order_create` TINYINT(1) NOT NULL DEFAULT 1,
  `include_admin_role` TINYINT(1) NOT NULL DEFAULT 1,
  `include_order_manager_role` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `single_dist_settings` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `order_distribution_settings` (`id`) VALUES (1);

-- 2. Distribution agent pool
CREATE TABLE IF NOT EXISTS `order_distribution_agents` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `serial` INT NOT NULL DEFAULT 1,
  `auto_assign_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `max_active_orders` INT NULL COMMENT 'NULL = unlimited',
  `status` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dist_agent_admin` (`admin_id`),
  KEY `idx_dist_agent_serial` (`serial`),
  CONSTRAINT `fk_dist_agent_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Assignment audit log
CREATE TABLE IF NOT EXISTS `order_assignment_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `from_admin_id` INT NULL,
  `to_admin_id` INT NULL,
  `action_type` ENUM('auto_assign','manual','redistribute','unassign') NOT NULL DEFAULT 'manual',
  `changed_by_admin_id` INT NULL,
  `note` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oal_order` (`order_id`),
  KEY `idx_oal_to_admin` (`to_admin_id`),
  KEY `idx_oal_created` (`created_at`),
  CONSTRAINT `fk_oal_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oal_from_admin`
    FOREIGN KEY (`from_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_oal_to_admin`
    FOREIGN KEY (`to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_oal_changed_by`
    FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Add assignment columns to orders table (safe ALTER — skips if column exists)
ALTER TABLE `orders`
  ADD COLUMN  `assigned_to_admin_id` INT NULL ,
  ADD COLUMN  `assigned_by_admin_id` INT NULL AFTER `assigned_to_admin_id`,
  ADD COLUMN  `assignment_method` ENUM('auto','manual','redistribute') NULL AFTER `assigned_by_admin_id`,
  ADD COLUMN  `assigned_at` TIMESTAMP NULL AFTER `assignment_method`,
  ADD KEY `idx_orders_assigned_admin` (`assigned_to_admin_id`);

-- 5. Add allow_handle_unassigned_order to per-admin permissions
ALTER TABLE `admin_notification_permissions`
  ADD COLUMN  `allow_handle_unassigned_order` TINYINT(1) NOT NULL DEFAULT 1
  COMMENT 'When 0, admin can only see orders assigned to them';

COMMIT;
-- END V2-017

-- =====================================================================
-- [V2-034] admin-push-tokens — FCM token store for admin push notifications
-- Date: 2026-04-04
-- Summary: Stores per-admin FCM tokens so the backend can send Firebase
--          push notifications to each admin's registered browser sessions.
--          Tokens are deactivated on logout or when Firebase reports them stale.
-- Preconditions: V2-017 must be applied (admins table exists)
-- =====================================================================
-- START V2-034
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `admin_push_tokens` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`   INT             NOT NULL,
  `fcm_token`  TEXT            NOT NULL,
  `user_agent` VARCHAR(512)    NULL,
  `is_active`  TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_apt_admin_active` (`admin_id`, `is_active`),
  CONSTRAINT `fk_apt_admin`
    FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores FCM tokens for admin browser push notifications (V2-034)';

COMMIT;
-- END V2-034

-- =====================================================================
-- [V2-035] user-push-tokens — FCM token store for customer push notifications
-- Date: 2026-04-04
-- Summary: Stores per-user FCM tokens so the backend can push order status
--          updates (approved, shipped, delivered, cancelled, etc.) to customers
--          in real-time across email, SMS, and Firebase push.
--          Also adds firebase_push_notification flag to order_status_notification_user.
-- Preconditions: users table must exist
-- =====================================================================
-- START V2-035
START TRANSACTION;

-- 1. Customer FCM token table
CREATE TABLE IF NOT EXISTS `user_push_tokens` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,

  `fcm_token`  TEXT            NOT NULL,
  `user_agent` VARCHAR(512)    NULL,
  `is_active`  TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_upt_user_active` (`user_id`, `is_active`),
  CONSTRAINT `fk_upt_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Stores FCM tokens for customer browser push notifications (V2-035)';

-- 2. Add firebase_push_notification permission flag for customer notifications
INSERT IGNORE INTO `permission_config` (`section`, `scope`, `key_name`, `value`, `value_type`)
VALUES ('order_status_notification_user', 'default', 'firebase_push_notification', 'false', 'bool');

COMMIT;
-- END V2-035


-- [V2-036] report-system-and-contact-report-notification-architecture
-- Date: 2026-04-04
-- Summary: Decouple Reports from Contact Us. Add report tables, report distribution pool,
--          extend admin_notification_permissions with 6 new contact/report notification columns,
--          add assignment columns to contact_messages, and seed permission_config for
--          contact__notification_admin and report__notification_admin.
-- Preconditions:
--   1) V2-018 (admin_notification_permissions table) must exist.
--   2) V2-035 (user_push_tokens) must exist.
--   3) Run in maintenance window.

-- START V2-036

-- 1. Extend admin_notification_permissions (6 new columns)
ALTER TABLE `admin_notification_permissions`
  ADD COLUMN  `contact_notification_email`         TINYINT(1) NOT NULL DEFAULT '1' AFTER `personal_notification_firebase_push`,
  ADD COLUMN  `contact_notification_sms`           TINYINT(1) NOT NULL DEFAULT '0' AFTER `contact_notification_email`,
  ADD COLUMN  `contact_notification_firebase_push` TINYINT(1) NOT NULL DEFAULT '1' AFTER `contact_notification_sms`,
  ADD COLUMN  `report_notification_email`          TINYINT(1) NOT NULL DEFAULT '1' AFTER `contact_notification_firebase_push`,
  ADD COLUMN  `report_notification_sms`            TINYINT(1) NOT NULL DEFAULT '0' AFTER `report_notification_email`,
  ADD COLUMN  `report_notification_firebase_push`  TINYINT(1) NOT NULL DEFAULT '1' AFTER `report_notification_sms`;

-- 2. Extend contact_messages (assignment columns)
ALTER TABLE `contact_messages`
  ADD COLUMN  `assigned_to_admin_id` INT DEFAULT NULL AFTER `status`,
  ADD COLUMN  `assigned_by_admin_id` INT DEFAULT NULL AFTER `assigned_to_admin_id`,
  ADD COLUMN  `assigned_at`          TIMESTAMP NULL DEFAULT NULL AFTER `assigned_by_admin_id`;
ALTER TABLE `contact_messages` ADD INDEX  `idx_cm_assigned` (`assigned_to_admin_id`);

-- 3. Seed permission_config
INSERT IGNORE INTO `permission_config` (`section`, `scope`, `key_name`, `value`, `value_type`, `is_active`)
VALUES
  ('contact__notification_admin', 'default', 'email',                      'true',  'bool', 1),
  ('contact__notification_admin', 'default', 'sms',                        'false', 'bool', 1),
  ('contact__notification_admin', 'default', 'firebase_push_notification',  'false', 'bool', 1),
  ('report__notification_admin',  'default', 'email',                      'true',  'bool', 1),
  ('report__notification_admin',  'default', 'sms',                        'false', 'bool', 1),
  ('report__notification_admin',  'default', 'firebase_push_notification',  'false', 'bool', 1);

-- 4. Create reports table
CREATE TABLE IF NOT EXISTS `reports` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tracking_token`  VARCHAR(64)     NOT NULL,
  `user_id`         BIGINT UNSIGNED DEFAULT NULL,
  `reporter_name`   VARCHAR(150)    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_email`  VARCHAR(255)    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reporter_phone`  VARCHAR(20)     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category`        ENUM('product_issue','order_issue','fraud','general','other') NOT NULL DEFAULT 'general',
  `subject`         VARCHAR(255)    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description`     TEXT            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id`        BIGINT UNSIGNED DEFAULT NULL,
  `status`          ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
  `priority`        ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `assigned_to_admin_id` INT DEFAULT NULL,
  `assigned_by_admin_id` INT DEFAULT NULL,
  `assignment_method`    ENUM('auto','manual','redistribute') DEFAULT NULL,
  `assigned_at`          TIMESTAMP NULL DEFAULT NULL,
  `is_read`    TINYINT(1) NOT NULL DEFAULT '0',
  `is_replied` TINYINT(1) NOT NULL DEFAULT '0',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_report_token`  (`tracking_token`),
  KEY `idx_report_user`           (`user_id`),
  KEY `idx_report_status`         (`status`, `created_at`),
  KEY `idx_report_assigned`       (`assigned_to_admin_id`),
  KEY `idx_report_deleted`        (`deleted_at`),
  CONSTRAINT `fk_report_user`     FOREIGN KEY (`user_id`)              REFERENCES `users`  (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_assigned` FOREIGN KEY (`assigned_to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_report_assigner` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create report_replies table
CREATE TABLE IF NOT EXISTS `report_replies` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id`  BIGINT UNSIGNED NOT NULL,
  `admin_id`   INT DEFAULT NULL,
  `reply_text` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reply_via`  VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rr_report` (`report_id`),
  KEY `idx_rr_admin`  (`admin_id`),
  CONSTRAINT `fk_rr_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rr_admin`  FOREIGN KEY (`admin_id`)  REFERENCES `admins`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Create report_distribution_settings (single row)
CREATE TABLE IF NOT EXISTS `report_distribution_settings` (
  `id`                         INT NOT NULL DEFAULT '1',
  `auto_assign_enabled`        TINYINT(1) NOT NULL DEFAULT '1',
  `assign_on_report_create`    TINYINT(1) NOT NULL DEFAULT '1',
  `include_admin_role`         TINYINT(1) NOT NULL DEFAULT '1',
  `include_order_manager_role` TINYINT(1) NOT NULL DEFAULT '0',
  `last_assigned_admin_id`     INT DEFAULT NULL,
  `updated_by_admin`           INT DEFAULT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `single_row_rds` CHECK (`id` = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT IGNORE INTO `report_distribution_settings` (`id`) VALUES (1);

-- 7. Create report_distribution_agents table
CREATE TABLE IF NOT EXISTS `report_distribution_agents` (
  `id`                  INT NOT NULL AUTO_INCREMENT,
  `admin_id`            INT NOT NULL,
  `serial`              INT NOT NULL DEFAULT '1',
  `max_active_reports`  INT DEFAULT NULL,
  `auto_assign_enabled` TINYINT(1) NOT NULL DEFAULT '1',
  `status`              TINYINT(1) NOT NULL DEFAULT '1',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_rda_admin` (`admin_id`),
  KEY `idx_rda_serial` (`serial`),
  KEY `idx_rda_status` (`status`),
  CONSTRAINT `fk_rda_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- END V2-036




-- =============================================================================
-- V2-037: Contact Distribution Pool
-- Run AFTER V2-036. Adds auto-distribution support for contact messages.
-- =============================================================================


-- 2. Contact Distribution Settings (single-row global config)
CREATE TABLE IF NOT EXISTS `contact_distribution_settings` (
  `id`                         INT(11)     NOT NULL AUTO_INCREMENT,
  `auto_assign_enabled`        TINYINT(1)  NOT NULL DEFAULT '0',
  `assign_on_message_create`   TINYINT(1)  NOT NULL DEFAULT '0',
  `include_admin_role`         TINYINT(1)  NOT NULL DEFAULT '1',
  `include_order_manager_role` TINYINT(1)  NOT NULL DEFAULT '1',
  `last_assigned_admin_id`     INT(11)              DEFAULT NULL,
  `updated_by_admin`           INT(11)              DEFAULT NULL,
  `updated_at`                 DATETIME             DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `contact_distribution_settings`
  (`id`, `auto_assign_enabled`, `assign_on_message_create`, `include_admin_role`, `include_order_manager_role`)
VALUES (1, 0, 0, 1, 1);

-- 3. Contact Distribution Agents pool
CREATE TABLE IF NOT EXISTS `contact_distribution_agents` (
  `id`                   INT(11)     NOT NULL AUTO_INCREMENT,
  `admin_id`             INT(11)     NOT NULL,
  `serial`               INT(11)     NOT NULL DEFAULT '1'  COMMENT 'Tie-break priority: lower = higher priority',
  `max_active_messages`  INT(11)              DEFAULT NULL  COMMENT 'NULL = unlimited concurrent messages',
  `auto_assign_enabled`  TINYINT(1)  NOT NULL DEFAULT '1',
  `status`               TINYINT(1)  NOT NULL DEFAULT '1',
  `created_at`           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_cda_admin` (`admin_id`),
  KEY `idx_cda_serial` (`serial`),
  KEY `idx_cda_status` (`status`),
  CONSTRAINT `fk_cda_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- END V2-037

-- =============================================================================
-- V2-038: Report & Contact Assignment Logs Tables
-- Manual assign/reassign/unassign audit trail (mirrors order_assignment_logs)
-- =============================================================================

-- 1. Report assignment logs
CREATE TABLE IF NOT EXISTS `report_assignment_logs` (
  `id`                 INT(11)     NOT NULL AUTO_INCREMENT,
  `report_id`          INT(11)     NOT NULL,
  `action_type`        ENUM('auto_assign','manual','redistribute','unassign') NOT NULL DEFAULT 'manual',
  `from_admin_id`      INT(11)              DEFAULT NULL,
  `to_admin_id`        INT(11)              DEFAULT NULL,
  `changed_by_admin_id` INT(11)             DEFAULT NULL,
  `created_at`         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ral_report`  (`report_id`),
  KEY `idx_ral_to`      (`to_admin_id`),
  KEY `idx_ral_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Contact message assignment logs
CREATE TABLE IF NOT EXISTS `contact_assignment_logs` (
  `id`                  INT(11)     NOT NULL AUTO_INCREMENT,
  `message_id`          INT(11)     NOT NULL,
  `action_type`         ENUM('auto_assign','manual','redistribute','unassign') NOT NULL DEFAULT 'manual',
  `from_admin_id`       INT(11)              DEFAULT NULL,
  `to_admin_id`         INT(11)              DEFAULT NULL,
  `changed_by_admin_id` INT(11)              DEFAULT NULL,
  `created_at`          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cal_message` (`message_id`),
  KEY `idx_cal_to`      (`to_admin_id`),
  KEY `idx_cal_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- END V2-038

-- ============================================================
-- [V2-040] notification-history-full-repair
-- Date: 2026-04-05
-- Summary: Expand notification_histories.category enum to include
--          4 new values needed for comprehensive logging:
--          * order_admin  — admin notified of new/assigned order
--          * contact_admin — admin notified of assigned contact message
--          * report_admin  — admin notified of assigned report
--          * report_reply  — customer notified of report reply
--          Also handles the announcement batch tracking source_type expansion.
-- Preconditions:
--   1) V2-038 must be applied.
--   2) notification_histories table must exist (V2-020).
-- ============================================================
-- START V2-040

ALTER TABLE `notification_histories`
  MODIFY COLUMN `category`
  ENUM(
    'order_status',
    'order_admin',
    'forgot_password',
    'welcome',
    'announcement',
    'contact_reply',
    'contact_admin',
    'report_admin',
    'report_reply',
    'personal',
    'otp',
    'system',
    'other'
  ) NOT NULL DEFAULT 'other';

-- END V2-040

-- ============================================================
-- [V2-041] audit-actions-for-report-contact-distribution
-- Date: 2026-04-06
-- Summary: Register all missing audit_actions keys that were being
--          written to admin_audit_logs by report.js and contact.js
--          but had no entry in the audit_actions lookup table.
--          Also adds two new user_audit_actions for public report
--          and contact message submission.
-- Preconditions:
--   1) V2-040 must be applied.
--   2) Deploy updated report.js and contact.js before or alongside.
-- ============================================================
-- START V2-041

INSERT IGNORE INTO `audit_actions` (`action_key`, `display_name`) VALUES

-- ── Report management ──────────────────────────────────────────────────────
('REPLY_REPORT',                          'Reply to Report'),
('ASSIGN_REPORT',                         'Assign Report'),
('UNASSIGN_REPORT',                       'Unassign Report'),
('UPDATE_REPORT_STATUS',                  'Update Report Status'),
('DELETE_REPORT',                         'Delete Report'),

-- ── Report distribution pool ───────────────────────────────────────────────
('UPDATE_REPORT_DISTRIBUTION_SETTINGS',   'Update Report Distribution Settings'),
('ADD_REPORT_DISTRIBUTION_AGENT',         'Add Report Distribution Agent'),
('EDIT_REPORT_DISTRIBUTION_AGENT',        'Edit Report Distribution Agent'),
('REMOVE_REPORT_DISTRIBUTION_AGENT',      'Remove Report Distribution Agent'),
('REDISTRIBUTE_REPORTS',                  'Redistribute Reports'),

-- ── Contact message management ─────────────────────────────────────────────
('REPLY_CONTACT_MESSAGE',                 'Reply to Contact Message'),
('ASSIGN_CONTACT_MESSAGE',               'Assign Contact Message'),
('UNASSIGN_CONTACT_MESSAGE',             'Unassign Contact Message'),

-- ── Contact distribution pool ──────────────────────────────────────────────
('UPDATE_CONTACT_DISTRIBUTION_SETTINGS',  'Update Contact Distribution Settings'),
('ADD_CONTACT_DISTRIBUTION_AGENT',        'Add Contact Distribution Agent'),
('EDIT_CONTACT_DISTRIBUTION_AGENT',       'Edit Contact Distribution Agent'),
('REMOVE_CONTACT_DISTRIBUTION_AGENT',     'Remove Contact Distribution Agent'),
('REDISTRIBUTE_CONTACT_MESSAGES',         'Redistribute Contact Messages');

-- New user-facing audit actions
INSERT IGNORE INTO `user_audit_actions` (`action_key`, `display_name`, `category`) VALUES
('SUBMIT_REPORT',          'Submit Report',          'SUPPORT'),
('SUBMIT_CONTACT_MESSAGE', 'Submit Contact Message', 'SUPPORT');

-- END V2-041

-- ============================================================
-- [V2-042] guest-checkout-email-otp-verification
-- Date: 2026-04-08
-- Summary: Add email OTP verification support to guest_orders and
--          a location_mapping_id column for delivery area linkage.
--
--          New columns on guest_orders:
--            * email_otp         – 6-digit OTP sent to guest email
--            * email_otp_exp     – expiry timestamp (10 min window)
--            * is_email_verified – boolean flag set after OTP confirmed
--            * location_mapping_id – FK-less reference to delivery area
--              (mirrors the area selected in DeliveryAreaSelector)
--
--          New backend endpoints (no DB change, for reference):
--            GET  /api/v1/guest/orderPermissions
--            POST /api/v1/guest/order/:id/send-email-otp
--            POST /api/v1/guest/order/:id/verify-email-otp
--
--          updateGuestOrder also now accepts location_mapping_id and note.
--
-- Preconditions:
--   1) Run in maintenance window.
--   2) Deploy updated guest_order.js and index.js before or alongside.
-- ============================================================
-- START V2-042

ALTER TABLE `guest_orders`
  ADD COLUMN `email_otp`          VARCHAR(10)  NULL DEFAULT NULL
    AFTER `otp_exp`,
  ADD COLUMN `email_otp_exp`      DATETIME     NULL DEFAULT NULL
    AFTER `email_otp`,
  ADD COLUMN `is_email_verified`  TINYINT(1)   NOT NULL DEFAULT 0
    AFTER `email_otp_exp`,
  ADD COLUMN `location_mapping_id` INT(11)     NULL DEFAULT NULL
    AFTER `zip_code`;

-- END V2-042

-- ============================================================
-- [V2-043] remove-regular-order-email-verified-config
-- Date: 2026-04-08
-- Summary: Email verification for registered customer orders is now hardcoded
--          (always required) in validateRegularOrderPermission.
--          The configurable toggle is removed from the admin panel — unverified
--          users can use guest checkout instead. This migration deletes the DB
--          row so the toggle disappears from
--          "Order Placement Requirements → Registered Customer Order".
-- Preconditions:
--   1) Deploy updated orderPermission.js and PermissionSettingsDB.js first.
-- ============================================================
-- START V2-043

DELETE FROM `permission_config`
WHERE `section`  = 'order_place_permission'
  AND `scope`    = 'regular'
  AND `key_name` = 'email_verified';

-- END V2-043

-- ============================================================
-- [V2-044] remove-guest-email-otp-verification
-- Date: 2026-04-08
-- Summary: Guest email OTP verification has been removed.
--          Rationale: the whole point of guest checkout is that customers can
--          order without creating an account. Requiring email OTP was unnecessary
--          friction — phone verification is sufficient.
--
--          Changes:
--            1. Delete permission_config rows for guest email:
--               - order_place_permission / guest / is_email_required
--               - order_place_permission / guest / is_email_verification_required
--            2. Drop OTP-related columns from guest_orders (added in V2-042):
--               - email_otp, email_otp_exp, is_email_verified
--            NOTE: location_mapping_id (also added in V2-042) is KEPT.
-- Preconditions:
--   1) Deploy updated orderPermission.js and PermissionSettingsDB.js first.
-- ============================================================
-- START V2-044

-- Remove guest email permission config rows
DELETE FROM `permission_config`
WHERE `section`  = 'order_place_permission'
  AND `scope`    = 'guest'
  AND `key_name` IN ('is_email_required', 'is_email_verification_required');

-- Drop OTP columns that are no longer used
ALTER TABLE `guest_orders`
  DROP COLUMN `email_otp`,
  DROP COLUMN `email_otp_exp`,
  DROP COLUMN `is_email_verified`;

-- END V2-044

-- ============================================================
-- [V2-045] restore-guest-email-required-config
-- Date: 2026-04-08
-- Summary: V2-044 incorrectly deleted is_email_required for the guest scope
--          alongside is_email_verification_required. Only the verification step
--          was meant to be removed. This migration re-inserts is_email_required
--          (default true) so the admin can still toggle whether guests must
--          provide an email address at checkout.
-- ============================================================
-- START V2-045

INSERT INTO `permission_config`
  (`section`, `scope`, `key_name`, `value`, `value_type`, `is_active`)
VALUES
  ('order_place_permission', 'guest', 'is_email_required', 'true', 'bool', 1)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `value_type` = VALUES(`value_type`),
  `is_active`  = VALUES(`is_active`);

-- END V2-045

-- ============================================================
-- [V2-046] announcement-zone-area-level-targeting
-- Date: 2026-04-10
-- Summary: Upgrade announcement zone targeting from city-only to
--          hierarchical city -> area (location_mappings.id) support.
--          Keeps legacy city rows compatible while allowing multi-area
--          selection under the same city.
-- Preconditions:
--   1) Deploy updated controllers/announcement.js and admin panel first.
--   2) Backup announcement_zones table before running.
-- ============================================================
-- START V2-046

ALTER TABLE `announcement_zones`
  ADD COLUMN  `location_mapping_id` INT NULL
    COMMENT 'FK-like ref to location_mappings.id for area-level targeting'
    AFTER `announcement_id`,
  ADD COLUMN  `area_name` VARCHAR(150) NULL
    AFTER `city_name`,
  ADD COLUMN  `area_name_normalized` VARCHAR(170) NULL
    AFTER `city_name_normalized`;

ALTER TABLE `announcement_zones`
  MODIFY COLUMN `city_name` VARCHAR(100) NULL,
  MODIFY COLUMN `city_name_normalized` VARCHAR(120) NULL;

ALTER TABLE `announcement_zones`
  DROP INDEX `uniq_announcement_city`,
  ADD UNIQUE KEY `uniq_announcement_zone_target`
    (`announcement_id`, `location_mapping_id`, `city_name_normalized`, `area_name_normalized`);

ALTER TABLE `announcement_zones`
  ADD KEY `idx_az_location_mapping` (`location_mapping_id`),
  ADD KEY `idx_az_area_norm` (`area_name_normalized`);

-- END V2-046

-- ============================================================
-- [V2-047] courier-location-staging-tables
-- Date: 2026-04-12
-- Summary: Create raw staging tables for Pathao and Steadfast courier
--          location data. These hold the full courier hierarchy fetched
--          from each courier's API. They are TRUNCATED and re-populated
--          on every sync run, then merged into location_mappings by the
--          merge controller (POST /api/v1/config/merge-location-mappings).
-- Impact: No existing table or data is modified. Two new tables only.
-- Preconditions:
--   1) Safe to run at any time.
--   2) Deploy controllers/location_sync.js and helper endpoints first.
-- ============================================================
-- START V2-047

CREATE TABLE IF NOT EXISTS `pathao_locations_raw` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `city_id`     INT            NOT NULL COMMENT 'Pathao city_id  (level-1 = district)',
  `city_name`   VARCHAR(150)   NOT NULL COMMENT 'Pathao city name (e.g. Dhaka)',
  `zone_id`     INT            NOT NULL COMMENT 'Pathao zone_id  (level-2 = zone/thana)',
  `zone_name`   VARCHAR(150)   NOT NULL COMMENT 'Pathao zone name (e.g. Ashulia)',
  `area_id`     INT            NOT NULL COMMENT 'Pathao area_id  (level-3 = area)',
  `area_name`   VARCHAR(150)   NOT NULL COMMENT 'Pathao area name',
  `synced_at`   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pathao_area` (`area_id`),
  KEY `idx_plr_city` (`city_id`),
  KEY `idx_plr_zone` (`zone_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `steadfast_locations_raw` (
  `id`              INT            NOT NULL AUTO_INCREMENT,
  `district_id`     INT            NOT NULL COMMENT 'Steadfast district id (level-1)',
  `district_name`   VARCHAR(150)   NOT NULL COMMENT 'Steadfast district name (e.g. Dhaka City)',
  `station_id`      INT            NOT NULL COMMENT 'Police station id (level-2 / thana)',
  `station_name`    VARCHAR(150)   NOT NULL COMMENT 'Police station / thana name',
  `synced_at`       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sf_station` (`station_id`),
  KEY `idx_slr_district` (`district_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- END V2-047

-- ============================================================
-- [V2-048] courier-location-merge-and-backfill
-- Date: 2026-04-12
-- Summary: Documents the merge controller workflow that:
--   Step 1: Upserts pathao_locations_raw → location_mappings
--           (sets district_name = Pathao city, city_name = zone, area_name = area)
--   Step 2: Upserts steadfast_locations_raw → location_mappings
--           (links by steadfast_id or inserts standalone rows)
--   Step 3: Backfills district_name on legacy location_mappings rows by
--           self-joining city_name against already-populated rows
--   Step 4: Backfills order_addresses.location_mapping_id for old orders
--           where it was NULL or pointed to a stale row (with synonym &
--           misspelling map + first-word fuzzy fallback)
--   Step 5: Normalizes Steadfast "X City" district names to match Pathao
--           canonical names (e.g. "Dhaka City" → "Dhaka")
--
-- Impact:
--   - location_mappings: district_name populated on ~37,000+ rows
--   - order_addresses: location_mapping_id backfilled on ~200 legacy rows
--   - orders, addresses, announcements: NOT MODIFIED
--
-- Endpoints:
--   POST /api/v1/config/sync-pathao-locations     (SUPER_ADMIN)
--   POST /api/v1/config/sync-steadfast-locations   (SUPER_ADMIN)
--   POST /api/v1/config/merge-location-mappings    (SUPER_ADMIN)
--     ?dry_run=true       → preview only, no writes
--     ?pathao_only=true    → skip Steadfast
--     ?steadfast_only=true → skip Pathao
--
-- Dev tool: http://localhost:9000/location-sync-tool
--
-- NOTE: No SQL needs to be run manually. All operations are performed
--       inline by the merge controller via the dev tool UI.
-- ============================================================
-- START V2-048
-- (no SQL — all logic is in controllers/location_sync.js)
-- END V2-048

-- ============================================================
-- GUIDELINE: Adding RedX / Paperfly Location Sync
-- ============================================================
--
-- When RedX or Paperfly credentials become available, follow this pattern:
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 1: Create staging table (new V2-0XX migration)        │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  CREATE TABLE IF NOT EXISTS `redx_locations_raw` (           │
-- │    `id`            INT NOT NULL AUTO_INCREMENT,              │
-- │    `district_id`   INT NOT NULL,                             │
-- │    `district_name` VARCHAR(150) NOT NULL,                    │
-- │    `area_id`       INT NOT NULL,                             │
-- │    `area_name`     VARCHAR(150) NOT NULL,                    │
-- │    `synced_at`     TIMESTAMP NOT NULL DEFAULT                │
-- │                    CURRENT_TIMESTAMP ON UPDATE               │
-- │                    CURRENT_TIMESTAMP,                        │
-- │    PRIMARY KEY (`id`),                                       │
-- │    UNIQUE KEY `uniq_redx_area` (`area_id`),                 │
-- │    KEY `idx_rlr_district` (`district_id`)                   │
-- │  );                                                          │
-- │                                                              │
-- │  -- Same pattern for paperfly_locations_raw                  │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 2: Add column to location_mappings                     │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  ALTER TABLE `location_mappings`                             │
-- │    ADD COLUMN `redx_area_id` INT NULL                       │
-- │    AFTER `steadfast_id`,                                     │
-- │    ADD UNIQUE KEY `uniq_redx_id` (`redx_area_id`);          │
-- │                                                              │
-- │  -- Same for paperfly_area_id or paperfly_hub_id             │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 3: Add sync endpoint in controllers/location_sync.js   │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  exports.syncRedxLocations = api({}, auth(async (...) => {   │
-- │    // 1. Fetch credentials from system_config (provider=redx)│
-- │    // 2. Call RedX API to get districts + areas              │
-- │    // 3. TRUNCATE redx_locations_raw                         │
-- │    // 4. INSERT each district/area into staging table        │
-- │  }));                                                        │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 4: Add merge block in mergeLocationMappings controller │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  Follow the same 3-tier logic as Steadfast:                  │
-- │    1. If redx_area_id already exists → UPDATE district_name  │
-- │    2. Else try to link to existing Pathao row by area_name   │
-- │    3. Else INSERT standalone row                             │
-- │                                                              │
-- │  Add a DO_REDX flag controlled by ?redx_only=true query     │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 5: Register route in index.js                          │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  router.post('/config/sync-redx-locations',                  │
-- │    locationSync.syncRedxLocations);                           │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 6: Add buttons to location-sync-tool.html              │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  Add "Run RedX Sync" button pointing to:                     │
-- │    POST /api/v1/config/sync-redx-locations                   │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- ┌──────────────────────────────────────────────────────────────┐
-- │ STEP 7: Add synonym entries (if needed)                     │
-- ├──────────────────────────────────────────────────────────────┤
-- │                                                              │
-- │  If RedX/Paperfly uses different district names than Pathao, │
-- │  add entries to the SYNONYMS map in Step 4 of the merge      │
-- │  controller (e.g. 'dhaka metro' → 'dhaka').                  │
-- │                                                              │
-- └──────────────────────────────────────────────────────────────┘
--
-- NAMING CONVENTION:
--   Staging table:  {courier}_locations_raw
--   FK column:      {courier}_area_id or {courier}_hub_id
--   Sync endpoint:  /config/sync-{courier}-locations
--   Unique key:     uniq_{courier}_id
-- ============================================================
