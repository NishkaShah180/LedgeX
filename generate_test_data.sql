-- Setup user variable
SET @user_email = 'john@example.com';
SET @user_id = (SELECT id FROM users WHERE email = @user_email LIMIT 1);

-- Optionally, you can wrap this in a transaction
START TRANSACTION;

-- Delete existing data for this user to avoid duplicates if run multiple times (optional, uncomment if needed)
-- DELETE FROM transactions WHERE user_id = @user_id;
-- DELETE FROM budgets WHERE user_id = @user_id;

-- ==========================================
-- TRANSACTIONS: Jan 2026 to June 2026
-- ==========================================

-- Jan 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 52000.00, 'INCOME', 'Salary', '2026-01-01', @user_id, NOW(), NOW()),
('Swiggy', 'Lunch', 3200.00, 'EXPENSE', 'Food', '2026-01-05', @user_id, NOW(), NOW()),
('Myntra', 'Clothes', 4800.00, 'EXPENSE', 'Shopping', '2026-01-10', @user_id, NOW(), NOW()),
('Movie Night', 'Tickets and snacks', 1500.00, 'EXPENSE', 'Entertainment', '2026-01-12', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2200.00, 'EXPENSE', 'Utilities', '2026-01-15', @user_id, NOW(), NOW()),
('Uber', 'Cab to office', 1800.00, 'EXPENSE', 'Transport', '2026-01-20', @user_id, NOW(), NOW()),
('Pharmacy', 'Medicines', 800.00, 'EXPENSE', 'Healthcare', '2026-01-25', @user_id, NOW(), NOW()),
('Grocery', 'Monthly groceries', 4500.00, 'EXPENSE', 'Food', '2026-01-28', @user_id, NOW(), NOW());

-- Feb 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 52000.00, 'INCOME', 'Salary', '2026-02-01', @user_id, NOW(), NOW()),
('Zomato', 'Dinner delivery', 2500.00, 'EXPENSE', 'Food', '2026-02-04', @user_id, NOW(), NOW()),
('Amazon', 'Electronics', 3100.00, 'EXPENSE', 'Shopping', '2026-02-09', @user_id, NOW(), NOW()),
('Concert', 'Weekend event', 2000.00, 'EXPENSE', 'Entertainment', '2026-02-14', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2100.00, 'EXPENSE', 'Utilities', '2026-02-16', @user_id, NOW(), NOW()),
('Petrol', 'Fuel for car', 2000.00, 'EXPENSE', 'Transport', '2026-02-22', @user_id, NOW(), NOW()),
('Grocery', 'Weekly groceries', 3800.00, 'EXPENSE', 'Food', '2026-02-26', @user_id, NOW(), NOW());

-- March 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 52000.00, 'INCOME', 'Salary', '2026-03-01', @user_id, NOW(), NOW()),
('Swiggy', 'Office lunch', 3500.00, 'EXPENSE', 'Food', '2026-03-05', @user_id, NOW(), NOW()),
('Zara', 'Summer clothes', 5500.00, 'EXPENSE', 'Shopping', '2026-03-11', @user_id, NOW(), NOW()),
('Movie Night', 'Weekend movie', 1200.00, 'EXPENSE', 'Entertainment', '2026-03-15', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2300.00, 'EXPENSE', 'Utilities', '2026-03-18', @user_id, NOW(), NOW()),
('Uber', 'Weekend travel', 1600.00, 'EXPENSE', 'Transport', '2026-03-21', @user_id, NOW(), NOW()),
('Pharmacy', 'First aid supplies', 600.00, 'EXPENSE', 'Healthcare', '2026-03-24', @user_id, NOW(), NOW()),
('Grocery', 'Monthly stock up', 4200.00, 'EXPENSE', 'Food', '2026-03-29', @user_id, NOW(), NOW());

-- April 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 55000.00, 'INCOME', 'Salary', '2026-04-01', @user_id, NOW(), NOW()),
('Zomato', 'Pizza delivery', 2800.00, 'EXPENSE', 'Food', '2026-04-06', @user_id, NOW(), NOW()),
('Myntra', 'Shoes', 4000.00, 'EXPENSE', 'Shopping', '2026-04-12', @user_id, NOW(), NOW()),
('Gaming', 'Game purchase', 1800.00, 'EXPENSE', 'Entertainment', '2026-04-16', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2500.00, 'EXPENSE', 'Utilities', '2026-04-18', @user_id, NOW(), NOW()),
('Petrol', 'Fuel for bike', 2200.00, 'EXPENSE', 'Transport', '2026-04-20', @user_id, NOW(), NOW()),
('Grocery', 'Fresh vegetables', 4700.00, 'EXPENSE', 'Food', '2026-04-27', @user_id, NOW(), NOW());

