-- ==============================================================================
-- LedgeX Demo Data Seed Script
-- Target User: nishka@ledgex.demo (Nishka Shah)
-- Description: Populates a realistic 6-month financial portfolio including
--              transactions, budgets, savings goals, and subscriptions.
-- Safety: Uses dynamic user ID lookup and safely cleans existing user data 
--         before inserting to ensure the script is safely re-runnable.
-- ==============================================================================

-- 1. Identify Target User
SET @user_email = 'nishka@ledgex.demo';
SET @user_id = (
    SELECT id
    FROM users
    WHERE email = @user_email
    LIMIT 1
);

-- Safely exit if user does not exist (Prevents errors if run on empty DB)
-- If using a client that supports it, but standard MySQL will just set @user_id to NULL.
-- The subsequent DELETE and INSERT statements will naturally fail/do nothing if @user_id is NULL, 
-- but to avoid constraint failures on INSERT, ensure the user exists before running.

-- Clean up existing data for this specific user to make script safely re-runnable
DELETE FROM transactions WHERE user_id = @user_id;
DELETE FROM budgets WHERE user_id = @user_id;
DELETE FROM savings_goals WHERE user_id = @user_id;
DELETE FROM subscriptions WHERE user_id = @user_id;

-- ==============================================================================
-- 2. TRANSACTIONS (January 2026 - June 2026)
-- ==============================================================================

INSERT INTO transactions (user_id, title, description, amount, type, category, transaction_date, created_at, updated_at) VALUES
-- JANUARY 2026 (Baseline Month)
(@user_id, 'Monthly Salary', 'TechCorp Inc.', 52000.00, 'INCOME', 'Salary', '2026-01-01', NOW(), NOW()),
(@user_id, 'Swiggy', 'Dinner delivery', 1250.00, 'EXPENSE', 'Food', '2026-01-04', NOW(), NOW()),
(@user_id, 'Amazon', 'Household items', 3450.00, 'EXPENSE', 'Shopping', '2026-01-08', NOW(), NOW()),
(@user_id, 'Uber', 'Office commute', 450.00, 'EXPENSE', 'Transport', '2026-01-12', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 2150.00, 'EXPENSE', 'Utilities', '2026-01-15', NOW(), NOW()),
(@user_id, 'Netflix', 'Monthly subscription', 649.00, 'EXPENSE', 'Entertainment', '2026-01-18', NOW(), NOW()),
(@user_id, 'Pharmacy', 'Medicines', 850.00, 'EXPENSE', 'Healthcare', '2026-01-20', NOW(), NOW()),
(@user_id, 'Zomato', 'Weekend lunch', 950.00, 'EXPENSE', 'Food', '2026-01-25', NOW(), NOW()),
(@user_id, 'Ola', 'Weekend travel', 320.00, 'EXPENSE', 'Transport', '2026-01-28', NOW(), NOW()),
(@user_id, 'Blinkit', 'Quick groceries', 600.00, 'EXPENSE', 'Food', '2026-01-30', NOW(), NOW()),

-- FEBRUARY 2026 (Shopping Spike)
(@user_id, 'Monthly Salary', 'TechCorp Inc.', 52000.00, 'INCOME', 'Salary', '2026-02-01', NOW(), NOW()),
(@user_id, 'Myntra', 'Wardrobe upgrade', 6500.00, 'EXPENSE', 'Shopping', '2026-02-05', NOW(), NOW()),
(@user_id, 'Amazon', 'Electronics', 4200.00, 'EXPENSE', 'Shopping', '2026-02-10', NOW(), NOW()),
(@user_id, 'Swiggy', 'Late night food', 800.00, 'EXPENSE', 'Food', '2026-02-14', NOW(), NOW()),
(@user_id, 'Uber', 'Office commute', 600.00, 'EXPENSE', 'Transport', '2026-02-17', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 1950.00, 'EXPENSE', 'Utilities', '2026-02-18', NOW(), NOW()),
(@user_id, 'Spotify Premium', 'Music subscription', 119.00, 'EXPENSE', 'Entertainment', '2026-02-21', NOW(), NOW()),
(@user_id, 'Grocery Store', 'Monthly supplies', 3100.00, 'EXPENSE', 'Food', '2026-02-25', NOW(), NOW()),

