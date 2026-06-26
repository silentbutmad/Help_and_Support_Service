# Authorization & User Management Guide

## Overview

The Help & Support Service now includes comprehensive role-based access control (RBAC) with dedicated Admin and Agent user management. This allows you to create a separate admin/agent UI with proper authorization.

---

## Database Schema Updates

### New Models

#### Admin
- `id` (String) - Unique identifier (UUID)
- `userId` (String) - Reference to User (unique)
- `permissions` (String) - Admin permissions (default: "full")
- `lastLogin` (DateTime?) - Last login timestamp
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

#### Agent
- `id` (String) - Unique identifier (UUID)
- `userId` (String) - Reference to User (unique)
- `department` (String?) - Agent's department
- `specialization` (String?) - Agent's specialization
- `isAvailable` (Boolean) - Availability status (default: true)
- `ticketsAssigned` (Int) - Number of tickets assigned (default: 0)
- `lastLogin` (DateTime?) - Last login timestamp
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

### Updated User Model
- Added `isActive` field (Boolean, default: true) for soft delete
- Added relations to Admin and Agent profiles

---

## User Roles

### USER (Regular User)
- Can create support tickets
- Can view their own tickets
- Can add comments to their tickets
- Cannot access admin/agent features

### SUPPORT_AGENT
- Can view and manage all tickets
- Can update ticket status
- Can be assigned to tickets
- Can add comments to any ticket
- Can view analytics
- Can manage FAQs
- Cannot manage users

### ADMIN
- Full access to all features
- Can manage users (create, update, delete)
- Can manage agents and admins
- Can view all analytics
- Can manage FAQs
- Can manage all tickets

---

## Authorization Middleware

### Available Middleware Functions

#### `authorizeRoles(allowedRoles)`
Generic role checker that accepts single role or array of roles.

**Usage:**
```javascript
// Single role
router.get('/admin-only', verifyToken, authorizeRoles('ADMIN'), handler);

// Multiple roles
router.get('/staff', verifyToken, authorizeRoles(['ADMIN', 'SUPPORT_AGENT']), handler);
```

#### Pre-built Middleware

- `isAdmin` - Allows only ADMIN role
- `isAgent` - Allows only SUPPORT_AGENT role
- `isAdminOrAgent` - Allows ADMIN or SUPPORT_AGENT
- `canManageUsers` - Allows only ADMIN
- `canManageTickets` - Allows ADMIN or SUPPORT_AGENT
- `canViewAnalytics` - Allows ADMIN or SUPPORT_AGENT
- `canManageFaqs` - Allows ADMIN or SUPPORT_AGENT
- `isTicketOwnerOrAdminOrAgent` - Allows ticket owner, ADMIN, or SUPPORT_AGENT

---

## User Management API Endpoints

### Base Path: `/support`

### User Management (Admin Only)

#### GET `/support/users`
Get all users with filtering and pagination.

**Authentication:** Required (ADMIN only)

