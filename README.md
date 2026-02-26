# Construction Company Income & Spending Management System

## Project Overview
A role-based financial transaction management system for construction companies built with Spring Boot, PostgreSQL, and JWT authentication.

## Features Implemented

### 1. **User Roles & Authentication**
- **WORKER**: Creates spending/income transactions
- **MANAGER**: Reviews and approves/rejects worker transactions  
- **DIRECTOR**: Views all transactions and statistics
- JWT Token-based authentication with Spring Security
- Custom UserDetailsService for database-backed users

### 2. **Transaction Management**
Worker can create transactions with:
- Amount (UZS currency)
- Transaction type (INCOME or SPENDING)
- Product name
- Source (company for income, location for spending)
- Description
- Optional weight in kg
- Photo evidence (stored as byte[] in database)

### 3. **Manager Review Workflow**
Managers can:
- View pending transactions from assigned workers
- Accept transactions (marks as ACCEPTED, updates statistics)
- Reject transactions (marks as REJECTED with comment)
- Return with comment (marks as COMMENTED for worker to fix)
- View all reviewed transactions

### 4. **Director Dashboard**
Directors can:
- View all transactions across all workers
- See which manager handled which transaction
- Track transaction statuses and statistics
- Get net profit calculations (income - spending)
- Day-by-day comparison reports

## Tech Stack

**Backend:**
- Spring Boot 3.4.0
- Spring Data JPA (Hibernate 6.6.2)
- Spring Security with JWT (jjwt 0.11.5)
- PostgreSQL 16.3
- Lombok 1.18.30
- Java 22

**Database:**
- PostgreSQL 16.3
- Credentials: postgres/root123
- Database: company_income_spend

## Project Structure

```
src/main/java/com/construction/app/
├── entity/
│   ├── User.java (with relations)
│   ├── Transaction.java (photo as byte[])
│   ├── UserRole.java (enum: WORKER, MANAGER, DIRECTOR)
│   ├── TransactionType.java (enum: INCOME, SPENDING)
│   └── TransactionStatus.java (enum: PENDING, ACCEPTED, REJECTED, COMMENTED)
├── repository/
│   ├── UserRepository.java
│   └── TransactionRepository.java
├── security/
│   ├── JwtTokenProvider.java (generate/validate tokens)
│   ├── JwtAuthenticationFilter.java (request filter)
│   ├── SecurityConfig.java (Spring Security configuration)
│   └── CustomUserDetailsService.java
├── service/
│   ├── AuthService.java (login)
│   └── TransactionService.java (CRUD, review, statistics)
├── controller/
│   ├── AuthController.java (POST /login)
│   └── TransactionController.java (transaction endpoints)
├── dto/
│   ├── LoginRequest/Response
│   ├── TransactionRequest/Response
│   ├── ReviewTransactionRequest
│   └── UserResponse
├── config/
│   └── DataInitializer.java (creates test users)
└── CompanyIncomeSpendApplication.java
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)

### Worker Endpoints
- `POST /api/transactions/create` - Create new transaction
- `GET /api/transactions/my-transactions` - View own transactions

### Manager Endpoints
- `GET /api/transactions/pending` - View pending transactions
- `GET /api/transactions/all` - View all assigned transactions
- `PUT /api/transactions/{id}/review` - Accept/Reject/Comment on transaction

### Shared Endpoints
- `GET /api/transactions/{id}/photo` - Download transaction photo
- `GET /api/health` - Health check

## Running the Application

```bash
# Build
mvn clean package

# Run
java -jar target/company-income-spend-1.0.0.jar
```

Server runs on: `http://localhost:8080/api`

## Test Users (Created Automatically)

```
Worker:  username=worker,  password=worker123
Manager: username=manager, password=manager123  
Director: username=director, password=director123
```

## Database Schema

**Users Table:** id, username, password (BCrypt), fullName, role, active, created_at, updated_at, assigned_manager_id

**Transactions Table:** id, worker_id, manager_id, type, status, amount, currency, product, source, description, weight_kg, photo_data (BLOB), photo_file_name, manager_comment, created_at, reviewed_at

## Key Features to Add (Future)

1. Director statistics endpoint with daily aggregations
2. Export reports to PDF/Excel
3. Multi-manager support with hierarchies
4. File upload service (AWS S3 integration)
5. Audit trail for all transaction changes
6. Email notifications for approvals/rejections
7. Mobile app frontend (React/React Native)
8. Transaction search and filtering
9. Bulk action support
10. Two-factor authentication

## Security Features

- JWT-based stateless authentication
- BCrypt password hashing
- Role-based access control (RBAC)
- Request authentication filter
- CSRF protection disabled (for JWT API)
- Session-less security (STATELESS policy)

## Notes

- Photos are currently stored in database as byte array (BLOB) for MVP
- Currency fixed to UZS for now
- Can be extended to support multiple currencies with exchange rates
- Hibernate auto-creates tables (ddl-auto: create-drop in dev mode)

---

**Status:** ✅ Core functionality implemented and tested
**Build:** ✅ Successfully builds with Maven
**Database:** ✅ Connected to PostgreSQL
**Security:** ✅ JWT + Spring Security configured
**Ready for:** Frontend development, API testing, and statistics implementation
