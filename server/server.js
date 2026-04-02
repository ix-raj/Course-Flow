// server.js (Updated)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173','http://localhost:5174', //  local frontend
     'https://course-flow-psi.vercel.app/'  //vercel
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/courses', require('./routes/coursesRoutes'));       
app.use('/api/workspace', require('./routes/workspaceRoutes'));    
app.use('/api/productivity', require('./routes/productivityRoutes')); 

app.get('/', (req, res) => {
  res.send('Course Flow API is running...');
});


const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

