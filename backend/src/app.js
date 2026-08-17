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
import savedChefRoutes from './routes/savedChef.routes.js';
import testRoutes from './routes/test.routes.js';

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

// Rate limiting — three separate policies so messaging cannot exhaust the auth budget
// and auth cannot exhaust the general API budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // strict — prevents brute-force; still comfortable for dev/testing
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const messagingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // generous — REST is used only for initial load, send, and mark-read; socket handles real-time
  message: { success: false, message: 'Too many messaging requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // generous for normal app usage (bookings, chefs, notifications, etc.)
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// Routes — each group carries its own limiter; no endpoint is double-limited
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/chef', apiLimiter, chefRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/menus', apiLimiter, menuRoutes);
app.use('/api/bookings', apiLimiter, bookingRoutes);
app.use('/api/reviews', apiLimiter, reviewRoutes);
app.use('/api/messages', messagingLimiter, messageRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/saved-chefs', apiLimiter, savedChefRoutes);
// Development/testing routes (can be disabled in production)
app.use('/api/test', apiLimiter, testRoutes);

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
