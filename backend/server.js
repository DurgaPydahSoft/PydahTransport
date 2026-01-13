const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const busRoutes = require('./routes/busRoutes');
const routeRoutes = require('./routes/routeRoutes');
const authRoutes = require('./routes/authRoutes');

// Routes
app.use('/api/buses', busRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/transport-requests', require('./routes/transportRequestRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Pydah Transport API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
