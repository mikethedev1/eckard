# Eckard Oil Capital — Backend Reference
## Complete API & Architecture Summary for Frontend Build

---

## 1. QUICK SETUP

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure environment
cp .env.example .env
# Edit .env with your MySQL credentials and secrets

# 3. Run database migrations (creates all tables)
npm run migrate

# 4. Seed default admin + plans
npm run seed

# 5. Start development server
npm run dev
# → API live at http://localhost:5000
```

**Default Admin Credentials (change immediately):**
- Email: `admin@eckardoil.com`
- Password: `Admin@123456`

---

## 2. BASE URL & RESPONSE FORMAT

**Base URL:** `http://localhost:5000/api`

**Every response follows this shape:**
```json
{
  "success": true | false,
  "message": "Human-readable message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Paginated responses add:**
```json
{
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Validation errors (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["field error 1", "field error 2"]
}
```

---

## 3. AUTHENTICATION

### How It Works
- JWT stored in HTTP-only cookies (`access_token`, `refresh_token`)
- Also returned in response body as `accessToken` for Bearer header use
- Access token: 7 days | Refresh token: 30 days
- All protected routes check cookie OR `Authorization: Bearer <token>` header

### Auth Endpoints

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{first_name, last_name, email, password, phone?, country?}` | Register new user |
| POST | `/auth/login` | `{email, password}` | Login |
| POST | `/auth/refresh` | cookie or `{refresh_token}` | Refresh access token |
| POST | `/auth/logout` | — | Clear session |
| GET | `/auth/me` | — | Get current user (🔒) |
| PUT | `/auth/change-password` | `{current_password, new_password}` | Change password (🔒) |

**Register/Login Response `data`:**
```json
{
  "user": {
    "id": 1,
    "uuid": "abc-123",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "role": "user",
    "balance": 0.00,
    "status": "active"
  },
  "accessToken": "eyJ..."
}
```

**Password Rules:** min 8 chars, must have uppercase + lowercase + number

---

## 4. USER ENDPOINTS (🔒 role: user)

Prefix: `/api/user`

### Dashboard
```
GET /dashboard
```
Returns: balance, stats (total_invested, active_amount, total_profit, pending_deposits, pending_withdrawals), recent_transactions (10), active_investments (5), unread_notifications count.

### Profile
```
PUT /profile
Body: { first_name?, last_name?, phone?, country?, address? }

POST /profile/avatar
Body: multipart/form-data, field: "avatar" (JPG/PNG/WEBP, max 5MB)
```

### Plans (Public – also available at /api/plans without auth)
```
GET /plans
```
Returns array of active plans with: id, name, description, min_amount, max_amount, roi_min, roi_max, duration_days, features (JSON array of strings).

### Investments
```
GET  /investments?status=active|completed|cancelled&page=1&limit=20
GET  /investments/:uuid
POST /investments
Body: { plan_id: number, amount: number }
```
**Investment Rules:**
- Amount must be within plan's min/max range
- User must have sufficient balance (balance >= amount)
- Balance is deducted immediately on creation
- Profit is auto-credited when cron job detects `end_date <= NOW()`

### Deposits
```
GET  /deposits?status=pending|approved|rejected&page=1&limit=20
GET  /deposits/:uuid
POST /deposits
Body: multipart/form-data
  Fields: amount (number), method (string), reference? (string), notes? (string)
  File:   proof_image (JPG/PNG/PDF, optional, max 5MB)
```
**Deposit Flow:** User submits → Admin reviews → On approval, balance is credited.

### Withdrawals
```
GET  /withdrawals?status=pending|approved|rejected&page=1&limit=20
GET  /withdrawals/:uuid
POST /withdrawals
Body: {
  amount: number,
  method: "bank_transfer" | "crypto",
  account_details: {
    bank_name?: string,
    account_number?: string,
    account_name?: string,
    routing_number?: string,
    wallet_address?: string,
    wallet_network?: string
  },
  notes?: string
}
```
**Withdrawal Rules:**
- User must have sufficient balance
- Only one pending withdrawal at a time
- Balance NOT deducted until admin approves

### Transactions
```
GET /transactions?type=deposit|withdrawal|investment|profit&status=completed&page=1&limit=20
```
Returns ledger entries with: type, amount, balance_before, balance_after, description, reference_type, status, created_at.

### Support Tickets
```
GET  /support?status=open|in_progress|resolved|closed&page=1&limit=20
GET  /support/:uuid
POST /support
Body: { subject: string, message: string, priority?: "low"|"medium"|"high"|"urgent" }
POST /support/:uuid/reply
Body: { message: string }
```

### Notifications
```
GET /notifications?page=1&limit=20
GET /notifications/unread          → { count: number }
PUT /notifications/read-all
PUT /notifications/:id/read
```

---

## 5. ADMIN ENDPOINTS (🔒 role: admin)

Prefix: `/api/admin`

### Admin Dashboard
```
GET /dashboard
```
Returns: stats (total_users, active_users, investment_volume, active_investments, total_deposits, pending_deposits, total_withdrawals, pending_withdrawals, open_tickets, platform_profit), charts (revenue last 12mo, user growth, investment distribution by plan), recent deposits & withdrawals.

### Analytics
```
GET /analytics?period=30   (period in days: 7 | 30 | 90 | 365)
```
Returns: summary stats, daily_revenue chart, daily_users chart, investment_trends, admin_activity breakdown.

### User Management
```
GET    /users?search=&status=active|banned|suspended&role=user|admin&page=1&limit=20
GET    /users/:id              → Full profile + stats
PUT    /users/:id              → Edit: first_name, last_name, email, phone, balance, role, status, country
DELETE /users/:id              → Soft delete (sets deleted_at)
```
**Edit User Notes:**
- Setting `status: "banned"` immediately blocks login
- Setting `balance` directly adjusts user's balance (admin credit/debit)
- Changing status triggers a notification to the user

### Investment Management
```
GET /investments?status=active|completed|cancelled&plan_id=&user_id=&page=1&limit=20
PUT /investments/:id
Body: { status?: "completed"|"cancelled", profit?: number, notes?: string }
```
**Force Complete:** Setting `status: "completed"` on an active investment credits the user's balance immediately. Optionally override `profit` amount.

### Deposit Management
```
GET /deposits?status=pending|approved|rejected&page=1&limit=20
PUT /deposits/:id/approve   → No body needed
PUT /deposits/:id/reject    → Body: { rejection_reason: string (required) }
```
Approving a deposit: credits user balance + creates transaction record + sends notification.

### Withdrawal Management
```
GET /withdrawals?status=pending|approved|rejected&page=1&limit=20
PUT /withdrawals/:id/approve  → No body needed
PUT /withdrawals/:id/reject   → Body: { rejection_reason: string (required) }
```
Approving a withdrawal: deducts user balance + creates transaction record + sends notification. Includes safety check for sufficient balance.

### Plan Management
```
GET    /plans
POST   /plans
PUT    /plans/:id
DELETE /plans/:id   (blocked if plan has active investments)
```
**Plan Body:**
```json
{
  "name": "Entry Level 2",
  "description": "...",
  "min_amount": 20000,
  "max_amount": 100000,
  "roi_min": 20,
  "roi_max": 35,
  "duration_days": 45,
  "features": ["Feature 1", "Feature 2"],
  "is_active": true
}
```

### Support Management
```
GET  /support?status=open|in_progress|resolved|closed&priority=low|medium|high|urgent
GET  /support/:id
POST /support/:id/reply
Body: { message: string, status?: "in_progress"|"resolved"|"closed" }
```

### Notifications & Broadcast
```
POST /broadcast
Body: { title: string, message: string, type?: "info"|"success"|"warning"|"error" }
```
Sends notification to ALL active users simultaneously.

### Admin Logs
```
GET /logs?page=1&limit=20
```
Returns all admin actions with admin name, action type, target, metadata, IP, timestamp.

---

## 6. PAGINATION QUERY PARAMS

All list endpoints support:
```
?page=1&limit=20
```
Max limit: 100. Default limit: 20.

---

## 7. FILE UPLOADS

- **Endpoint:** Include as `multipart/form-data`
- **Max size:** 5MB
- **Allowed types:** JPG, JPEG, PNG, WEBP, PDF
- **Served at:** `http://localhost:5000/uploads/<filename>`
- **Field names:**
  - Avatar: `avatar`
  - Deposit proof: `proof_image`

---

## 8. ERROR CODES

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (business logic error) |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role or banned) |
| 404 | Not found |
| 409 | Conflict (e.g. duplicate email) |
| 413 | File too large |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## 9. DATABASE TABLES SUMMARY

