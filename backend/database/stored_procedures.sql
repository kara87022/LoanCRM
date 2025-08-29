-- Stored Procedures for Mini-Business Loan CRM

DELIMITER $$

-- 1. Create Loan with Auto EMI Generation
CREATE PROCEDURE create_minibusiness_loan (
    IN p_loan_id VARCHAR(20),
    IN p_customer_id INT,
    IN p_customer_name VARCHAR(100),
    IN p_loan_amount DECIMAL(15,2),
    IN p_disbursement_date DATE,
    IN p_branch VARCHAR(50),
    IN p_sourced_by VARCHAR(100)
)
BEGIN
    DECLARE v_total_repayment DECIMAL(15,2);
    DECLARE v_emi_amount DECIMAL(15,2);
    DECLARE v_interest_earned DECIMAL(15,2);
    DECLARE i INT DEFAULT 1;

    -- Calculate amounts (20% flat interest)
    SET v_interest_earned = p_loan_amount * 0.20;
    SET v_total_repayment = p_loan_amount + v_interest_earned;
    SET v_emi_amount = v_total_repayment / 14;

    -- Insert Loan Master record
    INSERT INTO loans (
        loan_id, customer_id, customer_name, loan_amount, 
        date_of_disbursement, repayment_amount, interest_earned,
        installment_amount, branch, sourced_by
    ) VALUES (
        p_loan_id, p_customer_id, p_customer_name, p_loan_amount,
        p_disbursement_date, v_total_repayment, v_interest_earned,
        v_emi_amount, p_branch, p_sourced_by
    );

    -- Generate 14 EMI records (every 7 days)
    WHILE i <= 14 DO
        INSERT INTO repayment_schedule (loan_id, installment_number, due_date, amount)
        VALUES (p_loan_id, i, DATE_ADD(p_disbursement_date, INTERVAL (7*i) DAY), v_emi_amount);
        SET i = i + 1;
    END WHILE;

END$$

-- 2. Record Payment
CREATE PROCEDURE record_payment (
    IN p_loan_id VARCHAR(20),
    IN p_installment_id INT,
    IN p_amount DECIMAL(15,2),
    IN p_payment_method VARCHAR(20),
    IN p_payment_date DATE,
    IN p_collected_by VARCHAR(100)
)
BEGIN
    -- Insert payment record
    INSERT INTO payments (loan_id, installment_id, amount, payment_method, payment_date, collected_by)
    VALUES (p_loan_id, p_installment_id, p_amount, p_payment_method, p_payment_date, p_collected_by);
    
    -- Update installment status
    UPDATE repayment_schedule 
    SET status = 'Paid', payment_date = p_payment_date
    WHERE schedule_id = p_installment_id;
    
END$$

-- 3. Update Overdue Status (Daily Job)
CREATE PROCEDURE update_overdue_status()
BEGIN
    UPDATE repayment_schedule 
    SET 
        status = 'Overdue',
        days_overdue = DATEDIFF(CURDATE(), due_date)
    WHERE status = 'Pending' 
    AND due_date < CURDATE();
END$$

-- 4. Get Collection Dashboard Data
CREATE PROCEDURE get_collection_dashboard(
    IN p_date DATE
)
BEGIN
    SELECT 
        rs.loan_id,
        l.customer_name,
        rs.installment_number,
        rs.due_date,
        rs.amount,
        rs.status,
        CASE 
            WHEN rs.due_date < p_date AND rs.status = 'Pending' THEN DATEDIFF(p_date, rs.due_date)
            ELSE 0 
        END as days_overdue
    FROM repayment_schedule rs
    JOIN loans l ON l.loan_id = rs.loan_id
    WHERE l.status = 'Active'
    AND rs.due_date <= p_date
    ORDER BY rs.due_date ASC;
END$$

-- 5. Get Monthly Collection Stats
CREATE PROCEDURE get_monthly_collections(
    IN p_year INT,
    IN p_month INT
)
BEGIN
    SELECT 
        DATE_FORMAT(rs.due_date, '%Y-%m') as month,
        SUM(rs.amount) as target,
        SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) as collected,
        SUM(CASE WHEN rs.status != 'Paid' THEN rs.amount ELSE 0 END) as pending,
        ROUND((SUM(CASE WHEN rs.status = 'Paid' THEN rs.amount ELSE 0 END) / SUM(rs.amount)) * 100, 2) as collection_percentage
    FROM repayment_schedule rs
    JOIN loans l ON l.loan_id = rs.loan_id
    WHERE YEAR(rs.due_date) = p_year 
    AND MONTH(rs.due_date) = p_month
    AND l.status = 'Active'
    GROUP BY DATE_FORMAT(rs.due_date, '%Y-%m');
END$$

DELIMITER ;