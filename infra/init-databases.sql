-- Shared MySQL init — runs once on empty data volume.
-- One server, separate schemas per product / Control Plane.

CREATE DATABASE IF NOT EXISTS trialvo_shop
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS lifestyle_ecom
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS fashion_ecom
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS techshop_ecom
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Option 1 per-product demo DBs (same MySQL container, separate schemas)
CREATE DATABASE IF NOT EXISTS lifestyle_demo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS fashion_demo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS techshop_demo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS combobasket_demo
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS combobasket_ecom
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- App user (also created by MYSQL_USER env; ensure grants cover every DB)
CREATE USER IF NOT EXISTS 'trialvo'@'%' IDENTIFIED BY 'localdev2026';
GRANT ALL PRIVILEGES ON trialvo_shop.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON lifestyle_ecom.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON fashion_ecom.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON techshop_ecom.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON lifestyle_demo.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON fashion_demo.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON techshop_demo.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON combobasket_demo.* TO 'trialvo'@'%';
GRANT ALL PRIVILEGES ON combobasket_ecom.* TO 'trialvo'@'%';

-- Root already has all privileges via MYSQL_ROOT_PASSWORD
FLUSH PRIVILEGES;