-- MARCH 2026 (Food Overspend)
(@user_id, 'Monthly Salary', 'TechCorp Inc. - Appraised', 54000.00, 'INCOME', 'Salary', '2026-03-01', NOW(), NOW()),
(@user_id, 'Zomato', 'Team lunch', 1550.00, 'EXPENSE', 'Food', '2026-03-03', NOW(), NOW()),
(@user_id, 'Swiggy', 'Dinner delivery', 2100.00, 'EXPENSE', 'Food', '2026-03-07', NOW(), NOW()),
(@user_id, 'Blinkit', 'Snacks', 1850.00, 'EXPENSE', 'Food', '2026-03-12', NOW(), NOW()),
(@user_id, 'Grocery Store', 'Monthly supplies', 4500.00, 'EXPENSE', 'Food', '2026-03-15', NOW(), NOW()),
(@user_id, 'Uber', 'Travel to event', 800.00, 'EXPENSE', 'Transport', '2026-03-18', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 2300.00, 'EXPENSE', 'Utilities', '2026-03-20', NOW(), NOW()),
(@user_id, 'Pharmacy', 'Checkup meds', 1200.00, 'EXPENSE', 'Healthcare', '2026-03-28', NOW(), NOW()),
(@user_id, 'Bank Interest', 'Q1 Interest', 1250.00, 'INCOME', 'Interest', '2026-03-31', NOW(), NOW()),

-- APRIL 2026 (Stable Month)
(@user_id, 'Monthly Salary', 'TechCorp Inc.', 54000.00, 'INCOME', 'Salary', '2026-04-01', NOW(), NOW()),
(@user_id, 'Netflix', 'Monthly subscription', 649.00, 'EXPENSE', 'Entertainment', '2026-04-04', NOW(), NOW()),
(@user_id, 'Amazon', 'Books', 2150.00, 'EXPENSE', 'Shopping', '2026-04-09', NOW(), NOW()),
(@user_id, 'Swiggy', 'Weekend food', 1100.00, 'EXPENSE', 'Food', '2026-04-12', NOW(), NOW()),
(@user_id, 'Petrol Station', 'Car fuel', 3000.00, 'EXPENSE', 'Transport', '2026-04-15', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 2850.00, 'EXPENSE', 'Utilities', '2026-04-20', NOW(), NOW()),
(@user_id, 'Grocery Store', 'Monthly supplies', 3200.00, 'EXPENSE', 'Food', '2026-04-25', NOW(), NOW()),

-- MAY 2026 (High Transport Costs)
(@user_id, 'Monthly Salary', 'TechCorp Inc.', 56000.00, 'INCOME', 'Salary', '2026-05-01', NOW(), NOW()),
(@user_id, 'Uber', 'Airport drop', 2550.00, 'EXPENSE', 'Transport', '2026-05-03', NOW(), NOW()),
(@user_id, 'Ola', 'Outstation travel', 1800.00, 'EXPENSE', 'Transport', '2026-05-08', NOW(), NOW()),
(@user_id, 'Petrol Station', 'Road trip fuel', 4500.00, 'EXPENSE', 'Transport', '2026-05-15', NOW(), NOW()),
(@user_id, 'Zomato', 'Lunch', 1350.00, 'EXPENSE', 'Food', '2026-05-18', NOW(), NOW()),
(@user_id, 'Swiggy', 'Dinner', 1450.00, 'EXPENSE', 'Food', '2026-05-22', NOW(), NOW()),
(@user_id, 'Amazon', 'Travel gear', 1550.00, 'EXPENSE', 'Shopping', '2026-05-26', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 3100.00, 'EXPENSE', 'Utilities', '2026-05-29', NOW(), NOW()),
(@user_id, 'Dividend Credit', 'Tech Stock Dividend', 4500.00, 'INCOME', 'Dividend', '2026-05-30', NOW(), NOW()),

