import React, { useState, useEffect } from 'react';
import { Film, LogOut, Trash2, Plus, Star } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function MovieBookingApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('movieBookingUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (email, password, role) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (response.ok) {
        const user = { ...data.user, requestedRole: role };
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('movieBookingUser', JSON.stringify(user));
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please check if backend is running.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('movieBookingUser');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} error={error} />;
  }

  return currentUser.role === 'admin' || currentUser.requestedRole === 'admin' ? (
    <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />
  ) : (
    <UserDashboard currentUser={currentUser} onLogout={handleLogout} />
  );
}

function LoginPage({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginRole, setLoginRole] = useState('user');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }
    onLogin(email, password, loginRole);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '15px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '400px',
        padding: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
          <Film size={40} color="#667eea" />
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', margin: 0 }}>CineMax</h1>
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#333', marginBottom: '30px' }}>Welcome</h2>

        {error && (
          <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', color: '#c33', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#333', fontWeight: 'bold', marginBottom: '15px' }}>Login As</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
                <input type="radio" value="user" checked={loginRole === 'user'} onChange={e => setLoginRole(e.target.value)} style={{ marginRight: '8px' }} />
                <span>User</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#333' }}>
                <input type="radio" value="admin" checked={loginRole === 'admin'} onChange={e => setLoginRole(e.target.value)} style={{ marginRight: '8px' }} />
                <span>Admin</span>
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', color: '#333', fontWeight: 'bold', marginBottom: '8px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }} />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', color: '#333', fontWeight: 'bold', marginBottom: '8px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }} />
          </div>

          <button type="submit" style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>Login</button>
        </form>

        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '13px', color: '#555' }}>Demo Accounts:</p>
          <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666' }}><strong>User:</strong> john@example.com / password123</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}><strong>Admin:</strong> admin@cinema.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

function UserDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('movies');
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [cart, setCart] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [seatType, setSeatType] = useState('Standard');
  const [numTickets, setNumTickets] = useState(1);
  const [paymentMode, setPaymentMode] = useState('Credit Card');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedMovieForFeedback, setSelectedMovieForFeedback] = useState(null);
  const [userSnacksSpent, setUserSnacksSpent] = useState(0);
  const [bookingHistory, setBookingHistory] = useState([]);
  const [movieRecommendations, setMovieRecommendations] = useState([]);

  useEffect(() => {
    loadData();
    
  }, []);
  
  useEffect(() => {
    if (activeTab === 'recommendations') {
      loadMovieRecommendations();
    }
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === 'bookings') {
      console.log('Bookings tab activated, reloading data...');
      loadBookingsFromDB();
      loadUserSnacksSpending();
      loadBookingHistory();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      const [moviesRes, theatresRes, snacksRes] = await Promise.all([
        fetch(`${API_URL}/movies`).then(r => r.json()),
        fetch(`${API_URL}/theatres`).then(r => r.json()),
        fetch(`${API_URL}/snacks`).then(r => r.json())
      ]);
      
      setMovies(moviesRes || []);
      setTheatres(theatresRes || []);
      setSnacks(snacksRes || []);
      
      // Load feedback
      try {
        const feedbackRes = await fetch(`${API_URL}/feedback/my?userId=${currentUser.id}`);
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json();
          setFeedback(feedbackData || []);
        } else {
          console.log('No feedback data available');
          setFeedback([]);
        }
      } catch (feedbackErr) {
        console.log('Feedback endpoint not available yet');
        setFeedback([]);
      }
      
      // Load bookings from database
      await loadBookingsFromDB();
      
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };


  const loadMovieRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/movie-recommendations`);
      if (response.ok) {
        const data = await response.json();
        setMovieRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.log('Error loading recommendations:', err);
    }
  };
  const loadBookingsFromDB = async () => {
    try {
      console.log('Fetching bookings for user:', currentUser.id);
      const response = await fetch(`${API_URL}/bookings?userId=${currentUser.id}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const dbBookings = await response.json();
        console.log('Raw bookings data from API:', dbBookings);
        
        // Map the API response to match your component's expected structure
        const formattedBookings = dbBookings.map(booking => ({
          id: booking.Ticket_ID,
          movieTitle: booking.movie_title,
          theatreName: booking.theatre_name,
          date: booking.Show_Date,
          time: booking.Show_Time,
          seatType: booking.Seat_Type,
          tickets: booking.No_of_Tickets,
          snacks: booking.snacks || [],
          amount: parseFloat(booking.Amount || 0),
          paymentMode: booking.Payment_Mode,
          paymentStatus: booking.Payment_Status,
          genre: booking.Genre,
          location: booking.Location,
          seatNo: booking.Seat_No
        }));
        
        console.log('Formatted bookings:', formattedBookings);
        setBookings(formattedBookings);
        
        // Save to localStorage as backup
        localStorage.setItem(`bookings_${currentUser.id}`, JSON.stringify(formattedBookings));
        
      } else {
        const errorText = await response.text();
        console.log('API error:', errorText);
        // Fallback to localStorage
        const savedBookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.id}`) || '[]');
        setBookings(savedBookings);
      }
    } catch (err) {
      console.log('Fetch error:', err);
      // Fallback to localStorage
      const savedBookings = JSON.parse(localStorage.getItem(`bookings_${currentUser.id}`) || '[]');
      setBookings(savedBookings);
    }
  };

  const loadUserSnacksSpending = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/user/${currentUser.id}/snacks`);
      if (response.ok) {
        const data = await response.json();
        setUserSnacksSpent(data.totalSnacksSpent || 0);
        console.log('User snacks spending:', data.totalSnacksSpent);
      }
    } catch (err) {
      console.log('Error loading snacks spending:', err);
    }
  };

  const loadBookingHistory = async () => {
    try {
      console.log('🔍 Loading booking history for user:', currentUser.id);
      const response = await fetch(`${API_URL}/analytics/user/${currentUser.id}/booking-history`);
      console.log('📡 Booking history response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Booking history data received:', data);
        console.log('📝 Number of bookings:', data.bookings?.length);
        console.log('📝 First booking sample:', data.bookings?.[0]);
        setBookingHistory(data.bookings || []);
      } else {
        console.log('❌ Failed to load booking history, status:', response.status);
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
      }
    } catch (err) {
      console.log('💥 Error loading booking history:', err);
    }
  };
  
  const getNextDays = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const showtimes = ['10:00 AM', '1:00 PM', '4:00 PM', '7:00 PM', '10:00 PM'];
  const seatTypes = [
    { type: 'Standard', price: 10 },
    { type: 'Premium', price: 15 },
    { type: 'VIP', price: 20 }
  ];

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const addToCart = (snack) => {
    const existing = cart.find(i => i.Snack_ID === snack.Snack_ID);
    if (existing) {
      setCart(cart.map(i => i.Snack_ID === snack.Snack_ID ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...snack, quantity: 1 }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.Snack_ID !== id));

  const calculateTotal = () => {
    const seat = seatTypes.find(s => s.type === seatType);
    const tickets = seat ? seat.price * numTickets : 0;
    const snacksTotal = cart.reduce((sum, i) => sum + i.Price * i.quantity, 0);
    return tickets + snacksTotal;
  };

  const handleBooking = async () => {
    if (!selectedMovie || !selectedTheatre || !selectedDate || !selectedTime) {
      alert('Please complete all selections');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieId: selectedMovie.Movie_ID,
          theatreId: selectedTheatre.Theatre_ID,
          seatNo: "A1",
          seatType: seatType,
          numTickets: numTickets,
          showDate: selectedDate,
          showTime: selectedTime,
          paymentMode: paymentMode,
          snacks: cart.map(snack => ({
            snackId: snack.Snack_ID,
            quantity: snack.quantity
          })),
          userId: currentUser.id
        })
      });
  
      if (response.ok) {
        const result = await response.json();
        alert('✅ Booking confirmed! 🎉');
        
       
        const newBooking = {
          id: result.ticketId,
          movieTitle: selectedMovie.Title,
          movieId: selectedMovie.Movie_ID,
          theatreName: selectedTheatre.Name,
          theatreId: selectedTheatre.Theatre_ID,
          date: selectedDate,
          time: selectedTime,
          seatType,
          tickets: numTickets,
          snacks: cart,
          amount: result.totalAmount,
          paymentMode,
          userId: currentUser.id
        };
        
        const newBookings = [...bookings, newBooking];
        setBookings(newBookings);
        
       
        localStorage.setItem(`bookings_${currentUser.id}`, JSON.stringify(newBookings));
        
        // Reset form
        setSelectedMovie(null);
        setSelectedTheatre(null);
        setSelectedDate('');
        setSelectedTime('');
        setCart([]);
        setSeatType('Standard');
        setNumTickets(1);
        setActiveTab('bookings');
      } else {
        const errorData = await response.json();
        alert('Booking failed: ' + errorData.message);
      }
    } catch (err) {
      alert('Error making booking: ' + err.message);
    }
  };

  const handleFeedback = async () => {
    if (!selectedMovieForFeedback || !feedbackRating || !feedbackComment) {
      alert('Please select a movie and fill in all feedback fields');
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          movieId: selectedMovieForFeedback.Movie_ID, 
          rating: feedbackRating, 
          comment: feedbackComment,
          userId: currentUser.id
        })
      });

      if (response.ok) {
        alert('✅ Feedback submitted! 🎬\n(Trigger: trg_update_movie_rating auto-updated movie rating)\n(Trigger: trg_validate_feedback_rating validated rating)');
        setFeedbackRating(5);
        setFeedbackComment('');
        setSelectedMovieForFeedback(null);
        loadData();
      } else {
        const errorData = await response.json();
        alert('Error submitting feedback: ' + errorData.message);
      }
    } catch (err) {
      alert('Error submitting feedback: ' + err.message);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0e27' }}>
      <header style={{ backgroundColor: '#1a2a4a', color: '#fff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '28px' }}>
          🎬 CineMax
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <p style={{ margin: 0 }}>👤 {currentUser.name}</p>
          <button onClick={onLogout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <nav style={{ backgroundColor: '#16213e', padding: '16px', display: 'flex', gap: '10px', borderBottom: '2px solid #0f68ff', overflowX: 'auto' }}>
        {['movies', 'bookings', 'feedback', 'theatres'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 16px',
            backgroundColor: activeTab === tab ? '#0f68ff' : 'transparent',
            color: activeTab === tab ? '#fff' : '#aaa',
            border: '1px solid ' + (activeTab === tab ? '#0f68ff' : '#444'),
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>
            {tab === 'movies' && '🎬 Movies'}
            
            {tab === 'bookings' && '🎟️ My Bookings'}
            {tab === 'feedback' && '⭐ My Feedback'}
            {tab === 'theatres' && '🏢 Theatres'}
          </button>
        ))}
      </nav>

      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'movies' && !selectedMovie && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#0f68ff', marginBottom: '30px', fontWeight: 'bold' }}>🎬 Available Movies</h2>
           
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {movies.map(m => (
                <div key={m.Movie_ID} onClick={() => setSelectedMovie(m)} style={{
                  backgroundColor: '#1e3a5f',
                  border: '3px solid #0f68ff',
                  borderRadius: '12px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(15, 104, 255, 0.3)',
                  color: '#fff'
                }}>
                  <div style={{ backgroundColor: '#0f68ff', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{m.Title}</h3>
                  </div>
                  <p style={{ color: '#aaa', margin: '8px 0', fontSize: '14px' }}>Genre: {m.Genre}</p>
                  <p style={{ color: '#aaa', margin: '8px 0', fontSize: '14px' }}>Language: {m.Language}</p>
                  <p style={{ color: '#aaa', margin: '8px 0', fontSize: '14px' }}>Duration: {m.Duration} min</p>
                  <p style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '18px', margin: '12px 0' }}>⭐ {m.Rating || 'N/A'}/10</p>
                  <button style={{ width: '100%', padding: '10px', backgroundColor: '#0f68ff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>Book Now</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'movies' && selectedMovie && (
          <div style={{ backgroundColor: '#1a2a4a', border: '2px solid #0f68ff', borderRadius: '12px', padding: '30px', maxWidth: '700px' }}>
            <button onClick={() => setSelectedMovie(null)} style={{ color: '#0f68ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', marginBottom: '15px' }}>← Back to Movies</button>
            
            <h2 style={{ fontSize: '28px', color: '#0f68ff', marginBottom: '20px' }}>{selectedMovie.Title}</h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Select Theatre:</label>
              <select value={selectedTheatre?.Theatre_ID || ''} onChange={e => setSelectedTheatre(theatres.find(t => t.Theatre_ID == e.target.value))} style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#0f0f0f',
                border: '2px solid #0f68ff',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '14px'
              }}>
                <option value="">Choose Theatre</option>
                {theatres.map(t => <option key={t.Theatre_ID} value={t.Theatre_ID}>{t.Name} - {t.Location}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Date:</label>
                <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #0f68ff',
                  borderRadius: '6px',
                  color: '#fff'
                }}>
                  <option value="">Select Date</option>
                  {getNextDays().map(d => <option key={d} value={d}>{formatDate(d)}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Time:</label>
                <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #0f68ff',
                  borderRadius: '6px',
                  color: '#fff'
                }}>
                  <option value="">Select Time</option>
                  {showtimes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Seat Type:</label>
                <select value={seatType} onChange={e => setSeatType(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #0f68ff',
                  borderRadius: '6px',
                  color: '#fff'
                }}>
                  {seatTypes.map(s => <option key={s.type} value={s.type}>{s.type} - ${s.price}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Tickets:</label>
                <input type="number" min="1" max="10" value={numTickets} onChange={e => setNumTickets(Number(e.target.value))} style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #0f68ff',
                  borderRadius: '6px',
                  color: '#fff'
                }} />
              </div>
            </div>

            <h3 style={{ color: '#ffd700', marginBottom: '15px' }}>🍿 Add Snacks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {snacks.map(s => (
                <div key={s.Snack_ID} onClick={() => addToCart(s)} style={{
                  backgroundColor: '#2d4a2b',
                  border: '2px solid #4caf50',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  color: '#fff'
                }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{s.Snack_Name}</p>
                  <p style={{ margin: '5px 0 0 0', color: '#4caf50', fontWeight: 'bold' }}>${s.Price}</p>
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ backgroundColor: '#1e3a2b', border: '2px solid #4caf50', borderRadius: '8px', padding: '15px', marginBottom: '20px' }}>
                <h4 style={{ color: '#4caf50', margin: '0 0 10px 0' }}>🛒 Cart</h4>
                {cart.map(item => (
                  <div key={item.Snack_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '8px', marginBottom: '8px', color: '#fff' }}>
                    <span>{item.Snack_Name} x{item.quantity}</span>
                    <span>${(item.Price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.Snack_ID)} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Payment:</label>
                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#0f0f0f',
                  border: '2px solid #0f68ff',
                  borderRadius: '6px',
                  color: '#fff'
                }}>
                  <option>Credit Card</option>
                  <option>Debit Card</option>
                  <option>UPI</option>
                  <option>Cash</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Total:</label>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50', padding: '10px', backgroundColor: '#0f0f0f', borderRadius: '6px', textAlign: 'center' }}>${calculateTotal().toFixed(2)}</div>
              </div>
            </div>

            <button onClick={handleBooking} style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '15px'
            }}>✅ Confirm Booking</button>
          </div>
        )}
        {activeTab === 'recommendations' && (
  <div>
    <h2 style={{ fontSize: '32px', color: '#9d6bbf', marginBottom: '30px', fontWeight: 'bold' }}>
      ⭐ Personalized Recommendations
    </h2>
    
    {movieRecommendations.length === 0 ? (
      <div style={{ 
        backgroundColor: '#3a2555', 
        border: '2px solid #9d6bbf', 
        borderRadius: '12px', 
        padding: '40px', 
        textAlign: 'center',
        color: '#fff'
      }}>
        <h3 style={{ color: '#9d6bbf', marginBottom: '15px' }}>No Recommendations Yet</h3>
        <p style={{ color: '#ccc', marginBottom: '20px' }}>
          Start watching movies and providing feedback to get personalized recommendations!
        </p>
        <button 
          onClick={() => setActiveTab('movies')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#9d6bbf',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Browse All Movies
        </button>
      </div>
    ) : (
      <div>
        <div style={{ 
          backgroundColor: '#3a2555', 
          border: '2px solid #9d6bbf', 
          borderRadius: '12px', 
          padding: '20px', 
          marginBottom: '20px',
          color: '#fff'
        }}>
          <h3 style={{ color: '#9d6bbf', marginTop: 0 }}>🎯 Based on Your Preferences</h3>
          <p style={{ color: '#ccc', margin: 0 }}>
            We found {movieRecommendations.length} movies you might love based on ratings and popularity!
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          {movieRecommendations.map(m => (
            <div key={m.Movie_ID} onClick={() => setSelectedMovie(m)} style={{
              backgroundColor: '#3a2555',
              border: '3px solid #9d6bbf',
              borderRadius: '15px',
              padding: '25px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 6px 20px rgba(157, 107, 191, 0.3)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Popular Badge */}
              {m.Total_Bookings > 10 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  backgroundColor: '#ffd700',
                  color: '#000',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  🔥 Popular
                </div>
              )}

              {/* High Rating Badge */}
              {m.User_Rating >= 8 && (
                <div style={{
                  position: 'absolute',
                  top: '45px',
                  right: '15px',
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ⭐ Top Rated
                </div>
              )}

              <div style={{ backgroundColor: '#9d6bbf', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '20px', textAlign: 'center' }}>{m.Title}</h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#ccc', margin: '0 0 5px 0', fontSize: '12px' }}>Genre</p>
                  <p style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>{m.Genre}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#ccc', margin: '0 0 5px 0', fontSize: '12px' }}>Language</p>
                  <p style={{ color: '#fff', margin: 0, fontWeight: 'bold' }}>{m.Language}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                <div style={{ textAlign: 'center', backgroundColor: '#2a1a3a', padding: '8px', borderRadius: '8px' }}>
                  <p style={{ color: '#ffd700', margin: '0 0 5px 0', fontSize: '12px' }}>User Rating</p>
                  <p style={{ color: '#ffd700', margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                    ⭐ {m.User_Rating?.toFixed(1) || 'N/A'}/10
                  </p>
                </div>
                <div style={{ textAlign: 'center', backgroundColor: '#2a1a3a', padding: '8px', borderRadius: '8px' }}>
                  <p style={{ color: '#4caf50', margin: '0 0 5px 0', fontSize: '12px' }}>Watchers</p>
                  <p style={{ color: '#4caf50', margin: 0, fontWeight: 'bold', fontSize: '16px' }}>
                    {m.Users_Who_Watched}+
                  </p>
                </div>
              </div>

              {m.Total_Bookings > 0 && (
                <div style={{ textAlign: 'center', backgroundColor: '#1a2a4a', padding: '8px', borderRadius: '8px', marginBottom: '15px' }}>
                  <p style={{ color: '#0f68ff', margin: 0, fontSize: '14px' }}>
                    🎟️ {m.Total_Bookings} successful bookings
                  </p>
                </div>
              )}

              <button style={{ 
                width: '100%', 
                padding: '12px', 
                backgroundColor: '#9d6bbf', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#8a5ba8';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#9d6bbf';
                e.target.style.transform = 'translateY(0)';
              }}>
                🎬 Book This Movie
              </button>
            </div>
          ))}
        </div>

        {/* Browse All Movies CTA */}
        <div style={{ 
          backgroundColor: '#1a2a4a', 
          border: '2px solid #0f68ff', 
          borderRadius: '12px', 
          padding: '20px', 
          marginTop: '30px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#0f68ff', marginTop: 0 }}>Want to see more?</h3>
          <p style={{ color: '#ccc', marginBottom: '20px' }}>
            Browse our complete collection of movies
          </p>
          <button 
            onClick={() => setActiveTab('movies')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#0f68ff',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Browse All Movies
          </button>
        </div>
      </div>
    )}
  </div>
)}

        {activeTab === 'bookings' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#ffd700', marginBottom: '30px' }}>🎟️ My Bookings</h2>
            
            {/* Database Features Summary */}
            {bookings.length > 0 && (
              <div style={{ 
                backgroundColor: '#2d4a2b', 
                border: '2px solid #4caf50', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '20px',
                color: '#fff'
              }}>
                <h3 style={{ color: '#4caf50', marginTop: 0 }}>💰 Your Spending Analytics</h3>
                <p>Total spent on snacks: <strong>${userSnacksSpent.toFixed(2)}</strong></p>
                <p>Total booking value: <strong>${bookings.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</strong></p>
                <p style={{ fontSize: '12px', color: '#0f68ff' }}>
                  
                </p>
              </div>
            )}

            {/* Booking History from Stored Procedure */}
            {bookingHistory.length > 0 && (
              <div style={{ 
                backgroundColor: '#3a2555', 
                border: '2px solid #9d6bbf', 
                borderRadius: '8px', 
                padding: '15px', 
                marginBottom: '20px',
                color: '#fff'
              }}>
                <h3 style={{ color: '#9d6bbf', marginTop: 0 }}>📊 Detailed Booking History</h3>
                <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
                  
                </p>
                {bookingHistory.slice(0, 3).map((history, idx) => (
                  <div key={idx} style={{ 
                    backgroundColor: '#2a1a3a', 
                    padding: '10px', 
                    borderRadius: '6px', 
                    marginBottom: '8px',
                    border: '1px solid #6b4a8c'
                  }}>
                    <p style={{ margin: '5px 0', fontSize: '14px' }}>
                      <strong>{history.Movie_Title}</strong> - ${history.Grand_Total}
                    </p>
                    <p style={{ margin: '5px 0', fontSize: '12px', color: '#ccc' }}>
                      Snacks: {history.Snacks_Ordered || 'None'} | Status: {history.Payment_Status}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Regular Bookings Display */}
            {bookings.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '16px' }}>No bookings yet. Start booking now!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {bookings.map(b => (
                  <div key={b.id} style={{ backgroundColor: '#1a2a4a', border: '2px solid #ffd700', borderRadius: '12px', padding: '20px', color: '#fff' }}>
                    <h3 style={{ color: '#ffd700', marginTop: 0 }}>{b.movieTitle}</h3>
                    <p><strong>Theatre:</strong> {b.theatreName}</p>
                    <p><strong>Date:</strong> {formatDate(b.date)} @ {b.time}</p>
                    <p><strong>Seats:</strong> {b.tickets} x {b.seatType}</p>
                    <p><strong>Payment:</strong> {b.paymentMode}</p>
                    {b.snacks && b.snacks.length > 0 && (
  <p><strong>Snacks:</strong> 
    {b.snacks.map(snack => {
      // Handle different snack data structures
      const snackName = snack.Snack_Name || snack.snack_name || snack.name || 'Snack';
      const quantity = snack.quantity || snack.Quantity || 1;
      return `${snackName} x${quantity}`;
    }).join(', ')}
  </p>
)}
                    <p style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '18px' }}>Total: ${b.amount.toFixed(2)}</p>
                    <p style={{ color: '#0f68ff', fontSize: '12px', marginTop: '10px' }}>
                      
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#ffd700', marginBottom: '30px' }}>⭐ My Reviews</h2>

            {/* Feedback Form */}
            <div style={{ backgroundColor: '#2d3a4d', border: '2px solid #ffd700', borderRadius: '8px', padding: '20px', marginBottom: '30px' }}>
              <h3 style={{ color: '#ffd700', marginTop: 0 }}>⭐ Leave Feedback</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Select Movie:</label>
                <select
                  value={selectedMovieForFeedback?.Movie_ID || ''}
                  onChange={e => {
                    const movie = movies.find(m => m.Movie_ID == e.target.value);
                    setSelectedMovieForFeedback(movie || null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0f0f0f',
                    border: '2px solid #ffd700',
                    borderRadius: '6px',
                    color: '#fff'
                  }}
                >
                  <option value="">Choose a movie</option>
                  {movies.map(m => (
                    <option key={m.Movie_ID} value={m.Movie_ID}>
                      {m.Title}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMovieForFeedback && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Rating (1–10):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={feedbackRating}
                      onChange={e => setFeedbackRating(Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0f0f0f',
                        border: '2px solid #ffd700',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontWeight: 'bold' }}>Your Comment:</label>
                    <textarea
                      value={feedbackComment}
                      onChange={e => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      style={{
                        width: '100%',
                        padding: '10px',
                        backgroundColor: '#0f0f0f',
                        border: '2px solid #ffd700',
                        borderRadius: '6px',
                        color: '#fff',
                        minHeight: '80px',
                        fontFamily: 'Arial'
                      }}
                    />
                  </div>

                  <button
                    onClick={handleFeedback}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#ffd700',
                      color: '#000',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}
                  >
                    Submit Feedback
                  </button>
                </>
              )}
            </div>

            {/* Feedback List */}
            {feedback.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: '16px' }}>No reviews yet. Leave feedback on movies!</p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px'
                }}
              >
                {feedback.map((f, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#1a2a4a',
                      border: '2px solid #ffd700',
                      borderRadius: '12px',
                      padding: '20px',
                      color: '#fff'
                    }}
                  >
                    <h3 style={{ color: '#ffd700', marginTop: 0 }}>{f.movie_title}</h3>
                    <p style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '18px' }}>⭐ Rating: {f.Rating}/10</p>
                    <p style={{ color: '#aaa', marginTop: '10px' }}><strong>Your Review:</strong></p>
                    <p style={{ color: '#ccc' }}>{f.Comment || 'No comment provided'}</p>
                    <p style={{ color: '#0f68ff', fontSize: '12px', marginTop: '10px' }}>
                      
                      
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'theatres' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#9d6bbf', marginBottom: '30px' }}>🏢 Our Theatres</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {theatres.map(t => (
                <div key={t.Theatre_ID} style={{
                  backgroundColor: '#3a2555',
                  border: '3px solid #9d6bbf',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 4px 12px rgba(157, 107, 191, 0.3)',
                  color: '#fff'
                }}>
                  <div style={{ backgroundColor: '#9d6bbf', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                    <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{t.Name}</h3>
                  </div>
                  <p style={{ color: '#ccc', margin: '8px 0' }}>📍 {t.Location}</p>
                  <p style={{ color: '#ccc', margin: '8px 0' }}>Screens: <span style={{ fontWeight: 'bold', color: '#9d6bbf' }}>{t.No_of_Screens}</span></p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminDashboard({ currentUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [snacks, setSnacks] = useState([]);
  const [movieAnalytics, setMovieAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [movieTitle, setMovieTitle] = useState('');
  const [movieGenre, setMovieGenre] = useState('');
  const [movieLanguage, setMovieLanguage] = useState('');
  const [movieRating, setMovieRating] = useState('');

  const [theatreName, setTheatreName] = useState('');
  const [theatreLocation, setTheatreLocation] = useState('');
  const [theatreScreens, setTheatreScreens] = useState('');

  const [snackName, setSnackName] = useState('');
  const [snackPrice, setSnackPrice] = useState('');
  const [snacksRevenue, setSnacksRevenue] = useState(0);
  useEffect(() => {
    loadData();
    loadSnacksRevenue();
    const interval = setInterval(() => {
      loadData();
      loadSnacksRevenue(); 
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [moviesRes, theatresRes, snacksRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/movies`).then(r => r.json()),
        fetch(`${API_URL}/theatres`).then(r => r.json()),
        fetch(`${API_URL}/snacks`).then(r => r.json()),
        fetch(`${API_URL}/analytics/movies-summary`).then(r => r.json()).catch(() => ({ moviesSummary: [] }))
      ]);
      setMovies(moviesRes || []);
      setTheatres(theatresRes || []);
      setSnacks(snacksRes || []);
      setMovieAnalytics(analyticsRes.moviesSummary || []);
    } catch (err) {
      console.error('Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMovie = async () => {
    if (!movieTitle || !movieGenre || !movieLanguage || !movieRating) {
      alert('Fill all movie fields');
      return;
    }
    try {
      await fetch(`${API_URL}/movies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Title: movieTitle, Genre: movieGenre, Language: movieLanguage, Rating: parseFloat(movieRating) })
      });
      setMovieTitle('');
      setMovieGenre('');
      setMovieLanguage('');
      setMovieRating('');
      await loadData();
      alert('✅ Movie added!');
    } catch (err) {
      alert('Error adding movie');
    }
  };

  const deleteMovie = async (id) => {
    try {
      await fetch(`${API_URL}/movies/${id}`, { method: 'DELETE' });
      await loadData();
      alert('✅ Movie deleted!');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addTheatre = async () => {
    if (!theatreName || !theatreLocation || !theatreScreens) {
      alert('Fill all theatre fields');
      return;
    }
    try {
      await fetch(`${API_URL}/theatres`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Name: theatreName, Location: theatreLocation, No_of_Screens: parseInt(theatreScreens) })
      });
      setTheatreName('');
      setTheatreLocation('');
      setTheatreScreens('');
      await loadData();
      alert('✅ Theatre added!');
    } catch (err) {
      alert('Error adding theatre');
    }
  };
  const loadSnacksRevenue = async () => {
    try {
      
      const response = await fetch(`${API_URL}/analytics/snacks-revenue`);
      if (response.ok) {
        const data = await response.json();
        setSnacksRevenue(data.totalSnacksRevenue || 0);
      }
    } catch (err) {
      console.log('Error loading snacks revenue:', err);
    }
  };

  const deleteTheatre = async (id) => {
    try {
      await fetch(`${API_URL}/theatres/${id}`, { method: 'DELETE' });
      await loadData();
      alert('✅ Theatre deleted!');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const addSnack = async () => {
    if (!snackName || !snackPrice) {
      alert('Fill all snack fields');
      return;
    }
    try {
      await fetch(`${API_URL}/snacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Snack_Name: snackName, Price: parseFloat(snackPrice) })
      });
      setSnackName('');
      setSnackPrice('');
      await loadData();
      alert('✅ Snack added!');
    } catch (err) {
      alert('Error adding snack');
    }
  };

  const deleteSnack = async (id) => {
    try {
      await fetch(`${API_URL}/snacks/${id}`, { method: 'DELETE' });
      await loadData();
      alert('✅ Snack deleted!');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', backgroundColor: '#0f0f0f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0e27' }}>
      <header style={{ backgroundColor: '#1a2a4a', color: '#fff', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '28px' }}>
          📊 Admin Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <p style={{ margin: 0 }}>👤 {currentUser.name} (Admin)</p>
          <button onClick={onLogout} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>

      <nav style={{ backgroundColor: '#16213e', padding: '16px', display: 'flex', gap: '10px', borderBottom: '2px solid #0f68ff', overflowX: 'auto' }}>
        {['overview', 'movies', 'theatres', 'snacks', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 16px',
            backgroundColor: activeTab === tab ? '#0f68ff' : 'transparent',
            color: activeTab === tab ? '#fff' : '#aaa',
            border: '1px solid ' + (activeTab === tab ? '#0f68ff' : '#444'),
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            whiteSpace: 'nowrap'
          }}>
            {tab === 'overview' && '📊 Overview'}
            {tab === 'movies' && '🎬 Movies'}
            {tab === 'theatres' && '🏢 Theatres'}
            {tab === 'snacks' && '🍿 Snacks'}
            {tab === 'analytics' && '📈 Analytics'}
          </button>
        ))}
      </nav>

      <main style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#1e3a5f', border: '3px solid #0f68ff', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(15, 104, 255, 0.3)' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '16px' }}>📽️ Total Movies</p>
              <h2 style={{ margin: '15px 0 0 0', fontSize: '40px', color: '#0f68ff' }}>{movies.length}</h2>
            </div>
            <div style={{ backgroundColor: '#3a2555', border: '3px solid #9d6bbf', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(157, 107, 191, 0.3)' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '16px' }}>🏢 Total Theatres</p>
              <h2 style={{ margin: '15px 0 0 0', fontSize: '40px', color: '#9d6bbf' }}>{theatres.length}</h2>
            </div>
            <div style={{ backgroundColor: '#2d4a2b', border: '3px solid #4caf50', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '16px' }}>🍿 Total Snacks</p>
              <h2 style={{ margin: '15px 0 0 0', fontSize: '40px', color: '#4caf50' }}>{snacks.length}</h2>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#0f68ff', marginBottom: '30px' }}>📈 Movie Analytics </h2>
            <div style={{ overflowX: 'auto', backgroundColor: '#1a2a4a', border: '2px solid #0f68ff', borderRadius: '12px', padding: '20px' }}>
              <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #0f68ff' }}>
                    <th style={{ padding: '12px', textAlign: 'left', color: '#0f68ff' }}>Movie Title</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#0f68ff' }}>Bookings</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#ffd700' }}>Revenue </th>
                    <th style={{ padding: '12px', textAlign: 'center', color: '#ffd700' }}>Avg Rating </th>
                  </tr>
                </thead>
                <tbody>
                  {movieAnalytics.map((m, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #333', backgroundColor: idx % 2 === 0 ? '#0f0f0f' : 'transparent' }}>
                      <td style={{ padding: '12px' }}>{m.Title}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4caf50' }}>{m.total_bookings}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#ffd700' }}>${parseFloat(m.total_revenue || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#0f68ff' }}>{parseFloat(m.avg_rating || 0).toFixed(1)}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: '#aaa', marginTop: '20px', fontSize: '14px' }}>
             
             
            <div style={{ backgroundColor: '#2d4a2b', border: '3px solid #4caf50', borderRadius: '12px', padding: '20px', color: '#fff' }}>
        <h4 style={{ color: '#4caf50' }}>🍿 Snacks Revenue</h4>
        <p style={{ fontSize: '14px', color: '#aaa' }}>${snacksRevenue.toFixed(2)}</p>
      </div>
            </p>
          </div>
          
          
          
        )}

        {activeTab === 'movies' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#0f68ff', marginBottom: '30px' }}>🎬 Manage Movies</h2>
            
            <div style={{ backgroundColor: '#1a2a4a', border: '2px solid #0f68ff', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <h3 style={{ color: '#0f68ff', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Add New Movie</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Title" value={movieTitle} onChange={e => setMovieTitle(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #0f68ff', borderRadius: '6px', color: '#fff' }} />
                <input type="text" placeholder="Genre" value={movieGenre} onChange={e => setMovieGenre(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #0f68ff', borderRadius: '6px', color: '#fff' }} />
                <input type="text" placeholder="Language" value={movieLanguage} onChange={e => setMovieLanguage(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #0f68ff', borderRadius: '6px', color: '#fff' }} />
                <input type="number" placeholder="Rating (1-10)" value={movieRating} onChange={e => setMovieRating(e.target.value)} step="0.1" style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #0f68ff', borderRadius: '6px', color: '#fff' }} />
              </div>
              <button onClick={addMovie} style={{ padding: '12px 24px', backgroundColor: '#0f68ff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>➕ Add Movie</button>
            </div>

            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '20px' }}>Movies List ({movies.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px' }}>
              {movies.map(m => (
                <div key={m.Movie_ID} style={{ backgroundColor: '#1e3a5f', border: '2px solid #0f68ff', borderRadius: '10px', padding: '15px', color: '#fff' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#0f68ff' }}>{m.Title}</h4>
                  <p style={{ color: '#aaa', margin: '5px 0', fontSize: '13px' }}>Genre: {m.Genre}</p>
                  <p style={{ color: '#aaa', margin: '5px 0', fontSize: '13px' }}>Language: {m.Language}</p>
                  <p style={{ color: '#ffd700', fontWeight: 'bold', margin: '8px 0' }}>⭐ {m.Rating}</p>
                  <button onClick={() => deleteMovie(m.Movie_ID)} style={{ width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Trash2 size={14} style={{ display: 'inline', marginRight: '5px' }} /> Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'theatres' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#9d6bbf', marginBottom: '30px' }}>🏢 Manage Theatres</h2>
            
            <div style={{ backgroundColor: '#1a2a4a', border: '2px solid #9d6bbf', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <h3 style={{ color: '#9d6bbf', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Add New Theatre</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Theatre Name" value={theatreName} onChange={e => setTheatreName(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #9d6bbf', borderRadius: '6px', color: '#fff' }} />
                <input type="text" placeholder="Location" value={theatreLocation} onChange={e => setTheatreLocation(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #9d6bbf', borderRadius: '6px', color: '#fff' }} />
                <input type="number" placeholder="Number of Screens" value={theatreScreens} onChange={e => setTheatreScreens(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #9d6bbf', borderRadius: '6px', color: '#fff' }} />
              </div>
              <button onClick={addTheatre} style={{ padding: '12px 24px', backgroundColor: '#9d6bbf', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>➕ Add Theatre</button>
            </div>

            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '20px' }}>Theatres List ({theatres.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
              {theatres.map(t => (
                <div key={t.Theatre_ID} style={{ backgroundColor: '#3a2555', border: '2px solid #9d6bbf', borderRadius: '10px', padding: '15px', color: '#fff' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#9d6bbf' }}>{t.Name}</h4>
                  <p style={{ color: '#ccc', margin: '5px 0', fontSize: '13px' }}>📍 {t.Location}</p>
                  <p style={{ color: '#ccc', margin: '5px 0', fontSize: '13px' }}>Screens: <span style={{ color: '#9d6bbf', fontWeight: 'bold' }}>{t.No_of_Screens}</span></p>
                  <button onClick={() => deleteTheatre(t.Theatre_ID)} style={{ width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Trash2 size={14} style={{ display: 'inline', marginRight: '5px' }} /> Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
        

        {activeTab === 'snacks' && (
          <div>
            <h2 style={{ fontSize: '32px', color: '#4caf50', marginBottom: '30px' }}>🍿 Manage Snacks</h2>
            
            <div style={{ backgroundColor: '#1a2a4a', border: '2px solid #4caf50', borderRadius: '12px', padding: '25px', marginBottom: '30px' }}>
              <h3 style={{ color: '#4caf50', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> Add New Snack</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                <input type="text" placeholder="Snack Name" value={snackName} onChange={e => setSnackName(e.target.value)} style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #4caf50', borderRadius: '6px', color: '#fff' }} />
                <input type="number" placeholder="Price" value={snackPrice} onChange={e => setSnackPrice(e.target.value)} step="0.01" style={{ padding: '12px', backgroundColor: '#0f0f0f', border: '2px solid #4caf50', borderRadius: '6px', color: '#fff' }} />
              </div>
              <button onClick={addSnack} style={{ padding: '12px 24px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>➕ Add Snack</button>
            </div>

            <h3 style={{ color: '#fff', marginBottom: '15px', fontSize: '20px' }}>Snacks List ({snacks.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
              {snacks.map(s => (
                <div key={s.Snack_ID} style={{ backgroundColor: '#2d4a2b', border: '2px solid #4caf50', borderRadius: '10px', padding: '15px', color: '#fff', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#4caf50' }}>{s.Snack_Name}</h4>
                  <p style={{ color: '#4caf50', fontWeight: 'bold', fontSize: '18px', margin: '8px 0' }}>${s.Price}</p>
                  <button onClick={() => deleteSnack(s.Snack_ID)} style={{ width: '100%', marginTop: '10px', padding: '8px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}><Trash2 size={14} style={{ display: 'inline', marginRight: '5px' }} /> Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}