import {prisma} from "../models/db.js";
import { v4 as uuidv4 } from "uuid"
import {sendTicketCreatedNotification,sendStatusChangeNotification,sendNewCommentNotification,sendTicketAssignedNotification,sendWhatsAppNotification,sendEmail,initializeEmailTransporter} from "./notificationService.js"
import logger from "../utils/logger.js";

const createTicket = async ({ userId, title, description, issueType, priority }) => {
  try {
    const ticket = await prisma.ticket.create({
      data: {
        userId,
        title,
        description,
        issueType,
        priority
      }
    });

    await sendTicketCreatedNotification(ticket, null);

    return ticket;
  } catch (error) {
    console.error("========== PRISMA ERROR ==========");
    console.error(error);
    console.error(error.message);
    console.error(error.stack);

    throw error;
  }
};

const getUserTickets = async (userId, filters) => {
  try {
    const { status, priority, issueType, page, limit } = filters;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status }),
      ...(priority && { priority }),
      ...(issueType && { issueType })
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          comments: {  // ✅ Correct - inside include
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return {
      tickets,
      total,
      page,
      limit
    };
  } catch (error) {
    console.log(error.message);
    logger.error(`Error fetching user tickets: ${error.message}`);
    throw new Error('Failed to fetch tickets');
  }
};

const getTicketById = async (ticketId) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      comments: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      history: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return ticket;
  } catch (error) {
    logger.error(`Error fetching ticket: ${error.message}`);
    throw new Error('Failed to fetch ticket');
  }
};

const updateTicketStatus = async (ticketId, newStatus, changedBy) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const oldStatus = ticket.status;

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: newStatus }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        oldStatus,
        newStatus,
        changedBy
      }
    });

    await sendStatusChangeNotification(updatedTicket, oldStatus, newStatus, null);

    logger.info(`Ticket status updated: ${ticketId} from ${oldStatus} to ${newStatus}`);
    return updatedTicket;
  } catch (error) {
    logger.error(`Error updating ticket status: ${error.message}`);
    throw new Error('Failed to update ticket status');
  }
};

const assignTicket = async (ticketId, agentId, assignedBy) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedAgent: agentId,
        status: 'IN_PROGRESS'
      }
    });

    await prisma.ticketHistory.create({
      data: {
        ticketId,
        oldStatus: ticket.status,
        newStatus: 'IN_PROGRESS',
        changedBy: assignedBy
      }
    });

    await sendTicketAssignedNotification(updatedTicket, agent);

    logger.info(`Ticket assigned: ${ticketId} to agent: ${agentId}`);
    return updatedTicket;
  } catch (error) {
    logger.error(`Error assigning ticket: ${error.message}`);
    throw new Error('Failed to assign ticket');
  }
};

const addComment = async (ticketId, message, userId) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        userId,
        message
      }
    });

    await sendNewCommentNotification(ticket, comment, null);

    logger.info(`Comment added to ticket: ${ticketId}`);
    return comment;
  } catch (error) {
    logger.error(`Error adding comment: ${error.message}`);
    throw new Error('Failed to add comment');
  }
};

const getComments = async (ticketId, { page, limit }) => {
  try {
    const skip = (page - 1) * limit;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { ticketId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.comment.count({ where: { ticketId } })
    ]);

    return {
      comments,
      total,
      page,
      limit
    };
  } catch (error) {
    logger.error(`Error fetching comments: ${error.message}`);
    throw new Error('Failed to fetch comments');
  }
};

const getHelpCenter = async () => {
  try {
    return {
      whatsapp: process.env.SUPPORT_WHATSAPP || '+91XXXXXXXXXX',
      callUs: process.env.SUPPORT_PHONE || '+91XXXXXXXXXX',
      email: process.env.SUPPORT_EMAIL || 'support@company.com',
      workingHours: process.env.SUPPORT_HOURS || '09:00 AM - 06:00 PM',
      address: process.env.SUPPORT_ADDRESS || 'Company Address',
      website: process.env.SUPPORT_WEBSITE || 'https://company.com'
    };
  } catch (error) {
    logger.error(`Error fetching help center info: ${error.message}`);
    throw new Error('Failed to fetch help center information');
  }
};

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