**Query Parameters:**
- `role` (optional) - Filter by role (USER, SUPPORT_AGENT, ADMIN)
- `isActive` (optional) - Filter by active status (true/false)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SUPPORT_AGENT",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "adminProfile": null,
      "agentProfile": {
        "id": "uuid",
        "userId": "uuid",
        "department": "Technical Support",
        "specialization": "Payment Issues",
        "isAvailable": true,
        "ticketsAssigned": 15
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

---

#### GET `/support/users/:id`
Get specific user by ID.

**Authentication:** Required (ADMIN only)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SUPPORT_AGENT",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "adminProfile": null,
    "agentProfile": {
      "id": "uuid",
      "userId": "uuid",
      "department": "Technical Support",
      "specialization": "Payment Issues",
      "isAvailable": true,
      "ticketsAssigned": 15
    },
    "tickets": [
      {
        "id": "uuid",
        "title": "Payment Issue",
        "status": "OPEN",
        "priority": "HIGH",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

#### POST `/support/users`
Create new user (Admin or Agent).

**Authentication:** Required (ADMIN only)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "SUPPORT_AGENT",
  "department": "Technical Support",
  "specialization": "Payment Issues",
  "permissions": "full"
}
```

**Required Fields:**
- `name` (String) - User's full name
- `email` (String) - User's email (must be unique)
- `password` (String) - User's password (will be hashed)
- `role` (String) - Must be "ADMIN" or "SUPPORT_AGENT"

**Optional Fields:**
- `department` (String) - For agents only
- `specialization` (String) - For agents only
- `permissions` (String) - For admins only (default: "full")

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SUPPORT_AGENT",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "adminProfile": null,
    "agentProfile": {
      "id": "uuid",
      "userId": "uuid",
      "department": "Technical Support",
      "specialization": "Payment Issues",
      "isAvailable": true,
      "ticketsAssigned": 0
    }
  }
}
```

---

#### PUT `/support/users/:id`
Update existing user.

**Authentication:** Required (ADMIN only)

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "email": "john.updated@example.com",
  "role": "ADMIN",
  "isActive": true,
  "department": "Customer Support",
  "specialization": "Login Issues",
  "permissions": "full"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "role": "ADMIN",
    "isActive": true,
    "updatedAt": "2024-01-02T00:00:00.000Z",
    "adminProfile": {
      "id": "uuid",
      "userId": "uuid",
      "permissions": "full"
    },
    "agentProfile": null
  }
}
```

---

#### DELETE `/support/users/:id`
Delete user (soft delete - sets isActive to false).

**Authentication:** Required (ADMIN only)

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** Cannot delete your own account.

---

### Agent Management (Admin Only)

#### GET `/support/agents`
Get all active agents with filtering.

**Authentication:** Required (ADMIN only)

**Query Parameters:**
- `department` (optional) - Filter by department
- `isAvailable` (optional) - Filter by availability (true/false)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "department": "Technical Support",
      "specialization": "Payment Issues",
      "isAvailable": true,
      "ticketsAssigned": 15,
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

#### PATCH `/support/agents/:id`
Update agent profile.

**Authentication:** Required (ADMIN only)

**Request Body:**
```json
{
  "department": "Customer Support",
  "specialization": "Login Issues",
  "isAvailable": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent profile updated successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "department": "Customer Support",
    "specialization": "Login Issues",
    "isAvailable": false,
    "ticketsAssigned": 15,
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

---

### Admin Management (Admin Only)

#### GET `/support/admins`
Get all active admins.

**Authentication:** Required (ADMIN only)

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "permissions": "full",
      "lastLogin": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

#### PATCH `/support/admins/:id`
Update admin permissions.

**Authentication:** Required (ADMIN only)

**Request Body:**
```json
{
  "permissions": "limited"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin permissions updated successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "permissions": "limited",
    "user": {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@example.com"
    }
  }
}
```

---

### Profile Management (All Authenticated Users)

#### GET `/support/profile`
Get current user's profile.

**Authentication:** Required (All roles)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "SUPPORT_AGENT",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "adminProfile": null,
    "agentProfile": {
      "id": "uuid",
      "userId": "uuid",
      "department": "Technical Support",
      "specialization": "Payment Issues",
      "isAvailable": true,
      "ticketsAssigned": 15
    }
  }
}
```

---

## Updated Route Protection

### Support Routes
- **Create Ticket** - All authenticated users
- **View Own Tickets** - Ticket owner, Admin, or Agent
- **View Ticket Details** - Ticket owner, Admin, or Agent
- **Update Status** - Admin or Agent only
- **Assign Ticket** - Admin or Agent only
- **Add Comment** - Ticket owner, Admin, or Agent
- **View Comments** - Ticket owner, Admin, or Agent
- **Help Center** - Public (no auth required)

### FAQ Routes
- **View FAQs** - Public (no auth required)
- **Create FAQ** - Admin or Agent only
- **Update FAQ** - Admin or Agent only
- **Delete FAQ** - Admin or Agent only

### Analytics Routes
- **All Analytics** - Admin or Agent only

### User Management Routes
- **All User Management** - Admin only
- **View Profile** - All authenticated users

---

## Getting Started

### 1. Generate Prisma Client
```bash
npx prisma generate
```

### 2. Run Database Migration
```bash
npx prisma db push
```

### 3. Create First Admin User

You need to create the first admin user directly in the database or via a script:

**Option A: Using Prisma Studio**
```bash
npx prisma studio
```
Then manually insert a user with role 'ADMIN' and create corresponding Admin record.

**Option B: Using SQL**
```sql
-- Create user
INSERT INTO "User" (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Super Admin',
  'admin@example.com',
  '$2a$10$hashed_password_here',
  'ADMIN',
  true,
  NOW(),
  NOW()
);

-- Create admin profile
INSERT INTO "admins" (id, "userId", permissions, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  (SELECT id FROM "User" WHERE email = 'admin@example.com'),
  'full',
  NOW(),
  NOW()
);
```

**Option C: Using Node.js Script**
Create a script `scripts/createAdmin.js`:
```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      adminProfile: {
        create: {
          permissions: 'full'
        }
      }
    }
  });
  
  console.log('Admin created:', user);
}

createAdmin();
```

Run: `node scripts/createAdmin.js`

---

## Creating Admin/Agent Users

### Via API (After First Admin is Created)

**Create Agent:**
```bash
POST /support/users
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: application/json

Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "agent123",
  "role": "SUPPORT_AGENT",
  "department": "Technical Support",
  "specialization": "Payment Issues"
}
```

**Create Admin:**
```bash
POST /support/users
Headers:
  Authorization: Bearer <admin_token>
  Content-Type: application/json

