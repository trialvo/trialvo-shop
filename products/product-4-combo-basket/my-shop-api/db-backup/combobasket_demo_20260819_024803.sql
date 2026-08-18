-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: localhost    Database: combobasket_demo
-- ------------------------------------------------------
-- Server version	8.4.8

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
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `label` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Home',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('superadmin','admin','moderator') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `permissions` json DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
INSERT INTO `admins` VALUES (1,'Arafat Shovo','5arafatshovo@gmail.com',NULL,'$2b$12$kDz4ODXRyODKWzdcWorEweRoSjuok2RmtRjsNDvKE8rW4AyGLcqR.','superadmin',NULL,NULL,1,NULL,'2026-08-13 10:25:09','2026-08-13 10:25:09'),(2,'Arafat Admin','1arafatshovo@gmail.com',NULL,'$2b$12$NAOZhnPZ3QL32ekcdaIla.bH6hye/Mb5knLhXmolX63VPA1QKmvDC','admin',NULL,NULL,1,NULL,'2026-08-13 10:25:09','2026-08-13 10:25:09'),(3,'Trialvo Demo','demo@trialvo.com',NULL,'$2b$12$9rBTtciZ9l4GGHVty2LkQ.XgsM5akYzclM8AYsj9.tyioYcBYtLmK','superadmin',NULL,NULL,1,NULL,'2026-08-13 12:07:32','2026-08-18 20:43:58'),(4,'combobasket Smoke','smoke-combobasket-1786977798629@test.local',NULL,'$2a$12$XV9Kq8rSosamx61OpwX.8.7OPU4..Sl3MS/5ksSSio8Nx2zVuGxDO','admin',NULL,NULL,0,NULL,'2026-08-17 14:43:18','2026-08-17 14:43:18'),(5,'E2E Test','e2e-combo-basket-ecommerce-1786977814661@trialvo.demo',NULL,'$2a$12$1Gg1J2Ola9cl28OjqLOlYujQ/rYHsy7tlhyW6UzdAB3a2J/tvNWVW','admin',NULL,NULL,0,NULL,'2026-08-17 14:43:34','2026-08-17 14:43:34');
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entity_type` enum('product','category','order','coupon','faq','config','message','customer','admin','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` enum('create','update','delete','login','logout','status_change','mark_read','password_change') COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` int DEFAULT NULL,
  `admin_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_entity_type_entity_id` (`entity_type`,`entity_id`),
  KEY `audit_logs_admin_id` (`admin_id`),
  KEY `audit_logs_action` (`action`),
  KEY `audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,'admin','2','login',2,'Trial Test User','trial-test-1786397463085@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:31:03'),(2,'admin','2','login',2,'Trial Test User','trial-test-1786397463085@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:31:04'),(3,'admin','1','login',1,'Trialvo Demo','demo@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:34:33'),(4,'admin','3','login',3,'Trial Test User','trial-test-1786397673323@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:34:33'),(5,'admin','3','login',3,'Trial Test User','trial-test-1786397673323@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:34:34'),(6,'admin','1','login',1,'Trialvo Demo','demo@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:36:21'),(7,'admin','4','login',4,'Trial Test User','trial-test-1786397781125@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:36:21'),(8,'admin','4','login',4,'Trial Test User','trial-test-1786397781125@trialvo.com',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:36:22'),(9,'admin','6','login',6,'Admin Freeze Test','admin-freeze-test-1786398488228@trialvo.demo',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:48:08'),(10,'admin','6','login',6,'Admin Freeze Test','admin-freeze-test-1786398488228@trialvo.demo',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:48:09'),(11,'admin','8','login',8,'CP Admin Test','cp-admin-test-combo-basket-ecommerce-1786398826715@trialvo.demo',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-10 21:53:48'),(12,'admin','10','login',10,'CP Admin Test','cp-admin-test-combo-basket-ecommerce-1786441112439@trialvo.demo',NULL,NULL,'::ffff:172.30.0.1',NULL,'Login from ::ffff:172.30.0.1','2026-08-11 09:38:33');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_bn` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `svg_icon` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#e91e63',
  `show_on_home` tinyint(1) DEFAULT '0',
  `home_sort_order` int DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Snacks & Treats','স্ন্যাকস ও ট্রিটস','snacks',NULL,NULL,NULL,'#e91e63',0,0,0,1,'2026-08-10 21:29:10','2026-08-10 21:29:10'),(2,'Gift Boxes','গিফট বক্স','gift-boxes',NULL,NULL,NULL,'#e91e63',0,0,0,1,'2026-08-10 21:29:10','2026-08-10 21:29:10');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_product_items`
--

