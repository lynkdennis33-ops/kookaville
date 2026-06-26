import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import connectDB from './config/db.js';
import { setIo } from './sockets/io.js';
import initChatSocket from './sockets/chat.socket.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Wrap Express app in a plain HTTP server so Socket.IO can share it
    const httpServer = createServer(app);

    // Initialize Socket.IO on the same HTTP server
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    // Store io instance in the singleton so services can emit events
    setIo(io);

    // Register chat socket event handlers
    initChatSocket(io);

    // Start listening
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
startServer();

