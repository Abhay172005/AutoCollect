# AutoCollect — Smart Receivables & Payment Reminder System

AutoCollect is a full-stack receivables management platform designed to help B2B businesses track outstanding invoices, reconcile payments, manage customer accounts, and automate WhatsApp payment reminders.

Import ERP exports from tools such as Tally, Busy, and Marg, monitor receivables through an interactive dashboard, and track reminder delivery using the Meta WhatsApp Cloud API.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Node.js (v22), Express.js, JWT Authentication |
| **Database** | MongoDB (Mongoose ODM) |
| **Messaging** | Meta WhatsApp Cloud API (Graph API v26.0) |
| **File Parsing** | `pdf-parse`, `xlsx` |
| **Deployment** | Render (single-service full-stack web service) |

---

## Features

### Multi-Tenant SaaS Architecture
- Complete data isolation per business user via `merchantId` scoping across all database queries.
- Secure JWT-based merchant registration and authentication — no shared accounts.
- Each merchant independently manages their parties, bills, reminder logs, and local template settings.

### Core Receivables Automation
- **Smart ERP Upload**: Upload pending bill statements exported from Tally, Busy, or Marg in Excel, CSV, or PDF formats.
- **Intelligent Extraction**: Automatically identifies Bill Numbers, Party Names, Amounts, and Invoice Dates.
- **Weekly Reconciliation Engine**: Detects Paid, Partially Paid, and Pending invoices automatically on subsequent uploads.
- **Credit Terms & Due Dates**: Computes invoice due dates automatically from bill date and merchant credit terms.
- **Lifecycle Tracking**: Real-time status buckets — Upcoming, Due Today, Overdue, Paid, and Partially Paid.

### WhatsApp Cloud API Reminders
- **Direct Meta Integration**: Sends payment reminders via Meta's WhatsApp Cloud API using pre-approved business templates.
- **Approved Message Template**: Uses the `pending_bill_payment_reminder` template with 4 dynamic variables:
  1. `{{1}}` — Party Name
  2. `{{2}}` — Invoice Number
  3. `{{3}}` — Outstanding Balance (formatted in Indian currency style, e.g. `1,25,000`)
  4. `{{4}}` — Due Date (e.g. `30/11/2024`)
- **Single & Bulk Reminder Dispatch**: Send reminders for individual invoices or trigger one-click bulk reminders across overdue buckets with individual success/failure reporting.
- **Safe Feature Gate**: Production message dispatch defaults to disabled (`WHATSAPP_SEND_ENABLED=false`) until configuration, template approval, webhook verification, and controlled tests are confirmed.
- **Reminder History & Tracking**: Every dispatch attempt creates a permanent audit record storing the Meta message ID (`wamid`), recipient number, dispatched preview text, timestamp, and any API error details.
- **Two-Way Status Tracking**: Real-time webhook ingestion for message delivery receipts. Clearly distinguishes between:
  - **Accepted**: Meta Cloud API accepted the reminder for delivery (HTTP 200 with `wamid`); Meta's webhook status `sent` also maps to `Accepted` (server-level queue/dispatch). API acceptance indicates message dispatch and is never misrepresented as confirmed delivery.
  - **Delivered**: Confirmed delivery to the recipient's handset (`deliveredAt`).
  - **Read**: Confirmed read receipt when recipient opened the message (`readAt`).
  - **Failed**: Transmission or delivery failure (`failedAt` + `metaError`).
  - **Sent**: Retained as a distinct status for historical pre-migration records sent via former provider.

> [!NOTE]
> *Integration Verification Status*: Code architecture, signature validation, payload construction, and unit tests have been verified with mocked requests. Live production message transmission and end-to-end handset delivery have not been executed and remain unverified until an actual controlled test succeeds.

### Dashboard & Analytics
- **Live Metrics**: At-a-glance cards showing total outstanding balance, overdue amounts, due today invoices, and total parties.
- **Visual Insights**: Outstanding by Customer (bar chart), Collection Status (donut chart), and Overdue Aging Trends.
- **Action Feed**: Real-time chronological audit trail of file uploads, reminder dispatches, and status updates.

### Additional Capabilities
- **Global Search**: Search across invoices, party names, phone numbers, and cities from any view.
- **Party Directory**: Full party management with contact information, city categorization, and missing phone alerts.
- **Financial Reports**: Export customizable reports (Pending, Overdue, Paid, Partial, and Reminders) in CSV format.
- **Settings & Local Template Preview**: Customize merchant business details and preview reminder templates with local placeholder syntax (`{partyName}`, `{billNumber}`, `{balanceAmount}`, `{dueDate}`).

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22 LTS recommended)
- **MongoDB**: Local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- **Git**

### 1. Clone & Configure Environment

