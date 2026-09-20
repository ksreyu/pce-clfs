import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET / - Get matches related to user's items (requires authenticate)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    const userItems = await prisma.item.findMany({
      where: { reportedById: userId },
      select: { id: true }
    });
    const itemIds = userItems.map(i => i.id);

    const where = {
      OR: [
        { lostItemId: { in: itemIds } },
        { foundItemId: { in: itemIds } },
      ]
    };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          lostItem: { select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true, location: true, date: true } },
          foundItem: { select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true, location: true, date: true } },
        },
        orderBy: { score: 'desc' },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    res.json({ matches, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /all - Get all matches (admin)
router.get('/all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userRole !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        include: {
          lostItem: { select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true } },
          foundItem: { select: { id: true, itemCode: true, name: true, category: true, imageUrl: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.match.count(),
    ]);

    res.json({ matches, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get all matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// GET /:id - Get single match
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        lostItem: { include: { reportedBy: { select: { id: true, name: true, department: true } } } },
        foundItem: { include: { reportedBy: { select: { id: true, name: true, department: true } } } },
      },
    });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// PATCH /:id/status - Update match status (accept/reject)
router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        lostItem: { select: { id: true, reportedById: true, name: true } },
        foundItem: { select: { id: true, reportedById: true, name: true } },
      },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Only admins or owners of the matched items can update status
    const isOwner = match.lostItem.reportedById === req.userId || match.foundItem.reportedById === req.userId;
    const isAdmin = req.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this match' });
    }

    const updated = await prisma.match.update({
      where: { id: req.params.id },
      data: { status },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: `MATCH_${status}`,
        entityType: 'Match',
        entityId: match.id,
        details: `Match between "${match.lostItem.name}" and "${match.foundItem.name}" ${status.toLowerCase()}`,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

export default router;
