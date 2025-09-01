-- Railway MySQL Database Setup
CREATE DATABASE IF NOT EXISTS loan_crm;
USE loan_crm;

-- Import your existing schema
SOURCE database/schema.sql;

-- Create admin user
INSERT INTO users (username, email, password, role, status) 
VALUES ('admin', 'admin@loancrm.com', '$2a$10$example', 'admin', 'active');