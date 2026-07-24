-- Trialvo Shop Control Plane MySQL init (runs once on empty data volume).
CREATE DATABASE IF NOT EXISTS trialvo_shop
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Application user (root is used when MYSQL_ROOT_PASSWORD is set; this grants the app user).
CREATE USER IF NOT EXISTS 'trialvo'@'%' IDENTIFIED BY 'localdev2026';
GRANT ALL PRIVILEGES ON trialvo_shop.* TO 'trialvo'@'%';
FLUSH PRIVILEGES;
