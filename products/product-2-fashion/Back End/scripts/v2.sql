-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: myecomv2
-- ------------------------------------------------------
-- Server version	8.4.7-google

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


--
-- Table structure for table `admin_audit_logs`
--

DROP TABLE IF EXISTS `admin_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `resource` varchar(100) DEFAULT NULL,
  `resource_id` varchar(50) DEFAULT NULL,
  `meta` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_aal_admin_id` (`admin_id`),
  KEY `idx_aal_created_at` (`created_at`),
  KEY `admin_id` (`admin_id`),
  KEY `created_at` (`created_at`),
  KEY `action` (`action`),
  KEY `idx_audit_logs_id_desc` (`id`),
  CONSTRAINT `admin_audit_logs_chk_1` CHECK (json_valid(`meta`))
) ENGINE=InnoDB AUTO_INCREMENT=4302 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `admin_roles`
--

DROP TABLE IF EXISTS `admin_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_roles` (
  `admin_id` int NOT NULL,
  `role_id` int NOT NULL,
  PRIMARY KEY (`admin_id`,`role_id`),
  KEY `idx_ar_role_id` (`role_id`),
  CONSTRAINT `admin_roles_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_roles_ibfk_2` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `token_version` int DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by_admin_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `profile_img_path` text,
  `first_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` text,
  `otp` varchar(10) DEFAULT NULL,
  `otp_exp` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_admins_deleted_at` (`deleted_at`),
  KEY `idx_admins_deleted_by_admin` (`deleted_by_admin_id`),
  CONSTRAINT `fk_admins_deleted_by_admin` FOREIGN KEY (`deleted_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `admin_notification_permissions`
--

DROP TABLE IF EXISTS `admin_notification_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_notification_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `order_notification_email` tinyint(1) NOT NULL DEFAULT '1',
  `order_notification_sms` tinyint(1) NOT NULL DEFAULT '0',
  `order_notification_firebase_push` tinyint(1) NOT NULL DEFAULT '1',
  `personal_notification_email` tinyint(1) NOT NULL DEFAULT '1',
  `personal_notification_sms` tinyint(1) NOT NULL DEFAULT '0',
  `personal_notification_firebase_push` tinyint(1) NOT NULL DEFAULT '1',
  `allow_handle_unassigned_order` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'When 0, admin can only see orders assigned to them (V2-017)',
  `updated_by_admin` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_admin_notification_permissions_admin` (`admin_id`),
  KEY `idx_anp_updated_by` (`updated_by_admin`),
  CONSTRAINT `admin_notification_permissions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE,
  CONSTRAINT `admin_notification_permissions_ibfk_2` FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `analytics_config`
--

DROP TABLE IF EXISTS `analytics_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analytics_config` (
  `id` int NOT NULL DEFAULT '1',
  `config` json NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `single_row` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `headline` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_path` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_type` enum('all','subscribed_only','registered_users_only') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `zone_scope` enum('all','selected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `status` enum('draft','scheduled','sent','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `channel` enum('email','sms','both') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'email',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `open_count` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_announcement_delivery` (`status`,`scheduled_at`),
  KEY `idx_announcement_target` (`target_type`),
  KEY `idx_announcement_zone_scope` (`zone_scope`),
  KEY `idx_announcement_sent_history` (`sent_at`),
  KEY `idx_announcement_active` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `announcement_zones`
--

DROP TABLE IF EXISTS `announcement_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_zones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `announcement_id` bigint unsigned NOT NULL,
  `location_mapping_id` int DEFAULT NULL COMMENT 'FK-like ref to location_mappings.id for area-level targeting',
  `city_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_name_normalized` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_name_normalized` varchar(170) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_announcement_zone_target` (`announcement_id`,`location_mapping_id`,`city_name_normalized`,`area_name_normalized`),
  KEY `idx_az_announcement` (`announcement_id`),
  KEY `idx_az_location_mapping` (`location_mapping_id`),
  KEY `idx_az_city_norm` (`city_name_normalized`),
  KEY `idx_az_area_norm` (`area_name_normalized`),
  CONSTRAINT `announcement_zones_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `attributes`
--

DROP TABLE IF EXISTS `attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attributes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priority` tinyint DEFAULT '1',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_attribute_name` (`name`),
  KEY `idx_attr_status_priority` (`status`,`priority`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `audit_actions`
--

DROP TABLE IF EXISTS `audit_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_key` varchar(100) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `action_key` (`action_key`)
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `zone` enum('Home Top','Home Middle','Home Bottom','Category Page','Product Page','Campaign') NOT NULL,
  `type` enum('Default','Category wise','Product wise','Custom URL') NOT NULL,
  `img_path` varchar(512) NOT NULL,
  `path` text,
  `featured` tinyint(1) DEFAULT '0',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title` (`title`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `img_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` tinyint DEFAULT '1' COMMENT '1: Normal, 2: Medium, 3: High',
  `status` tinyint(1) DEFAULT '1' COMMENT '0: Inactive, 1: Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_brand_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `child_categories`
--

DROP TABLE IF EXISTS `child_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `child_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sub_category_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `priority` tinyint DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_child_sub_id` (`sub_category_id`),
  CONSTRAINT `fk_child_sub` FOREIGN KEY (`sub_category_id`) REFERENCES `sub_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `colors`
--

DROP TABLE IF EXISTS `colors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `hex` varchar(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Hex code e.g. #FFFFFF',
  `priority` tinyint DEFAULT '1',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_color_name` (`name`),
  UNIQUE KEY `unique_color_hex` (`hex`)
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `is_replied` tinyint(1) DEFAULT '0',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_contact_inbox` (`deleted_at`,`is_read`,`created_at` DESC),
  KEY `idx_contact_history` (`email`,`created_at`),
  KEY `idx_contact_user` (`user_id`,`created_at`),
  CONSTRAINT `fk_contact_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `contact_replies`
--

DROP TABLE IF EXISTS `contact_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_replies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `message_id` bigint unsigned NOT NULL,
  `admin_id` int DEFAULT NULL,
  `reply_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('email','sms') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'email',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reply_msg_id` (`message_id`),
  KEY `idx_reply_admin_id` (`admin_id`),
  CONSTRAINT `fk_reply_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reply_msg` FOREIGN KEY (`message_id`) REFERENCES `contact_messages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `dynamic_policies`
--

DROP TABLE IF EXISTS `dynamic_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dynamic_policies` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `policy_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `bd_title` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bengali title for dual-language support',
  `content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `content_type` enum('html','text') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'html',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `updated_by_admin` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_dynamic_policy_key` (`policy_key`),
  KEY `idx_dynamic_policy_status` (`status`),
  KEY `idx_dynamic_policy_deleted` (`deleted_at`),
  KEY `idx_dynamic_policy_updated_by` (`updated_by_admin`),
  CONSTRAINT `dynamic_policies_ibfk_1` FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `coupon_customer_targets`
--

DROP TABLE IF EXISTS `coupon_customer_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_customer_targets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_id` int NOT NULL,
  `customer_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_coupon_customer_lookup` (`coupon_id`,`customer_id`),
  KEY `idx_customer_coupon_lookup` (`customer_id`,`coupon_id`),
  CONSTRAINT `coupon_customer_targets_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `coupon_product_targets`
--

DROP TABLE IF EXISTS `coupon_product_targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_product_targets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coupon_id` int NOT NULL,
  `product_sku_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_coupon_sku` (`coupon_id`,`product_sku_id`),
  KEY `idx_coupon_sku_lookup` (`coupon_id`,`product_sku_id`),
  KEY `idx_sku_coupon_lookup` (`product_sku_id`,`coupon_id`),
  CONSTRAINT `coupon_product_targets_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_product_targets_ibfk_2` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `coupon_usages`
--

DROP TABLE IF EXISTS `coupon_usages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupon_usages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `coupon_id` int NOT NULL,
  `order_id` bigint unsigned NOT NULL,
  `customer_id` bigint unsigned DEFAULT NULL,
  `used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_coupon_order` (`coupon_id`,`order_id`),
  KEY `order_id` (`order_id`),
  KEY `customer_id` (`customer_id`),
  KEY `idx_coupon_customer` (`coupon_id`,`customer_id`),
  CONSTRAINT `coupon_usages_ibfk_1` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `coupon_usages_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `coupon_usages_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `discount_type` tinyint(1) DEFAULT '0' COMMENT '0 for flat, 1 for percentage',
  `min_purchase_amount` decimal(10,2) DEFAULT '0.00',
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT 'Only relevant for percentage type',
  `limit_per_user` int DEFAULT '1',
  `product_scope` enum('all','specified') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'all',
  `customer_scope` enum('all','specified') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'all',
  `start_date` datetime NOT NULL,
  `expire_date` datetime NOT NULL,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_coupon_checkout` (`code`,`status`,`start_date`,`expire_date`),
  KEY `idx_coupons_status_type` (`status`,`discount_type`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `sku_bulk_discount_rules`
--

DROP TABLE IF EXISTS `sku_bulk_discount_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sku_bulk_discount_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL COMMENT 'Human-readable label e.g. "100 pcs 20% off"',
  `product_sku_id` int NOT NULL,
  `min_qty` int NOT NULL,
  `discount_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = flat, 1 = percentage',
  `discount_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `free_delivery` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = whole-order ships free when this rule is triggered',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_bulk_sku_qty` (`product_sku_id`,`min_qty`),
  KEY `idx_bulk_sku_status_qty` (`product_sku_id`,`status`,`min_qty`),
  CONSTRAINT `sku_bulk_discount_rules_ibfk_1` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `combo_discount_rules`
--

DROP TABLE IF EXISTS `combo_discount_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_discount_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `free_delivery` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = whole-order ships free when this rule is triggered',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_combo_rules_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `combo_discount_rule_tiers`
--

DROP TABLE IF EXISTS `combo_discount_rule_tiers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_discount_rule_tiers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `combo_rule_id` bigint unsigned NOT NULL,
  `serial` int NOT NULL DEFAULT '1',
  `discount_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = flat, 1 = percentage',
  `discount_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_serial` (`combo_rule_id`,`serial`),
  KEY `idx_combo_tiers_status` (`combo_rule_id`,`status`,`serial`),
  CONSTRAINT `combo_discount_rule_tiers_ibfk_1` FOREIGN KEY (`combo_rule_id`) REFERENCES `combo_discount_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `combo_discount_tier_items`
--

DROP TABLE IF EXISTS `combo_discount_tier_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_discount_tier_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `combo_tier_id` bigint unsigned NOT NULL,
  `product_sku_id` int NOT NULL,
  `required_qty` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_sku` (`combo_tier_id`,`product_sku_id`),
  KEY `idx_combo_items_sku` (`product_sku_id`),
  CONSTRAINT `combo_discount_tier_items_ibfk_1` FOREIGN KEY (`combo_tier_id`) REFERENCES `combo_discount_rule_tiers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `combo_discount_tier_items_ibfk_2` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `delivery_charges`
--

DROP TABLE IF EXISTS `delivery_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_charges` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) DEFAULT 'standard',
  `customer_charge` decimal(10,2) DEFAULT '0.00',
  `our_charge` decimal(10,2) DEFAULT '0.00',
  `default_weight_kg` decimal(10,3) NOT NULL DEFAULT '1.000',
  `extra_charge_per_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` tinyint(1) DEFAULT '1',
  `img_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `favorites`
--

DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `idx_favorites_user` (`user_id`),
  KEY `idx_favorites_product` (`product_id`),
  KEY `idx_favorites_created` (`created_at`),
  KEY `idx_favorites_user_created` (`user_id`,`created_at`),
  KEY `idx_favorites_product_user` (`product_id`,`user_id`),
  CONSTRAINT `fk_favorites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `guest_order_items`
--

DROP TABLE IF EXISTS `guest_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `guest_order_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int NOT NULL,
  `product_sku_id` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `color_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color_hex` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attribute_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `variant_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  `buying_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `discount_type` tinyint(1) DEFAULT '0',
  `final_unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_goi_guest_id` (`guest_order_id`),
  CONSTRAINT `fk_goi_guest_order` FOREIGN KEY (`guest_order_id`) REFERENCES `guest_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1031 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `guest_orders`
--

DROP TABLE IF EXISTS `guest_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guest_orders` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `status` enum('pending','complete','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varbinary(16) DEFAULT NULL,
  `otp` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_exp` timestamp NULL DEFAULT NULL,
  `is_phone_verified` tinyint(1) DEFAULT '0',
  `profile_img` mediumtext COLLATE utf8mb4_unicode_ci,
  `full_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coupon_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_charge_id` int DEFAULT NULL,
  `payment_type` enum('gateway','cod','mixed') COLLATE utf8mb4_unicode_ci DEFAULT 'gateway',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_guest_order_id` (`order_id`),
  KEY `idx_guest_phone` (`phone`),
  KEY `idx_guest_ip_address` (`ip_address`),
  KEY `idx_guest_status` (`status`),
  KEY `idx_guest_deleted` (`deleted_at`),
  KEY `idx_guest_delivery_charge` (`delivery_charge_id`),
  KEY `idx_guest_orders_payment_type` (`payment_type`),
  CONSTRAINT `guest_orders_ibfk_1` FOREIGN KEY (`delivery_charge_id`) REFERENCES `delivery_charges` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `location_mappings`
--

DROP TABLE IF EXISTS `location_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_mappings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `location_type` enum('city','rural') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'city',
  `city_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `district_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `upazila_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `redx_area_id` int DEFAULT NULL,
  `pathao_city_id` int DEFAULT NULL,
  `pathao_zone_id` int DEFAULT NULL,
  `pathao_area_id` int DEFAULT NULL,
  `steadfast_id` int DEFAULT NULL,
  `paperfly_thana_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_pathao_area` (`pathao_area_id`),
  UNIQUE KEY `uniq_steadfast_id` (`steadfast_id`),
  KEY `idx_lm_city` (`city_name`),
  KEY `idx_lm_pathao_city` (`pathao_city_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `main_categories`
--

DROP TABLE IF EXISTS `main_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `main_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1' COMMENT '0: Inactive, 1: Active',
  `featured` tinyint(1) DEFAULT '0' COMMENT '0: No, 1: Yes',
  `priority` tinyint DEFAULT '1' COMMENT '1: Normal, 2: Medium, 3: High',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_main_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_addresses`
--

DROP TABLE IF EXISTS `order_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `address_id` bigint unsigned DEFAULT NULL,
  `address_type` enum('home','office','n/a') DEFAULT 'n/a',
  `full_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zip_code` varchar(20) DEFAULT NULL,
  `location_mapping_id` int DEFAULT NULL COMMENT 'FK to location_mappings for courier dispatch',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `idx_oa_location_mapping` (`location_mapping_id`),
  CONSTRAINT `order_addresses_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_coupons`
--

DROP TABLE IF EXISTS `order_coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_coupons` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `coupon_id` int DEFAULT NULL,
  `coupon_code` varchar(50) NOT NULL,
  `coupon_title` varchar(255) NOT NULL,
  `discount_type` tinyint(1) NOT NULL COMMENT '0 flat, 1 percentage',
  `discount_value` decimal(10,2) NOT NULL,
  `discount_amount` decimal(12,2) NOT NULL,
  `applied_on` enum('order','sku') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_coupon` (`order_id`),
  CONSTRAINT `order_coupons_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_couriers`
--

DROP TABLE IF EXISTS `order_couriers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_couriers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `courier_provider` varchar(50) DEFAULT NULL,
  `type` enum('manual','auto') DEFAULT NULL,
  `is_auto_available` tinyint(1) DEFAULT NULL,
  `delivery_charge_id` int DEFAULT NULL,
  `delivery_title` varchar(255) DEFAULT NULL,
  `customer_charge` decimal(10,2) DEFAULT '0.00',
  `our_charge` decimal(10,2) DEFAULT '0.00',
  `weight` decimal(8,2) DEFAULT '0.00',
  `tracking_number` varchar(100) DEFAULT NULL,
  `memo` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reference_id` varchar(250) DEFAULT NULL,
  `raw_response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_order` (`order_id`),
  KEY `idx_courier_type` (`type`),
  KEY `idx_courier_provider_type` (`courier_provider`,`type`),
  CONSTRAINT `order_couriers_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_couriers_chk_1` CHECK (json_valid(`raw_response`))
) ENGINE=InnoDB AUTO_INCREMENT=498 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `product_id` int NOT NULL,
  `product_sku_id` int NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  `color_id` int DEFAULT NULL,
  `color_name` varchar(50) DEFAULT NULL,
  `color_hex` varchar(7) DEFAULT NULL,
  `attribute_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `variant_name` varchar(50) DEFAULT NULL,
  `quantity` int NOT NULL,
  `buying_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `discount_type` tinyint(1) DEFAULT '0' COMMENT '0 flat, 1 percentage',
  `coupon_code` varchar(50) DEFAULT NULL,
  `coupon_discount` decimal(10,2) DEFAULT '0.00',
  `final_unit_price` decimal(10,2) NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `stock_adjusted` tinyint(1) NOT NULL DEFAULT '0',
  `sell_count_adjusted` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=566 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_payments`
--

DROP TABLE IF EXISTS `order_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `provider` varchar(50) NOT NULL,
  `transaction_ref` varchar(255) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('pending','success','failed') DEFAULT 'pending',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_payment` (`order_id`),
  CONSTRAINT `order_payments_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=145 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_refunds`
--

DROP TABLE IF EXISTS `order_refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_refunds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `order_payment_id` bigint unsigned DEFAULT NULL,
  `refund_method` enum('original_method','bank_transfer','mobile_banking','cash','other') NOT NULL DEFAULT 'original_method',
  `status` enum('pending','processed','failed') NOT NULL DEFAULT 'processed',
  `refund_reference` varchar(255) DEFAULT NULL,
  `refund_amount` decimal(12,2) NOT NULL,
  `note` text,
  `refunded_by_admin` int DEFAULT NULL,
  `refunded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_refunds_order` (`order_id`),
  KEY `idx_order_refunds_payment` (`order_payment_id`),
  KEY `idx_order_refunds_admin` (`refunded_by_admin`),
  KEY `idx_order_refunds_status_created` (`status`,`created_at`),
  CONSTRAINT `order_refunds_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_refunds_ibfk_2` FOREIGN KEY (`order_payment_id`) REFERENCES `order_payments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_refunds_ibfk_3` FOREIGN KEY (`refunded_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `notification_batches`
--

DROP TABLE IF EXISTS `notification_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_batches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `source_type` enum('announcement','manual_announcement','order_status','forgot_password','welcome','contact_reply','personal','system','other') NOT NULL DEFAULT 'other',
  `source_id` varchar(100) DEFAULT NULL,
  `channel` enum('email','sms','push','mixed') NOT NULL DEFAULT 'mixed',
  `audience_type` enum('user','admin','subscriber','guest','mixed','other') NOT NULL DEFAULT 'mixed',
  `title` varchar(255) DEFAULT NULL,
  `message` longtext,
  `initiated_by_admin` int DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT NULL,
  `finished_at` timestamp NULL DEFAULT NULL,
  `status` enum('draft','queued','processing','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `total_target` int NOT NULL DEFAULT '0',
  `total_sent` int NOT NULL DEFAULT '0',
  `total_failed` int NOT NULL DEFAULT '0',
  `meta` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nb_source` (`source_type`,`source_id`),
  KEY `idx_nb_status` (`status`,`created_at`),
  KEY `idx_nb_initiated_by` (`initiated_by_admin`),
  CONSTRAINT `notification_batches_ibfk_1` FOREIGN KEY (`initiated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `notification_histories`
--

DROP TABLE IF EXISTS `notification_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `batch_id` bigint unsigned DEFAULT NULL,
  `channel` enum('email','sms','push') NOT NULL,
  `category` enum('order_status','forgot_password','welcome','announcement','contact_reply','personal','otp','system','other') NOT NULL DEFAULT 'other',
  `recipient_type` enum('user','admin','subscriber','guest','manual','other') NOT NULL DEFAULT 'other',
  `recipient_user_id` bigint unsigned DEFAULT NULL,
  `recipient_admin_id` int DEFAULT NULL,
  `recipient_subscriber_id` bigint unsigned DEFAULT NULL,
  `recipient_guest_order_id` varchar(255) DEFAULT NULL,
  `recipient_email` varchar(255) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` longtext,
  `template_key` varchar(100) DEFAULT NULL,
  `provider` varchar(60) DEFAULT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `status` enum('queued','sent','failed','delivered','read','cancelled') NOT NULL DEFAULT 'queued',
  `error_message` varchar(500) DEFAULT NULL,
  `related_order_id` bigint unsigned DEFAULT NULL,
  `related_announcement_id` bigint unsigned DEFAULT NULL,
  `related_contact_message_id` bigint unsigned DEFAULT NULL,
  `triggered_by_admin_id` int DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nh_batch` (`batch_id`),
  KEY `idx_nh_channel_status_time` (`channel`,`status`,`created_at`),
  KEY `idx_nh_category_time` (`category`,`created_at`),
  KEY `idx_nh_recipient_user` (`recipient_user_id`),
  KEY `idx_nh_recipient_admin` (`recipient_admin_id`),
  KEY `idx_nh_recipient_subscriber` (`recipient_subscriber_id`),
  KEY `idx_nh_recipient_email` (`recipient_email`),
  KEY `idx_nh_recipient_phone` (`recipient_phone`),
  KEY `idx_nh_related_order` (`related_order_id`),
  KEY `idx_nh_related_announcement` (`related_announcement_id`),
  KEY `idx_nh_template` (`template_key`),
  KEY `idx_nh_provider_msg` (`provider`,`provider_message_id`),
  CONSTRAINT `notification_histories_ibfk_1` FOREIGN KEY (`batch_id`) REFERENCES `notification_batches` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_2` FOREIGN KEY (`recipient_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_3` FOREIGN KEY (`recipient_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_4` FOREIGN KEY (`recipient_subscriber_id`) REFERENCES `subscribers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_5` FOREIGN KEY (`related_order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_6` FOREIGN KEY (`related_announcement_id`) REFERENCES `announcements` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_7` FOREIGN KEY (`related_contact_message_id`) REFERENCES `contact_messages` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notification_histories_ibfk_8` FOREIGN KEY (`triggered_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `notification_attempts`
--

DROP TABLE IF EXISTS `notification_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_attempts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `notification_history_id` bigint unsigned NOT NULL,
  `attempt_no` smallint unsigned NOT NULL DEFAULT '1',
  `provider` varchar(60) DEFAULT NULL,
  `provider_message_id` varchar(255) DEFAULT NULL,
  `http_status` smallint DEFAULT NULL,
  `request_payload` json DEFAULT NULL,
  `response_payload` json DEFAULT NULL,
  `status` enum('success','failed') NOT NULL DEFAULT 'failed',
  `error_message` varchar(1000) DEFAULT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_notification_attempt_no` (`notification_history_id`,`attempt_no`),
  KEY `idx_na_status_time` (`status`,`attempted_at`),
  KEY `idx_na_provider_msg` (`provider`,`provider_message_id`),
  CONSTRAINT `notification_attempts_ibfk_1` FOREIGN KEY (`notification_history_id`) REFERENCES `notification_histories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_status_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `old_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by_admin` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `fk_osh_admin` (`changed_by_admin`),
  CONSTRAINT `fk_osh_admin` FOREIGN KEY (`changed_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1065 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` bigint unsigned DEFAULT NULL,
  `order_type` enum('regular','guest','admin_regular','admin_stranger','single_page') NOT NULL DEFAULT 'regular',
  `guest_order_uuid` char(36) DEFAULT NULL,
  `customer_name` varchar(200) NOT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `ip_address` varbinary(16) DEFAULT NULL,
  `is_fraud` tinyint(1) DEFAULT '0',
  `fraud_note` text,
  `fraud_test_results` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `origin` varchar(100) NOT NULL DEFAULT 'Own platform',
  `payment_type` enum('gateway','cod','mixed') NOT NULL,
  `payment_status` enum('unpaid','partial_paid','paid') DEFAULT 'unpaid',
  `subtotal` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `sku_discount_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `delivery_charge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `due_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `order_status` enum('new','approved','processing','packaging','shipped','out_for_delivery','delivered','returned','cancelled','on_hold','trash') DEFAULT 'new',
  `note` text,
  `placed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `assigned_to_admin_id` int DEFAULT NULL,
  `assigned_by_admin_id` int DEFAULT NULL,
  `assignment_method` enum('auto','manual','redistribute') DEFAULT NULL,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `created_by_admin` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_order_status` (`order_status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_order_status_created` (`order_status`,`created_at`),
  KEY `idx_payment_status_created` (`payment_status`,`created_at`),
  KEY `idx_customer_created` (`customer_id`,`created_at`),
  KEY `idx_guest_uuid` (`guest_order_uuid`),
  KEY `idx_orders_ip_address` (`ip_address`),
  KEY `idx_fraud_queue` (`is_fraud`,`created_at`),
  KEY `idx_due_amount` (`due_amount`),
  KEY `idx_placed_at` (`placed_at`),
  KEY `idx_orders_origin` (`origin`),
  KEY `idx_orders_assigned_to` (`assigned_to_admin_id`),
  KEY `idx_orders_assigned_by` (`assigned_by_admin_id`),
  KEY `idx_orders_assigned_at` (`assigned_at`),
  KEY `idx_fraud_status_created` (`is_fraud`,`order_status`,`created_at`),
  KEY `idx_orders_created_by_admin` (`created_by_admin`),
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`assigned_to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`assigned_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_chk_1` CHECK (json_valid(`fraud_test_results`))
) ENGINE=InnoDB AUTO_INCREMENT=611 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_distribution_agents`
--

DROP TABLE IF EXISTS `order_distribution_agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_distribution_agents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `serial` int NOT NULL DEFAULT '1',
  `auto_assign_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `max_active_orders` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_distribution_agent_admin` (`admin_id`),
  KEY `idx_distribution_agents_active` (`status`,`auto_assign_enabled`,`serial`),
  CONSTRAINT `order_distribution_agents_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_distribution_settings`
--

DROP TABLE IF EXISTS `order_distribution_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_distribution_settings` (
  `id` tinyint unsigned NOT NULL DEFAULT '1',
  `auto_assign_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `strategy` enum('round_robin') NOT NULL DEFAULT 'round_robin',
  `assign_on_order_create` tinyint(1) NOT NULL DEFAULT '1',
  `include_admin_role` tinyint(1) NOT NULL DEFAULT '1',
  `include_order_manager_role` tinyint(1) NOT NULL DEFAULT '1',
  `last_assigned_admin_id` int DEFAULT NULL,
  `updated_by_admin` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ods_last_assigned` (`last_assigned_admin_id`),
  KEY `idx_ods_updated_by` (`updated_by_admin`),
  CONSTRAINT `order_distribution_settings_chk_1` CHECK ((`id` = 1)),
  CONSTRAINT `order_distribution_settings_ibfk_1` FOREIGN KEY (`last_assigned_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_distribution_settings_ibfk_2` FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `order_assignment_logs`
--

DROP TABLE IF EXISTS `order_assignment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_assignment_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `action_type` enum('auto_assign','manual_assign','redistribute','unassign') NOT NULL,
  `from_admin_id` int DEFAULT NULL,
  `to_admin_id` int DEFAULT NULL,
  `changed_by_admin_id` int DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oal_order_id` (`order_id`),
  KEY `idx_oal_to_admin` (`to_admin_id`,`created_at`),
  KEY `idx_oal_changed_by` (`changed_by_admin_id`,`created_at`),
  CONSTRAINT `order_assignment_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_assignment_logs_ibfk_2` FOREIGN KEY (`from_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_assignment_logs_ibfk_3` FOREIGN KEY (`to_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_assignment_logs_ibfk_4` FOREIGN KEY (`changed_by_admin_id`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `page_view_logs`
--

DROP TABLE IF EXISTS `page_view_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_view_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `page_name` varchar(100) NOT NULL DEFAULT 'landing',
  `ip_address` varbinary(16) NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_date` date GENERATED ALWAYS AS (cast(`viewed_at` as date)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_daily_page_view` (`page_name`,`ip_address`,`view_date`),
  KEY `idx_page_date` (`page_name`,`view_date`),
  KEY `idx_viewed_at` (`viewed_at`),
  KEY `idx_page_views_viewed_at` (`viewed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1987 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `description` text,
  `module` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`),
  KEY `idx_permissions_module` (`module`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `img_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `serial` int NOT NULL DEFAULT '1',
  `color_id` int DEFAULT NULL COMMENT 'NULL = shared (shown for all colors); SET = shown only for that color',
  PRIMARY KEY (`id`),
  KEY `idx_pi_product_serial` (`product_id`,`serial`),
  KEY `idx_pi_color` (`color_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pi_color` FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1720 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `product_skus`
--

DROP TABLE IF EXISTS `product_skus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_skus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `color_id` int NOT NULL,
  `variant_id` int NOT NULL,
  `sku` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `weight_kg` decimal(10,3) NOT NULL DEFAULT '0.000',
  `buying_price` decimal(10,2) NOT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) DEFAULT '0.00',
  `discount_type` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 for flat, 1 for percentage',
  `stock` int DEFAULT '0',
  `status` tinyint(1) DEFAULT '1',
  `free_delivery` tinyint(1) NULL DEFAULT NULL COMMENT 'NULL=inherit from products.free_delivery, 1=free, 0=paid',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `product_id` (`product_id`),
  KEY `color_id` (`color_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `product_skus_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_skus_ibfk_2` FOREIGN KEY (`color_id`) REFERENCES `colors` (`id`),
  CONSTRAINT `product_skus_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1916 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `product_stock_logs`
--

DROP TABLE IF EXISTS `product_stock_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_stock_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sku_id` int NOT NULL,
  `action` enum('in','out') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `old_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_stock_logs_sku` (`sku_id`),
  KEY `idx_stock_logs_time` (`created_at`),
  CONSTRAINT `fk_stock_logs_sku` FOREIGN KEY (`sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `product_videos`
--

DROP TABLE IF EXISTS `product_videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int DEFAULT NULL,
  `label` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'e.g., Unboxing, Review, Tutorial',
  `video_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'External link (YouTube/Vimeo)',
  `path` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Internal file path if hosted locally',
  `thumb` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `product_view_logs`
--

DROP TABLE IF EXISTS `product_view_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_view_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `ip_address` varbinary(16) NOT NULL,
  `viewed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `view_date` date GENERATED ALWAYS AS (cast(`viewed_at` as date)) STORED,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_daily_view` (`product_id`,`ip_address`,`view_date`),
  KEY `idx_viewed_at` (`viewed_at`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `main_category_id` int NOT NULL,
  `sub_category_id` int DEFAULT NULL,
  `child_category_id` int DEFAULT NULL,
  `brand_id` int DEFAULT NULL,
  `attribute_id` int DEFAULT NULL,
  `video_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `face_image` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `free_delivery` tinyint(1) DEFAULT '0',
  `best_deal` tinyint(1) DEFAULT '0',
  `has_single_product_page` tinyint(1) NOT NULL DEFAULT '0',
  `view_count` int DEFAULT '0',
  `sell_count` int DEFAULT '0',
  `short_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `long_description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `meta_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `canonical_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `meta_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `meta_keywords` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `og_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `og_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `robots` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'index, follow',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `ux_products_slug` (`slug`),
  KEY `idx_product_slug` (`slug`),
  KEY `idx_products_main_category` (`main_category_id`),
  KEY `idx_products_sub_category` (`sub_category_id`),
  KEY `idx_products_child_category` (`child_category_id`),
  KEY `idx_products_brand` (`brand_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_featured` (`featured`),
  KEY `idx_products_best_deal` (`best_deal`),
  KEY `idx_products_created_at` (`created_at`),
  KEY `idx_products_listing` (`status`,`main_category_id`,`brand_id`,`created_at`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`main_category_id`) REFERENCES `main_categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=345 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `quick_access`
--

DROP TABLE IF EXISTS `quick_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quick_access` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `is_pinned` tinyint(1) DEFAULT '0' COMMENT '0 = not pinned, 1 = pinned',
  `img_path` varchar(512) NOT NULL,
  `path` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sort_order` tinyint unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `idx_rp_permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `is_system` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `sub_categories`
--

DROP TABLE IF EXISTS `sub_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sub_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `main_category_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `img_path` varchar(255) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `priority` tinyint DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_sub_main_id` (`main_category_id`),
  CONSTRAINT `fk_sub_main` FOREIGN KEY (`main_category_id`) REFERENCES `main_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `subscribers`
--

DROP TABLE IF EXISTS `subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscribers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = Active, 0 = Unsubscribed',
  `subscribed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `suspended_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email_active` (`email`,`suspended_at`),
  KEY `idx_subscribers_user_id` (`user_id`),
  KEY `idx_subscribers_status_email` (`status`,`email`),
  KEY `idx_subscribers_dates` (`subscribed_at`,`unsubscribed_at`),
  CONSTRAINT `fk_subscribers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `system_config`
--

DROP TABLE IF EXISTS `system_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `service` varchar(50) NOT NULL,
  `key_name` varchar(100) NOT NULL,
  `value` text NOT NULL,
  `provider` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key_name` (`key_name`)
) ENGINE=InnoDB AUTO_INCREMENT=672 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `firebase_push_credentials`
--

DROP TABLE IF EXISTS `firebase_push_credentials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `firebase_push_credentials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `credential_json` json NOT NULL,
  `client_config` json DEFAULT NULL COMMENT 'Firebase web app config (apiKey, authDomain, projectId, etc.)',
  `vapid_key` varchar(200) DEFAULT NULL COMMENT 'VAPID public key for Web Push',
  `is_active` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fpc_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_addresses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(200) DEFAULT NULL,
  `phone_id` bigint unsigned DEFAULT NULL,
  `address_type` enum('home','office','n/a') DEFAULT 'n/a',
  `full_address` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_mapping_id` int DEFAULT NULL COMMENT 'FK to location_mappings for courier dispatch',
  `zip_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_addr_phone` (`phone_id`),
  KEY `idx_address_lookup` (`user_id`),
  KEY `idx_ua_location_mapping` (`location_mapping_id`),
  CONSTRAINT `fk_addr_phone` FOREIGN KEY (`phone_id`) REFERENCES `user_phones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_addr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `user_audit_actions`
--

DROP TABLE IF EXISTS `user_audit_actions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_audit_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_key` varchar(100) NOT NULL,
  `display_name` varchar(100) DEFAULT NULL,
  `category` enum('AUTH','PROFILE','SECURITY','ADMIN') DEFAULT 'PROFILE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `action_key` (`action_key`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `user_audit_logs`
--

DROP TABLE IF EXISTS `user_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `action` varchar(50) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user_id` (`user_id`),
  KEY `idx_audit_ip_address` (`ip_address`),
  KEY `idx_audit_action` (`action`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_audit_logs_chk_1` CHECK (json_valid(`old_values`)),
  CONSTRAINT `user_audit_logs_chk_2` CHECK (json_valid(`new_values`))
) ENGINE=InnoDB AUTO_INCREMENT=911 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `user_phones`
--

DROP TABLE IF EXISTS `user_phones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_phones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `otp` varchar(10) DEFAULT NULL,
  `otp_exp` timestamp NULL DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_phone_user` (`user_id`),
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_phone_verified` (`phone_number`,`is_verified`),
  CONSTRAINT `fk_phone_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `user_verifications`
--

DROP TABLE IF EXISTS `user_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_verifications` (
  `user_id` bigint unsigned NOT NULL,
  `email_otp` varchar(10) DEFAULT NULL,
  `email_otp_exp` timestamp NULL DEFAULT NULL,
  `pass_otp` varchar(10) DEFAULT NULL,
  `pass_otp_exp` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uniq_user_verification` (`user_id`),
  UNIQUE KEY `uniq_user_verifications_user` (`user_id`),
  CONSTRAINT `fk_verif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `google_id` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `token_version` int unsigned NOT NULL DEFAULT '0',
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `img_path` text,
  `status` enum('active','inactive','suspended') DEFAULT 'active',
  `gender` enum('male','female','other','unspecified') DEFAULT 'unspecified',
  `dob` date DEFAULT NULL,
  `is_email_verified` tinyint(1) DEFAULT '0',
  `is_fully_verified` tinyint(1) DEFAULT '0',
  `fraud` text,
  `total_spent` decimal(12,2) DEFAULT '0.00',
  `register_ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `default_phone_id` bigint unsigned DEFAULT NULL,
  `default_address_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `idx_active_email` (`email`,`deleted_at`),
  UNIQUE KEY `uniq_users_email_active` (`email`,`deleted_at`),
  KEY `idx_google_id` (`google_id`),
  KEY `idx_users_not_deleted` (`deleted_at`),
  KEY `fk_default_phone` (`default_phone_id`),
  KEY `fk_default_address` (`default_address_id`),
  CONSTRAINT `fk_default_address` FOREIGN KEY (`default_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_default_phone` FOREIGN KEY (`default_phone_id`) REFERENCES `user_phones` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--

--
-- Table structure for table `variants`
--

DROP TABLE IF EXISTS `variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attribute_id` int NOT NULL,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `serial` int NOT NULL DEFAULT '1',
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_variant_per_attribute` (`attribute_id`,`name`),
  KEY `idx_var_attr_serial` (`attribute_id`,`serial`),
  KEY `idx_variant_status` (`status`),
  CONSTRAINT `variants_ibfk_1` FOREIGN KEY (`attribute_id`) REFERENCES `attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;






-- Dump completed on 2026-03-03 15:06:36




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





--
-- Post-dump schema patch for bilingual support
-- Add Bangla display name columns while preserving existing English `name`
--

ALTER TABLE `main_categories`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `sub_categories`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `child_categories`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `attributes`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `variants`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `colors`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;

ALTER TABLE `products`
  ADD COLUMN `name_bd` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL AFTER `name`;







-- V2-011: Bulk/Combo Discount Tables

CREATE TABLE IF NOT EXISTS `sku_bulk_discount_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_sku_id` INT UNSIGNED NOT NULL,
  `min_qty` INT UNSIGNED NOT NULL DEFAULT 1,
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_type` TINYINT NOT NULL DEFAULT 0 COMMENT '0=flat, 1=percentage',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sku_bulk_rule` (`product_sku_id`, `min_qty`),
  CONSTRAINT `fk_sku_bulk_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_discount_rules` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_combo_active` (`is_active`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_discount_rule_tiers` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_rule_id` INT UNSIGNED NOT NULL,
  `serial` INT NOT NULL DEFAULT 0,
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `discount_type` TINYINT NOT NULL DEFAULT 0 COMMENT '0=flat, 1=percentage',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_serial` (`combo_rule_id`, `serial`),
  CONSTRAINT `fk_combo_tier_rule` FOREIGN KEY (`combo_rule_id`) REFERENCES `combo_discount_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `combo_discount_tier_items` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `combo_tier_id` INT UNSIGNED NOT NULL,
  `product_sku_id` INT UNSIGNED NOT NULL,
  `min_qty` INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_combo_tier_item` (`combo_tier_id`, `product_sku_id`),
  CONSTRAINT `fk_combo_item_tier` FOREIGN KEY (`combo_tier_id`) REFERENCES `combo_discount_rule_tiers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_combo_item_sku` FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─────────────────────────────────────────────────────────────────────────────
-- V2-019: Order Multi-Refund Ledger
-- ─────────────────────────────────────────────────────────────────────────────
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


ALTER TABLE `orders`
  ADD COLUMN `fbp`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbp cookie for CAPI',
  ADD COLUMN `fbc`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbc click ID for CAPI',
  ADD COLUMN `capi_event_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Deduplication event_id shared with browser Pixel';

ALTER TABLE `guest_orders`
  ADD COLUMN `fbp`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbp cookie for CAPI',
  ADD COLUMN `fbc`           VARCHAR(200) NULL DEFAULT NULL COMMENT 'Facebook _fbc click ID for CAPI',
  ADD COLUMN `capi_event_id` VARCHAR(100) NULL DEFAULT NULL COMMENT 'Deduplication event_id shared with browser Pixel';

-- V2-030: Weight surcharge columns
ALTER TABLE `order_items`
  ADD COLUMN `weight_kg` DECIMAL(8,3) NOT NULL DEFAULT 0.000
    COMMENT 'SKU weight snapshot (kg) at time of order placement'
    AFTER `stock_adjusted`;

ALTER TABLE `orders`
  ADD COLUMN `weight_kg_total`     DECIMAL(10,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total order weight (kg)' AFTER `discount_total`,
  ADD COLUMN `weight_extra_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Extra delivery charge due to excess weight' AFTER `weight_kg_total`;

ALTER TABLE `guest_orders`
  ADD COLUMN `weight_kg_total`     DECIMAL(10,3) NOT NULL DEFAULT 0.000
    COMMENT 'Total order weight (kg)' AFTER `discount_total`,
  ADD COLUMN `weight_extra_charge` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Extra delivery charge due to excess weight' AFTER `weight_kg_total`;


-- ============================================================
-- [2026-03-08] Analytics: Seed analytics_config (id = 1)
-- Single source of truth for ALL analytics configuration.
-- Includes the full schema the admin UI expects (analytics + tracking + meta).
-- INSERT IGNORE = safe to re-run; will not overwrite if row already exists.
-- ============================================================

INSERT IGNORE INTO `analytics_config` (`id`, `config`) VALUES (1, '{
  "meta": {
    "currency": "BDT",
    "site_name": "Graduate Fashion",
    "environment": "production"
  },
  "tracking": {
    "auto_page_view": true,
    "track_scroll": false,
    "track_button_clicks": false,
    "track_search": true
  },
  "analytics": {
    "google_analytics": {
      "enabled": false,
      "measurement_id": "",
      "config": {
        "anonymize_ip": true,
        "send_page_view": true,
        "debug_mode": false
      }
    },
    "google_tag_manager": {
      "enabled": true,
      "gtm_id": "GTM-WQDNF2TP",
      "auth": "",
      "preview": ""
    },
    "facebook_pixel": {
      "enabled": false,
      "pixel_id": "",
      "advanced_matching": {
        "enabled": false,
        "email": true,
        "phone": true,
        "first_name": false,
        "last_name": false,
        "external_id": false
      },
      "track_events": {
        "page_view": true,
        "view_content": true,
        "add_to_cart": true,
        "initiate_checkout": true,
        "purchase": true,
        "search": false,
        "lead": false,
        "complete_registration": false
      },
      "conversion_api": {
        "enabled": false,
        "access_token": "",
        "test_event_code": ""
      }
    },
    "microsoft_clarity": {
      "enabled": false,
      "project_id": ""
    }
  }
}');

-- New audit action keys to insert into audit_actions table
-- Run this script once to update the DB


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
('RESTORE_ADMIN',   'Restore Admin');



-- New user audit action keys to insert into user_audit_actions table
INSERT IGNORE INTO user_audit_actions (action_key, display_name, category) VALUES
('SET_INITIAL_PASSWORD', 'Set Initial Password',  'SECURITY'),
('PLACE_ORDER',          'Place Order',            'ORDERS'),
('CANCEL_ORDER',         'Cancel Order',           'ORDERS'),
('PLACE_GUEST_ORDER',    'Place Guest Order',      'ORDERS'),
('UPDATE_PROFILE',       'Update Profile',         'PROFILE');


-- [2026-03-13] Announcement SMS Integration
-- Add channel column to announcements to track dispatch channel (email / sms / both)
ALTER TABLE `announcements`
  ADD COLUMN `channel` ENUM('email','sms','both') NOT NULL DEFAULT 'email'
  AFTER `target_type`;

-- V2-029: Bulk / Combo / Cart-Wide Discount Columns
-- Tracks per-order discount breakdowns and per-item discount rule references.
ALTER TABLE `orders`
  ADD COLUMN `bulk_discount_total`  DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Total savings from bulk discount rules'         AFTER `discount_total`,
  ADD COLUMN `combo_discount_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Total savings from combo discount rules'        AFTER `bulk_discount_total`,
  ADD COLUMN `cart_wide_discount`   DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'Total cart-wide discount applied at checkout'   AFTER `combo_discount_total`;

ALTER TABLE `order_items`
  ADD COLUMN `bulk_rule_id`           INT           NULL     DEFAULT NULL
    COMMENT 'FK to sku_bulk_discount_rules.id if a bulk rule applied'  AFTER `weight_kg`,
  ADD COLUMN `bulk_discount_applied`  DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'BDT saved on this item from the bulk rule'                AFTER `bulk_rule_id`,
  ADD COLUMN `combo_rule_id`          INT           NULL     DEFAULT NULL
    COMMENT 'FK to combo_discount_rule_tiers.id if a combo applied'    AFTER `bulk_discount_applied`,
  ADD COLUMN `combo_discount_applied` DECIMAL(10,2) NOT NULL DEFAULT 0.00
    COMMENT 'BDT saved on this item from the combo rule'               AFTER `combo_rule_id`;

-- Seed: admin audit action for order free delivery (admin override)
INSERT IGNORE INTO audit_actions (action_key, display_name) VALUES
('ORDER_FREE_DELIVERY', 'Admin Set Order Free Delivery');


-- V2-031: order_status_history already exists (defined above at line ~1119).
-- Duplicate CREATE TABLE removed. No schema change needed here.

-- V2-035: Customer FCM push token storage
DROP TABLE IF EXISTS `user_push_tokens`;
CREATE TABLE `user_push_tokens` (
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

-- ---------------------------------------------------------------------------
-- [V2-020 / V2-040] Notification Batches
-- Tracks bulk announcement send operations (one row per send invocation).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `notification_batches`;
CREATE TABLE `notification_batches` (
  `id`                  BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `source_type`         VARCHAR(60)      NOT NULL DEFAULT 'announcement'
                          COMMENT 'announcement | manual_announcement | system',
  `source_id`           VARCHAR(40)      NULL     COMMENT 'FK to source (e.g. announcements.id as string)',
  `channel`             ENUM('email','sms','push','both') NOT NULL DEFAULT 'email',
  `audience_type`       VARCHAR(60)      NOT NULL DEFAULT 'mixed'
                          COMMENT 'subscribed_only | registered_users_only | all | mixed | manual',
  `title`               VARCHAR(255)     NULL,
  `message`             TEXT             NULL,
  `initiated_by_admin`  INT UNSIGNED     NULL,
  `total_target`        INT UNSIGNED     NOT NULL DEFAULT 0,
  `total_sent`          INT UNSIGNED     NOT NULL DEFAULT 0,
  `total_failed`        INT UNSIGNED     NOT NULL DEFAULT 0,
  `status`              ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
  `started_at`          TIMESTAMP        NULL,
  `finished_at`         TIMESTAMP        NULL,
  `created_at`          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nb_source`   (`source_type`, `source_id`),
  KEY `idx_nb_status`   (`status`),
  KEY `idx_nb_created`  (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tracks bulk notification send batches (V2-020 / V2-040)';

-- ---------------------------------------------------------------------------
-- [V2-020 / V2-040] Notification Histories
-- One row per individual notification dispatch across all channels & events.
-- category enum updated in V2-040 to include admin-facing categories.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS `notification_histories`;
CREATE TABLE `notification_histories` (
  `id`                          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `batch_id`                    BIGINT UNSIGNED  NULL     COMMENT 'FK to notification_batches.id',

  -- Channel & category
  `channel`                     ENUM('email','sms','push') NOT NULL,
  `category`                    ENUM(
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
                                ) NOT NULL DEFAULT 'other',

  -- Recipient info (mutually exclusive; at most one FK set)
  `recipient_type`              ENUM('user','admin','subscriber','guest','manual','other')
                                  NOT NULL DEFAULT 'other',
  `recipient_user_id`           BIGINT UNSIGNED  NULL,
  `recipient_admin_id`          INT UNSIGNED     NULL,
  `recipient_subscriber_id`     BIGINT UNSIGNED  NULL,
  `recipient_guest_order_id`    VARCHAR(40)      NULL,

  -- Contact details (denormalized for easy audit)
  `recipient_email`             VARCHAR(255)     NULL,
  `recipient_phone`             VARCHAR(20)      NULL,
  `device_token`                VARCHAR(512)     NULL,

  -- Payload
  `title`                       VARCHAR(255)     NULL     COMMENT 'Email subject / push title',
  `message`                     MEDIUMTEXT       NULL     COMMENT 'Body / SMS text',
  `template_key`                VARCHAR(80)      NULL,

  -- Provider tracking
  `provider`                    VARCHAR(64)      NULL     COMMENT 'e.g. bulksms, alphasms, firebase',
  `provider_message_id`         VARCHAR(128)     NULL,

  -- Delivery
  `status`                      ENUM('queued','sent','failed','delivered','read','cancelled')
                                  NOT NULL DEFAULT 'sent',
  `error_message`               VARCHAR(512)     NULL,

  -- Context / relation
  `related_order_id`            BIGINT UNSIGNED  NULL,
  `related_announcement_id`     BIGINT UNSIGNED  NULL,
  `related_contact_message_id`  BIGINT UNSIGNED  NULL,
  `triggered_by_admin_id`       INT UNSIGNED     NULL,

  `sent_at`                     TIMESTAMP        NULL,
  `created_at`                  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_nh_channel`          (`channel`),
  KEY `idx_nh_category`         (`category`),
  KEY `idx_nh_recipient_user`   (`recipient_user_id`),
  KEY `idx_nh_recipient_admin`  (`recipient_admin_id`),
  KEY `idx_nh_status`           (`status`),
  KEY `idx_nh_created`          (`created_at`),
  KEY `idx_nh_batch`            (`batch_id`),
  KEY `idx_nh_order`            (`related_order_id`),
  KEY `idx_nh_contact`          (`related_contact_message_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Per-dispatch notification audit log (V2-020 / V2-040)';


-- ---------------------------------------------------------------------------
-- [V2-037] Mega Sale — product-level enrollment + SKU overrides
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `mega_sale_settings` (
  `id`                 TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `is_active`          TINYINT(1)       NOT NULL DEFAULT 0 COMMENT 'Master toggle: show mega sale page on storefront',
  `campaign_end_at`    DATETIME         NULL     COMMENT 'Global campaign countdown end time (banner timer + fallback for products)',
  `updated_by_admin`   INT              NULL,
  `created_at`         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `mega_sale_settings_chk_1` CHECK (`id` = 1),
  CONSTRAINT `fk_mss_admin`
    FOREIGN KEY (`updated_by_admin`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Single-row global Mega Sale configuration (V2-037)';

INSERT INTO `mega_sale_settings` (`id`) VALUES (1)
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`);

CREATE TABLE IF NOT EXISTS `mega_sale_products` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id`  INT             NOT NULL COMMENT 'FK to products.id',
  `is_active`   TINYINT(1)      NOT NULL DEFAULT 1 COMMENT 'Per-product toggle',
  `end_at`      DATETIME        NULL     COMMENT 'Per-product countdown override (NULL = inherit campaign_end_at)',
  `serial`      INT             NOT NULL DEFAULT 0 COMMENT 'Display order on storefront',
  `created_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_mega_sale_product` (`product_id`),
  KEY `idx_msp_active_serial` (`is_active`, `serial`),
  CONSTRAINT `fk_msp_product`
    FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Per-product Mega Sale entries with individual timer overrides (V2-037)';

CREATE TABLE IF NOT EXISTS `mega_sale_sku_overrides` (
  `id`                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `mega_sale_product_id`  BIGINT UNSIGNED NOT NULL COMMENT 'FK to mega_sale_products.id',
  `product_sku_id`        INT             NOT NULL COMMENT 'FK to product_skus.id',
  `is_excluded`           TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1 = this SKU is excluded from mega sale',
  `end_at`                DATETIME        NULL     COMMENT 'Per-SKU timer override (NULL = inherit from product)',
  `created_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_mso_sku` (`product_sku_id`),
  KEY `idx_mso_product` (`mega_sale_product_id`),
  CONSTRAINT `fk_mso_mega_product`
    FOREIGN KEY (`mega_sale_product_id`) REFERENCES `mega_sale_products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mso_sku`
    FOREIGN KEY (`product_sku_id`) REFERENCES `product_skus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Per-SKU overrides for Mega Sale (exclude or individual timer) (V2-037)';

-- ---------------------------------------------------------------------------
-- [V2-049] Report Image Attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `report_images` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `report_id`   BIGINT UNSIGNED NOT NULL,
  `reply_id`    BIGINT UNSIGNED DEFAULT NULL   COMMENT 'NULL = report-level image; non-NULL = reply attachment',
  `image_path`  VARCHAR(500)    NOT NULL,
  `serial`      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_images_report` (`report_id`),
  KEY `idx_report_images_reply`  (`reply_id`),
  CONSTRAINT `fk_ri_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ri_reply`  FOREIGN KEY (`reply_id`)  REFERENCES `report_replies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Table structure for table `single_page_sessions`
-- V2-055: Session table for Single Product Page OTP verification
--

DROP TABLE IF EXISTS `single_page_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `single_page_sessions` (
  `id` varchar(36) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_otp` varchar(6) DEFAULT NULL,
  `phone_otp_exp` datetime DEFAULT NULL,
  `email_otp` varchar(6) DEFAULT NULL,
  `email_otp_exp` datetime DEFAULT NULL,
  `is_phone_verified` tinyint(1) NOT NULL DEFAULT '0',
  `is_email_verified` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sps_phone` (`phone`),
  KEY `idx_sps_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
