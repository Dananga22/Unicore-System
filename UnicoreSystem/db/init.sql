-- UniCore System Database Initialization
CREATE DATABASE IF NOT EXISTS unicore_db;
USE unicore_db;

-- Ensure the application user exists for both local and LAN access
CREATE USER IF NOT EXISTS 'unicore_user'@'localhost' IDENTIFIED BY 'unicore_pass';
ALTER USER 'unicore_user'@'localhost' IDENTIFIED BY 'unicore_pass';
GRANT ALL PRIVILEGES ON unicore_db.* TO 'unicore_user'@'localhost';

CREATE USER IF NOT EXISTS 'unicore_user'@'%' IDENTIFIED BY 'unicore_pass';
ALTER USER 'unicore_user'@'%' IDENTIFIED BY 'unicore_pass';
GRANT ALL PRIVILEGES ON unicore_db.* TO 'unicore_user'@'%';

FLUSH PRIVILEGES;
