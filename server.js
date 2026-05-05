const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const PORT = process.env.PORT || 9090;
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const postsRoutes = require("./routes/posts");

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(require('./middleware/errorMiddleware'));

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