DROP TABLE IF EXISTS `combo_product_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_product_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `combo_id` int NOT NULL,
  `product_id` int NOT NULL,
  `qty` int NOT NULL DEFAULT '1',
  `custom_label` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional display label e.g. "ত্বকের যত্নের কিট"',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `combo_id` (`combo_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `combo_product_items_ibfk_1` FOREIGN KEY (`combo_id`) REFERENCES `combo_products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `combo_product_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_product_items`
--

LOCK TABLES `combo_product_items` WRITE;
/*!40000 ALTER TABLE `combo_product_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `combo_product_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_products`
--

DROP TABLE IF EXISTS `combo_products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `combo_products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_bn` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `images` json DEFAULT NULL,
  `bundle_price` decimal(10,2) NOT NULL COMMENT 'Final selling price set by admin',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT 'Sum of all item MRPs (auto or manual)',
  `in_stock` tinyint(1) DEFAULT '1',
  `stock_qty` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `sort_order` int DEFAULT '0',
  `tags` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_products`
--

LOCK TABLES `combo_products` WRITE;
/*!40000 ALTER TABLE `combo_products` DISABLE KEYS */;
/*!40000 ALTER TABLE `combo_products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('percent','fixed') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `value` decimal(10,2) NOT NULL,
  `min_order_amount` decimal(10,2) DEFAULT '0.00',
  `max_discount` decimal(10,2) DEFAULT NULL,
  `usage_limit` int DEFAULT '0',
  `used_count` int DEFAULT '0',
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `applies_to` enum('all','combo','single') COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `question` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int NOT NULL,
  `items` json NOT NULL,
  `order_mode` enum('single','combo','combo-bundle') COLLATE utf8mb4_unicode_ci DEFAULT 'single',
  `subtotal` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `delivery_charge` decimal(10,2) DEFAULT '0.00',
  `coupon_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `coupon_discount` decimal(10,2) DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `shipping_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_address` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shipping_city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_method` enum('cod','bkash','nagad','card') COLLATE utf8mb4_unicode_ci DEFAULT 'cod',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `fraud_status` json DEFAULT NULL COMMENT 'Cached fraud check result: { riskLevel, deliveryRate, total_parcels, total_delivered, total_cancel, apis, checkedAt }',
  `fraud_checked_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_bn` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(220) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `short_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `actual_price` decimal(10,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'flat discount in BDT; sell_price = price - discount_amount',
  `discount_price` decimal(10,2) DEFAULT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `images` json DEFAULT NULL,
  `category_id` int NOT NULL,
  `tags` json DEFAULT NULL,
  `in_stock` tinyint(1) DEFAULT '1',
  `stock_qty` int DEFAULT '0',
  `rating` decimal(3,1) DEFAULT '0.0',
  `review_count` int DEFAULT '0',
  `is_combo_eligible` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `features` json DEFAULT NULL,
  `specifications` json DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Chocolate Truffle Box','চকলেট ট্রাফল বক্স','chocolate-truffle-box',NULL,NULL,450.00,NULL,0.00,NULL,NULL,'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&q=85','[\"https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop&q=85\"]',2,NULL,1,50,0.0,0,1,0,NULL,0,NULL,NULL,'2026-08-10 21:29:10','2026-08-13 11:09:56'),(2,'Mixed Nut Jar','মিক্সড নাট জার','mixed-nut-jar',NULL,NULL,280.00,NULL,0.00,NULL,NULL,'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=600&fit=crop&q=85','[\"https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&h=600&fit=crop&q=85\"]',1,NULL,1,80,0.0,0,1,0,NULL,0,NULL,NULL,'2026-08-10 21:29:10','2026-08-13 11:09:56'),(3,'Premium Cookies Pack','প্রিমিয়াম কুকিজ প্যাক','premium-cookies',NULL,NULL,190.00,NULL,0.00,NULL,NULL,'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&q=85','[\"https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=600&fit=crop&q=85\"]',1,NULL,1,100,0.0,0,1,0,NULL,0,NULL,NULL,'2026-08-10 21:29:10','2026-08-13 11:09:56');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` tinyint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reviews_product_id_user_id` (`product_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shop_config`
--

DROP TABLE IF EXISTS `shop_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shop_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `combo_is_active` tinyint(1) DEFAULT '1',
  `combo_discount_percent` int DEFAULT '15',
  `combo_discount_type` enum('percent','flat') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `combo_min_amount_for_discount` decimal(10,2) DEFAULT '0.00',
  `combo_min_free_delivery` decimal(10,2) DEFAULT '300.00',
  `combo_delivery_charge` decimal(10,2) DEFAULT '60.00',
  `single_is_active` tinyint(1) DEFAULT '1',
  `single_discount_percent` int DEFAULT '0',
  `single_discount_type` enum('percent','flat') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `single_min_amount_for_discount` decimal(10,2) DEFAULT '0.00',
  `single_min_free_delivery` decimal(10,2) DEFAULT '200.00',
  `single_delivery_charge` decimal(10,2) DEFAULT '60.00',
  `combo_bundle_is_active` tinyint(1) DEFAULT '1',
  `combo_bundle_discount_percent` int DEFAULT '10',
  `combo_bundle_discount_type` enum('percent','flat') COLLATE utf8mb4_unicode_ci DEFAULT 'percent',
  `combo_bundle_min_amount_for_discount` decimal(10,2) DEFAULT '0.00',
  `combo_bundle_min_free_delivery` decimal(10,2) DEFAULT '500.00',
  `combo_bundle_delivery_charge` decimal(10,2) DEFAULT '60.00',
  `fraud_checker_enabled` tinyint(1) DEFAULT '0',
  `fraud_checker_api_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_zones` text COLLATE utf8mb4_unicode_ci,
  `combo_delivery_config` text COLLATE utf8mb4_unicode_ci,
  `single_delivery_config` text COLLATE utf8mb4_unicode_ci,
  `combo_bundle_delivery_config` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shop_config`
--

LOCK TABLES `shop_config` WRITE;
/*!40000 ALTER TABLE `shop_config` DISABLE KEYS */;
INSERT INTO `shop_config` VALUES (1,1,15,'percent',0.00,300.00,60.00,1,0,'percent',0.00,200.00,60.00,1,10,'percent',0.00,500.00,60.00,0,NULL,NULL,NULL,NULL,NULL,'2026-08-10 21:29:10','2026-08-10 21:29:10');
/*!40000 ALTER TABLE `shop_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_settings`
--

DROP TABLE IF EXISTS `site_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_tagline` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `site_description` text COLLATE utf8mb4_unicode_ci,
  `contact_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_hours` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `whatsapp_number` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_facebook` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_instagram` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_twitter` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `social_whatsapp` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `about_hero_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `about_hero_subtitle` text COLLATE utf8mb4_unicode_ci,
  `about_story` text COLLATE utf8mb4_unicode_ci,
  `about_stats` text COLLATE utf8mb4_unicode_ci,
  `about_values` text COLLATE utf8mb4_unicode_ci,
  `about_team` text COLLATE utf8mb4_unicode_ci,
  `home_show_featured` tinyint(1) DEFAULT NULL,
  `home_show_categories` tinyint(1) DEFAULT NULL,
  `home_show_process_steps` tinyint(1) DEFAULT NULL,
  `home_show_testimonials` tinyint(1) DEFAULT NULL,
  `home_show_category_sections` tinyint(1) DEFAULT NULL,
  `footer_tagline` text COLLATE utf8mb4_unicode_ci,
  `footer_quick_links` text COLLATE utf8mb4_unicode_ci,
  `footer_company_links` text COLLATE utf8mb4_unicode_ci,
  `footer_support_links` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_settings`
--

LOCK TABLES `site_settings` WRITE;
/*!40000 ALTER TABLE `site_settings` DISABLE KEYS */;
INSERT INTO `site_settings` VALUES (1,'ComboBasket','বাংলাদেশের সেরা কম্বো ও গিফট শপ','স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।','১২৩ মেইন স্ট্রিট, ঢাকা, বাংলাদেশ','+৮৮০ ১২৩৪-৫৬৭৮৯০','support@combobasket.com','শনি–বৃহস্পতি: সকাল ১০টা – রাত ৮টা','8801234567890','#','#','#','#','আমাদের সম্পর্কে','আমরা প্রিমিয়াম মানের পণ্য সবার কাছে পৌঁছে দেওয়ার লক্ষ্যে কাজ করে যাচ্ছি।','ComboBasket শুরু হয়েছিল একটি সহজ ধারণা থেকে — প্রিমিয়াম মানের পণ্য সবার নাগালে পৌঁছে দেওয়া। আমরা আমাদের প্রতিটি পণ্য সতর্কতার সাথে বাছাই করি, মান, ডিজাইন এবং মূল্যের ক্ষেত্রে আমাদের উচ্চ মানদণ্ড নিশ্চিত করে।','[{\"value\":\"১০হা+\",\"label\":\"সন্তুষ্ট গ্রাহক\"},{\"value\":\"৫হা+\",\"label\":\"পণ্য বিক্রয়\"},{\"value\":\"৫০+\",\"label\":\"ক্যাটাগরি\"},{\"value\":\"৯৯%\",\"label\":\"সন্তুষ্টির হার\"}]','[{\"icon\":\"Gem\",\"title\":\"মানের প্রতি অঙ্গীকার\",\"desc\":\"আমরা শুধুমাত্র সেরা মানের পণ্য সংগ্রহ করি।\",\"bg\":\"bg-pink-50\",\"iconColor\":\"text-pink-600\"},{\"icon\":\"Rocket\",\"title\":\"দ্রুত ডেলিভারি\",\"desc\":\"আপনার দরজায় দ্রুত ও নির্ভরযোগ্য ডেলিভারি।\",\"bg\":\"bg-blue-50\",\"iconColor\":\"text-blue-600\"},{\"icon\":\"Heart\",\"title\":\"গ্রাহক সেবা\",\"desc\":\"যেকোনো প্রশ্নে সর্বক্ষণ সহায়তার জন্য প্রস্তুত।\",\"bg\":\"bg-red-50\",\"iconColor\":\"text-red-600\"},{\"icon\":\"Lock\",\"title\":\"নিরাপদ কেনাকাটা\",\"desc\":\"আপনার তথ্য ও পেমেন্ট সর্বদা সুরক্ষিত।\",\"bg\":\"bg-purple-50\",\"iconColor\":\"text-purple-600\"}]','[{\"name\":\"Sarah Ahmed\",\"role\":\"প্রধান নির্বাহী ও প্রতিষ্ঠাতা\",\"icon\":\"Briefcase\"},{\"name\":\"Rifat Khan\",\"role\":\"প্রযুক্তি প্রধান\",\"icon\":\"Code\"},{\"name\":\"Nadia Islam\",\"role\":\"ডিজাইন প্রধান\",\"icon\":\"Palette\"}]',1,1,1,1,1,'বাংলাদেশের সেরা কম্বো ও গিফট শপ। স্কিনকেয়ার, মেকআপ, হেয়ার কেয়ার ও প্রিমিয়াম গিফট সেট — সবচেয়ে কম দামে, ফ্রি ডেলিভারিতে।','[{\"href\":\"/products\",\"label\":\"সকল পণ্য\"},{\"href\":\"/products?category=electronics\",\"label\":\"ইলেকট্রনিক্স\"},{\"href\":\"/products?category=fashion\",\"label\":\"ফ্যাশন\"},{\"href\":\"/products?category=accessories\",\"label\":\"এক্সেসরিজ\"}]','[{\"href\":\"/about\",\"label\":\"আমাদের সম্পর্কে\"},{\"href\":\"/contact\",\"label\":\"যোগাযোগ\"},{\"href\":\"#\",\"label\":\"ব্লগ\"},{\"href\":\"#\",\"label\":\"ক্যারিয়ার\"}]','[{\"href\":\"/contact\",\"label\":\"হেল্প সেন্টার\"},{\"href\":\"/faq\",\"label\":\"সাধারণ জিজ্ঞাসা\"},{\"href\":\"/refund\",\"label\":\"রিটার্ন ও রিফান্ড\"},{\"href\":\"/privacy\",\"label\":\"গোপনীয়তা নীতি\"},{\"href\":\"/cookies\",\"label\":\"কুকি নীতি\"}]','2026-08-13 10:57:42','2026-08-13 10:57:42');
/*!40000 ALTER TABLE `site_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sliders`
--

DROP TABLE IF EXISTS `sliders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sliders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `highlight` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `badge` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `badge_color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'from-pink-500 to-rose-600',
  `banner_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `accent_from` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#e91e63',
  `accent_to` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#ff4081',
  `bg_from` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#0f172a',
  `bg_via` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#1a1035',
  `bg_to` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '#1e0a2e',
  `price` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `original_price` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `discount` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `link` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT '/products',
  `cta_text` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'এখনই কিনুন',
  `cta_secondary` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT 'সব পণ্য দেখুন',
  `button_style` enum('gradient','solid','outline') COLLATE utf8mb4_unicode_ci DEFAULT 'gradient',
  `product_id` int DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `free_delivery` tinyint(1) DEFAULT '0',
  `authentic` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `sliders_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sliders`
--

LOCK TABLES `sliders` WRITE;
/*!40000 ALTER TABLE `sliders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sliders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscribers`
--

DROP TABLE IF EXISTS `subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscribers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'footer',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscribers`
--

LOCK TABLES `subscribers` WRITE;
/*!40000 ALTER TABLE `subscribers` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlists` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wishlists_user_id_product_id` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `wishlists_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

LOCK TABLES `wishlists` WRITE;
/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'combobasket_demo'
--

--
-- Dumping routines for database 'combobasket_demo'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
