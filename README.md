# LedgeX 💰

**Smart Personal Finance & Financial Wellness Platform**

LedgeX (project codename: Spendora) is a full-stack fintech application that helps users manage income, expenses, budgets, subscriptions, and savings goals — all in one place, enhanced with AI-driven financial insights.

---

## 📌 Problem Statement

People struggle to manage personal finances effectively due to unorganized expense tracking, lack of financial awareness, and poor spending analysis. Most existing finance apps only record transactions — they don't help users *understand* their spending behavior, catch budget overruns, manage recurring subscriptions, or plan savings goals intelligently.

LedgeX solves this by combining transaction tracking, budgeting, savings goals, subscription management, analytics, and **AI-powered financial guidance** into a single connected platform.

---

## 🎯 Core Features

### Financial Management
- Income & expense tracking
- Category-wise transaction management
- Monthly budget planning with utilization tracking
- Goal-based savings tracking with contribution history
- Subscription & recurring payment management

### Analytics & Reporting
- Monthly financial overview (income, expense, net balance, savings rate)
- Spending breakdown by category
- Monthly trend analysis
- Top expenses
- Budget vs actual comparison
- Composite **Financial Health Score** (0–100)

### AI-Powered Insights
- Rule-based financial insights (warnings, recommendations, achievements)
- **Gemini AI integration** for personalized, conversational financial advice
- Friendly, jargon-free summaries referencing the user's real numbers
- Savings advice, budget advice, and risk detection

### Platform Features
- Secure JWT-based authentication
- RESTful API architecture
- Swagger/OpenAPI documentation
- Global exception handling with consistent API response format

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 (Vite), Tailwind CSS v4, React Router DOM v7 |
| Backend | Java 21, Spring Boot 3, Maven |
| Database | MySQL |
| Authentication | Spring Security + JWT |
| AI Services | Google Gemini API |
| HTTP Client (Frontend) | Axios |
| Data Visualization | Recharts |
| Icons | Lucide React |
| API Testing | Postman |
| Dev Tools | Cursor AI, VS Code |

---

## 🏗️ System Architecture

LedgeX follows a **layered architecture** on the backend and a **component-based architecture** on the frontend.

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│   (Pages → Components → Context → API)   │
└───────────────────┬───────────────────────┘
                     │ REST API (JWT Bearer)
┌───────────────────▼───────────────────────┐
│           Spring Boot Backend             │
│                                            │
│  Controller → Service → Repository → DB   │
│                                            │
│  Cross-cutting: Security (JWT), DTOs,     │
│  Exception Handling, Validation           │
└───────────────────┬───────────────────────┘
                     │
              ┌──────▼──────┐       ┌─────────────┐
              │   MySQL DB   │      │  Gemini AI   │
              └──────────────┘      └─────────────┘
```

---

## 📂 Backend Structure

```
com.ledgex/
├── config/              → Security & app configuration
├── controller/          → REST API endpoints
├── dto/                 → Request/response data shapes
├── entity/              → JPA entities (DB tables)
├── exception/           → Global exception handling
├── repository/          → Spring Data JPA repositories
├── security/            → JWT filters & utilities
├── service/             → Business logic
│
├── analytics/           → Financial analytics & health score module
├── ai/                  → Rule-based AI Insights module
│   └── gemini/           → Gemini AI integration module
├── subscription/        → Subscription management module
```

### Backend Modules Implemented

| Module | Description |
|---|---|
| **Auth** | Register, login, JWT-based authentication |
| **Transactions** | CRUD for income & expense entries |
| **Budgets** | Monthly category budgets + dynamic utilization tracking |
| **Savings Goals** | Goal creation, contributions, auto-completion, progress tracking |
| **Subscriptions** | Recurring payment tracking, cost normalization (monthly/yearly), upcoming renewals |
| **Analytics** | Overview, spending by category, monthly trends, top expenses, budget vs actual, financial health score |
| **AI Insights** | Rule-based warnings, recommendations, and achievements |
| **Gemini AI** | Real AI-generated, personalized financial summaries and advice |

---

## 📂 Frontend Structure

```
src/
├── api/
│   └── axios.js          → Axios instance with JWT auto-attach
├── context/
│   └── AuthContext.jsx   → Auth state (token, user, login, logout)
├── components/
│   ├── ProtectedRoute.jsx
│   └── SidebarLayout.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── Dashboard.jsx
│   ├── TransactionsPage.jsx
│   ├── BudgetsPage.jsx
│   ├── GoalsPage.jsx
│   ├── SubscriptionsPage.jsx
│   ├── AnalyticsPage.jsx
│   └── AiInsightsPage.jsx
└── main.jsx               → Routes & app entry point
```

---

## 🔑 API Endpoints Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create new user account |
| POST | `/api/v1/auth/login` | Authenticate & receive JWT |

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/transactions` | Create transaction |
| GET | `/api/v1/transactions` | List transactions |
| GET / PUT / DELETE | `/api/v1/transactions/{id}` | Manage single transaction |

### Budgets
| Method | Endpoint | Description |
|---|---|---|
| POST / GET / PUT / DELETE | `/api/v1/budgets` | Budget CRUD |
| GET | `/api/v1/budgets/utilization` | Category-wise spend vs limit |

### Savings Goals
| Method | Endpoint | Description |
|---|---|---|
| POST / GET / PUT / DELETE | `/api/v1/savings-goals` | Goal CRUD |
| POST | `/api/v1/savings-goals/{id}/contribute` | Add contribution |
| GET | `/api/v1/savings-goals/summary` | Aggregated goal stats |

### Subscriptions
| Method | Endpoint | Description |
|---|---|---|
| POST / GET / PUT / DELETE | `/api/v1/subscriptions` | Subscription CRUD |
| GET | `/api/v1/subscriptions/active` | Active subscriptions only |
| GET | `/api/v1/subscriptions/upcoming?days=N` | Renewals due soon |
| GET | `/api/v1/subscriptions/summary` | Monthly/yearly cost estimate |

### Analytics
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/analytics/overview` | Monthly income/expense/balance |
| GET | `/api/v1/analytics/spending-by-category` | Category breakdown |
| GET | `/api/v1/analytics/monthly-trend` | 12-month trend |
| GET | `/api/v1/analytics/top-expenses` | Largest expenses |
| GET | `/api/v1/analytics/budget-vs-actual` | Budget comparison |
| GET | `/api/v1/analytics/savings-summary` | Goals overview |
| GET | `/api/v1/analytics/subscription-summary` | Subscriptions overview |
| GET | `/api/v1/analytics/financial-health-score` | Composite 0–100 score |

### AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/ai/financial-insights` | Rule-based insights |
| GET | `/api/v1/ai/gemini-insights` | Gemini-powered personalized advice |

---

## 🚀 Getting Started

### Backend
```bash
cd ledgex_backend
# Configure application.properties with your MySQL credentials & Gemini API key
mvn spring-boot:run
```
Runs on `http://localhost:8080`

### Frontend
```bash
cd ledgex_frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

---

## 🔮 Future Scope

- Banking & UPI integration with real-time transaction sync
- AI-powered financial forecasting
- Investment & portfolio tracking
- OCR-based receipt scanning
- Voice-based expense management
- Shared family expense management
- Financial credit score analysis
- Multi-currency support
- AI chatbot for financial assistance
- Mobile application (React Native)

---

## 👤 Author

Built as part of an academic/personal project to demonstrate full-stack development with AI integration.

---

## 📄 License

This project is for educational purposes.
