import express from "express"
const router = express.Router()
import { verifyToken } from "../middleware/authMiddleware.js";
import { canViewAnalytics } from "../middleware/authorizationMiddleware.js";
import { getTotalTickets,getTicketsByStatus,getTicketsByIssueType,getTicketsByPriority,getDashboardMetrics,getAverageResolutionTime } from "../controllers/analyticsController.js";

router.get('/analytics/total',verifyToken, canViewAnalytics, getTotalTickets);
router.get('/analytics/status', verifyToken, canViewAnalytics, getTicketsByStatus);
router.get('/analytics/priority', verifyToken, canViewAnalytics, getTicketsByPriority);
router.get('/analytics/issue-type', verifyToken, canViewAnalytics, getTicketsByIssueType);
router.get('/analytics/resolution-time', verifyToken, canViewAnalytics, getAverageResolutionTime);
router.get('/analytics/dashboard', verifyToken, canViewAnalytics, getDashboardMetrics);

export default router;