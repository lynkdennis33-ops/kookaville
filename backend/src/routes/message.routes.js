import express from 'express';
import messageController from '../controllers/message.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Specific named routes BEFORE generic routes to avoid path-matching conflicts

// GET /api/messages/conversations — list all conversations with last message + unread count
router.get('/conversations', auth, messageController.getConversations.bind(messageController));

// GET /api/messages/unread-count — total unread message count for the authenticated user
router.get('/unread-count', auth, messageController.getUnreadCount.bind(messageController));

// PATCH /api/messages/read — mark all messages in a booking conversation as read
router.patch('/read', auth, messageController.markAsRead.bind(messageController));

// POST /api/messages — send a message (booking participants only)
router.post('/', auth, messageController.createMessage.bind(messageController));

// GET /api/messages?bookingId=... — retrieve messages for a booking
router.get('/', auth, messageController.getMessages.bind(messageController));

export default router;
