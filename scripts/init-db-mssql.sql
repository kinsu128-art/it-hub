-- IT-Hub MSSQL Database Schema
-- Microsoft SQL Server T-SQL Script
-- Database: dk_it

USE dk_it;
GO

-- Drop existing tables if they exist
IF OBJECT_ID('dbo.asset_history', 'U') IS NOT NULL DROP TABLE dbo.asset_history;
IF OBJECT_ID('dbo.software', 'U') IS NOT NULL DROP TABLE dbo.software;
IF OBJECT_ID('dbo.printers', 'U') IS NOT NULL DROP TABLE dbo.printers;
IF OBJECT_ID('dbo.network_ips', 'U') IS NOT NULL DROP TABLE dbo.network_ips;
IF OBJECT_ID('dbo.servers', 'U') IS NOT NULL DROP TABLE dbo.servers;
IF OBJECT_ID('dbo.pcs', 'U') IS NOT NULL DROP TABLE dbo.pcs;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
GO

-- Users table
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(255) UNIQUE NOT NULL,
  password_hash NVARCHAR(MAX) NOT NULL,
  name NVARCHAR(255) NOT NULL,
  email NVARCHAR(255),
  role NVARCHAR(50) DEFAULT 'user',
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);
GO

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
GO

-- PC/Laptop assets
CREATE TABLE pcs (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asset_number NVARCHAR(255) UNIQUE NOT NULL,
  user_name NVARCHAR(255),
  department NVARCHAR(255),
  model_name NVARCHAR(255) NOT NULL,
  serial_number NVARCHAR(255) UNIQUE,
  purchase_date DATE,
  cpu NVARCHAR(MAX),
  ram NVARCHAR(255),
  disk NVARCHAR(255),
  status NVARCHAR(50) DEFAULT 'in_stock',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_pcs_status ON pcs(status);
CREATE INDEX idx_pcs_asset_number ON pcs(asset_number);
GO

-- Server assets
CREATE TABLE servers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asset_number NVARCHAR(255) UNIQUE NOT NULL,
  rack_location NVARCHAR(255),
  hostname NVARCHAR(255) NOT NULL,
  os_version NVARCHAR(255),
  ip_address NVARCHAR(45),
  purpose NVARCHAR(255),
  warranty_expiry DATE,
  cpu NVARCHAR(MAX),
  ram NVARCHAR(255),
  disk NVARCHAR(255),
  status NVARCHAR(50) DEFAULT 'active',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_servers_hostname ON servers(hostname);
CREATE INDEX idx_servers_status ON servers(status);
GO

-- Network IP addresses
CREATE TABLE network_ips (
  id INT IDENTITY(1,1) PRIMARY KEY,
  ip_address NVARCHAR(45) UNIQUE NOT NULL,
  subnet_mask NVARCHAR(45) NOT NULL,
  gateway NVARCHAR(45),
  assigned_device NVARCHAR(255),
  vlan_id INT,
  is_active BIT DEFAULT 1,
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_network_ips_ip ON network_ips(ip_address);
CREATE INDEX idx_network_ips_active ON network_ips(is_active);
GO

-- Printers
CREATE TABLE printers (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asset_number NVARCHAR(255) UNIQUE NOT NULL,
  model_name NVARCHAR(255) NOT NULL,
  ip_address NVARCHAR(45),
  location NVARCHAR(255),
  toner_status NVARCHAR(255),
  drum_status NVARCHAR(255),
  vendor_name NVARCHAR(255),
  vendor_contact NVARCHAR(MAX),
  status NVARCHAR(50) DEFAULT 'active',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_printers_status ON printers(status);
GO

-- Software licenses
CREATE TABLE software (
  id INT IDENTITY(1,1) PRIMARY KEY,
  software_name NVARCHAR(255) NOT NULL,
  license_key NVARCHAR(MAX),
  purchased_quantity INT NOT NULL,
  allocated_quantity INT DEFAULT 0,
  expiry_date DATE,
  version NVARCHAR(255),
  vendor_name NVARCHAR(255),
  status NVARCHAR(50) DEFAULT 'active',
  notes NVARCHAR(MAX),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  created_by INT,
  updated_by INT,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_software_expiry ON software(expiry_date);
CREATE INDEX idx_software_status ON software(status);
GO

-- Asset history (audit log)
CREATE TABLE asset_history (
  id INT IDENTITY(1,1) PRIMARY KEY,
  asset_type NVARCHAR(50) NOT NULL,
  asset_id INT NOT NULL,
  action NVARCHAR(50) NOT NULL,
  field_name NVARCHAR(255),
  old_value NVARCHAR(MAX),
  new_value NVARCHAR(MAX),
  changed_by INT,
  changed_at DATETIME2 DEFAULT GETDATE(),
  ip_address NVARCHAR(45),
  user_agent NVARCHAR(MAX),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
GO

CREATE INDEX idx_history_asset ON asset_history(asset_type, asset_id);
CREATE INDEX idx_history_date ON asset_history(changed_at);
CREATE INDEX idx_history_user ON asset_history(changed_by);
GO

-- Insert default admin user
-- Password: admin123 (bcrypt hashed with cost 10)
-- Note: This is a placeholder hash. Run the init-db.js script to generate the actual hash.
INSERT INTO users (username, password_hash, name, email, role)
VALUES (
  'admin',
  '$2a$10$X5JZCKzPPj8C8Y1XqmF4WuYGZQN8H3H3ZN8Y3Y3Y3Y3Y3Y3Y3Y3Y3Y',
  'Administrator',
  'admin@ithub.local',
  'admin'
);
GO

PRINT 'Database schema created successfully!';
PRINT 'Default admin user: admin / admin123';
GO