| Table | Purpose |
|-------|---------|
| `users` | Accounts (user + admin), balance, status |
| `plans` | Investment plans with ROI config |
| `investments` | Active/completed user investments |
| `deposits` | Deposit requests + proof uploads |
| `withdrawals` | Withdrawal requests + bank/wallet details |
| `transactions` | Immutable financial ledger |
| `support_tickets` | Support conversations |
| `ticket_messages` | Individual messages in tickets |
| `notifications` | Per-user + broadcast notifications |
| `admin_logs` | All admin actions with metadata |
| `audit_trail` | Full before/after change history |
| `refresh_tokens` | Active refresh token store |

---

## 10. CRON JOBS

**Investment Auto-Complete** (`0 * * * *` — every hour):
- Queries investments where `status='active'` AND `end_date <= NOW()`
- Credits `total_return` (principal + profit) to user balance
- Creates transaction record
- Sends completion notification

**Token Cleanup** (`0 0 * * *` — midnight daily):
- Removes expired refresh tokens from DB

---

## 11. FRONTEND AXIOS SETUP RECOMMENDATION

```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true,          // Required for HTTP-only cookies
  headers: { 'Content-Type': 'application/json' },
});

// Auto-refresh on 401
api.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await api.post('/auth/refresh');
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 12. ROLE-BASED ROUTING LOGIC

```
/login        → if role === 'admin' → /admin/dashboard
               → if role === 'user'  → /dashboard

ProtectedRoute → checks auth + role
AdminRoute     → checks role === 'admin'
UserRoute      → checks role === 'user'
```

---

## 13. KEY BUSINESS LOGIC FLOW (For Frontend State)

**Deposit Flow:**
1. User fills form + uploads proof → POST `/user/deposits`
2. Status shows `pending` in UI
3. Admin approves → status becomes `approved`, balance increases
4. User gets notification

**Withdrawal Flow:**
1. User fills form + enters bank details → POST `/user/withdrawals`
2. Status shows `pending` (balance NOT yet deducted)
3. Admin approves → status becomes `approved`, balance decreases
4. User gets notification

**Investment Flow:**
1. User selects plan + enters amount → POST `/user/investments`
2. Balance immediately deducted
3. Investment shows as `active` with countdown to `end_date`
4. Cron job auto-completes on maturity → balance increases

---

*Backend version 1.0.0 | Eckard Oil Capital*
