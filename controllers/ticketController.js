const { Ticket, User, Course, Lesson } = require('../models/associations');
const { Op } = require('sequelize');

// Student: Create a new ticket
exports.createTicket = async (req, res) => {
  try {
    const { courseId, lessonId, subject, message } = req.body;
    const userId = req.user.id;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Subject and message are required'
      });
    }

    const ticket = await Ticket.create({
      userId,
      courseId,
      lessonId: lessonId || null,
      subject,
      message,
      status: 'open'
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticket
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Student: Get my tickets
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;

    const tickets = await Ticket.findAll({
      where: { userId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Student: Get single ticket
exports.getTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const userId = req.user.id;

    const ticket = await Ticket.findOne({
      where: { id: ticketId, userId },
      include: [
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
      ]
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Get all tickets
exports.getAllTickets = async (req, res) => {
  try {
    const { status, courseId } = req.query;
    const where = {};

    if (status) where.status = status;
    if (courseId) where.courseId = courseId;

    const tickets = await Ticket.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        { model: Course, as: 'course', attributes: ['id', 'title'] },
        { model: Lesson, as: 'lesson', attributes: ['id', 'title'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Respond to ticket
exports.respondToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { adminResponse, status } = req.body;

    const ticket = await Ticket.findByPk(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const updateData = {
      adminResponse,
      respondedAt: new Date()
    };

    if (status === 'resolved') {
      updateData.status = 'resolved';
      updateData.resolvedAt = new Date();
    } else if (status) {
      updateData.status = status;
    }

    await ticket.update(updateData);

    // Send email notification to student (optional)
    // await emailService.sendTicketResponseEmail(ticket.userId, ticket);

    res.json({
      success: true,
      message: 'Response added successfully',
      data: ticket
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin: Update ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findByPk(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    await ticket.update({ status });

    res.json({
      success: true,
      message: 'Ticket status updated',
      data: ticket
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get ticket counts for dashboard
exports.getTicketStats = async (req, res) => {
  try {
    const open = await Ticket.count({ where: { status: 'open' } });
    const inProgress = await Ticket.count({ where: { status: 'in-progress' } });
    const resolved = await Ticket.count({ where: { status: 'resolved' } });
    const closed = await Ticket.count({ where: { status: 'closed' } });

    res.json({
      success: true,
      data: { open, inProgress, resolved, closed }
    });
  } catch (error) {
        res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
