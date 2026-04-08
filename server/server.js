require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

connectDB();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'https://course-flow-psi.vercel.app',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [])
]);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    const isVercelPreview = /^https:\/\/course-flow.*\.vercel\.app$/.test(normalizedOrigin);

    if (allowedOrigins.has(normalizedOrigin) || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// FIX: Set 50mb limit for course covers and large data syncs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes')); 
app.use('/api/courses', require('./routes/coursesRoutes'));       
app.use('/api/workspace', require('./routes/workspaceRoutes'));    
app.use('/api/productivity', require('./routes/productivityRoutes')); 

app.get('/', (req, res) => {
  res.send('Course Flow API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
