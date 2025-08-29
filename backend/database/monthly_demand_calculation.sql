-- Monthly Collection Demand Calculation from EMI Schedule

-- Calculate month-wise demand for March to October 2025
SELECT 
    DATE_FORMAT(rs.due_date, '%M %Y') as month,
    DATE_FORMAT(rs.due_date, '%Y-%m') as month_key,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as total_demand,
    SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collected,
    SUM(CASE WHEN rs.status != 'Paid' THEN rs.amount ELSE 0 END) as pending,
    ROUND(AVG(rs.amount), 2) as avg_emi_amount,
    ROUND((SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) / SUM(rs.amount)) * 100, 2) as collection_percentage
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE rs.due_date >= '2025-03-01' 
AND rs.due_date <= '2025-10-31'
AND l.status = 'Active'
GROUP BY DATE_FORMAT(rs.due_date, '%Y-%m'), DATE_FORMAT(rs.due_date, '%M %Y')
ORDER BY month_key;

-- Detailed breakdown by month for specific months
SELECT 
    'March 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 3 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'April 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 4 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'May 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 5 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'June 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 6 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'July 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 7 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'August 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 8 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'September 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 9 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active'

UNION ALL

SELECT 
    'October 2025' as month,
    COUNT(*) as total_emis,
    COUNT(DISTINCT rs.loan_id) as unique_loans,
    SUM(rs.amount) as demand
FROM repayment_schedule rs
JOIN loans l ON l.loan_id = rs.loan_id
WHERE MONTH(rs.due_date) = 10 AND YEAR(rs.due_date) = 2025
AND l.status = 'Active';