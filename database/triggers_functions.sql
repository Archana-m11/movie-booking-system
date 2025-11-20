
USE movie_booking;

 --============================================================================
-- TRIGGERS
-- ============================================================================

DELIMITER //

--  TRIGGER 1: Auto-calculate ticket amount based on seat type and quantity
CREATE TRIGGER trg_calculate_ticket_amount
BEFORE INSERT ON Ticket
FOR EACH ROW
BEGIN
    DECLARE seat_price DECIMAL(10, 2);
    
    -- Set price based on seat type
    IF NEW.Seat_Type = 'VIP' THEN
        SET seat_price = 20.00;
    ELSEIF NEW.Seat_Type = 'Premium' THEN
        SET seat_price = 15.00;
    ELSE
        SET seat_price = 10.00;
    END IF;
    
    -- Calculate total amount
    SET NEW.Amount = NEW.No_of_Tickets * seat_price;
END //



--  TRIGGER 2: Update movie rating when new feedback is added
CREATE TRIGGER trg_update_movie_rating
AFTER INSERT ON Feedback
FOR EACH ROW
BEGIN
    DECLARE avg_rating DECIMAL(2, 1);
    
    -- Calculate average rating from all feedback
    SELECT AVG(Rating) INTO avg_rating
    FROM Feedback
    WHERE Movie_ID = NEW.Movie_ID;
    
    -- Update the movie's rating
    UPDATE Movie
    SET Rating = avg_rating
    WHERE Movie_ID = NEW.Movie_ID;
END //

-- TRIGGER 3: Auto-update payment amount if ticket amount changes
CREATE TRIGGER trg_sync_payment_amount
AFTER UPDATE ON Ticket
FOR EACH ROW
BEGIN
    -- Update payment amount when ticket amount changes
    UPDATE Payment
    SET Amount = NEW.Amount
    WHERE Ticket_ID = NEW.Ticket_ID;
END //

--  TRIGGER 4: Validate movie rating range when feedback is submitted
CREATE TRIGGER trg_validate_feedback_rating
BEFORE INSERT ON Feedback
FOR EACH ROW
BEGIN
    IF NEW.Rating < 1 OR NEW.Rating > 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Rating must be between 1 and 10!';
    END IF;
END //


-- ============================================================================
-- FUNCTIONS 
-- ============================================================================

DELIMITER //

