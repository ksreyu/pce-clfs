import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateItemCode } from '../utils/helpers';
import { calculateMatchScore } from '../utils/matching';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

const router = Router();

const lostItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime(),
  time: z.string().optional().or(z.literal('')),
  location: z.string().min(1, 'Location is required'),
  color: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  identifyingFeatures: z.string().optional().or(z.literal('')),
  estimatedValue: z.string().optional().or(z.literal('')),
  contactPreference: z.string().optional().or(z.literal('')),
});

const foundItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().datetime(),
  time: z.string().optional().or(z.literal('')),
  location: z.string().min(1, 'Location is required'),
  color: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  identifyingFeatures: z.string().optional().or(z.literal('')),
  storageLocation: z.string().optional().or(z.literal('')),
});

const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().datetime().optional(),
  time: z.string().optional(),
  location: z.string().min(1).optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  identifyingFeatures: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['LOST', 'FOUND', 'MATCHED', 'CLAIMED', 'VERIFIED', 'RECOVERED', 'CLOSED', 'ARCHIVED']),
});

router.get('/stats', async (_req, res: Response) => {
  try {
    const [totalItems, recovered, users, matches] = await Promise.all([
      prisma.item.count(),
      prisma.item.count({ where: { status: 'RECOVERED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.match.count(),
    ]);
    return res.json({ totalItems, recovered, users, matches });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/', async (req, res: Response) => {
  try {
    const {
      search,
      category,
      location,
      type,
      status,
      color,
      brand,
      dateFrom,
      dateTo,
      reportedById,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      const q = search as string;
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { location: { contains: q } },
        { category: { contains: q } },
        { brand: { contains: q } },
      ];
    }

    if (category) where.category = category as string;
    if (location) where.location = { contains: location as string };
    if (type) where.type = type as string;
    if (status) where.status = status as string;
    if (color) where.color = { contains: color as string };
    if (brand) where.brand = { contains: brand as string };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom as string);
      if (dateTo) where.date.lte = new Date(dateTo as string);
    }

    if (reportedById) {
      where.reportedById = reportedById as string;
    }

    const orderBy =
      sort === 'oldest' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          reportedBy: {
            select: { id: true, name: true, department: true },
          },
        },
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      items,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('List items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.get('/:id', async (req, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        reportedBy: {
          select: { id: true, name: true, department: true },
        },
        lostMatches: {
          include: {
            foundItem: {
              select: { id: true, name: true, category: true, location: true, imageUrl: true },
            },
          },
        },
        foundMatches: {
          include: {
            lostItem: {
              select: { id: true, name: true, category: true, location: true, imageUrl: true },
            },
          },
        },
        _count: {
          select: { claims: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

router.post('/lost', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = lostItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const itemCode = generateItemCode();

    const item = await prisma.item.create({
      data: {
        itemCode,
        type: 'LOST',
        name: data.name,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        time: data.time,
        location: data.location,
        color: data.color,
        brand: data.brand,
        model: data.model,
        identifyingFeatures: data.identifyingFeatures,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        status: 'LOST',
        reportedById: req.userId!,
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, department: true },
        },
      },
    });

    const foundItems = await prisma.item.findMany({
      where: {
        type: 'FOUND',
        status: { in: ['FOUND', 'MATCHED'] },
      },
    });

    for (const foundItem of foundItems) {
      const matchInput = {
        category: item.category,
        name: item.name,
        location: item.location,
        date: item.date.toISOString(),
        color: item.color || undefined,
        brand: item.brand || undefined,
        model: item.model || undefined,
        description: item.description,
        identifyingFeatures: item.identifyingFeatures || undefined,
      };

      const foundInput = {
        category: foundItem.category,
        name: foundItem.name,
        location: foundItem.location,
        date: foundItem.date.toISOString(),
        color: foundItem.color || undefined,
        brand: foundItem.brand || undefined,
        model: foundItem.model || undefined,
        description: foundItem.description,
        identifyingFeatures: foundItem.identifyingFeatures || undefined,
      };

      const { score, reason } = calculateMatchScore(matchInput, foundInput);

      if (score >= 60) {
        const match = await prisma.match.create({
          data: {
            lostItemId: item.id,
            foundItemId: foundItem.id,
            score,
            reason,
          },
        });

        if (score >= 80) {
          await prisma.notification.create({
            data: {
              userId: req.userId!,
              title: 'High Match Found',
              message: `A high-confidence match (${score}%) was found for your lost item "${item.name}". Found item: "${foundItem.name}" at ${foundItem.location}.`,
              type: 'MATCH_FOUND',
              relatedItemId: item.id,
            },
          });
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'REPORT_LOST',
        entityType: 'Item',
        entityId: item.id,
        details: `Reported lost item: ${item.name} (${item.itemCode})`,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Report lost item error:', error);
    res.status(500).json({ error: 'Failed to report lost item' });
  }
});

router.post('/found', authenticate, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    const parsed = foundItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const itemCode = generateItemCode();

    const item = await prisma.item.create({
      data: {
        itemCode,
        type: 'FOUND',
        name: data.name,
        category: data.category,
        description: data.description,
        date: new Date(data.date),
        time: data.time,
        location: data.location,
        color: data.color,
        brand: data.brand,
        model: data.model,
        identifyingFeatures: data.identifyingFeatures,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        status: 'FOUND',
        reportedById: req.userId!,
      },
      include: {
        reportedBy: {
          select: { id: true, name: true, department: true },
        },
      },
    });

    const lostItems = await prisma.item.findMany({
      where: {
        type: 'LOST',
        status: { in: ['LOST', 'MATCHED'] },
      },
    });

    for (const lostItem of lostItems) {
      const lostInput = {
        category: lostItem.category,
        name: lostItem.name,
        location: lostItem.location,
        date: lostItem.date.toISOString(),
        color: lostItem.color || undefined,
        brand: lostItem.brand || undefined,
        model: lostItem.model || undefined,
        description: lostItem.description,
        identifyingFeatures: lostItem.identifyingFeatures || undefined,
      };

      const foundInput = {
        category: item.category,
        name: item.name,
        location: item.location,
        date: item.date.toISOString(),
        color: item.color || undefined,
        brand: item.brand || undefined,
        model: item.model || undefined,
        description: item.description,
        identifyingFeatures: item.identifyingFeatures || undefined,
      };

      const { score, reason } = calculateMatchScore(lostInput, foundInput);

      if (score >= 60) {
        await prisma.match.create({
          data: {
            lostItemId: lostItem.id,
            foundItemId: item.id,
            score,
            reason,
          },
        });

        if (score >= 80) {
          await prisma.notification.create({
            data: {
              userId: lostItem.reportedById,
              title: 'High Match Found',
              message: `A high-confidence match (${score}%) was found for your lost item "${lostItem.name}". Found item: "${item.name}" at ${item.location}.`,
              type: 'MATCH_FOUND',
              relatedItemId: lostItem.id,
            },
          });
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'REPORT_FOUND',
        entityType: 'Item',
        entityId: item.id,
        details: `Reported found item: ${item.name} (${item.itemCode})`,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Report found item error:', error);
    res.status(500).json({ error: 'Failed to report found item' });
  }
});

router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.reportedById !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this item' });
    }

    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const data = parsed.data;
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.time !== undefined) updateData.time = data.time;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.brand !== undefined) updateData.brand = data.brand;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.identifyingFeatures !== undefined) updateData.identifyingFeatures = data.identifyingFeatures;

    const updated = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        reportedBy: {
          select: { id: true, name: true, department: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_ITEM',
        entityType: 'Item',
        entityId: id,
        details: `Updated item: ${updated.name} (${updated.itemCode})`,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.reportedById !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    const newStatus = item.type === 'LOST' ? 'CLOSED' : 'ARCHIVED';

    const updated = await prisma.item.update({
      where: { id },
      data: { status: newStatus as any },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'DELETE_ITEM',
        entityType: 'Item',
        entityId: id,
        details: `Soft-deleted item: ${item.name} (${item.itemCode}) - status changed to ${newStatus}`,
      },
    });

    res.json({ message: 'Item deleted', item: updated });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    }

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.reportedById !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this item status' });
    }

    const updated = await prisma.item.update({
      where: { id },
      data: { status: parsed.data.status },
      include: {
        reportedBy: {
          select: { id: true, name: true, department: true },
        },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'UPDATE_STATUS',
        entityType: 'Item',
        entityId: id,
        details: `Status changed from ${item.status} to ${parsed.data.status} for item: ${item.name} (${item.itemCode})`,
      },
    });

    if (parsed.data.status === 'RECOVERED') {
      await prisma.notification.create({
        data: {
          userId: item.reportedById,
          title: 'Item Recovered',
          message: `Your item "${item.name}" (${item.itemCode}) has been marked as recovered.`,
          type: 'ITEM_RECOVERED',
          relatedItemId: item.id,
        },
      });
    }

    res.json(updated);
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({ error: 'Failed to update item status' });
  }
});

export default router;
