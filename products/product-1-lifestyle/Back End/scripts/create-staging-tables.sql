-- ============================================================
-- Staging tables for location sync (Pathao + Steadfast)
-- Run once. Safe to re-run (uses CREATE TABLE IF NOT EXISTS).
-- ============================================================

CREATE TABLE IF NOT EXISTS `pathao_locations_raw` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `city_id`     INT            NOT NULL COMMENT 'Pathao city_id  (level-1)',
  `city_name`   VARCHAR(150)   NOT NULL COMMENT 'Pathao city name (e.g. Dhaka)',
  `zone_id`     INT            NOT NULL COMMENT 'Pathao zone_id  (level-2)',
  `zone_name`   VARCHAR(150)   NOT NULL COMMENT 'Pathao zone name (e.g. Ashulia)',
  `area_id`     INT            NOT NULL COMMENT 'Pathao area_id  (level-3)',
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
  `district_name`   VARCHAR(150)   NOT NULL COMMENT 'Steadfast district name (e.g. Dhaka)',
  `station_id`      INT            NOT NULL COMMENT 'Police station id (level-2 / thana)',
  `station_name`    VARCHAR(150)   NOT NULL COMMENT 'Police station / thana name',
  `synced_at`       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_sf_station` (`station_id`),
  KEY `idx_slr_district` (`district_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
