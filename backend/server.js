const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB, connectFeeDB } = require('./config/db');

const app = express();

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
app.use('/api/transport-dues', require('./routes/transportDuesRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Pydah Transport API is running' });
});

const PORT = process.env.PORT || 5000;

const startDbs = async () => {
    await connectDB();
    await connectFeeDB();
};

startDbs()
    .then(() => {
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
        console.error('Failed to start:', err);
        process.exit(1);
    });