```bash
git clone https://github.com/Abhay172005/AutoCollect.git
cd AutoCollect
```

Copy the example environment configuration to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure your local `.env` with appropriate development credentials:

```env
# ── Server ────────────────────────────────────
PORT=5000

# ── Database ──────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/autocollect

# ── Authentication ────────────────────────────
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

# ── Meta WhatsApp Cloud API ───────────────────
# System User access token from Meta Business Manager
WHATSAPP_ACCESS_TOKEN=your_meta_system_user_access_token

# Phone Number ID registered in Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Graph API Version
WHATSAPP_API_VERSION=v26.0

# Approved Template Name and Language
WHATSAPP_TEMPLATE_NAME=pending_bill_payment_reminder
WHATSAPP_TEMPLATE_LANGUAGE=en

# Webhook Subscription Verification Secret (custom random token)
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token

# Meta App Secret (from App Dashboard → Settings → Basic)
META_APP_SECRET=your_meta_app_secret

# Feature Gate: keep false during setup and testing
WHATSAPP_SEND_ENABLED=false
```

> [!IMPORTANT]
> Never commit `.env` to source control. The root `.gitignore` excludes `.env` and `.env.*` while keeping `.env.example` tracked.

### 2. Install Dependencies

Install root, client, and server dependencies:

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### 3. Run the Development Environment

Run backend and frontend dev servers concurrently in separate terminals:

