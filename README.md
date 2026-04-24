🚀 UniCore System
Smart Campus Operations Management Platform

UniCore is a modern, full-stack university operations management system designed to streamline campus activities, improve resource utilization, and enhance communication between students, staff, and administrators.

It acts as a centralized smart campus hub integrating resource booking, maintenance tracking, notifications, and administrative control into a single platform.

🌟 Key Features
🔐 1. User Management & Security
Secure authentication using JWT + Google OAuth2
Role-Based Access Control (RBAC):
👤 Student/User
🛠 Staff/Technician
🧑‍💼 Administrator
Personalized dashboards and profile management
Protected API endpoints with Spring Security

🏢 2. Resource & Booking Management
📊 Real-time resource availability (labs, rooms, equipment)
📅 Intelligent booking system with:
conflict detection
capacity validation
time-slot selection
🔁 Booking lifecycle:
Pending → Approved → Cancel Requested → Cancelled
📌 Visual time-slot availability:
Available / Booked / Pending
🧾 Booking confirmation PDF export

🛠 3. Maintenance & Incident Ticketing
📝 Create and track maintenance tickets
🔄 Full ticket lifecycle:
Open → In Progress → Resolved → Closed / Rejected
💬 Collaborative updates between users and admins
🕓 Activity timeline tracking
🚨 Priority-based ticket handling (Low → Critical)
📄 Downloadable incident report (PDF)

🔔 4. Notification System
🔄 Near real-time notifications (auto-refresh)
📌 Event-based alerts:
Booking requests
Approval updates
Cancellation requests
Ticket updates
👁 Mark as read / unread tracking (user-specific)
🔗 Smart navigation from notifications to relevant pages

📊 5. Smart Admin Dashboard
Overview of:
total bookings
pending approvals
active resources
system users
Quick access to:
Booking approvals
Cancellation requests
Ticket management
Clean and responsive dashboard UI

📄 6. Reporting & Export
Generate PDFs for:
Booking confirmations
Ticket reports
Resource details
Admin-level reports (list view)
Lightweight and fast generation using backend services

🎯 7. UI/UX Enhancements
Responsive dashboard layout (sidebar + content)
Clean card-based design
Status badges with consistent color system
Breadcrumb navigation for better user flow
Role-based UI rendering (e.g., chatbot hidden for admin)
Improved error messages and validation feedback

🛠 Technology Stack
🔙 Backend
Java 17+
Spring Boot 3
Spring Security (JWT + OAuth2)
Hibernate / JPA
MySQL
🎨 Frontend
React (Vite)
Vanilla CSS (custom styling)
Axios (API communication)

⚙️ System Architecture
RESTful API-based backend
Modular service structure:
Booking Service
Ticket Service
Resource Service
Notification Service
Role-based API protection
Client-server separation for scalability

