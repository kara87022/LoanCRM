-- Mini-Business Loan CRM Database Schema
-- Product: Mini-Business Loan (₹5,000 - ₹5,00,000, 100 days, 20% flat interest)

-- 1. Customers Table
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(100),
    address TEXT,
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Loans Master Table
CREATE TABLE loans (
    loan_id VARCHAR(20) PRIMARY KEY,
    customer_id INT NOT NULL,
    branch VARCHAR(50),
    sourced_by VARCHAR(100),
    customer_name VARCHAR(100) NOT NULL,
    loan_amount DECIMAL(15,2) NOT NULL CHECK (loan_amount BETWEEN 5000 AND 500000),
    processing_fee DECIMAL(15,2) DEFAULT 0,
    gst DECIMAL(15,2) DEFAULT 0,
    net_disbursement DECIMAL(15,2),
    interest_rate DECIMAL(5,2) DEFAULT 20.00,
    tenure_days INT DEFAULT 100,
    total_installments INT DEFAULT 14,
    installment_amount DECIMAL(15,2),
    repayment_amount DECIMAL(15,2),
    interest_earned DECIMAL(15,2),
    roi DECIMAL(5,2),
    date_of_disbursement DATE NOT NULL,
    status ENUM('Active','Closed','Defaulted','Pending') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- 3. Repayment Schedule Table (EMI Schedule)
CREATE TABLE repayment_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id VARCHAR(20) NOT NULL,
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('Pending','Paid','Overdue','Bounced') DEFAULT 'Pending',
    payment_date DATE NULL,
    days_overdue INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id)
);

-- 4. Payments Table (Collection Records)
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id VARCHAR(20) NOT NULL,
    installment_id INT,
    amount DECIMAL(15,2) NOT NULL,
    payment_method ENUM('Cash','UPI','Bank Transfer','Cheque') DEFAULT 'Cash',
    payment_date DATE NOT NULL,
    remarks TEXT,
    collected_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id),
    FOREIGN KEY (installment_id) REFERENCES repayment_schedule(schedule_id)
);

-- 5. Collection Dashboard View
CREATE VIEW collection_dashboard AS
SELECT 
    rs.loan_id,
    l.customer_name,
    rs.installment_number,
    rs.due_date,
    rs.amount,
    rs.status,
    CASE 
        WHEN rs.due_date < CURDATE() AND rs.status = 'Pending' THEN DATEDIFF(CURDATE(), rs.due_date)
        ELSE 0 
    END as days_overdue
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE l.status = 'Active';

-- 6. Monthly Disbursement View
CREATE VIEW monthly_disbursement AS
SELECT 
    DATE_FORMAT(date_of_disbursement, '%Y-%m') as month,
    COUNT(*) as total_loans,
    SUM(loan_amount) as total_amount,
    AVG(loan_amount) as avg_amount
FROM loans 
WHERE status != 'Pending'
GROUP BY DATE_FORMAT(date_of_disbursement, '%Y-%m')
ORDER BY month DESC;

-- 7. Monthly Collection Demand View
CREATE VIEW monthly_collection_demand AS
SELECT 
    DATE_FORMAT(rs.due_date, '%Y-%m') as month,
    SUM(rs.amount) as demand,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collection,
    SUM(CASE WHEN rs.status != 'Paid' THEN rs.amount ELSE 0 END) as pending,
    ROUND((SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) / SUM(rs.amount)) * 100, 2) as collection_percentage
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE l.status = 'Active'
GROUP BY DATE_FORMAT(rs.due_date, '%Y-%m')
ORDER BY month DESC;

-- Indexes for Performance
CREATE INDEX idx_loans_disbursement_date ON loans(date_of_disbursement);
CREATE INDEX idx_repayment_due_date ON repayment_schedule(due_date);
CREATE INDEX idx_repayment_status ON repayment_schedule(status);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_repayment_month ON repayment_schedule(due_date, status);