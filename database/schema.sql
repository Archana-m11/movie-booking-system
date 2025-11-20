CREATE DATABASE IF NOT EXISTS movie_booking;
USE movie_booking;

CREATE TABLE User (
    User_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone_No VARCHAR(20) UNIQUE,
    Password VARCHAR(255) NOT NULL,
    CONSTRAINT chk_User_Email CHECK (Email LIKE '%@%')
);

CREATE TABLE Movie (
    Movie_ID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL UNIQUE,
    Genre VARCHAR(50),
    Language VARCHAR(50),
    Duration INT NOT NULL,
    Rating DECIMAL(2, 1),
    CONSTRAINT chk_Movie_Duration CHECK (Duration > 0),
    CONSTRAINT chk_Movie_Rating CHECK (Rating BETWEEN 0.0 AND 10.0)
);

CREATE TABLE Theatre (
    Theatre_ID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Location VARCHAR(255) NOT NULL,
    No_of_Screens INT NOT NULL,
    CONSTRAINT chk_Theatre_Screens CHECK (No_of_Screens >= 1)
);

CREATE TABLE Ticket (
    Ticket_ID INT PRIMARY KEY AUTO_INCREMENT,
    Seat_No VARCHAR(100) NOT NULL,
    Seat_Type VARCHAR(50) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    No_of_Tickets INT NOT NULL,
    User_ID INT NOT NULL,
    Movie_ID INT NOT NULL,
    Theatre_ID INT NOT NULL,
    Show_Date DATE,
    Show_Time VARCHAR(20),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Movie_ID) REFERENCES Movie(Movie_ID),
    FOREIGN KEY (Theatre_ID) REFERENCES Theatre(Theatre_ID),
    CONSTRAINT chk_Ticket_Amount CHECK (Amount >= 0),
    CONSTRAINT chk_Ticket_Count CHECK (No_of_Tickets >= 1)
);

-- ✅ Prevents same seat being booked twice for the same show
ALTER TABLE Ticket
ADD CONSTRAINT unique_seat_per_show UNIQUE (Theatre_ID, Show_Date, Show_Time, Seat_No);

CREATE TABLE Payment (
    Payment_ID INT PRIMARY KEY AUTO_INCREMENT,
    Payment_Mode VARCHAR(50) NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Payment_Status VARCHAR(50) NOT NULL,
    User_ID INT NOT NULL,
    Ticket_ID INT,
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Ticket_ID) REFERENCES Ticket(Ticket_ID),
    CONSTRAINT chk_Payment_Amount CHECK (Amount > 0),
    CONSTRAINT chk_Payment_Status CHECK (Payment_Status IN ('Pending', 'Completed', 'Failed'))
);

CREATE TABLE Snacks (
    Snack_ID INT PRIMARY KEY AUTO_INCREMENT,
    Snack_Name VARCHAR(100) NOT NULL UNIQUE,
    Price DECIMAL(6, 2) NOT NULL,
    Type VARCHAR(50),
    Beverage_Type VARCHAR(50),
    Availability INT NOT NULL DEFAULT 1,
    CONSTRAINT chk_Snack_Price CHECK (Price >= 0)
);

CREATE TABLE Feedback (
    Feedback_ID INT PRIMARY KEY AUTO_INCREMENT,
    Comment TEXT,
    Rating INT NOT NULL,
    User_ID INT NOT NULL,
    Movie_ID INT NOT NULL,
    CONSTRAINT uk_Feedback_UserMovie UNIQUE (User_ID, Movie_ID), 
    FOREIGN KEY (User_ID) REFERENCES User(User_ID),
    FOREIGN KEY (Movie_ID) REFERENCES Movie(Movie_ID),
    CONSTRAINT chk_Feedback_Rating CHECK (Rating BETWEEN 1 AND 10)
);

CREATE TABLE Orders (
    Order_ID INT PRIMARY KEY AUTO_INCREMENT,
    Ticket_ID INT NOT NULL,
    Snack_ID INT NOT NULL,
    Quantity INT NOT NULL,
    FOREIGN KEY (Ticket_ID) REFERENCES Ticket(Ticket_ID) ON DELETE CASCADE,
    FOREIGN KEY (Snack_ID) REFERENCES Snacks(Snack_ID),
    UNIQUE KEY (Ticket_ID, Snack_ID),
    CONSTRAINT chk_Order_Quantity CHECK (Quantity >= 1)
);

CREATE TABLE User_Watches_Movie (
    User_ID INT NOT NULL,
    Movie_ID INT NOT NULL,
    PRIMARY KEY (User_ID, Movie_ID),
    FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Movie_ID) REFERENCES Movie(Movie_ID) ON DELETE CASCADE
);

CREATE TABLE Movie_Screened_At_Theatre (
    Movie_ID INT NOT NULL,
    Theatre_ID INT NOT NULL,
    PRIMARY KEY (Movie_ID, Theatre_ID),
    FOREIGN KEY (Movie_ID) REFERENCES Movie(Movie_ID) ON DELETE CASCADE,
    FOREIGN KEY (Theatre_ID) REFERENCES Theatre(Theatre_ID) ON DELETE CASCADE
);
