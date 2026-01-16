# Device Hub

Internal device management system for enterprises - allows employees to borrow/return devices, manage device inventory, and track usage history.

## Key Features

- **Device Management**: Laptops, phones, tablets, monitors, accessories
- **Borrow/Return Workflow**: Request, extend, and return devices
- **User Management**: Role-based access control
- **Department Management**: Organized by department
- **Notifications**: In-app notification system
- **Audit Log**: Track all changes and activities

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router

**Backend:**
- Bun runtime
- MySQL database
- JWT authentication (cookie-based)
- Argon2id password hashing

## Requirements

- Node.js 18+ or Bun 1.0+
- MySQL 8.0+


## Installation

### 1. Clone repository

```bash
git clone <repository-url>
cd device-hub
```

### 2. Install dependencies

```bash
# Frontend
bun install
# or
npm install

# Backend
cd server
bun install
```

### 3. Configure environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

```env
# API URL (HTTPS)
VITE_API_URL=https://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=device_hub
DB_SSL=true
```

### 4. Database Setup

Ensure your MySQL server is running and you have created the database.

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE device_hub;"

# Run schema and seed data
cd server
bun run db:init
bun run db:seed
```

### 5. Start the Application

The easiest way to start both frontend and backend is:

```bash
bun run dev:all
```

Or run them separately:

```bash
# Terminal 1 - Backend
bun run server/index.ts

# Terminal 2 - Frontend
bun run dev
```

> **Note on HTTPS:**
> - The Frontend uses `vite-plugin-mkcert` to automatically generate locally trusted SSL certificates.
> - The Backend runs on HTTP (port 3001) by default for local development. The frontend proxies API requests to it.


Access:
- Frontend: https://localhost:8080 (or similar)
- Backend API: http://localhost:3001

## Default Accounts

| Email | Password | Role |
|-------|----------|------|
| superuser@company.com | password123 | Superuser |
| alex.johnson@company.com | password123 | Admin |
| sarah.chen@company.com | password123 | User |

## Scripts

```bash
# Development
bun run dev:all        # Start both frontend and backend
bun run dev            # Start frontend only
bun run dev:server     # Start backend only

# Build & Preview
bun run build          # Build for production
bun run preview        # Preview production build

# Code Quality
bun run lint           # Run linting
bun run test           # Run server tests

# Database
bun run db:init        # Initialize schema
bun run db:seed        # Seed sample data
bun run db:reset       # Reset database (drop & re-init)
```

## Project Structure

```
device-hub/
├── src/                    # Frontend source (React 19)
│   ├── components/         # React components
│   ├── contexts/           # Global state contexts
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Route pages
│   ├── types/              # Frontend types
│   └── lib/                # Utilities and API clients
├── server/                 # Backend source (Bun)
│   ├── db/                 # Database schema and connection
│   ├── middleware/         # Express-like middleware
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── scripts/            # Maintenance scripts
│   ├── mattermost/         # Mattermost bot integration
│   └── index.ts            # Server entry point
├── public/                 # Static assets
└── docs/                   # Documentation
```

## API Documentation

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for details.

### Mattermost Integration

See [docs/mattermost-bot-guide.md](docs/mattermost-bot-guide.md) for details on configuring and using the Mattermost bot.
