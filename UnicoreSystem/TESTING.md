# UniCore System Testing Evidence

## 1. Overview

- Project: UniCore System
- Backend: Spring Boot
- Frontend: React
- Test Types:
  - Unit testing
  - Integration testing
  - API testing with Postman
  - UI verification

## 2. Unit Tests

### 2.1 BookingServiceTest

- Purpose: Verify booking business rules
- Coverage:
  - Reject overlapping bookings
  - Save valid booking requests

Screenshot:
- Insert test runner screenshot here

### 2.2 TicketServiceTest

- Purpose: Verify ticket service logic
- Coverage:
  - Urgent notification logic for high-priority tickets
  - Comment ownership protection

Screenshot:
- Insert test runner screenshot here

## 3. Integration Test

### 3.1 BookingCreationIntegrationTest

- Purpose: Verify booking creation with repository/database interaction
- Expected Result:
  - Booking is persisted
  - Status is `PENDING`

Screenshot:
- Insert integration test screenshot here

## 4. Postman API Testing

Collection used:
- `postman/collections/UniCore-System-Testing.postman_collection.json`

### 4.1 Authentication APIs

- Register User
- Login User
- Login Admin

Evidence:
- Insert Postman screenshots for auth requests/responses

### 4.2 Booking APIs

- Create Booking
- Create Conflicting Booking
- Get My Bookings
- Approve Booking

Evidence:
- Insert Postman screenshots for booking success
- Insert screenshot showing `409 Conflict` for overlap prevention

### 4.3 Ticket APIs

- Create Ticket
- Get Tickets
- Add Ticket Comment
- Edit Comment
- Delete Comment

Evidence:
- Insert Postman screenshots for ticket/comment workflow

## 5. Frontend Testing Evidence

### 5.1 Booking Module

- Booking form submission
- Conflict validation message
- Booking history/list update

Screenshots:
- Insert frontend screenshots here

### 5.2 Ticket Module

- Ticket creation
- Ticket details page
- Comment add/edit/delete flow

Screenshots:
- Insert frontend screenshots here

### 5.3 Dashboard

- Dashboard loads with synchronized backend data

Screenshots:
- Insert dashboard screenshots here

## 6. Expected Results Summary

- Booking conflicts are prevented successfully
- Ticket creation and lifecycle work correctly
- Comment ownership rules are enforced
- Auth APIs return valid JWT tokens
- Frontend and backend stay synchronized

## 7. Test Execution Commands

### Backend tests

```powershell
cd Unicore-System\backend
..\apache-maven-3.9.6\bin\mvn.cmd test
```

### Frontend run

```powershell
cd Unicore-System\frontend
npm install
npm run dev
```

## 8. Final Submission Checklist

- Unit test screenshots attached
- Integration test screenshot attached
- Postman API screenshots attached
- Frontend screenshots attached
- No build folders included in ZIP
- README included
- Postman collection included
