const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS db');
    console.log('✅ Connected to database:', rows[0].db);
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
  }
})();

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ========== AUTH ROUTES ==========

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const [existing] = await db.query('SELECT * FROM User WHERE Email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const [result] = await db.query(
      'INSERT INTO User (Name, Email, Phone_No, Password) VALUES (?, ?, ?, ?)',
      [name, email, phone, password]
    );

    res.json({
      user: { id: result.insertId, name, email, phone },
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('❌ Register error:', error.message);
    res.status(400).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  let { email, password } = req.body;
  email = String(email).trim().toLowerCase();
  password = String(password).trim();
  console.log('🔐 Login attempt:', email);

  try {
    const [users] = await db.query(
      'SELECT User_ID, Name, Email, Phone_No, Role FROM User WHERE Email = ? AND Password = ?',
      [email, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    console.log('✅ Login successful:', user.Email, 'Role:', user.Role);
    
    res.json({
      user: {
        id: user.User_ID,
        name: user.Name,
        email: user.Email,
        phone: user.Phone_No,
        role: user.Role || 'user'
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ========== MOVIE ROUTES ==========

app.get('/api/movies', async (req, res) => {
  try {
    const [movies] = await db.query('SELECT * FROM Movie');
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

app.get('/api/movies/:id', async (req, res) => {
  try {
    const [movies] = await db.query('SELECT * FROM Movie WHERE Movie_ID = ?', [req.params.id]);
    if (movies.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movies[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching movie' });
  }
});

app.post('/api/movies', async (req, res) => {
  try {
    const { Title, Genre, Language, Duration, Rating } = req.body;
    const [result] = await db.query(
      'INSERT INTO Movie (Title, Genre, Language, Duration, Rating) VALUES (?, ?, ?, ?, ?)',
      [Title, Genre, Language, Duration || 120, Rating || 0]
    );
    res.json({ movieId: result.insertId, message: 'Movie added successfully' });
  } catch (error) {
    console.error('Error adding movie:', error);
    res.status(500).json({ message: 'Error adding movie' });
  }
});

app.delete('/api/movies/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Movie WHERE Movie_ID = ?', [req.params.id]);
    res.json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting movie' });
  }
});

// ========== THEATRE ROUTES ==========

app.get('/api/theatres', async (req, res) => {
  try {
    const [theatres] = await db.query('SELECT * FROM Theatre');
    res.json(theatres);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theatres' });
  }
});

app.get('/api/theatres/movie/:movieId', async (req, res) => {
  try {
    const [theatres] = await db.query(`
      SELECT t.* 
      FROM Theatre t
      JOIN Movie_Screened_At_Theatre mst ON t.Theatre_ID = mst.Theatre_ID
      WHERE mst.Movie_ID = ?
    `, [req.params.movieId]);
    res.json(theatres);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching theatres' });
  }
});

app.post('/api/theatres', async (req, res) => {
  try {
    const { Name, Location, No_of_Screens } = req.body;
    const [result] = await db.query(
      'INSERT INTO Theatre (Name, Location, No_of_Screens) VALUES (?, ?, ?)',
      [Name, Location, No_of_Screens]
    );
    res.json({ theatreId: result.insertId, message: 'Theatre added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding theatre' });
  }
});

app.delete('/api/theatres/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Theatre WHERE Theatre_ID = ?', [req.params.id]);
    res.json({ message: 'Theatre deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting theatre' });
  }
});

// ========== SNACKS ROUTES ==========

app.get('/api/snacks', async (req, res) => {
  try {
    const [snacks] = await db.query('SELECT * FROM Snacks WHERE Availability = 1');
    res.json(snacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching snacks' });
  }
});

app.post('/api/snacks', async (req, res) => {
  try {
    const { Snack_Name, Price } = req.body;
    const [result] = await db.query(
      'INSERT INTO Snacks (Snack_Name, Price, Type, Availability) VALUES (?, ?, ?, 1)',
      [Snack_Name, Price, 'Snack']
    );
    res.json({ snackId: result.insertId, message: 'Snack added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding snack' });
  }
});

app.delete('/api/snacks/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM Snacks WHERE Snack_ID = ?', [req.params.id]);
    res.json({ message: 'Snack deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting snack' });
  }
});

// ========== BOOKING ROUTES ==========

app.post('/api/bookings', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      movieId, 
      theatreId, 
      seatNo, 
      seatType,
      numTickets, 
      showDate, 
      showTime,
      paymentMode,
      snacks,
      userId
    } = req.body;
    
    // Generate a random seat number if not provided
    const finalSeatNo = seatNo || `S${Math.floor(Math.random() * 100) + 1}`;
    
    const [ticketResult] = await connection.query(
      `INSERT INTO Ticket (Seat_No, Seat_Type, Amount, No_of_Tickets, User_ID, Movie_ID, Theatre_ID, Show_Date, Show_Time) 
       VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [finalSeatNo, seatType, numTickets, userId, movieId, theatreId, showDate, showTime]
    );
    
    const ticketId = ticketResult.insertId;
    
    // Get the calculated amount from trigger
    const [ticket] = await connection.query('SELECT Amount FROM Ticket WHERE Ticket_ID = ?', [ticketId]);
    let totalAmount = parseFloat(ticket[0].Amount);
    
    // Add snacks to order
    if (snacks && snacks.length > 0) {
      for (const snack of snacks) {
        await connection.query(
          'INSERT INTO Orders (Ticket_ID, Snack_ID, Quantity) VALUES (?, ?, ?)',
          [ticketId, snack.snackId, snack.quantity]
        );
        
        const [snackData] = await connection.query('SELECT Price FROM Snacks WHERE Snack_ID = ?', [snack.snackId]);
        totalAmount += parseFloat(snackData[0].Price) * snack.quantity;
      }
    }
    
    // Create payment record
    const [paymentResult] = await connection.query(
      'INSERT INTO Payment (Payment_Mode, Amount, Payment_Status, User_ID, Ticket_ID) VALUES (?, ?, ?, ?, ?)',
      [paymentMode, totalAmount, 'Completed', userId, ticketId]
    );
    
    // Record user watched movie
    await connection.query(
      'INSERT IGNORE INTO User_Watches_Movie (User_ID, Movie_ID) VALUES (?, ?)',
      [userId, movieId]
    );
    
    await connection.commit();
    
    res.json({ 
      ticketId, 
      paymentId: paymentResult.insertId,
      totalAmount,
      message: 'Booking successful!' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Booking error:', error);
    res.status(400).json({ message: 'Booking failed', error: error.message });
  } finally {
    connection.release();
  }
});

app.get('/api/bookings', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Add cache-control headers to prevent 304 responses
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const [bookings] = await db.query(`
      SELECT 
        t.Ticket_ID,
        t.Seat_No,
        t.Seat_Type,
        t.No_of_Tickets,
        t.Amount,
        t.Show_Date,
        t.Show_Time,
        m.Title as movie_title,
        m.Genre,
        th.Name as theatre_name,
        th.Location,
        p.Payment_Status,
        p.Payment_Mode
      FROM Ticket t
      JOIN Movie m ON t.Movie_ID = m.Movie_ID
      JOIN Theatre th ON t.Theatre_ID = th.Theatre_ID
      LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
      WHERE t.User_ID = ?
      ORDER BY t.Ticket_ID DESC
    `, [userId]);
    
    // Fetch snacks for each booking
    for (let booking of bookings) {
      const [snacks] = await db.query(`
        SELECT s.Snack_Name, s.Price, o.Quantity
        FROM Orders o
        JOIN Snacks s ON o.Snack_ID = s.Snack_ID
        WHERE o.Ticket_ID = ?
      `, [booking.Ticket_ID]);
      booking.snacks = snacks;
    }
    
    console.log(`📊 Returning ${bookings.length} bookings for user ${userId}`);
    res.json(bookings);
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

app.get('/api/bookings/:id', auth, async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT 
        t.*,
        m.Title as movie_title,
        th.Name as theatre_name,
        p.Payment_Status,
        p.Payment_Mode
      FROM Ticket t
      JOIN Movie m ON t.Movie_ID = m.Movie_ID
      JOIN Theatre th ON t.Theatre_ID = th.Theatre_ID
      LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
      WHERE t.Ticket_ID = ? AND t.User_ID = ?
    `, [req.params.id, req.userId]);
    
    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(bookings[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking' });
  }
});

// ========== FEEDBACK ROUTES ==========

app.post('/api/feedback', async (req, res) => {
  try {
    const { movieId, rating, comment, userId } = req.body;
    
    // Validate rating
    if (rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Rating must be between 1 and 10' });
    }
    
    const [result] = await db.query(
      'INSERT INTO Feedback (Comment, Rating, User_ID, Movie_ID) VALUES (?, ?, ?, ?)',
      [comment, rating, userId, movieId]
    );
    
    res.json({ 
      feedbackId: result.insertId, 
      message: 'Feedback submitted successfully' 
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }
    console.error('❌ Feedback error:', error);
    res.status(400).json({ message: 'Failed to submit feedback' });
  }
});

app.get('/api/feedback/movie/:movieId', async (req, res) => {
  try {
    const [feedback] = await db.query(`
      SELECT f.*, u.Name as user_name
      FROM Feedback f
      JOIN User u ON f.User_ID = u.User_ID
      WHERE f.Movie_ID = ?
      ORDER BY f.Feedback_ID DESC
    `, [req.params.movieId]);
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

app.get('/api/feedback/my', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const [feedback] = await db.query(`
      SELECT f.*, m.Title as movie_title
      FROM Feedback f
      JOIN Movie m ON f.Movie_ID = m.Movie_ID
      WHERE f.User_ID = ?
      ORDER BY f.Feedback_ID DESC
    `, [userId]);
    
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

// ========== ADMIN ROUTES ==========

app.get('/api/admin/users', async (req, res) => {
  try {
    const [users] = await db.query('SELECT User_ID, Name, Email, Phone_No, Role FROM User');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

app.get('/api/admin/bookings', async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT 
        t.Ticket_ID,
        t.Seat_No,
        t.Seat_Type,
        t.No_of_Tickets,
        t.Amount,
        t.Show_Date,
        t.Show_Time,
        u.Name as user_name,
        u.Email as user_email,
        m.Title as movie_title,
        th.Name as theatre_name,
        p.Payment_Status,
        p.Payment_Mode
      FROM Ticket t
      JOIN User u ON t.User_ID = u.User_ID
      JOIN Movie m ON t.Movie_ID = m.Movie_ID
      JOIN Theatre th ON t.Theatre_ID = th.Theatre_ID
      LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
      ORDER BY t.Ticket_ID DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM User');
    const [totalBookings] = await db.query('SELECT COUNT(*) as count FROM Ticket');
    const [totalRevenue] = await db.query('SELECT SUM(Amount) as total FROM Payment WHERE Payment_Status = "Completed"');
    const [totalMovies] = await db.query('SELECT COUNT(*) as count FROM Movie');
    
    res.json({
      totalUsers: totalUsers[0].count,
      totalBookings: totalBookings[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      totalMovies: totalMovies[0].count
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// ========== ANALYTICS ROUTES (Using Functions & Procedures) ==========

// FUNCTION 1: Get movie revenue using fn_get_movie_revenue()
app.get('/api/analytics/movie/:id/revenue', async (req, res) => {
  try {
    const [result] = await db.query(
      'SELECT fn_get_movie_revenue(?) as revenue',
      [req.params.id]
    );
    
    const [movieDetails] = await db.query(
      'SELECT Title, Genre FROM Movie WHERE Movie_ID = ?',
      [req.params.id]
    );

    res.json({
      movieId: req.params.id,
      movieTitle: movieDetails[0]?.Title || 'Unknown',
      revenue: parseFloat(result[0]?.revenue) || 0,
      formattedRevenue: `$${parseFloat(result[0]?.revenue || 0).toFixed(2)}`
    });
  } catch (error) {
    console.error('❌ Error fetching movie revenue:', error.message);
    res.status(500).json({ message: 'Error fetching movie revenue' });
  }
});

// ============================================================================
// MOVIE RECOMMENDATIONS ENDPOINT
// ============================================================================

app.get('/api/analytics/movie-recommendations', async (req, res) => {
  try {
    const [recommendations] = await db.query(`
      SELECT DISTINCT
        m1.Movie_ID,
        m1.Title,
        m1.Genre,
        m1.Language,
        m1.Rating,
        fn_get_movie_avg_rating(m1.Movie_ID) AS User_Rating,
        COUNT(DISTINCT uwm.User_ID) AS Users_Who_Watched,
        ROUND(COUNT(DISTINCT t.Ticket_ID) * 1.0 / (SELECT COUNT(*) FROM Ticket), 2) AS Market_Share
      FROM Movie m1
      JOIN User_Watches_Movie uwm ON m1.Movie_ID = uwm.Movie_ID
      LEFT JOIN Ticket t ON m1.Movie_ID = t.Movie_ID
      WHERE m1.Genre IN ('Sci-Fi', 'Action')
      GROUP BY m1.Movie_ID, m1.Title, m1.Genre, m1.Language, m1.Rating
      ORDER BY User_Rating DESC, Users_Who_Watched DESC
    `);

    res.json({
      recommendations: recommendations || [],
      totalRecommendations: recommendations?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching movie recommendations:', error.message);
    res.status(500).json({ message: 'Error fetching movie recommendations' });
  }
});

// FUNCTION 2: Get average rating for a movie using fn_get_movie_avg_rating()
app.get('/api/analytics/movie/:id/rating', async (req, res) => {
  try {
    const [avgResult] = await db.query(
      'SELECT fn_get_movie_avg_rating(?) as avgRating',
      [req.params.id]
    );
    
    const [feedbackCount] = await db.query(
      'SELECT COUNT(*) as count FROM Feedback WHERE Movie_ID = ?',
      [req.params.id]
    );

    res.json({
      movieId: req.params.id,
      avgRating: parseFloat(avgResult[0]?.avgRating || 0),
      totalReviews: feedbackCount[0]?.count || 0
    });
  } catch (error) {
    console.error('❌ Error fetching movie rating:', error.message);
    res.status(500).json({ message: 'Error fetching movie rating' });
  }
});
// Add this to your server.js in the analytics section
app.get('/api/analytics/snacks-revenue', async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT SUM(s.Price * o.Quantity) as total_snacks_revenue
      FROM Orders o
      JOIN Snacks s ON o.Snack_ID = s.Snack_ID
    `);

    res.json({
      totalSnacksRevenue: parseFloat(result[0]?.total_snacks_revenue || 0),
      formattedRevenue: `$${parseFloat(result[0]?.total_snacks_revenue || 0).toFixed(2)}`
    });
  } catch (error) {
    console.error('❌ Error fetching snacks revenue:', error.message);
    res.status(500).json({ message: 'Error fetching snacks revenue' });
  }
});
// FUNCTION 3: Get user snacks spending using fn_get_user_snacks_spent()
app.get('/api/analytics/user/:id/snacks', async (req, res) => {
  try {
    const [snacksSpent] = await db.query(
      'SELECT fn_get_user_snacks_spent(?) as spent',
      [req.params.id]
    );
    
    const [snacksBreakdown] = await db.query(`
      SELECT 
        t.Ticket_ID,
        m.Title as movie_title,
        GROUP_CONCAT(CONCAT(s.Snack_Name, ' x', o.Quantity, ' = $', FORMAT(s.Price * o.Quantity, 2)) SEPARATOR ', ') as snacks_ordered,
        SUM(s.Price * o.Quantity) as snacks_total
      FROM Orders o
      JOIN Snacks s ON o.Snack_ID = s.Snack_ID
      JOIN Ticket t ON o.Ticket_ID = t.Ticket_ID
      JOIN Movie m ON t.Movie_ID = m.Movie_ID
      WHERE t.User_ID = ?
      GROUP BY t.Ticket_ID, m.Title
      ORDER BY t.Ticket_ID DESC
    `, [req.params.id]);

    res.json({
      userId: req.params.id,
      totalSnacksSpent: parseFloat(snacksSpent[0]?.spent || 0),
      formattedSpent: `$${parseFloat(snacksSpent[0]?.spent || 0).toFixed(2)}`,
      snacksBreakdown: snacksBreakdown || []
    });
  } catch (error) {
    console.error('❌ Error fetching user snacks spending:', error.message);
    res.status(500).json({ message: 'Error fetching user snacks spending' });
  }
});

// PROCEDURE 1: sp_get_user_booking_history()
// PROCEDURE 1: sp_get_user_booking_history()
app.get('/api/analytics/user/:id/booking-history', async (req, res) => {
  let connection;
  try {
    const userId = req.params.id;
    console.log('📊 Fetching booking history for user:', userId);
    
    connection = await db.getConnection();
    
    // First check if procedure exists
    const [procedureCheck] = await connection.query(
      `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
       WHERE ROUTINE_NAME = 'sp_get_user_booking_history' 
       AND ROUTINE_SCHEMA = ?`,
      [process.env.DB_NAME]
    );
    
    if (procedureCheck.length === 0) {
      console.log('❌ Procedure sp_get_user_booking_history does not exist');
      return res.json({ 
        userId, 
        bookings: [],
        totalBookings: 0,
        message: 'Procedure not available, using fallback'
      });
    }
    
    console.log('✅ Procedure exists, calling it...');
    const [results] = await connection.query(
      'CALL sp_get_user_booking_history(?)',
      [userId]
    );
    
    const bookingHistory = results[0] || [];
    console.log(`✅ Retrieved ${bookingHistory.length} booking history records`);
    
    res.json({
      userId: userId,
      bookings: bookingHistory,
      totalBookings: bookingHistory.length
    });
    
  } catch (error) {
    console.error('❌ Error in booking history endpoint:', error.message);
    
    // Fallback: If procedure fails, use regular query
    try {
      const [fallbackBookings] = await db.query(`
        SELECT 
          t.Ticket_ID,
          m.Title as Movie_Title,
          th.Name as Theatre_Name,
          t.Show_Date,
          t.Show_Time,
          t.Seat_Type,
          t.No_of_Tickets,
          t.Amount as Grand_Total,
          p.Payment_Status,
          GROUP_CONCAT(CONCAT(s.Snack_Name, ' x', o.Quantity)) as Snacks_Ordered
        FROM Ticket t
        JOIN Movie m ON t.Movie_ID = m.Movie_ID
        JOIN Theatre th ON t.Theatre_ID = th.Theatre_ID
        LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
        LEFT JOIN Orders o ON t.Ticket_ID = o.Ticket_ID
        LEFT JOIN Snacks s ON o.Snack_ID = s.Snack_ID
        WHERE t.User_ID = ?
        GROUP BY t.Ticket_ID, m.Title, th.Name, t.Show_Date, t.Show_Time, t.Seat_Type, t.No_of_Tickets, t.Amount, p.Payment_Status
        ORDER BY t.Show_Date DESC, t.Show_Time DESC
      `, [req.params.id]);
      
      res.json({
        userId: req.params.id,
        bookings: fallbackBookings || [],
        totalBookings: fallbackBookings?.length || 0,
        message: 'Using fallback query'
      });
    } catch (fallbackError) {
      res.status(500).json({ 
        message: 'Error fetching booking history', 
        error: error.message 
      });
    }
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// PROCEDURE 2: sp_process_payment_batch()
app.post('/api/analytics/payment-batch', async (req, res) => {
  try {
    const { theatreId, startDate, endDate, status } = req.body;
    
    if (!theatreId || !startDate || !endDate || !status) {
      return res.status(400).json({ message: 'Missing required fields: theatreId, startDate, endDate, status' });
    }

    const connection = await db.getConnection();
    const [result] = await connection.query(
      'CALL sp_process_payment_batch(?, ?, ?, ?)',
      [theatreId, startDate, endDate, status]
    );
    connection.release();

    res.json({
      report: result[0][0] || {},
      message: 'Payment batch processed successfully'
    });
  } catch (error) {
    console.error('❌ Error processing payment batch:', error.message);
    res.status(500).json({ message: 'Error processing payment batch', error: error.message });
  }
});

// PROCEDURE 3: sp_complete_booking()
app.post('/api/complete-booking-procedure', async (req, res) => {
  try {
    const { userId, movieId, theatreId, seatType, numTickets, showDate, showTime, paymentMode } = req.body;
    
    if (!userId || !movieId || !theatreId || !seatType || !numTickets || !showDate || !showTime || !paymentMode) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    const connection = await db.getConnection();
    let ticketId, totalAmount;

    try {
      const [result] = await connection.query(
        `CALL sp_complete_booking(?, ?, ?, ?, ?, ?, ?, ?, @p_ticket_id, @p_total_amount)`,
        [userId, movieId, theatreId, seatType, numTickets, showDate, showTime, paymentMode]
      );

      const [outParams] = await connection.query('SELECT @p_ticket_id as ticket_id, @p_total_amount as total_amount');
      ticketId = outParams[0]?.ticket_id;
      totalAmount = outParams[0]?.total_amount;

      res.json({
        ticketId: ticketId,
        totalAmount: parseFloat(totalAmount || 0),
        formattedAmount: `$${parseFloat(totalAmount || 0).toFixed(2)}`,
        message: 'Booking completed successfully via procedure'
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Error completing booking:', error.message);
    res.status(500).json({ message: 'Error completing booking', error: error.message });
  }
});

// Complex query: Get all movies with revenue, rating, and booking count
app.get('/api/analytics/movies-summary', async (req, res) => {
  try {
    const [moviesSummary] = await db.query(`
      SELECT 
        m.Movie_ID,
        m.Title,
        m.Genre,
        m.Language,
        m.Duration,
        m.Rating,
        fn_get_movie_revenue(m.Movie_ID) as total_revenue,
        COALESCE(AVG(f.Rating), 0) as avg_rating,
        COUNT(DISTINCT t.Ticket_ID) as total_bookings,
        COUNT(DISTINCT t.User_ID) as unique_users,
        COUNT(DISTINCT CASE WHEN f.Feedback_ID IS NOT NULL THEN f.User_ID END) as reviewers
      FROM Movie m
      LEFT JOIN Ticket t ON m.Movie_ID = t.Movie_ID
      LEFT JOIN Feedback f ON m.Movie_ID = f.Movie_ID
      GROUP BY m.Movie_ID, m.Title, m.Genre, m.Language, m.Duration, m.Rating
      ORDER BY total_revenue DESC
    `);

    res.json({
      moviesSummary: moviesSummary || [],
      totalMovies: moviesSummary?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching movies summary:', error.message);
    res.status(500).json({ message: 'Error fetching movies summary' });
  }
});

// Complex query: Get user analytics with spending patterns
app.get('/api/analytics/users-summary', async (req, res) => {
  try {
    const [usersSummary] = await db.query(`
      SELECT 
        u.User_ID,
        u.Name,
        u.Email,
        COUNT(DISTINCT t.Ticket_ID) as total_bookings,
        SUM(t.Amount) as total_spent_tickets,
        fn_get_user_snacks_spent(u.User_ID) as snacks_spent,
        (SUM(t.Amount) + COALESCE(fn_get_user_snacks_spent(u.User_ID), 0)) as total_spent,
        COUNT(DISTINCT m.Movie_ID) as movies_watched,
        COUNT(DISTINCT f.Feedback_ID) as reviews_given,
        MAX(t.Show_Date) as last_booking_date
      FROM User u
      LEFT JOIN Ticket t ON u.User_ID = t.User_ID
      LEFT JOIN Movie m ON t.Movie_ID = m.Movie_ID
      LEFT JOIN Feedback f ON u.User_ID = f.User_ID
      GROUP BY u.User_ID, u.Name, u.Email
      ORDER BY total_spent DESC
    `);

    res.json({
      usersSummary: usersSummary || [],
      totalUsers: usersSummary?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching users summary:', error.message);
    res.status(500).json({ message: 'Error fetching users summary' });
  }
});

// Complex query: Theatre performance with validation
app.get('/api/analytics/theatre-performance', async (req, res) => {
  try {
    const [theatrePerformance] = await db.query(`
      SELECT 
        th.Theatre_ID,
        th.Name,
        th.Location,
        th.No_of_Screens,
        COUNT(DISTINCT t.Ticket_ID) as total_bookings,
        SUM(t.Amount) as revenue,
        COUNT(DISTINCT t.Movie_ID) as unique_movies,
        COUNT(DISTINCT t.User_ID) as unique_customers,
        AVG(m.Rating) as avg_movie_rating,
        COUNT(DISTINCT CASE WHEN p.Payment_Status = 'Completed' THEN p.Payment_ID END) as completed_payments
      FROM Theatre th
      LEFT JOIN Ticket t ON th.Theatre_ID = t.Theatre_ID
      LEFT JOIN Movie m ON t.Movie_ID = m.Movie_ID
      LEFT JOIN Payment p ON t.Ticket_ID = p.Ticket_ID
      GROUP BY th.Theatre_ID, th.Name, th.Location, th.No_of_Screens
      ORDER BY revenue DESC
    `);

    res.json({
      theatrePerformance: theatrePerformance || [],
      totalTheatres: theatrePerformance?.length || 0
    });
  } catch (error) {
    console.error('❌ Error fetching theatre performance:', error.message);
    res.status(500).json({ message: 'Error fetching theatre performance' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    database: process.env.DB_NAME
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled error:', error);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`
  📊 Available Endpoints:
  ✅ AUTH: POST /api/login, POST /api/register
  ✅ MOVIES: GET/POST/DELETE /api/movies
  ✅ THEATRES: GET/POST/DELETE /api/theatres
  ✅ SNACKS: GET/POST/DELETE /api/snacks
  ✅ BOOKINGS: GET/POST /api/bookings
  ✅ FEEDBACK: GET/POST /api/feedback
  ✅ ADMIN: GET /api/admin/*
  ✅ ANALYTICS: GET /api/analytics/*
  ✅ HEALTH: GET /api/health
  `);
});