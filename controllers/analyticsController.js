import {prisma} from "../models/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from'../middleware/errorMiddleware.js';
import logger from "../utils/logger.js";

const getTotalTickets = asyncHandler(async (req, res) => {
  const total = await prisma.ticket.count();

  res.status(200).json({
    success: true,
    data: {
      total
    }
  });
});

const getTicketsByStatus = asyncHandler(async (req, res) => {
  const tickets = await prisma.ticket.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });

  const result = tickets.map(item => ({
    status: item.status,
    count: item._count.status
  }));

  res.status(200).json({
    success: true,
    data: result
  });
});

const getTicketsByPriority = asyncHandler(async (req, res) => {
  const tickets = await prisma.ticket.groupBy({
    by: ['priority'],
    _count: {
      priority: true
    }
  });

  const result = tickets.map(item => ({
    priority: item.priority,
    count: item._count.priority
  }));

  res.status(200).json({
    success: true,
    data: result
  });
});

const getTicketsByIssueType = asyncHandler(async (req, res) => {
  const tickets = await prisma.ticket.groupBy({
    by: ['issueType'],
    _count: {
      issueType: true
    }
  });

  const result = tickets.map(item => ({
    issueType: item.issueType,
    count: item._count.issueType
  }));

  res.status(200).json({
    success: true,
    data: result
  });
});

const getAverageResolutionTime = asyncHandler(async (req, res) => {
  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      status: 'RESOLVED'
    },
    select: {
      createdAt: true,
      updatedAt: true
    }
  });

  if (resolvedTickets.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        averageResolutionTime: 0,
        unit: 'hours',
        totalResolvedTickets: 0
      }
    });
  }

  const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
    const resolutionTime = (ticket.updatedAt - ticket.createdAt) / (1000 * 60 * 60);
    return sum + resolutionTime;
  }, 0);

  const averageResolutionTime = totalResolutionTime / resolvedTickets.length;

  res.status(200).json({
    success: true,
    data: {
      averageResolutionTime: Math.round(averageResolutionTime * 100) / 100,
      unit: 'hours',
      totalResolvedTickets: resolvedTickets.length
    }
  });
});

const getDashboardMetrics = asyncHandler(async (req, res) => {
  const [
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
    closedTickets,
    criticalTickets,
    highPriorityTickets
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { status: 'CLOSED' } }),
    prisma.ticket.count({ where: { priority: 'CRITICAL' } }),
    prisma.ticket.count({ where: { priority: 'HIGH' } })
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalTickets,
      statusBreakdown: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      priorityBreakdown: {
        critical: criticalTickets,
        high: highPriorityTickets
      }
    }
  });
});

export {
  getTotalTickets,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByIssueType,
  getAverageResolutionTime,
  getDashboardMetrics
};