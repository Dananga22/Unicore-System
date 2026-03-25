# UniCore-System: Smart Campus Operations Hub

## 1. Project Overview
**System Name:** UniCore-System
**Description:** A professional university operations web application designed to manage facilities, handle bookings, track maintenance and incident tickets, and provide real-time notifications, all within a secure, role-based architecture.
**Target Audience:** University students, academic staff, administrators, and optional maintenance technicians.
**Tech Stack:**
- **Frontend:** React, Tailwind CSS (Custom UI), Axios
- **Backend:** Spring Boot (Java), Spring Security, Hibernate/JPA
- **Database:** MySQL
- **Tooling:** VS Code, Git/GitHub, GitHub Actions (CI), Postman (API Testing)

---

## 2. Team Member Breakdown (3 Members)

To ensure equal contribution and module separation for evaluation, the responsibilities are divided as follows:

### 👤 Member 1: Facilities & Assets Module (Full-Stack)
**Focus:** Management of the core physical resources the campus offers.
- **Frontend:** Resources list page, resource management form, filtering/search components.
- **Backend:** CRUD REST APIs for Facilities/Assets, search endpoints, pagination logic, database schema for assets.
- **Key Deliverables:** Implementation of file upload (for asset images), robust input validation for resource creation.
- **Postman Testing:** Document and test all `/api/resources` endpoints.

### 👤 Member 2: Booking Management Module (Full-Stack)
**Focus:** Handling reservations, availability checking, and conflict prevention.
- **Frontend:** Booking request page, My Bookings user view, Admin booking approval dashboard/view, timeline/calendar integration.
- **Backend:** Endpoints for creating, approving, rejecting, and listing bookings. Business logic to prevent overlapping bookings.
- **Key Deliverables:** Accurate status lifecycle management (PENDING, APPROVED, REJECTED), complex query logic for availability.
- **Postman Testing:** Document and test all `/api/bookings` endpoints.

### 👤 Member 3: Tickets, Notifications & Authentication Module (Full-Stack)
**Focus:** User access, system monitoring, issue reporting, and real-time alerts.
- **Frontend:** Landing page, Login page, User/Admin dashboards, Ticket creation/details pages, Profile page, Notification panel.
- **Backend:** Spring Security configuration, JWT implementation, User/Role CRUD, Ticket lifecycle (OPEN, IN_PROGRESS, RESOLVED, CLOSED), Notification generation logic.
- **Key Deliverables:** Secure endpoint protection, Role-Based Access Control (RBAC), attachment handling for tickets.
- **Postman Testing:** Document and test all `/api/auth`, `/api/tickets`, and `/api/notifications` endpoints.

---

## 3. Page & Module Breakdown

### Global / Structural
*   **Top Navbar:** User profile dropdown, notification bell indicator, search bar.
*   **Sidebar (Role-Protected):** Dynamic navigation links based on user role (e.g., normal users don't see the "Approve Bookings" tab).

### Core Pages
1.  **Home / Landing Page:** Engaging, SaaS-style entry point highlighting campus features.
2.  **Login Page:** Secure authentication form with inline validation.
3.  **User Dashboard:** Summary of personal upcoming bookings, active tickets, and recent notifications.
4.  **Admin Dashboard:** System-wide overview (metrics via charts, pending approval counts, open incident counts).
5.  **Resources Page:** Grid/List view of available rooms/assets with search and filtering.
6.  **Resource Management (Admin):** Forms to add/edit/delete facilities.
7.  **Booking Request Page:** Form to select date/time, providing immediate feedback on availability.
8.  **My Bookings & Approvals Pages:** Tabular data with status badges and action buttons (cancel/approve).
9.  **Ticket Creation Page:** Form detailing the incident (location, category, description, optional attachment).
10. **Ticket Details Page:** Detailed view supporting state transitions and an activity/comment log.
11. **Profile Page:** Basic user data and settings.

---

## 4. Architectural Design

### Backend Architecture (Spring Boot)
Follows a clean, layered architectural pattern:
*   **Controller Layer (`@RestController`):** Handles incoming REST HTTP requests, routes them to services, and returns appropriate DTOs and HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found).
*   **Service Layer (`@Service`):** Contains the core business logic (e.g., checking booking conflicts, generating notifications upon ticket status changes).
*   **Repository Layer (`@Repository`):** Spring Data JPA interfaces for database interactions and custom queries.
*   **Security Layer:** Spring Security filters validating JWT, extracting authorities, and protecting endpoints via `@PreAuthorize("hasRole('ADMIN')")`.
*   **DTO & Mapper Layer:** Data Transfer Objects to ensure entities are not exposed directly, preventing over-posting and handling customized JSON structures.
*   **Global Exception Handler (`@ControllerAdvice`):** Captures exceptions and returns standardized error JSON messages.

### Frontend Architecture (React)
*   **Components (`/components`):** Reusable UI pieces (Buttons, Cards, Modals, StatusBadges, FormInputs).
*   **Pages (`/pages`):** High-level route views assembling various components.
*   **Services (`/services`):** Axios interceptors for API calls, automatically attaching the JWT bearer token.
*   **Hooks (`/hooks`):** Custom hooks (e.g., `useAuth`, `useFetch`) to manage component state and side effects.
*   **Context/State (`/context`):** Global state management for User Authentication and Notification counts.

---

## 5. UI/UX & Design System

### Color Palette
*   **Primary:** Deep Blue `#1E3A8A`
*   **Secondary:** Blue `#3B82F6`
*   **Accent:** Indigo `#6366F1`
*   **Success:** Green `#10B981` (for Approved, Resolved)
*   **Warning:** Amber `#F59E0B` (for Pending, In Progress)
*   **Danger:** Red `#EF4444` (for Rejected, Overlapping errors)
*   **Background:** Light Gray `#F8FAFC`
*   **Cards:** White `#FFFFFF`
*   **Text:** Dark Gray `#111827`

### Aesthetics
*   **Layouts:** Dashboard cards using `rounded-2xl` and `shadow-md` for soft elevation.
*   **Forms:** Clean input fields with focus states (indigo rings) and red helper text for validation errors.
*   **Data Display:** Tables featuring sortable headers, subtle hover effects, and distinct colored pill-shaped badges for entity statuses.

---

## 6. Academic Evaluation Target Checklist

- [ ] **Backend Business Logic:** Booking conflict prevention, ticket state transitions.
- [ ] **Frontend UI:** Modern Tailwind dashboard implementations.
- [ ] **RESTful APIs:** Complete GET, POST, PUT/PATCH, DELETE implementations per resource.
- [ ] **Validation:** `@Valid` with JSR-380 on Spring Boot, Formik/Yup or similar on React.
- [ ] **Error Handling:** Standardized API error responses and frontend Toast notifications.
- [ ] **Database:** MySQL relational mapping (`@OneToMany`, `@ManyToOne`) executed correctly.
- [ ] **Authorization:** Role-Based Access Control implemented on both UI (removing buttons) and Backend (blocking endpoints).
- [ ] **Testing:** Fully exported Postman Workspace collection containing environment variables and saved responses.
- [ ] **Version Control:** Documented GitHub repo with branch rules and a clear commit history highlighting individual member contributions.
- [ ] **CI Pipeline:** GitHub Actions configuring on-push build checks for the Spring Boot and React applications.
