import express from "express"
const router = express.Router()
import { verifyToken } from "../middleware/authMiddleware.js"
import { getTicketById,createTicket,updateTicketStatus,getUserTickets,assignTicket,addComment,getComments,getHelpCenter} from "../controllers/supportController.js"
import { isTicketOwnerOrAdminOrAgent, canManageTickets } from "../middleware/authorizationMiddleware.js"
import { ticketLimiter } from "../middleware/rateLimiter.js";

router.post('/tickets', verifyToken, ticketLimiter, createTicket);
router.get('/tickets/user/:userId', verifyToken, isTicketOwnerOrAdminOrAgent, getUserTickets);
router.get('/tickets/:id', verifyToken, isTicketOwnerOrAdminOrAgent, getTicketById);
router.patch('/tickets/:id/status', verifyToken, canManageTickets, updateTicketStatus);
router.patch('/tickets/:id/assign', verifyToken, canManageTickets, assignTicket);
router.post('/tickets/:id/comments', verifyToken, ticketLimiter, isTicketOwnerOrAdminOrAgent, addComment);
router.get('/tickets/:id/comments', verifyToken, isTicketOwnerOrAdminOrAgent, getComments);
router.get('/help', getHelpCenter);

export default router;