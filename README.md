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
- OpenSSL (for SSL certificate generation)
  - macOS: Pre-installed
  - Linux: `sudo apt install openssl` or `sudo yum install openssl`
  - Windows: `winget install OpenSSL.Light` or download from [slproweb.com](https://slproweb.com/products/Win32OpenSSL.html)

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

### 4. Generate SSL Certificate (Development)

The server runs on HTTPS, so you need to create a self-signed certificate:

**macOS / Linux:**
```bash
# Create certs directory
mkdir -p server/certs

# Get your local IP address
# macOS:
LOCAL_IP=$(ipconfig getifaddr en0)
# Linux:
# LOCAL_IP=$(hostname -I | awk '{print $1}')

echo "Your local IP: $LOCAL_IP"

# Generate self-signed certificate with local network support
openssl req -x509 -newkey rsa:4096 \
  -keyout server/certs/key.pem \
  -out server/certs/cert.pem \
  -days 365 -nodes \
  -subj "/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LOCAL_IP"
```

**Windows (PowerShell):**
```powershell
# Create certs directory
New-Item -ItemType Directory -Force -Path server\certs

# Get your local IP address
$LOCAL_IP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
Write-Host "Your local IP: $LOCAL_IP"

# Generate self-signed certificate (requires OpenSSL installed)
# Install OpenSSL: winget install OpenSSL.Light
openssl req -x509 -newkey rsa:4096 `
  -keyout server/certs/key.pem `
  -out server/certs/cert.pem `
  -days 365 -nodes `
  -subj "/CN=localhost" `
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LOCAL_IP"
```

**Windows (Git Bash):**
```bash
# Create certs directory
mkdir -p server/certs

# Get your local IP address
LOCAL_IP=$(ipconfig | grep -A 10 "Wireless\|Ethernet" | grep "IPv4" | head -1 | awk '{print $NF}')
echo "Your local IP: $LOCAL_IP"

# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout server/certs/key.pem \
  -out server/certs/cert.pem \
  -days 365 -nodes \
  -subj "//CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:$LOCAL_IP"
```

> **Note:** 
> - The `server/certs/` directory is git-ignored. Each developer needs to generate their own certificate.
> - If your IP changes, regenerate the certificate.
> - Windows users need OpenSSL installed. Install via: `winget install OpenSSL.Light` or download from [slproweb.com](https://slproweb.com/products/Win32OpenSSL.html)

### 5. Initialize Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE device_hub;"

# Run schema and seed data
cd server
bun run db:init
bun run db:seed
```

### 6. Run the application

**macOS / Linux:**
```bash
# Terminal 1 - Backend (HTTPS)
bun run --watch server/index.ts

# Terminal 2 - Frontend
bun run dev
# or
npm run dev
```

**Windows (PowerShell / CMD):**
```powershell
# Terminal 1 - Backend (HTTPS)
bun run --watch server/index.ts

# Terminal 2 - Frontend
bun run dev
# or
npm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend API: https://localhost:3001
- Local Network: https://[YOUR_IP]:3001 (e.g., https://192.168.1.100:3001)

### 7. Trust SSL Certificate (Browser)

On first access, the browser will show a security warning due to the self-signed certificate:
1. Click **Advanced**
2. Click **Proceed to localhost** (or your IP address)

> **Local Network Access:** Other devices on the same network can access the API at `https://[YOUR_IP]:3001`. They will also need to accept the certificate warning.

## Default Accounts

| Email | Password | Role |
|-------|----------|------|
| superuser@company.com | password123 | Superuser |
| alex.johnson@company.com | password123 | Admin |
| sarah.chen@company.com | password123 | User |

## Scripts

```bash
# Frontend
bun run dev          # Start development server
bun run build        # Build for production
bun run preview      # Preview production build
bun run lint         # Run linting

# Backend
cd server
bun run index.ts     # Start server
bun run db:init      # Initialize schema
bun run db:seed      # Seed sample data
```

## Project Structure

```
device-hub/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/           # React contexts (Auth, etc.)
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components
│   ├── types/              # TypeScript types
│   └── lib/                # Utilities
├── server/                 # Backend source
│   ├── certs/              # SSL certificates
│   ├── db/                 # Database (schema, seed, connection)
│   ├── middleware/         # Auth, security middleware
│   ├── routes/             # API routes
│   └── index.ts            # Server entry point
├── public/                 # Static assets
└── docs/                   # Documentation
```

## API Documentation

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for details.
