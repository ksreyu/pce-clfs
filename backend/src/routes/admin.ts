import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

router.use(authenticate, requireAdmin);

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
});

const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

const updateItemStatusSchema = z.object({
  status: z.enum(['LOST', 'FOUND', 'MATCHED', 'CLAIMED', 'VERIFIED', 'RECOVERED', 'CLOSED', 'ARCHIVED']),
});

// GET /dashboard
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalLostItems,
      totalFoundItems,
      pendingClaims,
      approvedClaims,
      recoveredItems,
      activeMatches,
      openReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.item.count({ where: { type: 'LOST' } }),
      prisma.item.count({ where: { type: 'FOUND' } }),
      prisma.claim.count({ where: { status: 'PENDING' } }),
      prisma.claim.count({ where: { status: 'APPROVED' } }),
      prisma.item.count({ where: { status: 'RECOVERED' } }),
      prisma.match.count({ where: { status: 'PENDING' } }),
      prisma.item.count({ where: { status: { in: ['LOST', 'FOUND'] } } }),
    ]);

    return res.json({
      totalUsers,
      totalLostItems,
      totalFoundItems,
      pendingClaims,
      approvedClaims,
      recoveredItems,
      activeMatches,
      openReports,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// GET /users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      role,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
        { studentId: { contains: search as string } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          studentId: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({
      users,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /users/:id/status
router.patch('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updateUserStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    const { status } = validation.data;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_USER_STATUS',
        entityType: 'User',
        entityId: id,
        details: `Updated user ${user.email} status from ${user.status} to ${status}`,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// PATCH /users/:id/role
router.patch('/users/:id/role', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updateUserRoleSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    const { role } = validation.data;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: id,
        details: `Updated user ${user.email} role from ${user.role} to ${role}`,
      },
    });

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// GET /items
router.get('/items', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      type,
      status,
      category,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { location: { contains: search as string } },
        { itemCode: { contains: search as string } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.item.count({ where }),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// PATCH /items/:id/status
router.patch('/items/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updateItemStatusSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({ error: validation.error.issues });
    }

    const { status } = validation.data;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedItem = await prisma.item.update({
      where: { id },
      data: { status },
      include: {
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_ITEM_STATUS',
        entityType: 'Item',
        entityId: id,
        details: `Updated item "${item.name}" status from ${item.status} to ${status}`,
      },
    });

    return res.json(updatedItem);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update item status' });
  }
});

// DELETE /items/:id (soft delete)
router.delete('/items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newStatus = item.type === 'LOST' ? 'CLOSED' : 'ARCHIVED';

    const updated = await prisma.item.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE_ITEM',
        entityType: 'Item',
        entityId: id,
        details: `Deleted item "${item.name}" (ID: ${id}) - status changed to ${newStatus}`,
      },
    });

    return res.json({ message: 'Item deleted successfully', item: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete item' });
  }
});

// GET /claims
router.get('/claims', async (req: AuthRequest, res: Response) => {
  try {
    const {
      search,
      status,
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { identifyingDetails: { contains: search as string } },
        {
          item: {
            name: { contains: search as string },
          },
        },
        {
          claimant: {
            name: { contains: search as string },
          },
        },
      ];
    }

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              location: true,
              category: true,
            },
          },
          claimant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.claim.count({ where }),
    ]);

    return res.json({
      claims,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch claims' });
  }
});

// GET /reports
router.get('/reports', async (_req: AuthRequest, res: Response) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      lostByCategory,
      foundByCategory,
      lostByMonth,
      foundByMonth,
      claimsByStatus,
      topLocations,
      totalItems,
      recoveredCount,
    ] = await Promise.all([
      prisma.item.groupBy({
        by: ['category'],
        where: { type: 'LOST' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.item.groupBy({
        by: ['category'],
        where: { type: 'FOUND' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.item.groupBy({
        by: ['createdAt'],
        where: {
          type: 'LOST',
          createdAt: { gte: sixMonthsAgo },
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.item.groupBy({
        by: ['createdAt'],
        where: {
          type: 'FOUND',
          createdAt: { gte: sixMonthsAgo },
        },
        _count: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.claim.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.item.groupBy({
        by: ['location'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      prisma.item.count(),
      prisma.item.count({ where: { status: 'RECOVERED' } }),
    ]);

    const formatMonthData = (data: { createdAt: Date; _count: { id: number } }[]) => {
      const monthly: Record<string, number> = {};
      data.forEach((item) => {
        const monthKey = item.createdAt.toISOString().slice(0, 7);
        monthly[monthKey] = (monthly[monthKey] || 0) + item._count.id;
      });
      return Object.entries(monthly).map(([month, count]) => ({ month, count }));
    };

    return res.json({
      lostByCategory: lostByCategory.map((item: { category: string; _count: { id: number } }) => ({
        category: item.category,
        count: item._count.id,
      })),
      foundByCategory: foundByCategory.map((item: { category: string; _count: { id: number } }) => ({
        category: item.category,
        count: item._count.id,
      })),
      lostByMonth: formatMonthData(lostByMonth as unknown as { createdAt: Date; _count: { id: number } }[]),
      foundByMonth: formatMonthData(foundByMonth as unknown as { createdAt: Date; _count: { id: number } }[]),
      claimsByStatus: claimsByStatus.map((item: { status: string; _count: { id: number } }) => ({
        status: item.status,
        count: item._count.id,
      })),
      topLocations: topLocations.map((item: { location: string; _count: { id: number } }) => ({
        location: item.location,
        count: item._count.id,
      })),
      recoveryRate: totalItems > 0 ? Math.round((recoveredCount / totalItems) * 10000) / 100 : 0,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate reports' });
  }
});

// GET /activity-logs
router.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.activityLog.count(),
    ]);

    return res.json({
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

export default router;
