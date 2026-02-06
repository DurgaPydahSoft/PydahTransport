# Pydah Transport Application – List of Functionalities

This document lists **what the application does** from a user’s perspective (functionalities), not how it is built.

---

## 1. Landing / Home

- View the **Pydah Transport** branding and tagline.
- Choose between:
  - **Student & Staff Portal** – Not available yet (labelled “Coming Soon”).
  - **Administrative Control** – Go to **Admin Login** to manage fleets, routes, and transport.

---

## 2. Admin Login

- **Sign in** with username and password to access the admin area.
- After successful login, user is taken to the **Dashboard**.
- “Forgot password” link is present (not implemented yet).

---

## 3. Dashboard (after login)

- View a high-level **overview**:
  - **Total Buses** – Number of buses in the fleet.
  - **Total Routes** – Number of routes and total network distance (e.g. in km).
  - **Daily Passengers** – Placeholder only (“Coming Soon”).
- See a **Recent Alerts** section (currently empty / no alerts).
- See **Quick Actions** (e.g. Add Bus, New Route) – these are placeholders and do not navigate to Bus or Route management yet.

---

## 4. Bus Fleet Management

- **View** all buses in a card/list layout (bus number, type, capacity, driver, attendant, status).
- **Add** a new bus by entering:
  - Bus number, capacity, type (e.g. Standard, Mini-bus, Van), driver name, attendant name, status (e.g. Active, In Maintenance, Retired).
- **Edit** an existing bus (same fields).
- **Delete** a bus (with a confirmation prompt).

---

## 5. Route Network Management

- **View** all routes with:
  - Route name, ID, start point, end point, total distance, estimated time.
  - **Stages** for each route: stage name, distance from start, fare (e.g. ₹).
- **Create** a new route by entering:
  - Route ID, route name, start point, end point, total distance, estimated time.
  - One or more **stages** (stage name, distance from start, fare).
- **Edit** an existing route (including its stages).
- **Delete** a route (with confirmation).

---

## 6. Transport Requests (view only)

- **View** a list of **student transport requests** (from the main database), showing:
  - Admission number, student name, route, stage, fare, status (e.g. Pending, Approved), request date.
- No **approve** or **reject** actions in the UI yet; this screen is read-only.

---

## 7. Logout

- **Sign out** from the admin area and return to the **Login** page.

---

## Summary Table

| # | Feature / Area           | What the user can do                                                                 |
|---|--------------------------|--------------------------------------------------------------------------------------|
| 1 | Landing / Home           | See branding; go to Student portal (coming soon) or Admin Login                      |
| 2 | Admin Login              | Sign in with username/password; reach Dashboard                                      |
| 3 | Dashboard                | See total buses, routes, network distance; placeholders for passengers & quick actions |
| 4 | Bus Fleet Management     | View, add, edit, delete buses (number, capacity, type, driver, attendant, status)    |
| 5 | Route Network Management | View, create, edit, delete routes and their stages (name, distance, fare)           |
| 6 | Transport Requests       | View list of student transport requests (read-only; no approve/reject in UI)        |
| 7 | Logout                   | Sign out and return to Login                                                        |

---

## Planned / Not Yet Available

- **Student & Staff Portal** – Access to bus schedules, route fares, transport pass application (Coming Soon).
- **Daily Passengers** count on Dashboard (Coming Soon).
- **Quick Actions** on Dashboard (Add Bus, New Route) – not yet linked to the actual management pages.
- **Forgot password** on Login page – link present, not implemented.
- **Approve / Reject** transport requests – data shows status, but no actions in the app yet.
