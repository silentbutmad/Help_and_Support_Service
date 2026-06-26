import {prisma} from "../models/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from'../middleware/errorMiddleware.js';
import logger from "../utils/logger.js";
import * as supportService from "../services/supportService.js"
import { v4 as uuidv4 } from "uuid"

const createTicket = asyncHandler(async (req, res) => {
  const { title, description, issueType, priority } = req.body;
  
  const userId = req.user.user_id;

  const ticket = await supportService.createTicket({
    userId,
    title,
    description,
    issueType,
    priority
  });

  logger.info(`Ticket created: ${ticket.id} by user: ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Ticket created successfully',
    data: ticket
  });
});

const getUserTickets = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status, priority, issueType, page = 1, limit = 10 } = req.query;

  const result = await supportService.getUserTickets(userId, {
    status,
    priority,
    issueType,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result.tickets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.total,
      pages: Math.ceil(result.total / limit)
    }
  });
});

const getTicketById = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;

  const ticket = await supportService.getTicketById(ticketId);

  res.status(200).json({
    success: true,
    data: ticket
  });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { status } = req.body;
  const changedBy = req.user.id;

  const ticket = await supportService.updateTicketStatus(ticketId, status, changedBy);

  logger.info(`Ticket status updated: ${ticketId} to ${status} by user: ${changedBy}`);

  res.status(200).json({
    success: true,
    message: 'Ticket status updated successfully',
    data: ticket
  });
});

const assignTicket = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { agentId } = req.body;
  const assignedBy = req.user.id;

  const ticket = await supportService.assignTicket(ticketId, agentId, assignedBy);

  logger.info(`Ticket assigned: ${ticketId} to agent: ${agentId} by user: ${assignedBy}`);

  res.status(200).json({
    success: true,
    message: 'Ticket assigned successfully',
    data: ticket
  });
});

const addComment = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { message } = req.body;
  const userId = req.user.id;

  const comment = await supportService.addComment(ticketId, message, userId);

  logger.info(`Comment added to ticket: ${ticketId} by user: ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: comment
  });
});

const getComments = asyncHandler(async (req, res) => {
  const ticketId = req.params.id;
  const { page = 1, limit = 50 } = req.query;

  const result = await supportService.getComments(ticketId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.status(200).json({
    success: true,
    data: result.comments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: result.total,
      pages: Math.ceil(result.total / limit)
    }
  });
});

const getHelpCenter = asyncHandler(async (req, res) => {
  const helpInfo = await supportService.getHelpCenter();

  res.status(200).json({
    success: true,
    data: helpInfo
  });
});

export {
  createTicket,
  getUserTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  addComment,
  getComments,
  getHelpCenter
};