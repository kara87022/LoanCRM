-- Sample Queries for Mini-Business Loan CRM

-- 1. Create a new loan (₹50,000 on 2025-01-15)
CALL create_minibusiness_loan(
    'MBL001', 
    101, 
    'Rajesh Kumar', 
    50000, 
    '2025-01-15', 
    'Mumbai Central', 
    'Agent001'
);

-- 2. View EMI Schedule for a loan
SELECT 
    loan_id,
    installment_number,
    due_date,
    amount,
    status
FROM repayment_schedule 
WHERE loan_id = 'MBL001'
ORDER BY installment_number;

-- 3. Record a payment (EMI 1 paid via UPI)
CALL record_payment(
    'MBL001',
    1,
    4285.71,
    'UPI',
    '2025-01-22',
    'Collection Agent'
);

-- 4. Check overdue cases
SELECT 
    rs.loan_id,
    l.customer_name,
    rs.installment_number,
    rs.due_date,
    rs.amount,
    DATEDIFF(CURDATE(), rs.due_date) as days_overdue
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE rs.status = 'Pending' 
AND rs.due_date < CURDATE()
ORDER BY days_overdue DESC;

-- 5. Daily collection report
SELECT 
    DATE(rs.due_date) as collection_date,
    COUNT(*) as total_emis,
    SUM(rs.amount) as total_due,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collected,
    SUM(CASE WHEN rs.status = 'Pending' THEN rs.amount ELSE 0 END) as pending
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE DATE(rs.due_date) = CURDATE()
AND l.status = 'Active'
GROUP BY DATE(rs.due_date);

-- 6. Monthly disbursement summary
SELECT * FROM monthly_disbursement LIMIT 12;

-- 7. Portfolio summary
SELECT 
    COUNT(*) as total_loans,
    SUM(loan_amount) as total_disbursed,
    SUM(repayment_amount) as total_repayment,
    SUM(interest_earned) as total_interest,
    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_loans,
    COUNT(CASE WHEN status = 'Closed' THEN 1 END) as closed_loans,
    COUNT(CASE WHEN status = 'Defaulted' THEN 1 END) as defaulted_loans
FROM loans;

-- 8. Collection efficiency by month
SELECT 
    DATE_FORMAT(rs.due_date, '%Y-%m') as month,
    COUNT(*) as total_installments,
    SUM(rs.amount) as total_due,
    COUNT(CASE WHEN rs.status = 'Paid' THEN 1 END) as paid_count,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collected_amount,
    ROUND((COUNT(CASE WHEN rs.status = 'Paid' THEN 1 END) / COUNT(*)) * 100, 2) as collection_rate
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE l.status = 'Active'
GROUP BY DATE_FORMAT(rs.due_date, '%Y-%m')
ORDER BY month DESC;

-- 9. Customer payment history
SELECT 
    p.payment_date,
    p.amount,
    p.payment_method,
    rs.installment_number,
    rs.due_date
FROM payments p
JOIN repayment_schedule rs ON rs.schedule_id = p.installment_id
WHERE p.loan_id = 'MBL001'
ORDER BY p.payment_date DESC;

-- 10. NPA (Non-Performing Assets) Report - Loans overdue > 90 days
SELECT 
    l.loan_id,
    l.customer_name,
    l.loan_amount,
    MIN(rs.due_date) as first_overdue_date,
    DATEDIFF(CURDATE(), MIN(rs.due_date)) as days_overdue,
    SUM(CASE WHEN rs.status != 'Paid' THEN rs.amount ELSE 0 END) as outstanding_amount
FROM loans l
JOIN repayment_schedule rs ON rs.loan_id = l.loan_id
WHERE rs.status IN ('Pending', 'Overdue')
AND rs.due_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
GROUP BY l.loan_id, l.customer_name, l.loan_amount
HAVING days_overdue > 90
ORDER BY days_overdue DESC;