-- JUNE 2026 (Recent Month)
(@user_id, 'Monthly Salary', 'TechCorp Inc.', 58000.00, 'INCOME', 'Salary', '2026-06-01', NOW(), NOW()),
(@user_id, 'Netflix', 'Monthly subscription', 649.00, 'EXPENSE', 'Entertainment', '2026-06-02', NOW(), NOW()),
(@user_id, 'Swiggy', 'Lunch delivery', 1250.00, 'EXPENSE', 'Food', '2026-06-06', NOW(), NOW()),
(@user_id, 'Grocery Store', 'Monthly supplies', 3800.00, 'EXPENSE', 'Food', '2026-06-10', NOW(), NOW()),
(@user_id, 'Myntra', 'Summer clothes', 2450.00, 'EXPENSE', 'Shopping', '2026-06-14', NOW(), NOW()),
(@user_id, 'Petrol Station', 'Car fuel', 2500.00, 'EXPENSE', 'Transport', '2026-06-18', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 3550.00, 'EXPENSE', 'Utilities', '2026-06-22', NOW(), NOW()),
(@user_id, 'Pharmacy', 'Supplements', 650.00, 'EXPENSE', 'Healthcare', '2026-06-28', NOW(), NOW()),
(@user_id, 'Freelance Payment', 'Web Design Project', 15000.00, 'INCOME', 'Freelance', '2026-06-30', NOW(), NOW()),

(@user_id, 'Monthly Salary', 'TechCorp Inc.', 58000.00, 'INCOME', 'Salary', '2026-07-01', NOW(), NOW()),
(@user_id, 'Netflix', 'Monthly subscription', 649.00, 'EXPENSE', 'Entertainment', '2026-07-02', NOW(), NOW()),
(@user_id, 'Amazon', 'Home decor', 3100.00, 'EXPENSE', 'Shopping', '2026-07-04', NOW(), NOW()),
(@user_id, 'Swiggy', 'Dinner delivery', 1450.00, 'EXPENSE', 'Food', '2026-07-07', NOW(), NOW()),
(@user_id, 'Electricity Bill', 'Monthly utility', 3800.00, 'EXPENSE', 'Utilities', '2026-07-09', NOW(), NOW()),
(@user_id, 'Uber', 'Office commute', 550.00, 'EXPENSE', 'Transport', '2026-07-11', NOW(), NOW()),
(@user_id, 'Grocery Store', 'Monthly supplies', 4100.00, 'EXPENSE', 'Food', '2026-07-14', NOW(), NOW());


-- ==============================================================================
-- 3. BUDGETS (January 2026 - June 2026)
-- ==============================================================================

