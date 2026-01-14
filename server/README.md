# Device Hub Backend

A Bun-based REST API server for the Device Hub application, using MySQL for data persistence with optimized connection pooling and production-ready features.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.2.21 (with native MySQL support)
- MySQL 8.0+

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=device_hub

# Connection Pool Settings (optional - sensible defaults provided)
DB_POOL_MAX=20              # Maximum concurrent connections
DB_IDLE_TIMEOUT=30          # Close idle connections after N seconds
DB_MAX_LIFETIME=3600        # Max connection lifetime in seconds (1 hour)
DB_CONNECTION_TIMEOUT=10    # Connection timeout in seconds

# SSL/TLS Settings (for production)
DB_SSL=false                        # Enable SSL (set to 'true' for production)
DB_SSL_REJECT_UNAUTHORIZED=true     # Reject unauthorized certificates
DB_SSL_CA=/path/to/ca.pem          # Path to CA certificate (optional)

# Server Configuration
PORT=3001
CORS_ORIGIN=http://localhost:5173

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend Configuration (for Vite)
VITE_API_URL=https://localhost:3001/api
```

### Production Configuration

For production environments, we recommend:

```env
# Production database settings
DB_POOL_MAX=50
DB_IDLE_TIMEOUT=60
DB_MAX_LIFETIME=1800
DB_CONNECTION_TIMEOUT=30
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Database Setup

1. Create the database:

```sql
CREATE DATABASE device_hub;
```

2. Initialize the schema:

```bash
bun run db:init
```

3. Seed the database with sample data:

```bash
bun run db:seed
```

Or reset everything at once:

```bash
bun run db:reset
```

## Running the Server

Development mode (with hot reload):

```bash
bun run server:dev
```

Production mode:

```bash
bun run server
```

Run both frontend and backend:

```bash
bun run dev:all
```

## API Endpoints

### Health & Monitoring

| Endpoint          | Description                                     |
| ----------------- | ----------------------------------------------- |
| `GET /api/health` | Detailed health check with database pool status |

**Health Check Response Example:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "database": {
    "healthy": true,
    "pool": {
      "active": 2,
      "idle": 18,
      "total": 20
    }
  }
}
```

### Authentication

- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/signup` - Register new user
- `GET /api/auth/me` - Get current user (requires auth)

### Users

- `GET /api/users` - List all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Departments

- `GET /api/departments` - List all departments
- `GET /api/departments/:id` - Get department by ID
- `POST /api/departments` - Create department (admin only)
- `PUT /api/departments/:id` - Update department (admin only)
- `DELETE /api/departments/:id` - Delete department (admin only)

### Equipment

- `GET /api/equipment` - List all equipment (with filtering)
- `GET /api/equipment/:id` - Get equipment by ID
- `POST /api/equipment` - Create equipment (admin only)
- `PUT /api/equipment/:id` - Update equipment (admin only)
- `DELETE /api/equipment/:id` - Delete equipment (admin only)
- `GET /api/equipment/category/:category` - Get by category
- `GET /api/equipment/status/:status` - Get by status

### Borrowing Requests

- `GET /api/borrowing` - List borrowing requests
- `GET /api/borrowing/:id` - Get request by ID
- `POST /api/borrowing` - Create borrowing request
- `PATCH /api/borrowing/:id/status` - Update request status
- `GET /api/borrowing/user/:userId` - Get requests by user
- `GET /api/borrowing/status/:status` - Get requests by status

### Return Requests

- `GET /api/returns` - List return requests
- `GET /api/returns/:id` - Get return by ID
- `POST /api/returns` - Create return request

## Connection Pool Features

The server uses Bun's native SQL API with optimized connection pooling:

- **Automatic Connection Management**: Connections are automatically created, reused, and released
- **Connection Limits**: Configurable maximum pool size to prevent overwhelming the database
- **Idle Timeout**: Connections are closed after being idle to free resources
- **Connection Lifetime**: Prevents stale connections with maximum lifetime settings
- **SSL/TLS Support**: Secure connections for production environments
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Graceful Shutdown**: Clean connection cleanup on SIGINT/SIGTERM

## Error Handling

The server includes comprehensive error handling:

- **DatabaseError**: Custom error class with error codes and query context
- **Retry Logic**: Automatic retries for connection issues and deadlocks
- **Graceful Degradation**: Health endpoints report degraded status instead of failing

### Retryable Errors

The following errors are automatically retried:

- Connection reset/refused/timeout
- Lock deadlocks and wait timeouts
- Protocol connection lost

## Testing

Run server tests:

```bash
bun run test:server
```

Run all tests (frontend + backend):

```bash
bun run test:all
```

## Demo Credentials

After seeding the database:

**Admin:**

- Username: `alex.johnson@company.com`
- Password: `password123`

**User:**

- Username: `sarah.chen@company.com`
- Password: `password123`

Note: The seed data uses placeholder password hashes. For the demo to work properly, you'll need to either:

1. Update the seed.sql with properly hashed passwords
2. Register new users through the signup flow
