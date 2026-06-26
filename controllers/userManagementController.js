import {prisma} from "../models/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles, isAdmin } from "../middleware/authorizationMiddleware.js";
import { asyncHandler } from'../middleware/errorMiddleware.js';
import logger from "../utils/logger.js";
import bcrypt from "bcryptjs";

/**
 * Get all users with filtering
 * GET /support/users
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, isActive, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
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
    }),
    prisma.user.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get user by ID
 * GET /support/users/:id
 */
const getUserById = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      adminProfile: true,
      agentProfile: true,
      tickets: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
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
});

/**
 * Create new user (Admin or Agent)
 * POST /support/users
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, specialization, permissions } = req.body;

  // Validate role
  if (!['ADMIN', 'SUPPORT_AGENT'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role. Must be ADMIN or SUPPORT_AGENT"
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User with this email already exists"
    });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with profile
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      ...(role === 'ADMIN' && {
        adminProfile: {
          create: {
            permissions: permissions || 'full'
          }
        }
      }),
      ...(role === 'SUPPORT_AGENT' && {
        agentProfile: {
          create: {
            department,
            specialization
          }
        }
      })
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      adminProfile: true,
      agentProfile: true
    }
  });

  logger.info(`User created: ${user.id} with role: ${role} by admin: ${req.user.id}`);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: user
  });
});

/**
 * Update user
 * PUT /support/users/:id
 */
const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const { name, email, role, isActive, department, specialization, permissions } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      adminProfile: true,
      agentProfile: true
    }
  });

  if (!existingUser) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Prepare update data
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
      adminProfile: true,
      agentProfile: true
    }
  });

  // Update profile based on role
  if (role === 'ADMIN' && existingUser.adminProfile) {
    await prisma.admin.update({
      where: { userId },
      data: {
        permissions: permissions || existingUser.adminProfile.permissions
      }
    });
  }

  if (role === 'SUPPORT_AGENT' && existingUser.agentProfile) {
    await prisma.agent.update({
      where: { userId },
      data: {
        department,
        specialization
      }
    });
  }

  logger.info(`User updated: ${userId} by admin: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user
  });
});

/**
 * Delete user (soft delete by setting isActive to false)
 * DELETE /support/users/:id
 */
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // Prevent self-deletion
  if (user.id === req.user.id) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete your own account"
    });
  }

  // Soft delete
  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false
    }
  });

  logger.info(`User deleted: ${userId} by admin: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

/**
 * Get all agents
 * GET /support/agents
 */
const getAllAgents = asyncHandler(async (req, res) => {
  const { department, isAvailable, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    user: {
      role: 'SUPPORT_AGENT',
      isActive: true
    }
  };

  if (department) where.department = department;
  if (isAvailable !== undefined) where.isAvailable = isAvailable === 'true';

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    }),
    prisma.agent.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: agents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get all admins
 * GET /support/admins
 */
const getAllAdmins = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const where = {
    user: {
      role: 'ADMIN',
      isActive: true
    }
  };

  const [admins, total] = await Promise.all([
    prisma.admin.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true
          }
        }
      }
    }),
    prisma.admin.count({ where })
  ]);

  res.status(200).json({
    success: true,
    data: admins,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * Update agent profile
 * PATCH /support/agents/:id
 */
const updateAgentProfile = asyncHandler(async (req, res) => {
  const agentId = req.params.id;
  const { department, specialization, isAvailable } = req.body;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: true }
  });

  if (!agent) {
    return res.status(404).json({
      success: false,
      message: "Agent not found"
    });
  }

  const updatedAgent = await prisma.agent.update({
    where: { id: agentId },
    data: {
      department,
      specialization,
      isAvailable
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  logger.info(`Agent profile updated: ${agentId} by admin: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: "Agent profile updated successfully",
    data: updatedAgent
  });
});

/**
 * Update admin permissions
 * PATCH /support/admins/:id
 */
const updateAdminPermissions = asyncHandler(async (req, res) => {
  const adminId = req.params.id;
  const { permissions } = req.body;

  const admin = await prisma.admin.findUnique({
    where: { id: adminId }
  });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found"
    });
  }

  const updatedAdmin = await prisma.admin.update({
    where: { id: adminId },
    data: {
      permissions
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  logger.info(`Admin permissions updated: ${adminId} by admin: ${req.user.id}`);

  res.status(200).json({
    success: true,
    message: "Admin permissions updated successfully",
    data: updatedAdmin
  });
});

export {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllAgents,
  getAllAdmins,
  updateAgentProfile,
  updateAdminPermissions
};