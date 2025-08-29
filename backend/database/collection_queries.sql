-- Collection Demand Queries for Dashboard

-- 1. Monthly Collection Demand (Auto-calculated from EMI schedule)
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
ORDER BY month DESC
LIMIT 12;

-- 2. Daily Collection Dashboard
SELECT 
    DATE(rs.due_date) as date,
    SUM(rs.amount) as demand,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collection,
    COUNT(*) as total_emis,
    COUNT(CASE WHEN rs.status = 'Paid' THEN 1 END) as paid_emis,
    COUNT(CASE WHEN rs.status = 'Pending' THEN 1 END) as pending_emis
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE DATE(rs.due_date) = CURDATE()
AND l.status = 'Active'
GROUP BY DATE(rs.due_date);

-- 3. Collection Performance by Branch
SELECT 
    l.branch,
    DATE_FORMAT(rs.due_date, '%Y-%m') as month,
    SUM(rs.amount) as demand,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collection,
    ROUND((SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) / SUM(rs.amount)) * 100, 2) as collection_rate
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE l.status = 'Active'
GROUP BY l.branch, DATE_FORMAT(rs.due_date, '%Y-%m')
ORDER BY month DESC, collection_rate DESC;

-- 4. Overdue Analysis
SELECT 
    CASE 
        WHEN DATEDIFF(CURDATE(), rs.due_date) BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN DATEDIFF(CURDATE(), rs.due_date) BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN DATEDIFF(CURDATE(), rs.due_date) BETWEEN 61 AND 90 THEN '61-90 Days'
        WHEN DATEDIFF(CURDATE(), rs.due_date) > 90 THEN '90+ Days'
    END as overdue_bucket,
    COUNT(*) as count,
    SUM(rs.amount) as overdue_amount
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE rs.status IN ('Pending', 'Overdue')
AND rs.due_date < CURDATE()
AND l.status = 'Active'
GROUP BY overdue_bucket
ORDER BY MIN(DATEDIFF(CURDATE(), rs.due_date));

-- 5. Real-time Collection Dashboard Stats
SELECT 
    (SELECT COUNT(*) FROM loans WHERE status = 'Active') as active_loans,
    (SELECT SUM(amount) FROM repayment_schedule rs JOIN loans l ON l.loan_id = rs.loan_id WHERE DATE(rs.due_date) = CURDATE() AND l.status = 'Active') as today_demand,
    (SELECT SUM(amount) FROM repayment_schedule rs JOIN loans l ON l.loan_id = rs.loan_id WHERE DATE(rs.due_date) = CURDATE() AND rs.status = 'Paid' AND l.status = 'Active') as today_collection,
    (SELECT COUNT(*) FROM repayment_schedule rs JOIN loans l ON l.loan_id = rs.loan_id WHERE rs.status IN ('Pending', 'Overdue') AND rs.due_date < CURDATE() AND l.status = 'Active') as overdue_count,
    (SELECT SUM(amount) FROM repayment_schedule rs JOIN loans l ON l.loan_id = rs.loan_id WHERE rs.status IN ('Pending', 'Overdue') AND rs.due_date < CURDATE() AND l.status = 'Active') as overdue_amount;