-- FUNCTION 1: Calculate total revenue for a specific movie
CREATE FUNCTION fn_get_movie_revenue (movie_id INT)
RETURNS DECIMAL(12, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_revenue DECIMAL(12, 2);
    
    SELECT COALESCE(SUM(t.Amount), 0)
    INTO total_revenue
    FROM Ticket t
    WHERE t.Movie_ID = movie_id
    AND t.Ticket_ID IN (
        SELECT Ticket_ID FROM Payment WHERE Payment_Status = 'Completed'
    );
    
    RETURN total_revenue;
END //

-- FUNCTION 2: Get average rating for a movie with multiple reviews
CREATE FUNCTION fn_get_movie_avg_rating (movie_id INT)
RETURNS DECIMAL(3, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE avg_rating DECIMAL(3, 2);
    
    SELECT COALESCE(AVG(Rating), 0)
    INTO avg_rating
    FROM Feedback
    WHERE Movie_ID = movie_id;
    
    RETURN avg_rating;
END //

-- FUNCTION 3: Get total snacks revenue for a specific user
CREATE FUNCTION fn_get_user_snacks_spent (user_id INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_spent DECIMAL(10, 2);
    
    SELECT COALESCE(SUM(s.Price * o.Quantity), 0)
    INTO total_spent
    FROM Orders o
    JOIN Snacks s ON o.Snack_ID = s.Snack_ID
    JOIN Ticket t ON o.Ticket_ID = t.Ticket_ID
    WHERE t.User_ID = user_id;
    
    RETURN total_spent;
END //

DELIMITER ;

-- ============================================================================
-- PROCEDURES 
-- ============================================================================

DELIMITER //

-- PROCEDURE 1: Complete a booking transaction (Ticket + Payment)
CREATE PROCEDURE sp_complete_booking (
    IN p_user_id INT,
    IN p_movie_id INT,
    IN p_theatre_id INT,
    IN p_seat_type VARCHAR(50),
    IN p_no_tickets INT,
    IN p_show_date DATE,
    IN p_show_time VARCHAR(20),
    IN p_payment_mode VARCHAR(50),
    OUT p_ticket_id INT,
    OUT p_total_amount DECIMAL(10, 2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Booking failed. Transaction rolled back.';
    END;
    
    START TRANSACTION;
    
    -- Insert ticket
    INSERT INTO Ticket (Seat_No, Seat_Type, No_of_Tickets, User_ID, Movie_ID, Theatre_ID, Show_Date, Show_Time)
    VALUES (CONCAT('S', FLOOR(RAND() * 100)), p_seat_type, p_no_tickets, p_user_id, p_movie_id, p_theatre_id, p_show_date, p_show_time);
    
    SET p_ticket_id = LAST_INSERT_ID();
    
    -- Get ticket amount
    SELECT Amount INTO p_total_amount FROM Ticket WHERE Ticket_ID = p_ticket_id;
    
    -- Update payment status to Completed
    UPDATE Payment
    SET Payment_Mode = p_payment_mode, Payment_Status = 'Completed'
    WHERE Ticket_ID = p_ticket_id;
    
    -- Add user watch record
    INSERT INTO User_Watches_Movie (User_ID, Movie_ID)
    VALUES (p_user_id, p_movie_id)
    ON DUPLICATE KEY UPDATE User_ID = p_user_id;
    
    COMMIT;
END //

-- PROCEDURE 2: Get detailed booking history for a user with snacks breakdown
CREATE PROCEDURE sp_get_user_booking_history (IN p_user_id INT)
BEGIN
    SELECT 
        t.Ticket_ID,
        m.Title AS Movie_Title,
        th.Name AS Theatre_Name,
        t.Seat_Type,
        t.No_of_Tickets,
        t.Show_Date,
        t.Show_Time,
        t.Amount AS Ticket_Amount,
        COALESCE(SUM(s.Price * o.Quantity), 0) AS Snacks_Total,
        (t.Amount + COALESCE(SUM(s.Price * o.Quantity), 0)) AS Grand_Total,
        GROUP_CONCAT(CONCAT(s.Snack_Name, ' (x', o.Quantity, ')') SEPARATOR ', ') AS Snacks_Ordered,
        p.Payment_Status
    FROM Ticket t
    JOIN Movie m ON t.Movie_ID = m.Movie_ID
    JOIN Theatre th ON t.Theatre_ID = th.Theatre_ID
    LEFT JOIN Orders o ON t.Ticket_ID = o.Ticket_ID
    LEFT JOIN Snacks s ON o.Snack_ID = s.Snack_ID
    LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
    WHERE t.User_ID = p_user_id
    GROUP BY t.Ticket_ID
    ORDER BY t.Show_Date DESC;
END //

-- PROCEDURE 3: Update bulk payment status and generate transaction report
CREATE PROCEDURE sp_process_payment_batch (
    IN p_theatre_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_new_status VARCHAR(50)
)
BEGIN
    DECLARE payment_count INT;
    DECLARE total_amount DECIMAL(12, 2);
    
    IF p_new_status NOT IN ('Pending', 'Completed', 'Failed') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Invalid payment status. Must be Pending, Completed, or Failed.';
    END IF;
    
    -- Update payments for tickets in date range at specific theatre
    UPDATE Payment p
    SET p.Payment_Status = p_new_status
    WHERE p.Ticket_ID IN (
        SELECT t.Ticket_ID
        FROM Ticket t
        WHERE t.Theatre_ID = p_theatre_id
        AND t.Show_Date BETWEEN p_start_date AND p_end_date
    );
    
    -- Get statistics
    SELECT COUNT(*), COALESCE(SUM(Amount), 0)
    INTO payment_count, total_amount
    FROM Payment p
    WHERE p.Ticket_ID IN (
        SELECT t.Ticket_ID
        FROM Ticket t
        WHERE t.Theatre_ID = p_theatre_id
        AND t.Show_Date BETWEEN p_start_date AND p_end_date
    );
    
    -- Display report
    SELECT 
        p_theatre_id AS Theatre_ID,
        p_new_status AS New_Status,
        payment_count AS Payments_Updated,
        total_amount AS Total_Amount,
        p_start_date AS Start_Date,
        p_end_date AS End_Date;
END //

DELIMITER ;