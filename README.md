# AutoCollect – Smart Receivables & Payment Reminder System

A production-ready, multi-tenant MERN SaaS platform for B2B merchants to automate payment collections. Import weekly ERP exports (Tally, Busy, Marg), track outstanding invoices in real-time, and send automated WhatsApp payment reminders via Twilio — all from a single, beautiful dashboard.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | MongoDB (Mongoose ODM) |
| **Messaging** | Twilio (WhatsApp / SMS) |
| **File Parsing** | pdf-parse, xlsx |
| **Deployment** | Render (single-service full-stack) |

## Features

### Multi-Tenant SaaS Architecture
- Fully isolated data per merchant via `merchantId` scoping on every query.
- Secure JWT-based registration and login — no shared admin accounts.
- Each merchant manages their own parties, bills, reminders, and settings.

### Premium UI/UX
- **Linear / Vercel Inspired Design**: Ultra-deep true-black dark mode with subtle glassmorphism.
- **Dynamic Theming**: Seamless light/dark toggle on every screen — landing, login, signup, and dashboard.
- **Responsive Tables**: Sticky headers with backdrop blur for managing large datasets.
- **Onboarding Empty States**: Guided 3-step setup for new merchants (Add Parties → Upload → Remind).
- **Premium Upload Experience**: Animated extraction progress indicator during PDF/Excel processing.

### Core Receivables Automation
- **Smart PDF/Excel Upload**: Upload pending bills exported from Tally, Busy, or Marg (CSV, Excel, PDF).
- **Auto-Matching & Extraction**: Intelligently extracts Bill Numbers, Party Names, Amounts, and Dates.
- **Weekly Comparison Engine**: Automatically detects Paid, Partially Paid, and Pending invoices on each upload.
- **Auto Due Date Calculation**: Bill Date + Credit Days.
- **Status Tracking**: Upcoming, Due Today, Overdue, Paid, Partially Paid.

### Dashboard & Analytics
- **Highlight Metrics**: Pulsing alerts for "Overdue" and "Due Today" invoices.
- **Quick Actions**: 1-click access to Add Party and Upload ERP directly from the dashboard.
- **Visual Insights**: Outstanding by Customer (Bar), Collection Status (Donut), Overdue Trend (Area).
- **Recent Activities Feed**: Real-time log of uploads, reminders sent, and status changes.

### Twilio WhatsApp Reminders
- **Real WhatsApp/SMS**: Send professional payment reminders via the Twilio API.
- **One-Click Bulk Send**: Trigger reminders for all overdue bills instantly.
- **Reminder History**: Complete log of every message sent, with timestamps and delivery status.

### Additional
- Global search across parties, bills, phone numbers, and cities.
- Party management with CRUD, city filtering, and missing phone number detection.
- 5 report types (Pending, Overdue, Paid, Partial, Reminders) with CSV export.
- Merchant settings (business name, reminder templates).
- Toast notifications, loading skeletons, and form validation throughout.

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & Setup Environment

```bash
git clone https://github.com/Abhay172005/AutoCollect.git
cd AutoCollect
```

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autocollect
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 2. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Run Application

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

---

## Deployment (Render — Single Service)

This project is configured for single-service deployment on [Render](https://render.com/).

| Setting | Value |
|---------|-------|
| **Root Directory** | *(leave blank)* |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |

The root `package.json` orchestrates the full build:
1. Installs client dependencies and builds the React app (`client/dist`).
2. Installs server dependencies.
3. Starts Express, which serves both the API and the built React frontend.

Set all environment variables (`MONGODB_URI`, `JWT_SECRET`, `TWILIO_*`) in the Render dashboard.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Merchant registration |
| POST | `/api/auth/login` | Merchant login |
| GET | `/api/auth/me` | Current user |
| POST | `/api/upload` | Upload & parse ERP file |
| GET | `/api/upload-history` | Upload history |
| GET | `/api/bills` | List bills (search, filter, sort, pagination) |
| GET | `/api/bills/export/csv` | Export bills as CSV |
| GET/POST/PUT/DELETE | `/api/parties` | Party CRUD |
| GET | `/api/reminders/due` | Bills due for reminders |
| POST | `/api/reminders/send` | Send reminder |
| GET | `/api/reminders/history` | Reminder history |
| GET | `/api/reports/:type` | Generate reports |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/PUT | `/api/settings` | Merchant settings |
| GET | `/api/search?q=` | Global search |
| GET | `/api/health` | Health check |

---

## Project Structure

```
AutoCollect/
├── package.json                    # Root orchestrator (build + start)
├── .env                            # Environment config
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── components/
│       │   ├── layout/             # Sidebar, Navbar, Layout, PageTransition
│       │   └── ui/                 # EmptyState, Skeleton
│       ├── contexts/               # AuthContext, ThemeContext
│       ├── pages/                  # Dashboard, Bills, Parties, Upload, etc.
│       └── services/               # Axios API layer
│
└── server/
    ├── package.json
    ├── server.js                   # Express entry + static serving
    ├── config/                     # MongoDB connection
    ├── controllers/                # Route handlers
    ├── middleware/                  # Auth, Upload, Error handling
    ├── models/                     # Mongoose schemas (Bill, Party, User, etc.)
    ├── routes/                     # Express route definitions
    └── services/                   # Business logic (PDF parsing, reminders, etc.)
```

---

## License

MIT