```bash
# Terminal 1 — Backend API (runs on http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend Application (runs on http://localhost:5173)
cd client
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

### 4. Running Automated Tests

Run the backend test suite (uses Node.js built-in test runner):

```bash
cd server
npm test
```

---

## Webhooks (Meta WhatsApp Cloud API)

AutoCollect includes endpoints to receive real-time message status updates from Meta:

- **Subscription Handshake**: `GET /api/webhooks/whatsapp`
  - Validates `hub.mode === 'subscribe'` and verifies `hub.verify_token` against `WHATSAPP_VERIFY_TOKEN` using constant-time comparison (`crypto.timingSafeEqual`).
  - Responds with `hub.challenge` on successful verification.
- **Event Notification**: `POST /api/webhooks/whatsapp`
  - Validates HMAC-SHA256 signature from the `X-Hub-Signature-256` header against the exact raw request bytes (`express.raw()`) using `META_APP_SECRET`.
  - Rejects missing, placeholder, or invalid secrets securely.
  - Ingests status updates for the subscribed `messages` webhook field.
  - Updates `ReminderHistory` documents by `wamid` with timestamp-aware state transitions:
    - `sent` → `Accepted` (server-level queue/acceptance, distinct from confirmed delivery)
    - `delivered` → `Delivered` (records `deliveredAt`)
    - `read` → `Read` (records `readAt`; handles read-before-delivered by advancing directly to `Read` and backfilling `deliveredAt` when delayed delivery arrives)
    - `failed` → `Failed` (records `failedAt` and serializes `metaError`)
  - Uses provider event timestamps (`statusObj.timestamp`) to drop stale out-of-order events, protect confirmed delivery/read states, and handle duplicate events idempotently without redundant database writes.

**Production Webhook Callback URL:**
```
https://autocollect.onrender.com/api/webhooks/whatsapp
```

---

## Render Deployment (Single Web Service)

AutoCollect is configured for deployment as a single full-stack Web Service on [Render](https://render.com/).

### Deployment Settings

| Setting | Value |
|---------|-------|
| **Environment** | `Node` |
| **Root Directory** | *(leave blank / repository root)* |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

The root `package.json` coordinates building both tiers:
1. `cd client && npm install && npm run build`: Compiles the Vite React application into `client/dist`.
2. `cd ../server && npm install`: Installs backend production dependencies.
3. `npm start` (`cd server && node server.js`): Starts the Express server, which serves backend API routes under `/api/*` and static frontend assets with an SPA catch-all fallback.

### Production Migration & Verification Checklist

1. **Configure Environment Variables**: Set all required keys in the Render Dashboard (`MONGODB_URI`, `JWT_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANGUAGE`, `WHATSAPP_VERIFY_TOKEN`, `META_APP_SECRET`).
2. **Keep Send Disabled Initially**: Verify `WHATSAPP_SEND_ENABLED=false` is set in Render.
3. **Deploy Webhook**: Trigger deploy on Render to publish the `/api/webhooks/whatsapp` endpoints.
4. **Configure Webhook in Meta**: In Meta App Dashboard → WhatsApp → Configuration:
   - **Callback URL**: `https://autocollect.onrender.com/api/webhooks/whatsapp`
   - **Verify Token**: Must match `WHATSAPP_VERIFY_TOKEN`.
   - Click **Verify and Save**.
5. **Subscribe to Fields**: Under Webhook Fields, subscribe to **`messages`**.
6. **Confirm Template Approval**: In Meta WhatsApp Manager, ensure the template `pending_bill_payment_reminder` is approved with language code `en`.
7. **Perform Controlled Test Send**:
   - Temporarily set `WHATSAPP_SEND_ENABLED=true` in Render.
   - Send a reminder to a verified internal testing number.
   - Confirm delivery on WhatsApp and verify the record transitions from `Accepted` to `Delivered`/`Read` in AutoCollect Reminder History.
8. **Finalize Production**: Leave sending enabled for daily merchant operations.

> [!NOTE]
> Modifying reminder templates in the AutoCollect UI Settings page customizes local merchant preview copy only. It does not alter the registered template in Meta Business Manager.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|:-------------:|
| `POST` | `/api/auth/register` | Register a new merchant | No |
| `POST` | `/api/auth/login` | Merchant login & JWT issuance | No |
| `GET` | `/api/auth/me` | Retrieve authenticated merchant profile | Yes |
| `POST` | `/api/upload` | Upload & parse ERP ledger file (PDF/Excel) | Yes |
| `GET` | `/api/upload-history` | View historical file uploads | Yes |
| `GET` | `/api/bills` | Query bills (filters, search, pagination, sort) | Yes |
| `GET` | `/api/bills/export/csv` | Export filtered bills to CSV | Yes |
| `GET` | `/api/parties` | List parties with balance and contact status | Yes |
| `POST` | `/api/parties` | Create new party | Yes |
| `PUT` | `/api/parties/:id` | Update party details | Yes |
| `DELETE` | `/api/parties/:id` | Delete party | Yes |
| `GET` | `/api/reminders/due` | Categorized bills due for reminders (Today, 3d, 7d, 15d) | Yes |
| `GET` | `/api/reminders/preview/:billId` | Generate reminder message preview for a bill | Yes |
| `POST` | `/api/reminders/send` | Dispatch WhatsApp reminder for a single bill | Yes |
| `POST` | `/api/reminders/send-bulk` | Dispatch WhatsApp reminders in bulk for multiple bills | Yes |
| `GET` | `/api/reminders/history` | Paginated reminder history logs with delivery status | Yes |
| `GET` | `/api/webhooks/whatsapp` | Meta webhook verification handshake | No |
| `POST` | `/api/webhooks/whatsapp` | Meta status update event receiver (HMAC validated) | No |
| `GET` | `/api/reports/:type` | Generate analytical reports (Pending, Overdue, etc.) | Yes |
| `GET` | `/api/dashboard/stats` | Aggregate dashboard statistics & charts | Yes |
| `GET` | `/api/settings` | Retrieve merchant settings & template | Yes |
| `PUT` | `/api/settings` | Update merchant settings & template | Yes |
| `GET` | `/api/search` | Global search across bills, parties, and phone numbers | Yes |
| `GET` | `/api/health` | Service health check | No |

---

## Project Structure

```
AutoCollect/
├── .env.example                    # Template environment variables
├── .gitignore                      # Git exclusion rules
├── package.json                    # Root build and deployment orchestrator
├── README.md                       # Documentation
│
├── client/                         # Frontend (React 19 + Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── components/             # Reusable UI, layout, navbar, sidebar
│       ├── contexts/               # AuthContext, ThemeContext
│       ├── pages/                  # Dashboard, Bills, Reminders, History, Settings
│       └── services/               # Axios API client
│
└── server/                         # Backend (Node.js + Express + MongoDB)
    ├── package.json
    ├── server.js                   # App entry, raw body middleware, static serving
    ├── config/                     # Database connection
    ├── controllers/
    │   ├── reminderController.js   # Single and bulk reminder endpoints
    │   ├── webhookController.js    # Meta webhook handshake & status event processor
    │   └── ...                     # Auth, bills, parties, upload, settings
    ├── middleware/                 # JWT protection, file upload, error handling
    ├── models/
    │   ├── Bill.js                 # Invoice schema with reminderSent flag
    │   ├── ReminderHistory.js      # Audit log with wamid, deliveredAt, readAt
    │   └── ...                     # Party, User, Settings, UploadHistory
    ├── routes/
    │   ├── reminders.js            # Reminder route definitions
    │   ├── webhooks.js             # Public Meta webhook routes
    │   └── ...                     # Bills, parties, auth, upload, reports
    ├── services/
    │   └── reminderService.js      # Meta Cloud API client, phone normalizer, sender
    └── tests/
        ├── reminderService.test.js # Unit tests for sender, phone format, webhooks
        └── settings.test.js        # Unit tests for template migration & preview
```

---

## License

Distributed under the MIT License.
