/**
 * Authorization Middleware for Role-Based Access Control
 */

/**
 * Check if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const userRole = req.user.role;
      
      // Convert single role to array for uniform handling
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      
      if (!roles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${roles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization error",
        error: error.message
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorizeRoles('ADMIN');

/**
 * Check if user is support agent
 */
export const isAgent = authorizeRoles('SUPPORT_AGENT');

/**
 * Check if user is admin or support agent
 */
export const isAdminOrAgent = authorizeRoles(['ADMIN', 'SUPPORT_AGENT']);

/**
 * Check if user is the ticket owner, admin, or assigned agent
 */
export const isTicketOwnerOrAdminOrAgent = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const userRole = req.user.role;
    const ticketId = req.params.id;
    const userId = req.user.id;

    // Admin and agents have full access
    if (userRole === 'ADMIN' || userRole === 'SUPPORT_AGENT') {
      return next();
    }

    // For regular users, check if they own the ticket
    const { prisma } = await import('../models/db.js');
    
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { userId: true }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found"
      });
    }

    if (ticket.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own tickets."
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization error",
      error: error.message
    });
  }
};

/**
 * Check if user can manage other users (admin only)
 */
export const canManageUsers = authorizeRoles('ADMIN');

/**
 * Check if user can manage tickets (admin or agent)
 */
export const canManageTickets = authorizeRoles(['ADMIN', 'SUPPORT_AGENT']);

/**
 * Check if user can view analytics (admin or agent)
 */
export const canViewAnalytics = authorizeRoles(['ADMIN', 'SUPPORT_AGENT']);

/**
 * Check if user can manage FAQs (admin or agent)
 */
export const canManageFaqs = authorizeRoles(['ADMIN', 'SUPPORT_AGENT']);