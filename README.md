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
JWT_SECRET=autocollect_jwt_secret_key_2024_prod
JWT_EXPIRE=7d
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

### 3. Seed Database

```bash
cd server
npm run seed
```

This creates:
- Admin user: `admin@autocollect.com` / `admin123`
- Default settings (business name, reminder template)
- 10 sample parties
- 15 sample bills with various statuses

### 4. Run Application

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

### Core Features
- **PDF Upload & Parsing**: Upload Pending Bills PDFs from accounting software
- **Weekly Comparison Engine**: Detects Paid, Partially Paid, and Pending invoices
- **Auto Due Date Calculation**: Bill Date + Credit Days
- **Status Tracking**: Upcoming, Due Today, Overdue, Paid, Partially Paid

### Dashboard
- 7 stat cards with real-time aggregations
- Outstanding Amount by Customer (Bar chart)
- Collection Status (Donut chart)
- Overdue Bills Trend (Area chart)
- Recent Activities feed
- Dashboard Notifications

### Party Management
- CRUD operations with card grid view
- Missing phone number detection
- City filter and search
- Auto-creation from PDF imports

### Reminder System
- Preview reminder messages before sending
- Bulk reminder sending
- WhatsApp/SMS simulation (MVP)
- Complete reminder history with logs

### Reports
- 5 report types: Pending, Overdue, Paid, Partial, Reminders
- CSV export
- Summary statistics

### Additional
- Global search (parties, bills, phone)
- Dark/Light mode toggle
- Fully responsive design
- Toast notifications
- Loading skeletons
- JWT authentication

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
