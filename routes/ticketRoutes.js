const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const ticketController = require('../controllers/ticketController');

// Student routes (require login)
router.use(protect);

router.post('/', ticketController.createTicket);
router.get('/my', ticketController.getMyTickets);
router.get('/my/:ticketId', ticketController.getTicketById);

// Admin only routes
router.get('/all', adminOnly, ticketController.getAllTickets);
router.get('/stats', adminOnly, ticketController.getTicketStats);
router.put('/:ticketId/respond', adminOnly, ticketController.respondToTicket);
router.put('/:ticketId/status', adminOnly, ticketController.updateTicketStatus);

module.exports = router;