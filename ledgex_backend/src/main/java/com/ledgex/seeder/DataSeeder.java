package com.ledgex.seeder;

import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.budget.entity.Budget;
import com.ledgex.budget.repository.BudgetRepository;
import com.ledgex.savings.entity.SavingsGoal;
import com.ledgex.savings.enums.SavingsGoalStatus;
import com.ledgex.savings.repository.SavingsGoalRepository;
import com.ledgex.subscription.entity.Subscription;
import com.ledgex.subscription.enums.BillingCycle;
import com.ledgex.subscription.repository.SubscriptionRepository;
import com.ledgex.transaction.entity.Transaction;
import com.ledgex.transaction.enums.TransactionType;
import com.ledgex.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.seeder.enabled", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String DEFAULT_PASSWORD = "password123";

    @Override
    @Transactional
    public void run(String... args) {
        log.info("--- DataSeeder Started ---");
        
        List<User> users = seedUsers();
        if (!users.isEmpty()) {
            User demoUser = users.get(0);

            log.info("Clearing old demo data for user: {}", demoUser.getEmail());
            transactionRepository.deleteByUserId(demoUser.getId());
            budgetRepository.deleteByUserId(demoUser.getId());
            savingsGoalRepository.deleteByUserId(demoUser.getId());
            subscriptionRepository.deleteByUserId(demoUser.getId());

            seedTransactions(demoUser);
            seedBudgets(demoUser);
            seedSavingsGoals(demoUser);
            seedSubscriptions(demoUser);
        } else {
            log.warn("No users available to seed related entities. Did user seeding fail?");
        }
        
        log.info("--- DataSeeder Completed ---");
        log.info("Demo Login Credentials:");
        log.info("Email: admin@ledgex.local | Password: {}", DEFAULT_PASSWORD);
        log.info("Email: demo@ledgex.local | Password: {}", DEFAULT_PASSWORD);
        log.info("Email: demo2@ledgex.local | Password: {}", DEFAULT_PASSWORD);
    }

    private List<User> seedUsers() {
        if (userRepository.count() > 0) {
            log.info("Users already exist. Skipping user seeding.");
            return userRepository.findAll();
        }

        log.info("Seeding users...");
        List<User> users = new ArrayList<>();
        
        users.add(User.builder()
                .firstName("Admin")
                .lastName("User")
                .email("admin@ledgex.local")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .build());

        users.add(User.builder()
                .firstName("Demo")
                .lastName("User")
                .email("demo@ledgex.local")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .build());

        users.add(User.builder()
                .firstName("Second")
                .lastName("Demo")
                .email("demo2@ledgex.local")
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .build());

        return userRepository.saveAll(users);
    }

    private void seedTransactions(User user) {


        log.info("Seeding realistic transactions for user: {}", user.getEmail());
        List<Transaction> transactions = new ArrayList<>();

        // Helper method to add transactions cleanly
        // Using approximate days ago to simulate Jan - July spread
        
        // Month 6 (approx 180 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 65000.00, TransactionType.INCOME, "Salary", 180);
        addTx(transactions, user, "Swiggy", "Dinner delivery", 1250.00, TransactionType.EXPENSE, "Food", 177);
        addTx(transactions, user, "Amazon", "Household items", 3450.00, TransactionType.EXPENSE, "Shopping", 173);
        addTx(transactions, user, "Uber", "Office commute", 450.00, TransactionType.EXPENSE, "Transport", 169);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 2150.00, TransactionType.EXPENSE, "Utilities", 166);
        addTx(transactions, user, "Netflix", "Monthly subscription", 649.00, TransactionType.EXPENSE, "Entertainment", 163);
        addTx(transactions, user, "Pharmacy", "Medicines", 850.00, TransactionType.EXPENSE, "Healthcare", 161);
        addTx(transactions, user, "Zomato", "Weekend lunch", 950.00, TransactionType.EXPENSE, "Food", 156);
        addTx(transactions, user, "Ola", "Weekend travel", 320.00, TransactionType.EXPENSE, "Transport", 153);
        addTx(transactions, user, "Blinkit", "Quick groceries", 600.00, TransactionType.EXPENSE, "Food", 151);

        // Month 5 (approx 150 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 68000.00, TransactionType.INCOME, "Salary", 150);
        addTx(transactions, user, "Myntra", "Wardrobe upgrade", 6500.00, TransactionType.EXPENSE, "Shopping", 146);
        addTx(transactions, user, "Amazon", "Electronics", 4200.00, TransactionType.EXPENSE, "Shopping", 141);
        addTx(transactions, user, "Swiggy", "Late night food", 800.00, TransactionType.EXPENSE, "Food", 137);
        addTx(transactions, user, "Uber", "Office commute", 600.00, TransactionType.EXPENSE, "Transport", 134);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 1950.00, TransactionType.EXPENSE, "Utilities", 133);
        addTx(transactions, user, "Spotify Premium", "Music subscription", 119.00, TransactionType.EXPENSE, "Entertainment", 130);
        addTx(transactions, user, "Grocery Store", "Monthly supplies", 3100.00, TransactionType.EXPENSE, "Food", 126);

        // Month 4 (approx 120 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc. - Appraised", 70000.00, TransactionType.INCOME, "Salary", 120);
        addTx(transactions, user, "Zomato", "Team lunch", 1550.00, TransactionType.EXPENSE, "Food", 118);
        addTx(transactions, user, "Swiggy", "Dinner delivery", 2100.00, TransactionType.EXPENSE, "Food", 114);
        addTx(transactions, user, "Blinkit", "Snacks", 1850.00, TransactionType.EXPENSE, "Food", 109);
        addTx(transactions, user, "Grocery Store", "Monthly supplies", 4500.00, TransactionType.EXPENSE, "Food", 106);
        addTx(transactions, user, "Uber", "Travel to event", 800.00, TransactionType.EXPENSE, "Transport", 103);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 2300.00, TransactionType.EXPENSE, "Utilities", 101);
        addTx(transactions, user, "Pharmacy", "Checkup meds", 1200.00, TransactionType.EXPENSE, "Healthcare", 93);
        addTx(transactions, user, "Bank Interest", "Q1 Interest", 1250.00, TransactionType.INCOME, "Interest", 90);

        // Month 3 (approx 90 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 72000.00, TransactionType.INCOME, "Salary", 90);
        addTx(transactions, user, "Netflix", "Monthly subscription", 649.00, TransactionType.EXPENSE, "Entertainment", 87);
        addTx(transactions, user, "Amazon", "Books", 2150.00, TransactionType.EXPENSE, "Shopping", 82);
        addTx(transactions, user, "Swiggy", "Weekend food", 1100.00, TransactionType.EXPENSE, "Food", 79);
        addTx(transactions, user, "Petrol Station", "Car fuel", 3000.00, TransactionType.EXPENSE, "Transport", 76);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 2850.00, TransactionType.EXPENSE, "Utilities", 71);
        addTx(transactions, user, "Grocery Store", "Monthly supplies", 3200.00, TransactionType.EXPENSE, "Food", 66);

        // Month 2 (approx 60 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 75000.00, TransactionType.INCOME, "Salary", 60);
        addTx(transactions, user, "Uber", "Airport drop", 2550.00, TransactionType.EXPENSE, "Transport", 58);
        addTx(transactions, user, "Ola", "Outstation travel", 1800.00, TransactionType.EXPENSE, "Transport", 53);
        addTx(transactions, user, "Petrol Station", "Road trip fuel", 4500.00, TransactionType.EXPENSE, "Transport", 46);
        addTx(transactions, user, "Zomato", "Lunch", 1350.00, TransactionType.EXPENSE, "Food", 43);
        addTx(transactions, user, "Swiggy", "Dinner", 1450.00, TransactionType.EXPENSE, "Food", 39);
        addTx(transactions, user, "Amazon", "Travel gear", 1550.00, TransactionType.EXPENSE, "Shopping", 35);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 3100.00, TransactionType.EXPENSE, "Utilities", 32);
        addTx(transactions, user, "Dividend Credit", "Tech Stock Dividend", 4500.00, TransactionType.INCOME, "Dividend", 31);

        // Month 1 (approx 30 days ago)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 78000.00, TransactionType.INCOME, "Salary", 30);
        addTx(transactions, user, "Netflix", "Monthly subscription", 649.00, TransactionType.EXPENSE, "Entertainment", 29);
        addTx(transactions, user, "Swiggy", "Lunch delivery", 1250.00, TransactionType.EXPENSE, "Food", 25);
        addTx(transactions, user, "Grocery Store", "Monthly supplies", 3800.00, TransactionType.EXPENSE, "Food", 21);
        addTx(transactions, user, "Myntra", "Summer clothes", 2450.00, TransactionType.EXPENSE, "Shopping", 17);
        addTx(transactions, user, "Petrol Station", "Car fuel", 2500.00, TransactionType.EXPENSE, "Transport", 13);
        addTx(transactions, user, "Electricity Bill", "Monthly utility", 3550.00, TransactionType.EXPENSE, "Utilities", 9);
        addTx(transactions, user, "Pharmacy", "Supplements", 650.00, TransactionType.EXPENSE, "Healthcare", 3);
        addTx(transactions, user, "Freelance Payment", "Web Design Project", 15000.00, TransactionType.INCOME, "Freelance", 1);

        // Current Month (Recent days)
        addTx(transactions, user, "Monthly Salary", "TechCorp Inc.", 80000.00, TransactionType.INCOME, "Salary", 0);
        addTx(transactions, user, "Netflix", "Monthly subscription", 649.00, TransactionType.EXPENSE, "Entertainment", 0);
        addTx(transactions, user, "Amazon", "Home decor", 3100.00, TransactionType.EXPENSE, "Shopping", 0);
        addTx(transactions, user, "Swiggy", "Dinner delivery", 1450.00, TransactionType.EXPENSE, "Food", 0);

        transactionRepository.saveAll(transactions);
    }

    private void addTx(List<Transaction> list, User user, String title, String desc, double amount, TransactionType type, String category, int daysAgo) {
        list.add(Transaction.builder()
                .user(user)
                .title(title)
                .description(desc)
                .amount(BigDecimal.valueOf(amount))
                .type(type)
                .category(category)
                .transactionDate(LocalDate.now().minusDays(daysAgo))
                .build());
    }

    private void seedBudgets(User user) {


        log.info("Seeding realistic budgets for user: {}", user.getEmail());
        List<Budget> budgets = new ArrayList<>();
        LocalDate now = LocalDate.now();

        String[] categories = {"Food", "Shopping", "Entertainment", "Utilities", "Transport", "Healthcare"};
        double[] limits = {9000.00, 5500.00, 2500.00, 4000.00, 4500.00, 2000.00};

        for (int i = 0; i < categories.length; i++) {
            // Current month budget
            budgets.add(Budget.builder()
                    .user(user)
                    .category(categories[i])
                    .monthlyLimit(BigDecimal.valueOf(limits[i]))
                    .month(now.getMonthValue())
                    .year(now.getYear())
                    .build());
            
            // Previous month budget
            LocalDate previousMonth = now.minusMonths(1);
            budgets.add(Budget.builder()
                    .user(user)
                    .category(categories[i])
                    .monthlyLimit(BigDecimal.valueOf(limits[i]))
                    .month(previousMonth.getMonthValue())
                    .year(previousMonth.getYear())
                    .build());
        }

        budgetRepository.saveAll(budgets);
    }

    private void seedSavingsGoals(User user) {


        log.info("Seeding realistic savings goals for user: {}", user.getEmail());
        List<SavingsGoal> goals = new ArrayList<>();
        LocalDate now = LocalDate.now();

        goals.add(SavingsGoal.builder().user(user).name("Emergency Fund").targetAmount(BigDecimal.valueOf(150000.00)).savedAmount(BigDecimal.valueOf(150000.00)).targetDate(now.minusMonths(2)).status(SavingsGoalStatus.COMPLETED).build());
        goals.add(SavingsGoal.builder().user(user).name("New Laptop").targetAmount(BigDecimal.valueOf(80000.00)).savedAmount(BigDecimal.valueOf(80000.00)).targetDate(now.minusMonths(1)).status(SavingsGoalStatus.COMPLETED).build());
        goals.add(SavingsGoal.builder().user(user).name("New Phone").targetAmount(BigDecimal.valueOf(60000.00)).savedAmount(BigDecimal.valueOf(55000.00)).targetDate(now.plusMonths(1)).status(SavingsGoalStatus.IN_PROGRESS).build());
        goals.add(SavingsGoal.builder().user(user).name("Europe Trip").targetAmount(BigDecimal.valueOf(200000.00)).savedAmount(BigDecimal.valueOf(85000.00)).targetDate(now.plusMonths(10)).status(SavingsGoalStatus.IN_PROGRESS).build());
        goals.add(SavingsGoal.builder().user(user).name("Home Down Payment").targetAmount(BigDecimal.valueOf(50000.00)).savedAmount(BigDecimal.valueOf(10000.00)).targetDate(now.plusMonths(5)).status(SavingsGoalStatus.CANCELLED).build());

        savingsGoalRepository.saveAll(goals);
    }

    private void seedSubscriptions(User user) {


        log.info("Seeding realistic subscriptions for user: {}", user.getEmail());
        List<Subscription> subscriptions = new ArrayList<>();
        LocalDate now = LocalDate.now();

        subscriptions.add(Subscription.builder().user(user).name("Netflix").amount(BigDecimal.valueOf(649.00)).billingCycle(BillingCycle.MONTHLY).category("Entertainment").nextBillingDate(now.plusDays(10)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("Spotify Premium").amount(BigDecimal.valueOf(119.00)).billingCycle(BillingCycle.MONTHLY).category("Entertainment").nextBillingDate(now.plusDays(15)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("YouTube Premium").amount(BigDecimal.valueOf(129.00)).billingCycle(BillingCycle.MONTHLY).category("Entertainment").nextBillingDate(now.plusDays(22)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("ChatGPT Plus").amount(BigDecimal.valueOf(1950.00)).billingCycle(BillingCycle.MONTHLY).category("Utilities").nextBillingDate(now.plusDays(5)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("Google One").amount(BigDecimal.valueOf(1300.00)).billingCycle(BillingCycle.YEARLY).category("Utilities").nextBillingDate(now.plusMonths(4)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("Amazon Prime").amount(BigDecimal.valueOf(1499.00)).billingCycle(BillingCycle.YEARLY).category("Shopping").nextBillingDate(now.plusMonths(2)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("GitHub Copilot").amount(BigDecimal.valueOf(8500.00)).billingCycle(BillingCycle.YEARLY).category("Utilities").nextBillingDate(now.plusMonths(6)).isActive(true).build());
        subscriptions.add(Subscription.builder().user(user).name("Apple Music").amount(BigDecimal.valueOf(99.00)).billingCycle(BillingCycle.MONTHLY).category("Entertainment").nextBillingDate(now.minusMonths(2)).isActive(false).build());

        subscriptionRepository.saveAll(subscriptions);
    }
}
