# UniCore Smart Campus System

UniCore is a full-stack smart campus operations platform designed to improve the management of university resources, bookings, maintenance tickets, notifications, and role-based administration. The system provides a centralized interface for students, staff, and administrators to interact with campus services through a secure React frontend and a Spring Boot REST API.

This project was developed as an academic submission for a professional application framework assignment and demonstrates full-stack software engineering practices including authentication, authorization, REST API design, conflict validation, dashboard analytics, testing, and documentation.

## 1. Project Overview

The UniCore Smart Campus System focuses on digitizing common campus operations that are often handled manually or through disconnected systems. The application combines resource management, booking workflows, maintenance ticketing, notifications, and administrative reporting into one integrated platform.

Core objectives of the system:
- Provide secure user authentication and role-based access control
- Enable efficient campus resource discovery and reservation
- Prevent overlapping bookings for the same resource
- Support maintenance and incident ticket tracking with comments
- Deliver notifications for operational events
- Present administrative insights through dashboard analytics

## 2. Technologies Used

### Frontend
- React 19
- Vite
- React Router DOM
- Bootstrap 5
- React Bootstrap
- Recharts
- Vanilla CSS

### Backend
- Java 17
- Spring Boot 3.2.5
- Spring Web
- Spring Data JPA
- Spring Security
- Spring OAuth2 Client
- Spring Validation
- JJWT 0.12.5
- Lombok

### Database and Tools
- MySQL 8
- H2 Database for selected integration tests
- Maven
- npm
- Postman
- Docker Compose

## 3. System Architecture

The system follows a standard three-layer full-stack architecture.

```text
React Frontend (Vite)
        |
        | HTTP / JSON + JWT
        v
Spring Boot REST API
        |
        | JPA / Hibernate
        v
MySQL Database
```

### Architectural Layers
- Presentation Layer: React components, pages, forms, dashboard charts, and client-side routing
- API Layer: Spring Boot controllers exposing REST endpoints under `/api`
- Business Layer: Service classes implementing booking rules, comment ownership rules, analytics generation, and ticket workflows
- Data Access Layer: JPA repositories for persistence, filtering, and analytics queries
- Security Layer: JWT authentication, role-based authorization, and protected routes

## 4. Project Structure

```text
Unicore-System/
├── backend/
│   ├── src/main/java/com/unicore/
│   │   ├── config/
│   │   ├── controller/
│   │   ├── dto/
│   │   ├── exception/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   ├── src/main/resources/
│   └── src/test/java/com/unicore/service/
├── frontend/
│   ├── src/components/
│   ├── src/pages/
│   ├── src/services/
│   └── src/assets/
└── README.md
```

## 5. Core Features

### Authentication and User Management
- JWT-based login and registration
- Google OAuth2 configuration support
- Role-based access control for users and administrators
- Profile and user management endpoints

### Resource Management
- Create, update, delete, and list campus resources
- Resource image upload support
- Resource status control

### Booking Management
- Resource booking creation and approval workflow
- Booking conflict detection for overlapping time ranges
- Cancellation, rejection, and personal booking history
- Booking analytics and summary data

### Ticket Management
- Maintenance and incident ticket creation
- Ticket status updates and assignment
- Ticket comments and attachments
- Comment edit and delete with owner or admin authorization

### Notifications
- User notification feed
- Unread count support
- Mark-as-read and mark-all-as-read actions

### Dashboard Analytics
- Total bookings
- Most used resources
- Peak booking hours
- Ticket status distribution
- Summary cards and charts for admins

## 6. Features Mapped to Assignment Requirements

| Assignment Area | UniCore Implementation |
| --- | --- |
| User authentication | JWT login and registration with secured endpoints |
| Authorization | Role-based access control using Spring Security |
| CRUD operations | Users, resources, bookings, tickets, comments |
| Validation | Request validation, conflict detection, ownership checks |
| Business rules | Prevent overlapping bookings, restrict comment edits to owner or admin |
| RESTful APIs | Structured `/api` endpoints for all modules |
| Frontend integration | React frontend consuming Spring Boot APIs |
| Persistence | MySQL with JPA/Hibernate |
| Dashboard / reporting | Admin analytics endpoints with charts |
| Testing | Unit tests, integration test, Postman collection |
| Documentation | README, testing evidence, setup guide |

