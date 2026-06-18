package com.ledgex.ai.gemini.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgex.ai.dto.FinancialInsightsResponse;
import com.ledgex.ai.gemini.config.GeminiProperties;
import com.ledgex.ai.gemini.dto.GeminiRequestDTO;
import com.ledgex.ai.gemini.dto.GeminiResponseDTO;
import com.ledgex.ai.service.AIInsightsService;
import com.ledgex.analytics.dto.BudgetVsActualResponse;
import com.ledgex.analytics.dto.CategorySpendingResponse;
import com.ledgex.analytics.dto.FinancialHealthScoreResponse;
import com.ledgex.analytics.dto.OverviewAnalyticsResponse;
import com.ledgex.analytics.dto.SavingsSummaryAnalyticsResponse;
import com.ledgex.analytics.dto.SubscriptionSummaryAnalyticsResponse;
import com.ledgex.analytics.service.AnalyticsService;
import com.ledgex.auth.entity.User;
import com.ledgex.auth.repository.UserRepository;
import com.ledgex.common.exception.ResourceNotFoundException;
import com.ledgex.savings.entity.SavingsGoal;
import com.ledgex.savings.repository.SavingsGoalRepository;
import com.ledgex.subscription.entity.Subscription;
import com.ledgex.subscription.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private static final String RESPONSE_SCHEMA = """
            {
              "type": "object",
              "properties": {
                "financialSummary": { "type": "string" },
                "recommendations": { "type": "array", "items": { "type": "string" } },
                "risks": { "type": "array", "items": { "type": "string" } },
                "savingsAdvice": { "type": "array", "items": { "type": "string" } },
                "budgetAdvice": { "type": "array", "items": { "type": "string" } }
              },
              "required": ["financialSummary", "recommendations", "risks", "savingsAdvice", "budgetAdvice"]
            }
            """;

    private final AnalyticsService analyticsService;
    private final AIInsightsService aiInsightsService;
    private final UserRepository userRepository;
    private final SavingsGoalRepository savingsGoalRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final GeminiProperties geminiProperties;
    private final ObjectMapper objectMapper;
    private final RestClient.Builder restClientBuilder;

    @Transactional(readOnly = true)
    public GeminiResponseDTO getGeminiInsights(String userEmail) {
        GeminiRequestDTO request = buildRequest(userEmail);

        if (!isGeminiConfigured()) {
            log.warn("Gemini API key is not configured; returning fallback insights");
            return buildFallbackResponse(request);
        }

        try {
            String prompt = buildPrompt(request, userEmail);
            String responseText = callGeminiApi(prompt);
            return parseGeminiResponse(responseText);
        } catch (Exception exception) {
            log.error("Gemini API call failed; returning fallback insights", exception);
            return buildFallbackResponse(request);
        }
    }

    private GeminiRequestDTO buildRequest(String userEmail) {
        FinancialInsightsResponse ruleBasedInsights = aiInsightsService.getFinancialInsights(userEmail);

        return GeminiRequestDTO.builder()
                .financialHealthScore(analyticsService.getFinancialHealthScore(userEmail))
                .overview(analyticsService.getOverview(userEmail))
                .spendingByCategory(analyticsService.getSpendingByCategory(userEmail))
                .budgetVsActual(analyticsService.getBudgetVsActual(userEmail))
                .savingsSummary(analyticsService.getSavingsSummary(userEmail))
                .subscriptionSummary(analyticsService.getSubscriptionSummary(userEmail))
                .ruleBasedInsights(ruleBasedInsights)
                .build();
    }

    private boolean isGeminiConfigured() {
        String apiKey = geminiProperties.getApiKey();
        return apiKey != null && !apiKey.isBlank();
    }

    private String buildPrompt(GeminiRequestDTO request, String userEmail) {
        FinancialHealthScoreResponse healthScore = request.getFinancialHealthScore();
        OverviewAnalyticsResponse overview = request.getOverview();
        FinancialInsightsResponse ruleBasedInsights = request.getRuleBasedInsights();

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<SavingsGoal> savingsGoals = savingsGoalRepository.findByUserIdOrderByTargetDateAsc(user.getId());
        List<Subscription> activeSubscriptions = subscriptionRepository
                .findByUserIdAndIsActiveTrueOrderByNextBillingDateAsc(user.getId());

        String rating = healthScore.getRating().name().toLowerCase();
        String budgetLines = formatBudgetLines(request.getBudgetVsActual());
        String savingsGoalLines = formatSavingsGoalLines(savingsGoals);
        String subscriptionLines = formatSubscriptionLines(activeSubscriptions);
        String spendingLines = formatSpendingLines(request.getSpendingByCategory());
        String achievements = formatInsightList(ruleBasedInsights.getAchievements());
        String warnings = formatInsightList(ruleBasedInsights.getWarnings());

        return """
                You are a friendly personal finance advisor.

                User's Financial Data:
                - Financial Health Score: %d/100 (%s)
                - This Month Income: %s
                - This Month Expenses: %s
                - Net Balance: %s

                Spending by Category:
                %s

                Budgets:
                %s

                Savings Goals:
                %s

                Subscriptions:
                %s

                Achievements: %s
                Warnings: %s

                Now write a friendly 2-3 sentence summary that references these actual numbers naturally \
                in the response. For example mention the exact income, biggest expense category, or savings progress.

                For recommendations, risks, savingsAdvice, and budgetAdvice — each point should reference actual \
                numbers from the user's data where relevant. Write each as simple, actionable, friendly advice in \
                plain English (max 1-2 sentences each). Avoid technical jargon. Build upon the achievements and \
                warnings above without contradicting them.

                Respond with JSON only using this exact structure:
                {
                  "financialSummary": "A friendly, conversational 2-3 sentence summary referencing actual numbers",
                  "recommendations": ["actionable advice referencing actual numbers where relevant"],
                  "risks": ["friendly risk explanation referencing actual numbers where relevant"],
                  "savingsAdvice": ["savings tip referencing actual goal amounts or progress where relevant"],
                  "budgetAdvice": ["budget tip referencing actual limits, spending, or categories where relevant"]
                }

                Provide 2-4 items per list. Use warm, encouraging language.
                """.formatted(
                healthScore.getScore(),
                rating,
                formatAmount(overview.getTotalIncome()),
                formatAmount(overview.getTotalExpense()),
                formatAmount(overview.getNetBalance()),
                spendingLines,
                budgetLines,
                savingsGoalLines,
                subscriptionLines,
                achievements,
                warnings
        );
    }

    private String formatAmount(BigDecimal amount) {
        return "₹" + amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatBudgetLines(List<BudgetVsActualResponse> budgets) {
        if (budgets == null || budgets.isEmpty()) {
            return "- No budgets set";
        }

        StringBuilder lines = new StringBuilder();
        for (BudgetVsActualResponse budget : budgets) {
            lines.append("- ").append(budget.getCategory())
                    .append(": Limit ").append(formatAmount(budget.getBudgetLimit()))
                    .append(", Spent ").append(formatAmount(budget.getActualSpent()))
                    .append(" (").append(budget.getUtilizationPercentage().setScale(0, RoundingMode.HALF_UP))
                    .append("% used)\n");
        }
        return lines.toString().stripTrailing();
    }

    private String formatSavingsGoalLines(List<SavingsGoal> goals) {
        if (goals == null || goals.isEmpty()) {
            return "- No savings goals set";
        }

        StringBuilder lines = new StringBuilder();
        for (SavingsGoal goal : goals) {
            BigDecimal progress = goal.getTargetAmount().compareTo(BigDecimal.ZERO) > 0
                    ? goal.getSavedAmount()
                    .multiply(BigDecimal.valueOf(100))
                    .divide(goal.getTargetAmount(), 0, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            lines.append("- ").append(goal.getName())
                    .append(": Target ").append(formatAmount(goal.getTargetAmount()))
                    .append(", Saved ").append(formatAmount(goal.getSavedAmount()))
                    .append(" (").append(progress).append("% complete) - ")
                    .append(goal.getStatus().name().toLowerCase().replace('_', ' '))
                    .append("\n");
        }
        return lines.toString().stripTrailing();
    }

    private String formatSubscriptionLines(List<Subscription> subscriptions) {
        if (subscriptions == null || subscriptions.isEmpty()) {
            return "- No active subscriptions";
        }

        StringBuilder lines = new StringBuilder();
        for (Subscription subscription : subscriptions) {
            lines.append("- ").append(subscription.getName())
                    .append(": ").append(formatAmount(subscription.getAmount()))
                    .append("/").append(subscription.getBillingCycle().name().toLowerCase())
                    .append("\n");
        }
        return lines.toString().stripTrailing();
    }

    private String formatSpendingLines(List<CategorySpendingResponse> spendingByCategory) {
        if (spendingByCategory == null || spendingByCategory.isEmpty()) {
            return "- No spending recorded this month";
        }

        StringBuilder lines = new StringBuilder();
        for (CategorySpendingResponse spending : spendingByCategory) {
            lines.append("- ").append(spending.getCategory())
                    .append(": ").append(formatAmount(spending.getAmount()))
                    .append(" (").append(spending.getPercentage().setScale(0, RoundingMode.HALF_UP))
                    .append("%)\n");
        }
        return lines.toString().stripTrailing();
    }

    private String formatInsightList(List<String> items) {
        if (items == null || items.isEmpty()) {
            return "None noted";
        }
        return String.join("; ", items);
    }

    private String callGeminiApi(String prompt) throws JsonProcessingException {
        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.4,
                "responseMimeType", "application/json",
                "responseSchema", objectMapper.readTree(RESPONSE_SCHEMA)
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", generationConfig
        );

        RestClient restClient = restClientBuilder
                .baseUrl(geminiProperties.getBaseUrl())
                .build();

        GeminiApiResponse apiResponse = restClient.post()
                .uri("/models/{model}:generateContent?key={apiKey}",
                        geminiProperties.getModel(),
                        geminiProperties.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(GeminiApiResponse.class);

        if (apiResponse == null
                || apiResponse.candidates == null
                || apiResponse.candidates.isEmpty()
                || apiResponse.candidates.getFirst().content == null
                || apiResponse.candidates.getFirst().content.parts == null
                || apiResponse.candidates.getFirst().content.parts.isEmpty()) {
            throw new RestClientException("Gemini API returned an empty response");
        }

        String text = apiResponse.candidates.getFirst().content.parts.getFirst().text;
        if (text == null || text.isBlank()) {
            throw new RestClientException("Gemini API returned empty text content");
        }

        return text;
    }

    private GeminiResponseDTO parseGeminiResponse(String responseText) throws JsonProcessingException {
        GeminiResponseDTO response = objectMapper.readValue(responseText, GeminiResponseDTO.class);
        return GeminiResponseDTO.builder()
                .financialSummary(response.getFinancialSummary())
                .recommendations(sanitizeList(response.getRecommendations()))
                .risks(sanitizeList(response.getRisks()))
                .savingsAdvice(sanitizeList(response.getSavingsAdvice()))
                .budgetAdvice(sanitizeList(response.getBudgetAdvice()))
                .build();
    }

    private List<String> sanitizeList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.toList());
    }

    private GeminiResponseDTO buildFallbackResponse(GeminiRequestDTO request) {
        FinancialHealthScoreResponse healthScore = request.getFinancialHealthScore();
        OverviewAnalyticsResponse overview = request.getOverview();
        SavingsSummaryAnalyticsResponse savingsSummary = request.getSavingsSummary();
        SubscriptionSummaryAnalyticsResponse subscriptionSummary = request.getSubscriptionSummary();
        FinancialInsightsResponse ruleBasedInsights = request.getRuleBasedInsights();

        List<String> recommendations = new ArrayList<>();
        List<String> risks = new ArrayList<>();
        List<String> savingsAdvice = new ArrayList<>();
        List<String> budgetAdvice = new ArrayList<>();

        if (ruleBasedInsights.getRecommendations() != null) {
            recommendations.addAll(ruleBasedInsights.getRecommendations());
        }
        if (ruleBasedInsights.getWarnings() != null) {
            risks.addAll(ruleBasedInsights.getWarnings());
        }

        if (overview.getNetBalance().compareTo(BigDecimal.ZERO) < 0) {
            risks.add("Monthly expenses exceed income by "
                    + overview.getNetBalance().abs().setScale(2, RoundingMode.HALF_UP));
            budgetAdvice.add("Review discretionary spending to restore a positive monthly balance");
        }

        for (BudgetVsActualResponse budget : request.getBudgetVsActual()) {
            if (budget.getActualSpent().compareTo(budget.getBudgetLimit()) > 0) {
                budgetAdvice.add("Reduce " + budget.getCategory()
                        + " spending to stay within the budget limit of "
                        + budget.getBudgetLimit().setScale(2, RoundingMode.HALF_UP));
            } else if (budget.getUtilizationPercentage().compareTo(new BigDecimal("80")) > 0) {
                budgetAdvice.add("Monitor " + budget.getCategory()
                        + " closely — budget utilization is at "
                        + budget.getUtilizationPercentage().setScale(0, RoundingMode.HALF_UP) + "%");
            }
        }

        if (savingsSummary.getActiveGoals() > 0) {
            savingsAdvice.add("You have " + savingsSummary.getActiveGoals()
                    + " active savings goal(s) with "
                    + savingsSummary.getOverallSavingsProgressPercentage().setScale(0, RoundingMode.HALF_UP)
                    + "% overall progress");
            if (overview.getNetBalance().compareTo(BigDecimal.ZERO) > 0) {
                savingsAdvice.add("Allocate a portion of this month's positive balance toward savings goals");
            }
        } else {
            savingsAdvice.add("Consider creating a savings goal to build an emergency fund");
        }

        if (subscriptionSummary.getMonthlyEstimatedCost().compareTo(BigDecimal.ZERO) > 0) {
            recommendations.add("Review " + subscriptionSummary.getActiveSubscriptions()
                    + " active subscription(s) costing approximately "
                    + subscriptionSummary.getMonthlyEstimatedCost().setScale(2, RoundingMode.HALF_UP)
                    + " per month");
        }

        String topCategory = request.getSpendingByCategory().stream()
                .findFirst()
                .map(CategorySpendingResponse::getCategory)
                .orElse("spending");

        if (recommendations.isEmpty()) {
            recommendations.add("Focus on your highest spending category: " + topCategory);
        }
        if (risks.isEmpty()) {
            risks.add("No critical risks detected from current data");
        }
        if (budgetAdvice.isEmpty()) {
            budgetAdvice.add("Continue tracking expenses against your budgets to maintain control");
        }
        if (savingsAdvice.isEmpty()) {
            savingsAdvice.add("Set a monthly savings target aligned with your financial goals");
        }

        String financialSummary = "Your financial health score is " + healthScore.getScore()
                + " (" + healthScore.getRating().name().toLowerCase() + "). "
                + healthScore.getExplanation()
                + " This month's net balance is "
                + overview.getNetBalance().setScale(2, RoundingMode.HALF_UP) + ".";

        return GeminiResponseDTO.builder()
                .financialSummary(financialSummary)
                .recommendations(recommendations)
                .risks(risks)
                .savingsAdvice(savingsAdvice)
                .budgetAdvice(budgetAdvice)
                .build();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class GeminiApiResponse {
        public List<Candidate> candidates;

        @JsonIgnoreProperties(ignoreUnknown = true)
        private static class Candidate {
            public Content content;
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        private static class Content {
            public List<Part> parts;
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        private static class Part {
            public String text;
        }
    }
}
