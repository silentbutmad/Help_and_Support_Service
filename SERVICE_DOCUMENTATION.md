# Help & Support Service Documentation

## Overview

The Help & Support Service is a microservice backend built with Express.js and Prisma ORM that provides comprehensive customer support functionality. It handles support ticket management, FAQ management, analytics, and multi-channel notifications (email and WhatsApp).

### Key Features
- Support ticket creation and management
- Ticket status tracking and assignment
- Comment system for tickets
- FAQ (Frequently Asked Questions) management
- Analytics and reporting
- Email notifications via Nodemailer
- WhatsApp notifications via Twilio
- JWT-based authentication
- Rate limiting
- Service discovery with Eureka
- Comprehensive logging with Winston

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [Services](#services)
   - [Support Service](#support-service)
   - [Notification Service](#notification-service)
3. [Controllers](#controllers)
   - [Support Controller](#support-controller)
   - [FAQ Controller](#faq-controller)
   - [Analytics Controller](#analytics-controller)
4. [Routes](#routes)
   - [Support Routes](#support-routes)
   - [FAQ Routes](#faq-routes)
   - [Analytics Routes](#analytics-routes)
5. [Middleware](#middleware)
   - [Authentication Middleware](#authentication-middleware)
   - [Error Handling Middleware](#error-handling-middleware)
   - [Rate Limiter Middleware](#rate-limiter-middleware)
6. [Main Application](#main-application)

---

## Database Schema

### Enums

#### TicketStatus
- `OPEN` - Ticket has been created but not yet addressed
- `IN_PROGRESS` - Ticket is being worked on
- `RESOLVED` - Ticket issue has been resolved
- `CLOSED` - Ticket has been closed

#### Priority
- `LOW` - Low priority issue
- `MEDIUM` - Medium priority issue
- `HIGH` - High priority issue
- `CRITICAL` - Critical priority issue requiring immediate attention

#### IssueType
- `PAYMENT` - Payment-related issues
- `LOGIN` - Login/authentication issues
- `ACCOUNT` - Account-related issues
- `EXPENSE` - Expense-related issues
- `BUG` - Bug reports
- `FEATURE_REQUEST` - Feature requests
- `OTHER` - Other types of issues

#### UserRole
- `USER` - Regular user
- `SUPPORT_AGENT` - Support agent
- `ADMIN` - Administrator

### Models

#### User
- `id` (String) - Unique identifier (UUID)
- `name` (String) - User's full name
- `email` (String) - User's email (unique)
- `password` (String) - Hashed password
- `role` (UserRole) - User role (default: USER)
- `createdAt` (DateTime) - Account creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `tickets` (Ticket[]) - Related tickets

#### Ticket
- `id` (String) - Unique identifier (UUID)
- `userId` (String) - Reference to user who created the ticket
- `title` (String) - Ticket title
- `description` (String) - Detailed description of the issue
- `issueType` (IssueType) - Category of the issue
- `priority` (Priority) - Priority level
- `status` (TicketStatus) - Current status (default: OPEN)
- `assignedAgent` (String?) - Assigned support agent ID (optional)
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp
- `user` (User) - Related user
- `comments` (Comment[]) - Related comments
- `history` (TicketHistory[]) - Status change history

#### Comment
- `id` (String) - Unique identifier (UUID)
- `ticketId` (String) - Reference to ticket
- `message` (String) - Comment content
- `createdAt` (DateTime) - Creation timestamp
- `ticket` (Ticket) - Related ticket

#### TicketHistory
- `id` (String) - Unique identifier (UUID)
- `ticketId` (String) - Reference to ticket
- `oldStatus` (TicketStatus?) - Previous status (optional)
- `newStatus` (TicketStatus) - New status
- `changedBy` (String) - User ID who made the change
- `createdAt` (DateTime) - Change timestamp
- `ticket` (Ticket) - Related ticket

#### FAQ
- `id` (String) - Unique identifier (UUID)
- `question` (String) - FAQ question
- `answer` (String) - FAQ answer
- `category` (String) - FAQ category
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

---

## Services

### Support Service

**File:** `services/supportService.js`

#### Functions

##### `createTicket({ userId, title, description, issueType, priority })`
**Purpose:** Creates a new support ticket and sends notification to the user.

**Parameters:**
- `userId` (String) - ID of the user creating the ticket
- `title` (String) - Ticket title
- `description` (String) - Detailed description of the issue
- `issueType` (IssueType) - Category of the issue
- `priority` (Priority) - Priority level

**Returns:** Promise<Ticket> - The created ticket object with user details

**Process:**
1. Creates a new ticket in the database with the provided details
2. Includes user information (id, name, email) in the response
3. Sends a ticket creation notification email to the user
4. Logs the successful creation
5. Returns the ticket object

**Error Handling:** Throws error if ticket creation fails

---

##### `getUserTickets(userId, filters)`
**Purpose:** Retrieves paginated list of tickets for a specific user with optional filtering.

**Parameters:**
- `userId` (String) - ID of the user
- `filters` (Object):
  - `status` (TicketStatus?) - Filter by status
  - `priority` (Priority?) - Filter by priority
  - `issueType` (IssueType?) - Filter by issue type
  - `page` (Number) - Page number (default: 1)
  - `limit` (Number) - Items per page (default: 10)

**Returns:** Promise<Object> - Object containing:
- `tickets` (Array) - List of tickets with user and latest comment
- `total` (Number) - Total number of tickets
- `page` (Number) - Current page
- `limit` (Number) - Items per page

**Process:**
1. Calculates skip value based on page and limit
2. Builds where clause with optional filters
3. Executes parallel queries to get tickets and total count
4. Orders tickets by creation date (newest first)
5. Includes user details and latest comment for each ticket
6. Returns paginated results

**Error Handling:** Throws error if fetching fails

---

##### `getTicketById(ticketId)`
**Purpose:** Retrieves detailed information about a specific ticket including all comments and history.

**Parameters:**
- `ticketId` (String) - ID of the ticket

**Returns:** Promise<Ticket> - Ticket object with user, all comments, and history

**Process:**
1. Fetches ticket by ID from database
2. Includes user information
3. Includes all comments ordered by creation date
4. Includes complete ticket history ordered by creation date
5. Throws error if ticket not found
6. Returns complete ticket details

**Error Handling:** Throws error if ticket not found or fetch fails

---

##### `updateTicketStatus(ticketId, newStatus, changedBy)`
**Purpose:** Updates the status of a ticket and records the change in history.

**Parameters:**
- `ticketId` (String) - ID of the ticket
- `newStatus` (TicketStatus) - New status to set
- `changedBy` (String) - User ID who is making the change

**Returns:** Promise<Ticket> - Updated ticket object with user details

**Process:**
1. Fetches current ticket to verify it exists
2. Stores old status for history
3. Updates ticket status in database
4. Creates a history record with old status, new status, and who changed it
5. Sends status change notification email to ticket owner
6. Logs the status change
7. Returns updated ticket

**Error Handling:** Throws error if ticket not found or update fails

---

##### `assignTicket(ticketId, agentId, assignedBy)`
**Purpose:** Assigns a ticket to a support agent and updates status to IN_PROGRESS.

**Parameters:**
- `ticketId` (String) - ID of the ticket
- `agentId` (String) - ID of the support agent
- `assignedBy` (String) - User ID who is making the assignment

**Returns:** Promise<Ticket> - Updated ticket object with user details

**Process:**
1. Fetches ticket to verify it exists
2. Fetches agent details to verify agent exists
3. Updates ticket with assigned agent and sets status to IN_PROGRESS
4. Creates history record for status change
5. Sends assignment notification email to the agent
6. Logs the assignment
7. Returns updated ticket

**Error Handling:** Throws error if ticket or agent not found, or assignment fails

---

##### `addComment(ticketId, message, userId)`
**Purpose:** Adds a comment to a ticket and notifies relevant parties.

**Parameters:**
- `ticketId` (String) - ID of the ticket
- `message` (String) - Comment content
- `userId` (String) - User ID adding the comment

**Returns:** Promise<Comment> - Created comment object with user details

**Process:**
1. Fetches ticket to verify it exists
2. Creates new comment in database
3. Includes user information in response
4. Sends new comment notification email to ticket owner
5. Logs the comment addition
6. Returns created comment

**Error Handling:** Throws error if ticket not found or comment creation fails

---

##### `getComments(ticketId, { page, limit })`
**Purpose:** Retrieves paginated comments for a specific ticket.

**Parameters:**
- `ticketId` (String) - ID of the ticket
- `page` (Number) - Page number (default: 1)
- `limit` (Number) - Items per page (default: 50)

**Returns:** Promise<Object> - Object containing:
- `comments` (Array) - List of comments with user details
- `total` (Number) - Total number of comments
- `page` (Number) - Current page
- `limit` (Number) - Items per page

**Process:**
1. Calculates skip value based on page and limit
2. Verifies ticket exists
3. Executes parallel queries to get comments and total count
4. Orders comments by creation date (newest first)
5. Includes user information for each comment
6. Returns paginated results

**Error Handling:** Throws error if ticket not found or fetch fails

---

##### `getHelpCenter()`
**Purpose:** Retrieves help center contact information from environment variables.

**Parameters:** None

**Returns:** Promise<Object> - Help center information:
- `whatsapp` (String) - WhatsApp support number
- `callUs` (String) - Phone support number
- `email` (String) - Support email address
- `workingHours` (String) - Support working hours
- `address` (String) - Company address
- `website` (String) - Company website

**Process:**
1. Reads configuration from environment variables
2. Provides default values if environment variables not set
3. Returns help center information object

**Error Handling:** Throws error if retrieval fails

---

### Notification Service

**File:** `services/notificationService.js`

#### Functions

##### `initializeEmailTransporter()`
**Purpose:** Initializes the Nodemailer email transporter with configuration from environment variables.

**Parameters:** None

**Returns:** Promise<Transporter | null> - Email transporter instance or null if configuration missing

**Process:**
1. Checks if email configuration exists (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)
2. Creates Nodemailer transporter with SMTP configuration
3. Logs success or warning message
4. Returns transporter instance

**Error Handling:** Returns null if configuration missing or initialization fails

---

##### `sendEmail(to, subject, html)`
**Purpose:** Sends an email to a recipient.

**Parameters:**
- `to` (String) - Recipient email address
- `subject` (String) - Email subject
- `html` (String) - HTML content of the email

**Returns:** Promise<Boolean> - True if email sent successfully, false otherwise

**Process:**
1. Initializes transporter if not already initialized
2. Checks if transporter is configured
3. Sends email using Nodemailer
4. Logs success or failure
5. Returns success status

**Error Handling:** Returns false if email sending fails

---

##### `sendTicketCreatedNotification(ticket)`
**Purpose:** Sends email notification to user when a ticket is created.

**Parameters:**
- `ticket` (Ticket) - Ticket object with user details

**Returns:** Promise<void>

**Process:**
1. Constructs HTML email with ticket details
2. Includes ticket ID, title, issue type, priority, status, and creation date
3. Sends email to ticket owner
4. No return value

**Error Handling:** Silently fails, logs error

---

##### `sendTicketAssignedNotification(ticket, agent)`
**Purpose:** Sends email notification to agent when a ticket is assigned.

**Parameters:**
- `ticket` (Ticket) - Ticket object with user details
- `agent` (User) - Agent object with name and email

**Returns:** Promise<void>

**Process:**
1. Constructs HTML email with ticket and agent details
2. Includes ticket information and user details
3. Sends email to assigned agent
4. No return value

**Error Handling:** Silently fails, logs error

---

##### `sendStatusChangeNotification(ticket, oldStatus, newStatus)`
**Purpose:** Sends email notification to user when ticket status changes.

**Parameters:**
- `ticket` (Ticket) - Ticket object with user details
- `oldStatus` (TicketStatus) - Previous status
- `newStatus` (TicketStatus) - New status

**Returns:** Promise<void>

**Process:**
1. Constructs HTML email with status change details
2. Shows old and new status
3. Sends email to ticket owner
4. No return value

**Error Handling:** Silently fails, logs error

---

##### `sendNewCommentNotification(ticket, comment)`
**Purpose:** Sends email notification to user when a new comment is added.

**Parameters:**
- `ticket` (Ticket) - Ticket object with user details
- `comment` (Comment) - Comment object with message and user details

**Returns:** Promise<void>

**Process:**
1. Constructs HTML email with comment details
2. Includes comment message, author name, and timestamp
3. Sends email to ticket owner
4. No return value

**Error Handling:** Silently fails, logs error

---

##### `sendWhatsAppNotification(phoneNumber, message)`
**Purpose:** Sends WhatsApp message using Twilio API.

**Parameters:**
- `phoneNumber` (String) - Recipient phone number
- `message` (String) - Message content

**Returns:** Promise<Boolean> - True if message sent successfully, false otherwise

**Process:**
1. Checks if Twilio configuration exists
2. Initializes Twilio client with credentials
3. Sends WhatsApp message
4. Logs success or failure
5. Returns success status

**Error Handling:** Returns false if configuration missing or sending fails

---

## Controllers

### Support Controller

**File:** `controllers/supportController.js`

#### Functions

##### `createTicket(req, res)`
**Purpose:** HTTP handler for creating a new support ticket.

**Route:** `POST /support/tickets`

**Authentication:** Required (verifyToken middleware)

**Request Body:**
- `title` (String, required) - Ticket title
- `description` (String, required) - Issue description
- `issueType` (IssueType, required) - Category of issue
- `priority` (Priority, required) - Priority level

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": { /* ticket object */ }
}
```

**Process:**
1. Extracts user ID from authenticated request
2. Validates request body
3. Calls supportService.createTicket()
4. Logs ticket creation
5. Returns success response with ticket data

---

##### `getUserTickets(req, res)`
**Purpose:** HTTP handler for retrieving user's tickets with filtering and pagination.

**Route:** `GET /support/tickets/user/:userId`

**Authentication:** Required (verifyToken middleware)

**Query Parameters:**
- `status` (TicketStatus, optional) - Filter by status
- `priority` (Priority, optional) - Filter by priority
- `issueType` (IssueType, optional) - Filter by issue type
- `page` (Number, optional) - Page number (default: 1)
- `limit` (Number, optional) - Items per page (default: 10)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [ /* array of tickets */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

**Process:**
1. Extracts user ID from route params
2. Extracts filter and pagination parameters from query
3. Calls supportService.getUserTickets()
4. Returns tickets with pagination metadata

---

##### `getTicketById(req, res)`
**Purpose:** HTTP handler for retrieving a specific ticket with full details.

**Route:** `GET /support/tickets/:id`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - Ticket ID

**Response:** 200 OK
```json
{
  "success": true,
  "data": { /* ticket object with comments and history */ }
}
```

**Process:**
1. Extracts ticket ID from route params
2. Calls supportService.getTicketById()
3. Returns complete ticket details

---

##### `updateTicketStatus(req, res)`
**Purpose:** HTTP handler for updating ticket status.

**Route:** `PATCH /support/tickets/:id/status`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - Ticket ID

**Request Body:**
- `status` (TicketStatus, required) - New status

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Ticket status updated successfully",
  "data": { /* updated ticket object */ }
}
```

**Process:**
1. Extracts ticket ID from route params
2. Extracts new status from request body
3. Extracts user ID from authenticated request
4. Calls supportService.updateTicketStatus()
5. Logs status change
6. Returns success response

---

##### `assignTicket(req, res)`
**Purpose:** HTTP handler for assigning a ticket to a support agent.

**Route:** `PATCH /support/tickets/:id/assign`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - Ticket ID

**Request Body:**
- `agentId` (String, required) - Agent user ID

**Response:** 200 OK
```json
{
  "success": true,
  "message": "Ticket assigned successfully",
  "data": { /* updated ticket object */ }
}
```

**Process:**
1. Extracts ticket ID from route params
2. Extracts agent ID from request body
3. Extracts user ID from authenticated request
4. Calls supportService.assignTicket()
5. Logs assignment
6. Returns success response

---

##### `addComment(req, res)`
**Purpose:** HTTP handler for adding a comment to a ticket.

**Route:** `POST /support/tickets/:id/comments`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - Ticket ID

**Request Body:**
- `message` (String, required) - Comment content

**Response:** 201 Created
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": { /* comment object */ }
}
```

**Process:**
1. Extracts ticket ID from route params
2. Extracts comment message from request body
3. Extracts user ID from authenticated request
4. Calls supportService.addComment()
5. Logs comment addition
6. Returns success response

---

##### `getComments(req, res)`
**Purpose:** HTTP handler for retrieving comments for a ticket.

**Route:** `GET /support/tickets/:id/comments`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - Ticket ID

**Query Parameters:**
- `page` (Number, optional) - Page number (default: 1)
- `limit` (Number, optional) - Items per page (default: 50)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [ /* array of comments */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "pages": 1
  }
}
```

**Process:**
1. Extracts ticket ID from route params
2. Extracts pagination parameters from query
3. Calls supportService.getComments()
4. Returns comments with pagination metadata

---

##### `getHelpCenter(req, res)`
**Purpose:** HTTP handler for retrieving help center contact information.

**Route:** `GET /support/help`

**Authentication:** Not required (public endpoint)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "whatsapp": "+91XXXXXXXXXX",
    "callUs": "+91XXXXXXXXXX",
    "email": "support@company.com",
    "workingHours": "09:00 AM - 06:00 PM",
    "address": "Company Address",
    "website": "https://company.com"
  }
}
```

**Process:**
1. Calls supportService.getHelpCenter()
2. Returns help center information

---

### FAQ Controller

**File:** `controllers/faqController.js`

#### Functions

##### `getAllFaqs(req, res)`
**Purpose:** HTTP handler for retrieving all FAQs with optional category filtering.

**Route:** `GET /support/faqs`

**Authentication:** Not required (public endpoint)

**Query Parameters:**
- `category` (String, optional) - Filter by category

**Response:** 200 OK
```json
{
  "success": true,
  "count": 10,
  "data": [ /* array of FAQs */ ]
}
```

**Process:**
1. Extracts optional category filter from query
2. Fetches FAQs from database with optional filtering
3. Orders by creation date (newest first)
4. Returns FAQs with count

---

##### `createFaq(req, res)`
**Purpose:** HTTP handler for creating a new FAQ.

**Route:** `POST /support/faqs`

**Authentication:** Required (verifyToken middleware)

**Request Body:**
- `question` (String, required) - FAQ question
- `answer` (String, required) - FAQ answer
- `category` (String, required) - FAQ category

**Response:** 201 Created
```json
{
  "success": true,
  "message": "FAQ created successfully",
  "data": { /* FAQ object */ }
}
```

**Process:**
1. Extracts FAQ data from request body
2. Creates new FAQ in database
3. Logs creation
4. Returns success response with FAQ data

---

##### `updateFaq(req, res)`
**Purpose:** HTTP handler for updating an existing FAQ.

**Route:** `PUT /support/faqs/:id`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - FAQ ID

**Request Body:**
- `question` (String, optional) - Updated question
- `answer` (String, optional) - Updated answer
- `category` (String, optional) - Updated category

**Response:** 200 OK
```json
{
  "success": true,
  "message": "FAQ updated successfully",
  "data": { /* updated FAQ object */ }
}
```

**Process:**
1. Extracts FAQ ID from route params
2. Extracts update data from request body
3. Updates FAQ in database
4. Logs update
5. Returns success response with updated FAQ

---

##### `deleteFaq(req, res)`
**Purpose:** HTTP handler for deleting an FAQ.

**Route:** `DELETE /support/faqs/:id`

**Authentication:** Required (verifyToken middleware)

**Route Parameters:**
- `id` (String, required) - FAQ ID

**Response:** 200 OK
```json
{
  "success": true,
  "message": "FAQ deleted successfully"
}
```

**Process:**
1. Extracts FAQ ID from route params
2. Deletes FAQ from database
3. Logs deletion
4. Returns success response

---

### Analytics Controller

**File:** `controllers/analyticsController.js`

#### Functions

##### `getTotalTickets(req, res)`
**Purpose:** HTTP handler for retrieving total ticket count.

**Route:** `GET /support/analytics/total`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "total": 150
  }
}
```

**Process:**
1. Counts total tickets in database
2. Returns total count

---

##### `getTicketsByStatus(req, res)`
**Purpose:** HTTP handler for retrieving ticket distribution by status.

**Route:** `GET /support/analytics/status`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    { "status": "OPEN", "count": 45 },
    { "status": "IN_PROGRESS", "count": 30 },
    { "status": "RESOLVED", "count": 60 },
    { "status": "CLOSED", "count": 15 }
  ]
}
```

**Process:**
1. Groups tickets by status
2. Counts tickets in each status
3. Returns status distribution

---

##### `getTicketsByPriority(req, res)`
**Purpose:** HTTP handler for retrieving ticket distribution by priority.

**Route:** `GET /support/analytics/priority`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    { "priority": "LOW", "count": 20 },
    { "priority": "MEDIUM", "count": 50 },
    { "priority": "HIGH", "count": 60 },
    { "priority": "CRITICAL", "count": 20 }
  ]
}
```

**Process:**
1. Groups tickets by priority
2. Counts tickets in each priority level
3. Returns priority distribution

---

##### `getTicketsByIssueType(req, res)`
**Purpose:** HTTP handler for retrieving ticket distribution by issue type.

**Route:** `GET /support/analytics/issue-type`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": [
    { "issueType": "PAYMENT", "count": 30 },
    { "issueType": "LOGIN", "count": 25 },
    { "issueType": "BUG", "count": 40 },
    { "issueType": "FEATURE_REQUEST", "count": 15 },
    { "issueType": "OTHER", "count": 40 }
  ]
}
```

**Process:**
1. Groups tickets by issue type
2. Counts tickets in each issue type
3. Returns issue type distribution

---

##### `getAverageResolutionTime(req, res)`
**Purpose:** HTTP handler for calculating average ticket resolution time.

**Route:** `GET /support/analytics/resolution-time`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "averageResolutionTime": 24.5,
    "unit": "hours",
    "totalResolvedTickets": 100
  }
}
```

**Process:**
1. Fetches all resolved tickets with creation and update timestamps
2. Calculates resolution time for each ticket (updatedAt - createdAt in hours)
3. Computes average resolution time
4. Returns average with total count of resolved tickets
5. Returns 0 if no resolved tickets exist

---

##### `getDashboardMetrics(req, res)`
**Purpose:** HTTP handler for retrieving comprehensive dashboard metrics.

**Route:** `GET /support/analytics/dashboard`

**Authentication:** Required (verifyToken middleware)

**Response:** 200 OK
```json
{
  "success": true,
  "data": {
    "totalTickets": 150,
    "statusBreakdown": {
      "open": 45,
      "inProgress": 30,
      "resolved": 60,
      "closed": 15
    },
    "priorityBreakdown": {
      "critical": 20,
      "high": 60
    }
  }
}
```

**Process:**
1. Executes parallel queries to get multiple metrics:
   - Total tickets
   - Open tickets count
   - In-progress tickets count
   - Resolved tickets count
   - Closed tickets count
   - Critical priority tickets count
   - High priority tickets count
2. Organizes data into status and priority breakdowns
3. Returns comprehensive dashboard metrics

---

## Routes

### Support Routes

**File:** `routes/supportRoutes.js`

**Base Path:** `/support`

#### Endpoints

| Method | Endpoint | Middleware | Controller | Description |
|--------|----------|------------|------------|-------------|
| POST | `/tickets` | verifyToken, ticketLimiter | createTicket | Create a new support ticket |
| GET | `/tickets/user/:userId` | verifyToken | getUserTickets | Get user's tickets with filtering |
| GET | `/tickets/:id` | verifyToken | getTicketById | Get ticket details by ID |
| PATCH | `/tickets/:id/status` | verifyToken | updateTicketStatus | Update ticket status |
| PATCH | `/tickets/:id/assign` | verifyToken | assignTicket | Assign ticket to agent |
| POST | `/tickets/:id/comments` | verifyToken, ticketLimiter | addComment | Add comment to ticket |
| GET | `/tickets/:id/comments` | verifyToken | getComments | Get ticket comments |
| GET | `/help` | None | getHelpCenter | Get help center information |

---

### FAQ Routes

**File:** `routes/faqRoutes.js`

**Base Path:** `/support`

#### Endpoints

| Method | Endpoint | Middleware | Controller | Description |
|--------|----------|------------|------------|-------------|
| GET | `/faqs` | None | getAllFaqs | Get all FAQs (public) |
| POST | `/faqs` | verifyToken | createFaq | Create new FAQ |
| PUT | `/faqs/:id` | verifyToken | updateFaq | Update FAQ |
| DELETE | `/faqs/:id` | verifyToken | deleteFaq | Delete FAQ |

---

### Analytics Routes

**File:** `routes/analyticsRoutes.js`

**Base Path:** `/support`

#### Endpoints

| Method | Endpoint | Middleware | Controller | Description |
|--------|----------|------------|------------|-------------|
| GET | `/analytics/total` | verifyToken | getTotalTickets | Get total ticket count |
| GET | `/analytics/status` | verifyToken | getTicketsByStatus | Get tickets by status distribution |
| GET | `/analytics/priority` | verifyToken | getTicketsByPriority | Get tickets by priority distribution |
| GET | `/analytics/issue-type` | verifyToken | getTicketsByIssueType | Get tickets by issue type distribution |
| GET | `/analytics/resolution-time` | verifyToken | getAverageResolutionTime | Get average resolution time |
| GET | `/analytics/dashboard` | verifyToken | getDashboardMetrics | Get comprehensive dashboard metrics |

---

## Middleware

### Authentication Middleware

**File:** `middleware/authMiddleware.js`

#### Functions

##### `verifyToken(req, res, next)`
**Purpose:** Verifies JWT token from request headers and attaches user data to request object.

**Parameters:**
- `req` (Request) - Express request object
- `res` (Response) - Express response object
- `next` (Function) - Next middleware function

**Process:**
1. Extracts Authorization header from request
2. Validates header format (must start with "Bearer ")
3. Extracts token from header
4. Verifies token using JWT_ACCESS_SECRET environment variable
5. Attaches decoded user data to req.user
6. Calls next() to proceed to next middleware
7. Returns 401 if token missing or invalid

**Error Responses:**
- 401 - "Access token missing" (if no token provided)
- 401 - "Invalid or expired token" (if token invalid/expired)

---

### Error Handling Middleware

**File:** `middleware/errorMiddleware.js`

#### Functions

##### `errorHandler(err, req, res, next)`
**Purpose:** Global error handling middleware that logs errors and returns formatted error responses.

**Parameters:**
- `err` (Error) - Error object
- `req` (Request) - Express request object
- `res` (Response) - Express response object
- `next` (Function) - Next middleware function

**Process:**
1. Logs error details including message, stack, URL, method, body, params, and query
2. Extracts status code from error (defaults to 500)
3. Returns formatted error response
4. Includes stack trace in development mode only

**Response Format:**
```json
{
  "success": false,
  "message": "Error message",
  "stack": "Error stack trace (development only)"
}
```

---

##### `notFound(req, res)`
**Purpose:** Handles 404 errors for undefined routes.

**Parameters:**
- `req` (Request) - Express request object
- `res` (Response) - Express response object

**Response:** 404 Not Found
```json
{
  "success": false,
  "message": "Route /path not found"
}
```

---

##### `asyncHandler(fn)`
**Purpose:** Wrapper function to handle async errors in route handlers.

**Parameters:**
- `fn` (Function) - Async route handler function

**Returns:** Wrapped function that catches async errors and passes them to error handling middleware

**Process:**
1. Wraps async route handler
2. Catches any rejected promises
3. Passes errors to next() middleware for handling

**Usage:** Used to eliminate try-catch blocks in controllers

---

### Rate Limiter Middleware

**File:** `middleware/rateLimiter.js`

#### Functions

##### `generalLimiter`
**Purpose:** General rate limiter applied to all routes.

**Configuration:**
- Window: 15 minutes
- Max requests: 100 per window
- Standard rate limiting for all endpoints

---

##### `ticketLimiter`
**Purpose:** Stricter rate limiter for ticket creation and comment endpoints.

**Configuration:**
- Window: 15 minutes
- Max requests: 10 per window
- Applied to ticket creation and comment endpoints to prevent abuse

---

## Main Application

**File:** `app.js`

### Configuration

#### Environment Variables
- `PORT` - Server port (default: 5003)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)
- `JWT_ACCESS_SECRET` - Secret key for JWT verification
- Database configuration (via Prisma)
- Email configuration (via Nodemailer)
- Twilio configuration (for WhatsApp)
- Eureka configuration (for service discovery)

### Middleware Stack
1. CORS configuration
2. JSON body parser
3. URL-encoded body parser
4. General rate limiter
5. Health check endpoint
6. Route mounting
7. 404 handler
8. Error handler

### Routes Mounted
- `/support` - Support routes (tickets, help center)
- `/support` - FAQ routes
- `/support` - Analytics routes

### Health Check
**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "message": "Help & Support Service is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### Service Discovery
- Registers with Eureka server on startup
- Service name: AUTH-SERVICE (note: appears to be mislabeled in code)
- Port: 5003

---

## Technology Stack

### Core Technologies
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma** - ORM for database operations
- **PostgreSQL** - Database (via Neon serverless)

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **express-rate-limit** - Rate limiting
- **cors** - Cross-origin resource sharing

### Notifications
- **Nodemailer** - Email notifications
- **Twilio** - WhatsApp notifications (optional)

### Logging
- **Winston** - Logging library
- **winston-daily-rotate-file** - Log rotation

### Service Discovery
- **eureka-js-client** - Netflix Eureka client

### Utilities
- **uuid** - UUID generation
- **dotenv** - Environment variable management
- **axios** - HTTP client (for future use)

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack trace (development only)"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

---

## Error Codes

- **200** - OK - Request successful
- **201** - Created - Resource created successfully
- **400** - Bad Request - Invalid request parameters
- **401** - Unauthorized - Authentication required or invalid
- **404** - Not Found - Resource not found
- **429** - Too Many Requests - Rate limit exceeded
- **500** - Internal Server Error - Server error

---

## Notification Triggers

The service sends notifications automatically in the following scenarios:

### Email Notifications

1. **Ticket Created** - When a new support ticket is created
   - Recipient: Ticket owner (user who created the ticket)
   - Triggered by: `createTicket()` function
   - Contains: Ticket ID, title, issue type, priority, status, creation date

2. **Ticket Assigned** - When a ticket is assigned to a support agent
   - Recipient: Assigned support agent
   - Triggered by: `assignTicket()` function
   - Contains: Ticket details, user information, assignment details

3. **Status Changed** - When ticket status is updated
   - Recipient: Ticket owner (user who created the ticket)
   - Triggered by: `updateTicketStatus()` function
   - Contains: Ticket ID, old status, new status

4. **New Comment** - When a comment is added to a ticket
   - Recipient: Ticket owner (user who created the ticket)
   - Triggered by: `addComment()` function
   - Contains: Ticket title, comment message, author name, timestamp

### WhatsApp Notifications

- WhatsApp notifications are available but require Twilio configuration
- The `sendWhatsAppNotification()` function is implemented but not currently used in the main flow
- Can be integrated for urgent/critical ticket notifications

### Notification Configuration

**Email Configuration (Required for email notifications):**
- `EMAIL_HOST` - SMTP server host
- `EMAIL_PORT` - SMTP server port (default: 587)
- `EMAIL_USER` - Email account username
- `EMAIL_PASS` - Email account password
- `EMAIL_FROM` - Sender email address (optional, defaults to EMAIL_USER)

**WhatsApp Configuration (Required for WhatsApp notifications):**
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio authentication token
- `TWILIO_WHATSAPP_NUMBER` - Twilio WhatsApp number

**Note:** If email configuration is missing, the service continues to function but email notifications are disabled with a warning log.

---

## Notes

1. All authenticated endpoints require a valid JWT token in the Authorization header: `Bearer <token>`
2. Email notifications are optional and require proper configuration of email environment variables
3. WhatsApp notifications require Twilio configuration and are optional
4. The service uses PostgreSQL database via Neon serverless
5. Service discovery is configured via Netflix Eureka
6. All timestamps are in ISO 8601 format
7. Pagination is implemented for list endpoints with configurable page size
8. Comprehensive logging is implemented using Winston for debugging and monitoring
9. Rate limiting is applied to prevent abuse
10. The service follows RESTful API design principles

---

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database
- Environment variables configured

### Installation
```bash
npm install
```

### Environment Setup
Create a `.env` file with required environment variables:
- Database connection string
- JWT secret
- Email configuration (optional)
- Twilio configuration (optional)
- Eureka configuration (optional)

### Running the Service
```bash
# Development
npm run dev

# Production
npm start
```

### Service Port
- Default: 5003
- Health check: `http://localhost:5003/health`

---

## Support

For issues or questions, please contact the support team or refer to the help center endpoint: `GET /support/help`