-- May 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 55000.00, 'INCOME', 'Salary', '2026-05-01', @user_id, NOW(), NOW()),
('Swiggy', 'Burger', 3400.00, 'EXPENSE', 'Food', '2026-05-04', @user_id, NOW(), NOW()),
('Amazon', 'Home decor', 3600.00, 'EXPENSE', 'Shopping', '2026-05-10', @user_id, NOW(), NOW()),
('Movie Night', 'Latest release', 1600.00, 'EXPENSE', 'Entertainment', '2026-05-14', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2600.00, 'EXPENSE', 'Utilities', '2026-05-17', @user_id, NOW(), NOW()),
('Uber', 'Airport transfer', 1900.00, 'EXPENSE', 'Transport', '2026-05-22', @user_id, NOW(), NOW()),
('Pharmacy', 'Health check', 950.00, 'EXPENSE', 'Healthcare', '2026-05-25', @user_id, NOW(), NOW()),
('Grocery', 'Monthly supplies', 4100.00, 'EXPENSE', 'Food', '2026-05-28', @user_id, NOW(), NOW());

-- June 2026
INSERT INTO transactions (title, description, amount, type, category, transaction_date, user_id, created_at, updated_at) VALUES
('Salary', 'Monthly Salary', 55000.00, 'INCOME', 'Salary', '2026-06-01', @user_id, NOW(), NOW()),
('Zomato', 'Biryani', 3000.00, 'EXPENSE', 'Food', '2026-06-05', @user_id, NOW(), NOW()),
('Myntra', 'Accessories', 5200.00, 'EXPENSE', 'Shopping', '2026-06-11', @user_id, NOW(), NOW()),
('Netflix', 'Monthly subscription', 1000.00, 'EXPENSE', 'Entertainment', '2026-06-13', @user_id, NOW(), NOW()),
('Electricity Bill', 'Monthly electricity bill', 2800.00, 'EXPENSE', 'Utilities', '2026-06-16', @user_id, NOW(), NOW()),
('Petrol', 'Fuel for car', 2100.00, 'EXPENSE', 'Transport', '2026-06-21', @user_id, NOW(), NOW()),
('Grocery', 'Weekly top-up', 4400.00, 'EXPENSE', 'Food', '2026-06-26', @user_id, NOW(), NOW());

-- ==========================================
-- BUDGETS: Jan 2026 to June 2026
-- ==========================================

-- Jan 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 5000.00, 1, 2026, @user_id, NOW(), NOW()),
('Shopping', 6000.00, 1, 2026, @user_id, NOW(), NOW()),
('Entertainment', 2000.00, 1, 2026, @user_id, NOW(), NOW()),
('Utilities', 3000.00, 1, 2026, @user_id, NOW(), NOW()),
('Transport', 2500.00, 1, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1500.00, 1, 2026, @user_id, NOW(), NOW());

-- Feb 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 5200.00, 2, 2026, @user_id, NOW(), NOW()),
('Shopping', 6500.00, 2, 2026, @user_id, NOW(), NOW()),
('Entertainment', 2000.00, 2, 2026, @user_id, NOW(), NOW()),
('Utilities', 3200.00, 2, 2026, @user_id, NOW(), NOW()),
('Transport', 2700.00, 2, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1500.00, 2, 2026, @user_id, NOW(), NOW());

-- March 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 5500.00, 3, 2026, @user_id, NOW(), NOW()),
('Shopping', 6200.00, 3, 2026, @user_id, NOW(), NOW()),
('Entertainment', 1500.00, 3, 2026, @user_id, NOW(), NOW()),
('Utilities', 3100.00, 3, 2026, @user_id, NOW(), NOW()),
('Transport', 2400.00, 3, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1800.00, 3, 2026, @user_id, NOW(), NOW());

-- April 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 4800.00, 4, 2026, @user_id, NOW(), NOW()),
('Shopping', 5800.00, 4, 2026, @user_id, NOW(), NOW()),
('Entertainment', 2200.00, 4, 2026, @user_id, NOW(), NOW()),
('Utilities', 3500.00, 4, 2026, @user_id, NOW(), NOW()),
('Transport', 2600.00, 4, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1200.00, 4, 2026, @user_id, NOW(), NOW());

-- May 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 5100.00, 5, 2026, @user_id, NOW(), NOW()),
('Shopping', 5500.00, 5, 2026, @user_id, NOW(), NOW()),
('Entertainment', 2500.00, 5, 2026, @user_id, NOW(), NOW()),
('Utilities', 3300.00, 5, 2026, @user_id, NOW(), NOW()),
('Transport', 2800.00, 5, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1600.00, 5, 2026, @user_id, NOW(), NOW());

-- June 2026
INSERT IGNORE INTO budgets (category, monthly_limit, month, year, user_id, created_at, updated_at) VALUES
('Food', 5000.00, 6, 2026, @user_id, NOW(), NOW()),
('Shopping', 6000.00, 6, 2026, @user_id, NOW(), NOW()),
('Entertainment', 2000.00, 6, 2026, @user_id, NOW(), NOW()),
('Utilities', 3000.00, 6, 2026, @user_id, NOW(), NOW()),
('Transport', 2500.00, 6, 2026, @user_id, NOW(), NOW()),
('Healthcare', 1500.00, 6, 2026, @user_id, NOW(), NOW());

COMMIT;
