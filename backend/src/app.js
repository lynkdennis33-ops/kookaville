import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import chefRoutes from './routes/chef.routes.js';
import categoryRoutes from './routes/category.routes.js';
import menuRoutes from './routes/menu.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import reviewRoutes from './routes/review.routes.js';
import messageRoutes from './routes/message.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

app.use('/api/', limiter);

// Body parsing middleware
//
// IMPORTANT — Stripe webhook signature verification requires the RAW request body
// (the exact bytes Stripe signed). express.json() parses the body into a JS object
// and discards the raw buffer, which breaks stripe.webhooks.constructEvent().
//
// Solution: apply express.raw() specifically for the webhook path BEFORE express.json().
// body-parser sets req._body = true after it runs, which causes the next body-parser
// (express.json()) to skip re-parsing the request — so all other routes are unaffected.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chef', chefRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