## 7. API Endpoints List

Base URL:

```text
http://localhost:8080/api
```

### Authentication APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/auth/login` | Authenticate user and return JWT |
| POST | `/auth/register` | Register a new user |

### User APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/users/test` | Test protected access |
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update current user profile |
| GET | `/users` | Get all users |
| PUT | `/users/{id}/role` | Update user role |
| PUT | `/users/{id}/status` | Update user status |
| PUT | `/users/{id}/details` | Update user details |
| DELETE | `/users/{id}` | Delete a user |

### Resource APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/resources` | Create resource |
| GET | `/resources` | List all resources |
| GET | `/resources/{id}` | Get resource by ID |
| PUT | `/resources/{id}` | Update resource |
| DELETE | `/resources/{id}` | Delete resource |
| PATCH | `/resources/{id}/status` | Update resource availability/status |
| POST | `/resources/{id}/image` | Upload resource image |

### Booking APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/bookings` | Create booking |
| GET | `/bookings` | Get all bookings |
| GET | `/bookings/analytics/summary` | Booking analytics summary |
| GET | `/bookings/my` | Get current user's bookings |
| GET | `/bookings/{id}` | Get booking by ID |
| PATCH | `/bookings/{id}/approve` | Approve booking |
| PATCH | `/bookings/{id}/reject` | Reject booking |
| PATCH | `/bookings/{id}/cancel` | Cancel booking |

### Slot APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/slots` | Get available resource slots |
| POST | `/slots/book` | Create booking from slot-based flow |

### Ticket APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/tickets` | Create ticket |
| GET | `/tickets` | Get tickets |
| GET | `/tickets/analytics/summary` | Ticket analytics summary |
| GET | `/tickets/{id}` | Get ticket by ID |
| PATCH | `/tickets/{id}/status` | Update ticket status |
| PATCH | `/tickets/{id}/assign` | Assign ticket |
| POST | `/tickets/{id}/comments` | Add comment to ticket |
| GET | `/tickets/{id}/comments` | Get comments for a ticket |
| POST | `/tickets/{id}/attachments` | Upload ticket attachment |

### Comment APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| PUT | `/comments/{id}` | Edit comment |
| DELETE | `/comments/{id}` | Delete comment |

### Notification APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/notifications` | Get notifications for current user |
| GET | `/notifications/unread-count` | Get unread notification count |
| PUT | `/notifications/{id}/read` | Mark notification as read |
| PUT | `/notifications/read-all` | Mark all notifications as read |

