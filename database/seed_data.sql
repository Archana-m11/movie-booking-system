USE movie_booking;

-- Insert Users (password: password123 - hashed with bcrypt)
INSERT INTO User (Name, Email, Phone_No, Password) VALUES
('John Doe', 'john@example.com', '+1234567890', 'password123'),
('Jane Smith', 'jane@example.com', '+1234567891', 'password123');

-- Insert Movies
INSERT INTO Movie (Title, Genre, Language, Duration, Rating) VALUES
('Inception', 'Sci-Fi', 'English', 148, 8.8),
('The Dark Knight', 'Action', 'English', 152, 9.0),
('Interstellar', 'Sci-Fi', 'English', 169, 8.6),
('Pulp Fiction', 'Crime', 'English', 154, 8.9),
('The Shawshank Redemption', 'Drama', 'English', 142, 9.3);

-- Insert Theatres
INSERT INTO Theatre (Name, Location, No_of_Screens) VALUES
('Cineplex Downtown', '123 Main St, Downtown', 8),
('Movie Palace', '456 West Ave, Uptown', 6),
('Star Cinema', '789 Central Rd, Midtown', 10);

-- Insert Snacks
INSERT INTO Snacks (Snack_Name, Price, Type, Beverage_Type, Availability) VALUES
('Popcorn (Large)', 5.99, 'Snack', NULL, 1),
('Nachos with Cheese', 6.49, 'Snack', NULL, 1),
('Hot Dog', 4.99, 'Snack', NULL, 1),
('Coca Cola (Large)', 3.99, 'Beverage', 'Soda', 1),
('Pepsi (Large)', 3.99, 'Beverage', 'Soda', 1),
('Bottled Water', 2.49, 'Beverage', 'Water', 1),
('Coffee', 3.49, 'Beverage', 'Hot', 1);

-- Link Movies to Theatres
INSERT INTO Movie_Screened_At_Theatre (Movie_ID, Theatre_ID) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 2),
(3, 2), (3, 3),
(4, 1), (4, 3),
(5, 1), (5, 2), (5, 3);