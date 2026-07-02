-- LedgeX Demo Data Seed Script
-- Safe to run multiple times. Inserts missing data for john@example.com

SET @user_email = 'john@example.com';

-- --------------------------------------------------------
-- 1. Savings Goals
-- --------------------------------------------------------

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'New Car', 1500000.00, 250000.00, '2026-12-31', 'IN_PROGRESS'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'New Car'
);

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'Emergency Fund', 500000.00, 500000.00, '2025-01-01', 'COMPLETED'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'Emergency Fund'
);

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'Europe Trip', 300000.00, 120000.00, '2026-10-15', 'IN_PROGRESS'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'Europe Trip'
);

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'Laptop Upgrade', 120000.00, 120000.00, '2026-05-20', 'COMPLETED'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'Laptop Upgrade'
);

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'Home Downpayment', 2500000.00, 550000.00, '2028-06-01', 'IN_PROGRESS'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'Home Downpayment'
);

INSERT INTO savings_goals (created_at, updated_at, user_id, name, target_amount, saved_amount, target_date, status)
SELECT NOW(), NOW(), u.id, 'Diwali Shopping', 50000.00, 15000.00, '2026-10-31', 'IN_PROGRESS'
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM savings_goals sg WHERE sg.user_id = u.id AND sg.name = 'Diwali Shopping'
);


-- --------------------------------------------------------
-- 2. Subscriptions
-- --------------------------------------------------------

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Netflix', 499.00, 'MONTHLY', 'Entertainment', '2026-07-15', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Netflix'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Spotify Premium', 119.00, 'MONTHLY', 'Entertainment', '2026-07-05', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Spotify Premium'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Amazon Prime', 1499.00, 'YEARLY', 'Shopping', '2026-11-20', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Amazon Prime'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Gym Membership', 12000.00, 'YEARLY', 'Health', '2027-01-01', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Gym Membership'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'ChatGPT Plus', 1650.00, 'MONTHLY', 'Software', '2026-07-12', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'ChatGPT Plus'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Zomato Gold', 499.00, 'YEARLY', 'Food', '2027-03-15', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Zomato Gold'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Adobe Creative Cloud', 4500.00, 'MONTHLY', 'Software', '2026-07-28', false
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Adobe Creative Cloud'
);

INSERT INTO subscriptions (created_at, updated_at, user_id, name, amount, billing_cycle, category, next_billing_date, is_active)
SELECT NOW(), NOW(), u.id, 'Times of India', 99.00, 'MONTHLY', 'News', '2026-07-10', true
FROM users u
WHERE u.email = @user_email AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.name = 'Times of India'
);
