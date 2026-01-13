# **Pydah Transport Application – Educational Institute Edition  
Functional Requirements Documentation**

## **1. Overview**
Pydah Transport is a web-based transport management system for **Pydah Educational Institutions**. It manages buses, routes, and **stage-wise fare structures** for student/staff transportation.

---

## **2. Core Functionalities**

### **2.1 Bus Management**
- **Create Bus**: Add a new bus with details:
  - Bus ID (Unique)
  - Bus Number (License Plate)
  - Capacity (Number of seats)
  - Bus Type (Standard, Mini-bus, Van)
  - Amenities (First-aid kit, Fire extinguisher, GPS tracker)
  - Driver & Attendant details
- **Edit Bus**: Modify existing bus details.
- **View Bus List**: Display all buses with filters (available/assigned).
- **Delete/Archive Bus**: Remove bus from service (retain historical data).

---

### **2.2 Route Management**
- **Create Route**: Define a new route with:
  - Route ID (Unique)
  - Route Name (e.g., "Kukatpally Main Route")
  - Start Point (Institute Campus)
  - End Point (Farthest stop)
  - Total Distance (km)
  - Estimated Travel Time
  - **Stages**: Define pickup/drop points along the route
- **Edit Route**: Update route details, add/remove stages.
- **View Routes**: List all routes with stage details.
- **Assign Buses to Routes**: Link buses to specific routes and timings.

---

### **2.3 Stage-wise Fare Management**
**Stage** = A segment/distance interval along a route where a fixed fare applies.

#### **Features:**
- **Define Stages per Route**:
  - Example Route: Campus → Stage 1 (2km) → Stage 2 (4km) → Stage 3 (6km)
  - Each stage has a **fixed fare** based on distance from campus
- **Stage Fare Structure**:
  - Stage 1 (0–3 km): ₹500/month
  - Stage 2 (3–6 km): ₹800/month
  - Stage 3 (6–9 km): ₹1100/month
  - Beyond 9 km: ₹1400/month
- **Multiple Fare Types**:
  - Student Monthly Pass
  - Staff Monthly Pass
  - Single Journey Fare (if applicable)
- **Edit/Update Stage Fares**: Modify as per institute policy.

---

## **3. User Roles**

### **3.1 Transport Manager (Admin)**
- Full access to bus, route, stage fare management
- Generate reports
- Approve/Reject transport applications

### **3.2 Institute Staff/Teachers**
- View available routes & stages
- Apply for transport pass
- Make payments (monthly)

### **3.3 Students/Parents**
- View route & stage-wise fares
- Register for transport
- Check bus timings & pickup points

### **3.4 Drivers & Attendants**
- View assigned route & stages
- Mark daily attendance/trips
- Report issues

---

## **4. Additional Features**

### **4.1 Student/Staff Transport Registration**
- Select route → Select stage (nearest pickup) → Calculate fare → Apply
- Auto-approval or manual approval by Transport Manager
- ID card generation with bus/route details

### **4.2 Attendance & Tracking**
- Daily student/staff boarding log (via RFID/Manual entry)
- Stage-wise pickup/drop tracking
- Late arrival alerts to parents/staff

### **4.3 Notifications**
- New route/stage announcements
- Fare change alerts
- Bus delay/cancellation alerts (SMS/Email)

### **4.4 Reports**
- Stage-wise collection report
- Bus occupancy report
- Defaulters list (fee pending)
- Fuel & maintenance cost per route

---

## **5. Sample Workflow**

1. **Transport Manager creates route**  
   Route: "Madhapur Route" with stages:
   - Stage 1: Hitech City (3km from campus) → Fare: ₹600/month
   - Stage 2: Kondapur (5km) → Fare: ₹900/month
   - Stage 3: Gachibowli (7km) → Fare: ₹1200/month

2. **Assign bus** → Bus B01 assigned to this route (Morning & Evening trips).

3. **Student applies for transport**  
   - Selects "Madhapur Route", Stage 2 (Kondapur)  
   - System calculates fare: ₹900/month  
   - Application sent for approval.

4. **Payment & ID card** → After payment, student receives digital pass with:
   - Bus number
   - Pickup point (Stage 2: Kondapur)
   - Pickup time: 7:15 AM

---

## **6. Tech Stack Suggestions**
- **Backend**: Python (Django – recommended for education systems)
- **Database**: PostgreSQL (for relational data: routes, stages, users)
- **Frontend**: React.js or Django Templates
- **Authentication**: Role-based (Student, Staff, Transport Manager)
- **Notifications**: Email/SMS API (e.g., Twilio, Fast2SMS)

---

## **7. Future Enhancements**
- Live bus tracking for parents via GPS
- Integration with institute ERP for fee collection
- Mobile app for drivers (trip logging)
- Automated stage-wise fare revision based on fuel price changes
- Route optimization (suggest best routes/stages)

---

*This document provides a clear structure for Pydah Transport tailored to **educational institutes** with **stage-based fare system**.*

## **8. Hybrid Database Strategy**
- **MySQL**: Used to fetch and manage Student/Staff data (existing institute records).
- **MongoDB**: Used for Transport-specific data (Buses, Routes, Stages, Fares, Logs) and linking them to MySQL user records.
