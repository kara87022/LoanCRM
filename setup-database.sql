-- Railway MySQL Database Setup
USE railway;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  department VARCHAR(100),
  designation VARCHAR(100),
  joinDate DATE,
  branch VARCHAR(100),
  employeeId VARCHAR(50),
  profilePic TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  loan_id VARCHAR(50) PRIMARY KEY,
  branch VARCHAR(100),
  sourced_by VARCHAR(100),
  customer_name VARCHAR(255) NOT NULL,
  loan_amount DECIMAL(15,2),
  processing_fee DECIMAL(15,2),
  gst DECIMAL(15,2),
  net_disbursement DECIMAL(15,2),
  repayment_amount DECIMAL(15,2),
  interest_earned DECIMAL(15,2),
  roi DECIMAL(5,2),
  tenure_days INT,
  date_of_disbursement DATE,
  installment_amount DECIMAL(15,2),
  total_installments INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create installments table
CREATE TABLE IF NOT EXISTS installments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id VARCHAR(50),
  installment_number INT,
  amount DECIMAL(15,2),
  due_date DATE,
  status VARCHAR(20) DEFAULT 'Pending',
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loan_id VARCHAR(50),
  installment_id INT,
  amount_collected DECIMAL(15,2),
  collection_date DATE,
  collection_method VARCHAR(50),
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(loan_id),
  FOREIGN KEY (installment_id) REFERENCES installments(id)
);

-- Insert admin user (password: admin123)
INSERT INTO users (username, password, role, name, email, employeeId, department, designation) 
VALUES (
  'admin@loancrm.com', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
  'admin',
  'System Administrator',
  'admin@loancrm.com',
  'EMP001',
  'Administration',
  'System Admin'
) ON DUPLICATE KEY UPDATE username=username;

SELECT 'Database setup completed successfully!' as message;