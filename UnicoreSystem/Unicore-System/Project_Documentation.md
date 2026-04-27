# UniCore-System: Smart Campus Operations Hub

1. Project Overview

System Name: UniCore-System

Description:
A professional university operations web application designed to manage facilities, handle bookings, track maintenance and incident tickets, and provide real-time notifications, all within a secure, role-based architecture.

Target Audience:
University students, academic staff, administrators, and maintenance technicians.

Tech Stack:

Frontend: React, Tailwind CSS, Axios
Backend: Spring Boot (Java), Spring Security, Hibernate/JPA
Database: MySQL
Tooling: VS Code, Git/GitHub, GitHub Actions (CI), Postman

2. Team Member Breakdown (3 Members)

To ensure equal contribution and clear module separation, responsibilities were divided as follows:
👤 Member 1 – User Management, Authentication & Resource Management (Full-Stack)

Focus: Secure access control and management of campus resources.

Responsibilities:

Implemented OAuth 2.0 + JWT authentication
Developed Role-Based Access Control (RBAC) (USER, ADMIN, TECHNICIAN)
Built User Management APIs (/api/users)
Built Resource Management APIs (/api/resources)
Implemented:
Resource CRUD operations
Search, filtering, pagination
Image upload for facilities

Frontend:

Login system
Profile page
Resource listing & management UI

👤 Member 2 – Booking Management Module (Full-Stack)

Focus: Reservation system with validation and approval workflow.

Responsibilities:

Developed Booking APIs (/api/bookings)
Implemented conflict detection logic (no overlapping bookings)
Managed booking lifecycle:
PENDING → APPROVED / REJECTED → CANCELLED
Built admin approval system

Frontend:

Booking request page
My bookings page
Admin approval dashboard

Key Feature:

Real-time validation for availability

👤 Member 3 – Ticket Management + Advanced Features (Full-Stack) (My Contribution)

Focus: Incident management, monitoring, and system support features.

🎫 Ticket Management System
Backend:
Developed APIs: /api/tickets
Implemented ticket lifecycle:
OPEN → IN_PROGRESS → RESOLVED → CLOSED
REJECTED (Admin-controlled)
Features:
Ticket assignment to technicians
Priority handling:
LOW, MEDIUM, HIGH, CRITICAL
Image attachment upload
Comment system
Role-based access:
Users → own tickets
Admin/Technician → full access

Frontend:
Ticket creation form
Ticket detail page with comments
Status tracking UI

🔔 Notification System (Shared Across All Members)

⚠️ Implemented collaboratively across all modules.

Features:
Triggered on:
Booking approvals/rejections
Ticket updates
Assignments
Comments
Stored in database
UI features:
Notification panel
Unread count badge
Users can mark notifications as read

🚀 Special Features (Advanced Contribution)
📅 1. Admin Operations Calendar Dashboard

A centralized dashboard integrating bookings and tickets.

Features:

Month & Week view
Booking + Ticket visualization
Daily breakdown of operations
Ticket count indicators
Urgent & overdue ticket detection
Backend API:
/api/admin/operations/calendar

Impact:

Improves decision-making
Provides real-time system monitoring


🤖 2. Smart Support Chatbot

A frontend chatbot assistant for user guidance.

Features:

Keyword-based responses
Quick navigation actions
Context-aware suggestions
Helps users access:
Bookings
Tickets
Resources

Impact:

Enhances user experience
Reduces learning curve


3. Page & Module Breakdown
Global Structure
Top Navbar: Profile, notifications, search
Sidebar: Role-based navigation
Core Pages
Landing Page
Login Page
User Dashboard
Admin Dashboard
Resources Page
Resource Management
Booking Page
Booking Approval Page
Ticket Creation Page
Ticket Details Page
Profile Page


5. Architectural Design

Backend (Spring Boot)
Controller Layer → Handles API requests
Service Layer → Business logic
Repository Layer → Database operations
Security Layer → JWT + RBAC
DTO Layer → Safe data transfer
Exception Handling → Standardized errors
Frontend (React)
Components → Reusable UI
Pages → Main views
Services → API calls
Hooks → State management
Context → Global auth & notifications

6. UI/UX Design
Color Palette
Primary: #1E3A8A
Secondary: #3B82F6
Success: #10B981
Warning: #F59E0B
Danger: #EF4444
Design Features
Modern dashboard cards
Clean forms with validation
Status badges (color-coded)
Responsive layout

7. REST API Design

The system follows RESTful principles:

Endpoints:
/api/resources
/api/bookings
/api/tickets
/api/admin/operations
Methods:
GET → Retrieve
POST → Create
PUT/PATCH → Update
DELETE → Remove

Status Codes:
200 OK
201 Created
400 Bad Request
403 Forbidden
404 Not Found

8. Testing & Validation
APIs tested using Postman
Covered:
Authentication
Booking validation
Ticket lifecycle
Notifications
Validation:
Backend: @Valid
Frontend: Form validation

9. Version Control & CI/CD
Repository:
https://github.com/Dananga22/Unicore-System
Strategy:
Feature branches → develop → main
Each member worked on own branch
Commit Convention:
feat: feature
fix: bug
docs: documentation
CI/CD:
GitHub Actions for build checks


10. Academic Evaluation Checklist
✔ Backend Business Logic
✔ Modern Frontend UI
✔ RESTful APIs
✔ Validation & Error Handling
✔ Database Relationships
✔ Role-Based Authorization
✔ Postman Testing
✔ Version Control (GitHub)
✔ CI/CD Pipeline
