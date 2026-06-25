import express from 'express';
import messageController from '../controllers/message.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// POST /api/messages — send a message (booking participants only)
router.post('/', auth, messageController.createMessage.bind(messageController));

// GET /api/messages?bookingId=... — retrieve messages for a booking
router.get('/', auth, messageController.getMessages.bind(messageController));

export default router;
