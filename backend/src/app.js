require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const { connectDB } = require('./config/database');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Express app oluştur
const app = express();
const server = http.createServer(app);

// Socket.IO yapılandırması
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://eticaret-stok-yonetim.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('Yeni WebSocket bağlantısı:', socket.id);

  socket.on('disconnect', () => {
    console.log('WebSocket bağlantısı kapandı:', socket.id);
  });

  // Özel odaya katılma (örn: admin-notifications)
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`${socket.id} ${room} odasına katıldı`);
  });
});

// Socket.IO instance'ını request'e ekle
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://eticaret-stok-yonetim.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'E-Ticaret Stok Yönetim API',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Server başlat
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Veritabanı bağlantısı
    await connectDB();

    // Server'ı başlat
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   E-Ticaret Stok Yönetim API                             ║
║   Sunucu ${PORT} portunda çalışıyor                          ║
║                                                           ║
║   API: http://localhost:${PORT}/api                          ║
║   Health: http://localhost:${PORT}/api/health                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
