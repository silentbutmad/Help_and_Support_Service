# Help & Support Microservice

A production-ready Help & Support microservice built with Node.js, Express.js, Prisma ORM, and Neon PostgreSQL.

## Features

- **Ticket Management**: Create, update, assign, and track support tickets
- **Ticket Status Tracking**: Open, In Progress, Resolved, Closed
- **Comments System**: Add and retrieve comments on tickets
- **Ticket History**: Complete audit trail of status changes
- **FAQ Management**: Create, update, and delete FAQs
- **Analytics Dashboard**: Comprehensive metrics and insights
- **Email Notifications**: Automated notifications for ticket events
- **WhatsApp Notifications**: Optional WhatsApp integration via Twilio
- **Role-Based Access**: USER, SUPPORT_AGENT, ADMIN roles
- **Rate Limiting**: Protection against abuse
- **Winston Logging**: Comprehensive logging with daily rotation
- **Health Check**: Service health monitoring endpoint

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: Neon PostgreSQL
- **Authentication**: JWT
- **Email**: Nodemailer
- **WhatsApp**: Twilio (optional)
- **Logging**: Winston

## Project Structure

```
support-service/
│
├── src/
│   ├── controllers/
│   │   ├── supportController.js      # Ticket and comment operations
│   │   ├── faqController.js          # FAQ CRUD operations
│   │   └── analyticsController.js    # Analytics and metrics
│   │
│   ├── services/
│   │   ├── supportService.js         # Business logic for tickets
│   │   └── notificationService.js    # Email and WhatsApp notifications
│   │
│   ├── routes/
│   │   ├── supportRoutes.js          # Ticket and help routes
│   │   ├── faqRoutes.js              # FAQ routes
│   │   └── analyticsRoutes.js        # Analytics routes
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT authentication & authorization
│   │   ├── errorMiddleware.js        # Error handling
│   │   └── rateLimiter.js            # Rate limiting
│   │
│   ├── prisma/
│   │   └── schema.prisma             # Database schema
│   │
│   ├── utils/
│   │   └── logger.js                 # Winston logger configuration
│   │
│   ├── app.js                        # Express app configuration
│   └── server.js                     # Server entry point
│
├── .env.example                      # Environment variables template
├── .gitignore                        # Git ignore rules
├── Dockerfile                        # Docker configuration
├── docker-compose.yml                # Docker Compose configuration
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Neon PostgreSQL database
- (Optional) Gmail account for email notifications
- (Optional) Twilio account for WhatsApp notifications

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd support-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=support@company.com

# Twilio WhatsApp (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

5. Set up the database:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

6. Start the development server:
```bash
npm run dev
```

The service will be available at `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Support Tickets
- `POST /support/tickets` - Create a new ticket (Authenticated)
- `GET /support/tickets/user/:userId` - Get user's tickets (Authenticated)
- `GET /support/tickets/:id` - Get ticket by ID (Authenticated)
- `PATCH /support/tickets/:id/status` - Update ticket status (Support Agent/Admin)
- `PATCH /support/tickets/:id/assign` - Assign ticket to agent (Support Agent/Admin)
- `POST /support/tickets/:id/comments` - Add comment to ticket (Authenticated)
- `GET /support/tickets/:id/comments` - Get ticket comments (Authenticated)

### FAQs
- `GET /support/faqs` - Get all FAQs (Public)
- `POST /support/faqs` - Create FAQ (Admin only)
- `PUT /support/faqs/:id` - Update FAQ (Admin only)
- `DELETE /support/faqs/:id` - Delete FAQ (Admin only)

### Help Center
- `GET /support/help` - Get help center information (Public)

### Analytics (Support Agent/Admin only)
- `GET /support/analytics/total` - Total tickets count
- `GET /support/analytics/status` - Tickets grouped by status
- `GET /support/analytics/priority` - Tickets grouped by priority
- `GET /support/analytics/issue-type` - Tickets grouped by issue type
- `GET /support/analytics/resolution-time` - Average resolution time
- `GET /support/analytics/dashboard` - Dashboard metrics

## User Roles

- **USER**: Can create tickets, view their own tickets, add comments
- **SUPPORT_AGENT**: Can update ticket status, assign tickets, view analytics
- **ADMIN**: Full access including FAQ management

## Database Schema

### User
- id, name, email, password, role, timestamps

### Ticket
- id, userId, title, description, issueType, priority, status, assignedAgent, timestamps

### Comment
- id, ticketId, message, userId, createdAt

### TicketHistory
- id, ticketId, oldStatus, newStatus, changedBy, createdAt

### FAQ
- id, question, answer, category, timestamps

## Notifications

The service sends notifications for:
- Ticket creation (email to user)
- Ticket assignment (email to agent)
- Status changes (email to user)
- New comments (email to ticket owner)

## Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Docker Deployment

### Using Docker Compose (Recommended)

1. Build and start the service:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop the service:
```bash
docker-compose down
```

### Using Docker

1. Build the image:
```bash
docker build -t help-support-service .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env help-support-service
```

## Environment Variables

See `.env.example` for all available configuration options.

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting to prevent abuse
- CORS configuration
- Request validation
- Centralized error handling
- Comprehensive logging
- SQL injection prevention (via Prisma ORM)

## Logging

Logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

Logs are rotated daily and kept for 14 days.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Support

For support, email support@company.com or call +91XXXXXXXXXX