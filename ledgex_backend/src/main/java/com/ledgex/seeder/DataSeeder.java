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
import java.util.Random;

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
        if (transactionRepository.count() > 0) {
            log.info("Transactions already exist. Skipping transaction seeding.");
            return;
        }

        log.info("Seeding transactions for user: {}", user.getEmail());
        List<Transaction> transactions = new ArrayList<>();
        Random random = new Random();
        LocalDate now = LocalDate.now();

        String[] expenseCategories = {"Groceries", "Rent", "Utilities", "Entertainment", "Dining Out", "Transportation"};
        String[] incomeCategories = {"Salary", "Freelance", "Investment"};

        // Generate ~90 transactions over the last 6 months
        for (int i = 0; i < 90; i++) {
            boolean isExpense = random.nextDouble() > 0.3; // 70% expenses, 30% income
            String category = isExpense 
                ? expenseCategories[random.nextInt(expenseCategories.length)] 
                : incomeCategories[random.nextInt(incomeCategories.length)];
            
            TransactionType type = isExpense ? TransactionType.EXPENSE : TransactionType.INCOME;
            
            // Random amount between 10.00 and 1000.00 (or larger for income)
            double amountValue = isExpense 
                ? 10 + (990 * random.nextDouble()) 
                : 1000 + (4000 * random.nextDouble());
            
            // Random date within the last 180 days
            LocalDate txDate = now.minusDays(random.nextInt(180));

            transactions.add(Transaction.builder()
                    .user(user)
                    .title((isExpense ? "Paid for " : "Received ") + category)
                    .description("Auto-generated " + type.name().toLowerCase() + " transaction")
                    .amount(BigDecimal.valueOf(amountValue))
                    .type(type)
                    .category(category)
                    .transactionDate(txDate)
                    .build());
        }

        transactionRepository.saveAll(transactions);
    }

    private void seedBudgets(User user) {
        if (budgetRepository.count() > 0) {
            log.info("Budgets already exist. Skipping budget seeding.");
            return;
        }

        log.info("Seeding budgets for user: {}", user.getEmail());
        List<Budget> budgets = new ArrayList<>();
        LocalDate now = LocalDate.now();

        String[] categories = {"Groceries", "Entertainment", "Dining Out", "Transportation", "Utilities", "Shopping"};
        double[] limits = {500.00, 200.00, 300.00, 150.00, 250.00, 400.00};

        for (int i = 0; i < categories.length; i++) {
            budgets.add(Budget.builder()
                    .user(user)
                    .category(categories[i])
                    .monthlyLimit(BigDecimal.valueOf(limits[i]))
                    .month(now.getMonthValue())
                    .year(now.getYear())
                    .build());
            
            // Also add for the previous month
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
        if (savingsGoalRepository.count() > 0) {
            log.info("Savings goals already exist. Skipping savings goals seeding.");
            return;
        }

        log.info("Seeding savings goals for user: {}", user.getEmail());
        List<SavingsGoal> goals = new ArrayList<>();
        LocalDate now = LocalDate.now();

        goals.add(SavingsGoal.builder()
                .user(user)
                .name("Emergency Fund")
                .targetAmount(BigDecimal.valueOf(10000.00))
                .savedAmount(BigDecimal.valueOf(4500.00))
                .targetDate(now.plusMonths(12))
                .status(SavingsGoalStatus.IN_PROGRESS)
                .build());

        goals.add(SavingsGoal.builder()
                .user(user)
                .name("New Laptop")
                .targetAmount(BigDecimal.valueOf(2000.00))
                .savedAmount(BigDecimal.valueOf(2000.00))
                .targetDate(now.minusDays(5))
                .status(SavingsGoalStatus.COMPLETED)
                .build());

        goals.add(SavingsGoal.builder()
                .user(user)
                .name("Summer Vacation")
                .targetAmount(BigDecimal.valueOf(3500.00))
                .savedAmount(BigDecimal.valueOf(1200.00))
                .targetDate(now.plusMonths(4))
                .status(SavingsGoalStatus.IN_PROGRESS)
                .build());

        savingsGoalRepository.saveAll(goals);
    }

    private void seedSubscriptions(User user) {
        if (subscriptionRepository.count() > 0) {
            log.info("Subscriptions already exist. Skipping subscriptions seeding.");
            return;
        }

        log.info("Seeding subscriptions for user: {}", user.getEmail());
        List<Subscription> subscriptions = new ArrayList<>();
        LocalDate now = LocalDate.now();

        subscriptions.add(Subscription.builder()
                .user(user)
                .name("Netflix")
                .amount(BigDecimal.valueOf(15.99))
                .billingCycle(BillingCycle.MONTHLY)
                .category("Entertainment")
                .nextBillingDate(now.plusDays(10))
                .isActive(true)
                .build());

        subscriptions.add(Subscription.builder()
                .user(user)
                .name("Spotify")
                .amount(BigDecimal.valueOf(9.99))
                .billingCycle(BillingCycle.MONTHLY)
                .category("Entertainment")
                .nextBillingDate(now.plusDays(5))
                .isActive(true)
                .build());

        subscriptions.add(Subscription.builder()
                .user(user)
                .name("Gym Membership")
                .amount(BigDecimal.valueOf(49.99))
                .billingCycle(BillingCycle.MONTHLY)
                .category("Health")
                .nextBillingDate(now.plusDays(20))
                .isActive(true)
                .build());

        subscriptions.add(Subscription.builder()
                .user(user)
                .name("Amazon Prime")
                .amount(BigDecimal.valueOf(139.00))
                .billingCycle(BillingCycle.YEARLY)
                .category("Shopping")
                .nextBillingDate(now.plusMonths(5))
                .isActive(true)
                .build());

        subscriptions.add(Subscription.builder()
                .user(user)
                .name("Adobe Creative Cloud")
                .amount(BigDecimal.valueOf(54.99))
                .billingCycle(BillingCycle.MONTHLY)
                .category("Software")
                .nextBillingDate(now.plusDays(15))
                .isActive(false) // Cancelled subscription example
                .build());

        subscriptionRepository.saveAll(subscriptions);
    }
}