### Admin Dashboard APIs

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/admin/dashboard/summary` | Get dashboard summary |
| GET | `/admin/dashboard/analytics/bookings/total` | Get total bookings |
| GET | `/admin/dashboard/analytics/resources/most-used` | Get most used resources |
| GET | `/admin/dashboard/analytics/bookings/peak-hours` | Get peak booking hours |
| GET | `/admin/dashboard/analytics/tickets/status-distribution` | Get ticket status distribution |

## 8. Setup Instructions

### Prerequisites
- Java 17
- Node.js and npm
- MySQL 8
- Maven
- Docker Desktop or Docker Engine for database setup

### Option A: Start MySQL with Docker Compose

From the project root:

```bash
docker-compose up -d
```

Expected database configuration:

```text
Database: unicore_db
Username: unicore_user
Password: unicore_pass
```

### Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Build the backend:

```bash
mvn clean install
```

Run the Spring Boot application:

```bash
mvn spring-boot:run
```

Backend default URL:

```text
http://localhost:8080
```

Relevant configuration is stored in:

```text
backend/src/main/resources/application.yml
```

Important configuration includes:
- `server.address=0.0.0.0`
- `server.port=8080`
- MySQL datasource settings
- JWT secret and expiration
- upload directory
- OAuth2 redirect URI

### Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Run the React development server:

```bash
npm run dev
```

Frontend default URL:

```text
http://localhost:5173
```

### Frontend API Configuration

The frontend API base URL is managed in:

```text
frontend/src/services/api.js
```

For local single-machine development:

```js
const API_BASE_URL = 'http://localhost:8080/api';
```

For multi-device LAN testing, replace `localhost` with the backend machine IP:

```js
const API_BASE_URL = 'http://192.168.1.93:8080/api';
```

## 9. Security and Business Logic Notes

### JWT Security
- JWT secret is stored in `application.yml` under `app.jwt.secret`
- Token expiration is configurable using `app.jwt.expiration-ms`
- The system uses secure token signing and validation in the security layer

### Booking Conflict Prevention
- The system prevents overlapping bookings for the same resource
- Conflict detection checks whether the new booking time overlaps an existing pending or approved booking
- Exact-time and partial overlaps are rejected

### Comment Ownership Rules
- Only the comment owner or an administrator can edit or delete comments
- Authorization is enforced in the service layer, not only in the frontend

## 10. Suggested Viva Explanation

If asked to explain the design during a viva, the project can be summarized as follows:

- The frontend is built using React and communicates with the backend through REST APIs
- Spring Boot handles business logic, validation, security, and persistence
- MySQL stores users, resources, bookings, tickets, comments, and notifications
- JWT secures authentication and role-based access protects administrative actions
- Analytics queries provide admin dashboard insights such as booking totals, peak hours, and ticket distributions
- Validation logic ensures important business rules such as preventing booking conflicts and unauthorized comment modification

## 11. Member Contribution Section

Update the names and registration numbers before final submission.

| Member | Registration No. | Contribution Area |
| --- | --- | --- |
| Member 1 | ITxxxxxxxx | Resource management, frontend screens, resource APIs |
| Member 2 | ITxxxxxxxx | Booking management, conflict validation, booking analytics |
| Member 3 | ITxxxxxxxx | Authentication, ticket management, notifications, dashboard |

## 12. Screenshots Placeholders

Insert screenshots in the final report or replace this section with embedded images.

Recommended screenshots:
- Login page
- Registration page
- Resource listing page
- Booking creation form
- Booking conflict error message
- Ticket creation page
- Ticket details page with comments
- Admin dashboard summary cards
- Most used resources chart
- Peak booking hours chart
- Ticket status distribution pie chart
- Notifications panel

Placeholder layout:

```text
[Screenshot 1: Login Page]
[Screenshot 2: Booking Creation]
[Screenshot 3: Ticket Details]
[Screenshot 4: Admin Dashboard Analytics]
```

## 13. Testing Evidence Section

The project includes backend test classes and a Postman collection for API verification.

### Automated Tests

Available test classes:
- `src/test/java/com/unicore/service/BookingServiceTest.java`
- `src/test/java/com/unicore/service/TicketServiceTest.java`
- `src/test/java/com/unicore/service/BookingCreationIntegrationTest.java`

These tests demonstrate:
- booking conflict validation
- successful booking creation
- urgent ticket notification logic
- secure comment ownership enforcement

Run backend tests:

```bash
cd backend
mvn test
```

### Postman Collection

Postman collection location:

```text
../postman/collections/UniCore-System-Testing.postman_collection.json
```

Recommended Postman evidence:
- auth login success
- user registration success
- booking creation success
- booking conflict returning `409 Conflict`
- ticket creation success
- comment edit success
- comment delete success

### Report Evidence Checklist
- Include screenshots of unit tests passing
- Include screenshot of integration test passing
- Include Postman screenshots for auth, booking, and ticket APIs
- Include frontend screenshots showing synchronized workflows

## 14. Submission Checklist

Before creating the final ZIP file:
- Remove `node_modules`
- Remove `target`, `target-cli`, `dist`, `.DS_Store`, and `__MACOSX`
- Ensure only source code and documentation are included
- Include `README.md`
- Include the Postman collection
- Include testing evidence in the report
- Verify backend configuration matches the intended environment
- Verify frontend API URL matches the target backend machine

## 15. Rebuild Commands

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
mvn clean install
mvn spring-boot:run
```

## 16. Academic Use Note

This README is structured for academic submission and can be directly used as project documentation. Before final submission, update:
- member names
- registration numbers
- screenshot evidence
- deployment-specific URLs if needed
