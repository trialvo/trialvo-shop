CREATE TABLE IF NOT EXISTS license_state (
  id TINYINT PRIMARY KEY DEFAULT 1,
  install_id VARCHAR(64) DEFAULT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'active',
  last_lease_exp DATETIME DEFAULT NULL,
  last_good_lease_at DATETIME DEFAULT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_license_single_row CHECK (id = 1)
);
INSERT IGNORE INTO license_state (id, state) VALUES (1, 'active');
