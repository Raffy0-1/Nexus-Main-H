import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Swagger documentation imports
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import jwt from 'jsonwebtoken';

dotenv.config();

import { validateEnv } from './config/envValidator';
validateEnv();

import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import meetingRoutes from './routes/meetingRoutes';
import documentRoutes from './routes/documentRoutes';
import paymentRoutes from './routes/paymentRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import collaborationRoutes from './routes/collaborationRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const port = parseInt(process.env.PORT || '5000', 10);

app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 20 requests per windowMs for auth routes
});

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 1. Swagger API Documentation Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexus API Documentation',
      version: '1.0.0',
      description: 'API endpoints for the Nexus Platform Collaboration Features',
    },
    servers: [
      { url: `http://localhost:${port}` }
    ]
  },
  apis: ['./src/routes/*.ts'], // Automatically generates docs from route comments
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Connect to Database
connectDB();

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/collaborations', collaborationRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Nexus API is running' });
});

// 2. Enhanced WebRTC Signaling & Chat Server
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    socket.data.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId} on socket ${socket.id}`);
  socket.join(`user:${userId}`); // Join personal room for private DMs

  // Broadcast WebRTC signals and messaging
  socket.on('send-message', (data: { receiverId: string, content: string }) => {
       // Broadcast to receiver's private room
       socket.to(`user:${data.receiverId}`).emit('receive-message', {
         _id: Date.now().toString(),
         senderId: userId,
         receiverId: data.receiverId,
         content: data.content,
         createdAt: new Date().toISOString()
       });
       // Optional: Echo back to sender so other devices sync instantly
       socket.to(`user:${userId}`).emit('receive-message', {
         _id: Date.now().toString(),
         senderId: userId,
         receiverId: data.receiverId,
         content: data.content,
         createdAt: new Date().toISOString()
       });
  });

  socket.on('join-room', (roomId: string, uId: string) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', uId || userId);

    // Broadcast audio toggle to others in the room
    socket.on('toggle-audio', ({ roomId: rId, muted }) => {
      socket.to(rId || roomId).emit('user-toggled-audio', uId || userId, muted);
    });

    // Broadcast video toggle to others in the room
    socket.on('toggle-video', ({ roomId: rId, hidden }) => {
      socket.to(rId || roomId).emit('user-toggled-video', uId || userId, hidden);
    });

    // Handle call ending cleanly
    socket.on('end-call', () => {
      socket.to(roomId).emit('user-ended-call', uId || userId);
      socket.leave(roomId);
    });
  });
  
  socket.on('disconnect', () => {
     console.log('User disconnected', socket.id);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});

app.use(notFound);
app.use(errorHandler);