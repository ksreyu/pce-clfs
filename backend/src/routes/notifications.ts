import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET / - Get user's notifications (requires authenticate)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId! },
        include: { user: { select: { id: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.notification.count({ where: { userId: req.userId! } }),
      prisma.notification.count({ where: { userId: req.userId!, isRead: false } }),
    ]);

    res.json({ notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /unread-count - Get unread count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.userId!, isRead: false }
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch count' });
  }
});

// PATCH /:id/read - Mark notification as read
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.userId! },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PATCH /read-all - Mark all as read
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
