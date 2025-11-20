# Movie Booking System

A full-stack movie ticket booking system with admin and user interfaces built with React, Node.js, Express, and MySQL.

## 🎯 Features

- 🎬 Browse movies with ratings and details
- 🎟️ Book tickets with seat selection
- 🍿 Add snacks to bookings
- 👨‍💼 Admin dashboard for managing movies, theatres, and snacks
- 💳 Multiple payment options
- 📊 User booking history

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MySQL
- **Styling:** CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/movie-booking-system.git
cd movie-booking-system
```

### 2. Database Setup

Create the database and run SQL scripts:
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE movie_booking;
exit;

# Run SQL scripts
mysql -u root -p movie_booking < database/schema.sql
mysql -u root -p movie_booking < database/seed_data.sql
mysql -u root -p movie_booking < database/triggers_functions.sql
```

### 3. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=movie_booking
JWT_SECRET=your_secret_key_change_in_production
```

Start the backend:
```bash
npm start
```

### 4. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 👤 Demo Accounts

**User Account:**
- Email: john@example.com
- Password: password123

**Admin Account:**
- Email: admin@cinema.com
- Password: admin123

## 📁 Project Structure
```
movie-booking-system/
├── backend/
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── AppWithLogin.jsx
│   │   ├── index.js
│   │   └── app.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   ├── schema.sql
│   ├── seed_data.sql
│   └── triggers_functions.sql
└── README.md
```

## 🎨 Features Overview

### User Features
- View available movies
- Book tickets with seat selection
- Add snacks to booking
- View booking history
- Multiple payment options

### Admin Features
- Add/Delete movies
- Add/Delete theatres
- Add/Delete snacks
- View all bookings
- Dashboard statistics



```

