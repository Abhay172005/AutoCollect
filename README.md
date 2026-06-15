# AutoCollect – Smart Receivables & Payment Reminder System

A full-stack MERN application for B2B merchants to automate payment follow-ups by importing weekly Pending Bills PDFs, tracking payment status, and sending reminders.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS, React Router, Recharts, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **PDF Parsing**: pdf-parse
- **File Upload**: Multer

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Setup Environment

Copy `.env` in the root and update if needed:

```
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
cd server
npm install

# Client
cd ../client
npm install
```

### 3. Run Application

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Features

### Enterprise SaaS Architecture
- **Multi-Tenant System**: Fully isolated data per merchant (`merchantId`), allowing multiple businesses to use the platform securely.
- **JWT Authentication**: Secure registration, login, and protected routes.

### Premium UI/UX
- **Linear/Vercel Inspired Design**: Ultra-sleek dark mode (deep true black), subtle glassmorphism, and highly polished typography.
- **Dynamic Theming**: Seamless native light/dark mode toggles across all screens including the landing, login, and dashboard pages.
- **Animated Data States**: Beautiful extraction loading states and 3-step onboarding empty states.
- **Responsive Tables**: Sticky headers with backdrop blur for managing thousands of rows flawlessly.

### Core Receivables Automation
- **Smart PDF/Excel Upload**: Upload pending bills from Tally, Busy, or Marg. 
- **Auto-Matching & Extraction**: Intelligently extracts Bill Numbers, Party Names, and Amounts to match to existing customers.
- **Weekly Comparison Engine**: Detects Paid, Partially Paid, and Pending invoices automatically on new uploads.

### Dashboard & Analytics
- **Highlight Metrics**: Prominent pulsing alerts for "Overdue" and "Due Today" invoices.
- **Quick Actions**: Direct 1-click access to add parties or upload new ERP data.
- **Visual Insights**: Outstanding Amount by Customer (Bar), Collection Status (Donut), Overdue Trend (Area).

### Twilio Reminders Integration
- **Real WhatsApp/SMS**: Configured to use the Twilio API to fire off professional payment reminders.
- **One-Click Send**: Trigger reminders for all overdue bills instantly.
- **Reminder History**: Full log of all communication sent to parties.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Admin login |
| GET | /api/auth/me | Current user |
| POST | /api/upload | Upload & parse PDF |
| GET | /api/bills | List bills (search, filter, sort, pagination) |
| GET | /api/bills/export/csv | Export bills CSV |
| GET/POST/PUT/DELETE | /api/parties | Party CRUD |
| GET | /api/reminders/due | Bills due for reminders |
| POST | /api/reminders/send | Send reminder |
| GET | /api/reminders/history | Reminder history |
| GET | /api/reports/:type | Generate reports |
| GET | /api/dashboard/stats | Dashboard statistics |
| GET | /api/settings | Get/Update settings |
| GET | /api/search?q= | Global search |

## Folder Structure

```
AutoCollect/
├── client/
│   └── src/
│       ├── components/layout/   # Sidebar, Navbar, Layout
│       ├── contexts/            # Auth, Theme providers
│       ├── pages/               # All page components
│       └── services/            # API service layer
├── server/
│   ├── config/                  # DB connection
│   ├── controllers/             # Route handlers
│   ├── middleware/               # Auth, Upload, Error
│   ├── models/                  # Mongoose schemas
│   ├── routes/                  # Express routes
│   ├── services/                # Business logic
│   └── seed.js                  # Database seeder
└── .env                         # Environment config
```

## License

MIT
