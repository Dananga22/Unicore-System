# UniCore-System

Professional Smart Campus Operations Hub for university facilities, bookings, maintenance tickets, notifications, and role-based access control.

## Canonical Project Structure

This repository now uses a single source of truth:

```text
UnicoreSystem/
├── Unicore-System/
│   ├── backend/    Spring Boot REST API
│   └── frontend/   React + Vite frontend
├── .github/workflows/
├── db/
├── docker-compose.yml
└── postman/
```

Older duplicate backends were removed from active use so new work should only continue inside `Unicore-System/backend` and `Unicore-System/frontend`.

## Stack

- Frontend: React, Vite, React Router
- Backend: Spring Boot 3, Spring Security, Spring Data JPA
- Database: MySQL 8
- Auth: JWT with role-based authorization
- Testing: Maven test, Postman collection
- CI: GitHub Actions

## Modules and Member Ownership

- Member 1: Facilities & Assets Catalogue
- Member 2: Booking Management
- Member 3: Maintenance Tickets, Notifications, Authentication & RBAC

## Features

- Facilities and assets CRUD with filtering and status control
- Booking requests with overlap prevention and admin approval workflow
- Ticket lifecycle with comments and secure image uploads
- Notifications for booking and ticket updates
- JWT authentication with `USER`, `ADMIN`, and `TECHNICIAN` roles
- Responsive dashboard UI with sidebar and top navigation

## Local Run

### 1. Start MySQL

```bash
docker-compose up -d
```

### 2. Run backend

Use Java 17.

```bash
cd Unicore-System/backend
mvn spring-boot:run
```

Backend: `http://localhost:8080`

### 3. Run frontend

```bash
cd Unicore-System/frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Seed Accounts

- Admin: `admin@unicore.edu` / `Admin@123`
- Technician: `technician@unicore.edu` / `Technician@123`
- User: `student1@unicore.edu` / `Student@123`

## CI

GitHub Actions builds:

- `Unicore-System/backend` with Maven
- `Unicore-System/frontend` with Vite

## Postman

Use the collection in `postman/collections/UniCore-System.postman_collection.json` for examiner-ready API evidence.