Body:
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "admin123",
  "role": "ADMIN",
  "permissions": "full"
}
```

---

## React Admin/Agent UI Integration

### Authentication Flow

1. **Login Endpoint** (You need to create this in your auth service or add it here)
   - User logs in with email/password
   - Server returns JWT token with user role
   - Store token in localStorage/context

2. **Role-Based Routing in React**
```javascript
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function ProtectedRoute({ children, allowedRoles }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Fetch user profile
    fetch('/support/profile', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => setUser(data.data));
  }, []);
  
  if (!user) return <div>Loading...</div>;
  
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/agent" element={
          <ProtectedRoute allowedRoles={['SUPPORT_AGENT', 'ADMIN']}>
            <AgentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/user" element={
          <ProtectedRoute allowedRoles={['USER', 'SUPPORT_AGENT', 'ADMIN']}>
            <UserDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

### Example Admin Dashboard Features

```javascript
// AdminDashboard.jsx
function AdminDashboard() {
  const [stats, setStats] = useState({});
  
  useEffect(() => {
    // Fetch analytics
    fetch('/support/analytics/dashboard', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => setStats(data.data));
  }, []);
  
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div className="stats">
        <div>Total Tickets: {stats.totalTickets}</div>
        <div>Open: {stats.statusBreakdown?.open}</div>
        <div>In Progress: {stats.statusBreakdown?.inProgress}</div>
      </div>
      
      {/* User Management */}
      <UserManagement />
      
      {/* Agent Management */}
      <AgentManagement />
    </div>
  );
}
```

### Example Agent Dashboard Features

```javascript
// AgentDashboard.jsx
function AgentDashboard() {
  const [myTickets, setMyTickets] = useState([]);
  
  useEffect(() => {
    // Fetch assigned tickets
    fetch('/support/tickets?assignedTo=me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => setMyTickets(data.data));
  }, []);
  
  return (
    <div>
      <h1>Agent Dashboard</h1>
      <div className="my-tickets">
        <h2>My Assigned Tickets</h2>
        {myTickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
}
```

---

## Security Best Practices

1. **Password Hashing**: All passwords are hashed using bcryptjs with 10 salt rounds
2. **JWT Tokens**: Use secure JWT tokens with expiration
3. **Role Verification**: All protected routes verify user role
4. **Soft Delete**: Users are soft-deleted (isActive flag) to maintain data integrity
5. **Cascade Delete**: Deleting a user cascades to Admin/Agent profiles
6. **Input Validation**: All inputs are validated before processing
7. **SQL Injection Protection**: Prisma ORM prevents SQL injection
8. **Rate Limiting**: API endpoints have rate limiting enabled

---

## Testing the Authorization

### Test as Regular User
```bash
# Should succeed
curl -H "Authorization: Bearer <user_token>" http://localhost:5003/support/tickets

# Should fail (403)
curl -H "Authorization: Bearer <user_token>" http://localhost:5003/support/users
```

### Test as Agent
```bash
# Should succeed
curl -H "Authorization: Bearer <agent_token>" http://localhost:5003/support/tickets

# Should succeed
curl -H "Authorization: Bearer <agent_token>" http://localhost:5003/support/analytics/dashboard

# Should fail (403)
curl -H "Authorization: Bearer <agent_token>" http://localhost:5003/support/users
```

### Test as Admin
```bash
# Should succeed
curl -H "Authorization: Bearer <admin_token>" http://localhost:5003/support/tickets

# Should succeed
curl -H "Authorization: Bearer <admin_token>" http://localhost:5003/support/users

# Should succeed
curl -H "Authorization: Bearer <admin_token>" http://localhost:5003/support/agents
```

---

## Migration Notes

### For Existing Databases

If you have an existing database with users, you need to:

1. **Add isActive column:**
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;
```

2. **Create Admin and Agent tables:**
```sql
CREATE TABLE IF NOT EXISTS "admins" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "permissions" TEXT DEFAULT 'full',
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "agents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "department" TEXT,
  "specialization" TEXT,
  "isAvailable" BOOLEAN DEFAULT true,
  "ticketsAssigned" INTEGER DEFAULT 0,
  "lastLogin" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "admins_userId_key" ON "admins"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "agents_userId_key" ON "agents"("userId");

-- Add foreign keys
ALTER TABLE "admins" ADD CONSTRAINT "admins_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
ALTER TABLE "agents" ADD CONSTRAINT "agents_userId_fkey" 
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
```

3. **Update existing users:**
```sql
UPDATE "User" SET "isActive" = true WHERE "isActive" IS NULL;
```

---

## Summary

The authorization system provides:
- ✅ Role-based access control (USER, SUPPORT_AGENT, ADMIN)
- ✅ Dedicated Admin and Agent profiles
- ✅ Comprehensive user management API
- ✅ Middleware for easy route protection
- ✅ Soft delete for users
- ✅ Ticket ownership verification
- ✅ Ready for React admin/agent UI integration

All routes are now properly protected based on user roles, and you can build a separate React UI for admin and agent users with confidence that the backend is secure and properly authorized.