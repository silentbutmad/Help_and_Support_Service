import express from "express"
const router = express.Router()
import { verifyToken } from "../middleware/authMiddleware.js";
import { 
  authorizeRoles, 
  isAdmin,
  isAdminOrAgent, 
  canManageUsers,
  canManageTickets,
  canViewAnalytics,
  canManageFaqs 
} from "../middleware/authorizationMiddleware.js";
import { 
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllAgents,
  getAllAdmins,
  updateAgentProfile,
  updateAdminPermissions
} from "../controllers/userManagementController.js";

// User management routes (Admin only)
router.get('/users', verifyToken, isAdmin, getAllUsers);
router.get('/users/:id', verifyToken, isAdmin, getUserById);
router.post('/users', verifyToken, isAdmin, createUser);
router.put('/users/:id', verifyToken, isAdmin, updateUser);
router.delete('/users/:id', verifyToken, isAdmin, deleteUser);

// Agent management routes (Admin only)
router.get('/agents', verifyToken, isAdmin, getAllAgents);
router.patch('/agents/:id', verifyToken, isAdmin, updateAgentProfile);

// Admin management routes (Admin only)
router.get('/admins', verifyToken, isAdmin, getAllAdmins);
router.patch('/admins/:id', verifyToken, isAdmin, updateAdminPermissions);

// Profile routes (for logged-in users)
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const { prisma } = await import('../models/db.js');
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        adminProfile: true,
        agentProfile: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: error.message
    });
  }
});

export default router;