-- We use INSERT IGNORE to safely handle the unique constraints (user_id, category, month, year)
-- just in case the previous DELETE didn't run or this part is executed independently.
INSERT IGNORE INTO budgets (user_id, category, monthly_limit, month, year, created_at, updated_at) VALUES
-- JAN
(@user_id, 'Food', 8000.00, 1, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 5000.00, 1, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2000.00, 1, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 3000.00, 1, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4000.00, 1, 2026, NOW(), NOW()),
(@user_id, 'H-- JULY 2026 (Current Month)
ealthcare', 2000.00, 1, 2026, NOW(), NOW()),

-- FEB
(@user_id, 'Food', 8000.00, 2, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 5000.00, 2, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2000.00, 2, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 3000.00, 2, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4000.00, 2, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2000.00, 2, 2026, NOW(), NOW()),

-- MAR
(@user_id, 'Food', 8500.00, 3, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 5500.00, 3, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2500.00, 3, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 3500.00, 3, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4000.00, 3, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2000.00, 3, 2026, NOW(), NOW()),

-- APR
(@user_id, 'Food', 8500.00, 4, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 5000.00, 4, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2000.00, 4, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 3500.00, 4, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4500.00, 4, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2000.00, 4, 2026, NOW(), NOW()),

-- MAY
(@user_id, 'Food', 8500.00, 5, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 6000.00, 5, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2500.00, 5, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 4000.00, 5, 2026, NOW(), NOW()),
(@user_id, 'Transport', 5000.00, 5, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2000.00, 5, 2026, NOW(), NOW()),

-- JUN
(@user_id, 'Food', 9000.00, 6, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 6000.00, 6, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 2500.00, 6, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 4500.00, 6, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4500.00, 6, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2000.00, 6, 2026, NOW(), NOW()),

-- JUL
(@user_id, 'Food', 9500.00, 7, 2026, NOW(), NOW()),
(@user_id, 'Shopping', 6000.00, 7, 2026, NOW(), NOW()),
(@user_id, 'Entertainment', 3000.00, 7, 2026, NOW(), NOW()),
(@user_id, 'Utilities', 4500.00, 7, 2026, NOW(), NOW()),
(@user_id, 'Transport', 4500.00, 7, 2026, NOW(), NOW()),
(@user_id, 'Healthcare', 2500.00, 7, 2026, NOW(), NOW());


-- ==============================================================================
-- 4. SAVINGS GOALS (5 Realistic Goals)
-- ==============================================================================

INSERT INTO savings_goals (user_id, name, target_amount, saved_amount, target_date, status, created_at, updated_at) VALUES
-- 2 Completed
(@user_id, 'Emergency Fund', 150000.00, 150000.00, '2026-03-01', 'COMPLETED', NOW(), NOW()),
(@user_id, 'New Laptop', 80000.00, 80000.00, '2026-05-15', 'COMPLETED', NOW(), NOW()),
-- 1 Nearly Complete (In Progress)
(@user_id, 'New Phone', 60000.00, 55000.00, '2026-08-01', 'IN_PROGRESS', NOW(), NOW()),
-- 1 In Progress (Long Term)
(@user_id, 'Europe Trip', 200000.00, 85000.00, '2027-05-01', 'IN_PROGRESS', NOW(), NOW()),
-- 1 Cancelled
(@user_id, 'Mutual Fund Investment', 50000.00, 10000.00, '2026-12-01', 'CANCELLED', NOW(), NOW());


-- ==============================================================================
-- 5. SUBSCRIPTIONS (8 Subscriptions, Mixed Cycles, 1 Inactive)
-- ==============================================================================

INSERT INTO subscriptions (user_id, name, amount, billing_cycle, category, next_billing_date, is_active, created_at, updated_at) VALUES
(@user_id, 'Netflix', 649.00, 'MONTHLY', 'Entertainment', DATE_ADD(CURRENT_DATE, INTERVAL 10 DAY), 1, NOW(), NOW()),
(@user_id, 'Spotify Premium', 119.00, 'MONTHLY', 'Entertainment', DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 1, NOW(), NOW()),
(@user_id, 'YouTube Premium', 129.00, 'MONTHLY', 'Entertainment', DATE_ADD(CURRENT_DATE, INTERVAL 22 DAY), 1, NOW(), NOW()),
(@user_id, 'ChatGPT Plus', 1950.00, 'MONTHLY', 'Utilities', DATE_ADD(CURRENT_DATE, INTERVAL 5 DAY), 1, NOW(), NOW()),
(@user_id, 'Google One', 1300.00, 'YEARLY', 'Utilities', '2026-11-15', 1, NOW(), NOW()),
(@user_id, 'Amazon Prime', 1499.00, 'YEARLY', 'Shopping', '2026-09-01', 1, NOW(), NOW()),
(@user_id, 'Canva Pro', 3999.00, 'YEARLY', 'Utilities', '2027-01-10', 1, NOW(), NOW()),
(@user_id, 'Apple Music', 99.00, 'MONTHLY', 'Entertainment', '2026-02-14', 0, NOW(), NOW()); -- Inactive subscription

-- ==============================================================================
-- End of Seed Script
-- ==============================================================================
